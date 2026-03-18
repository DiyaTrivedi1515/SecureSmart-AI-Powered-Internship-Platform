const express = require('express');
const Company = require('../models/Company');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();

// @route   GET /api/company/me
// @desc    Get current company profile
router.get('/me', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ user_id: req.user.id });
        if (!company) {
            // If no profile, but user is verified/pending, return basic info
            const user = await User.findById(req.user.id);
            return res.json({ 
                verification_status: user.verification_status,
                company_name: user.name // fallback
            });
        }
        res.json({
            ...company._doc,
            verification_status: (await User.findById(req.user.id)).verification_status
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/company/profile
// @desc    Create or update company profile
router.post('/profile', protect, async (req, res) => {
    try {
        const { companyName, bio } = req.body;
        
        let company = await Company.findOne({ user_id: req.user.id });
        if (company) {
            // Update
            company.company_name = companyName;
            company.company_description = bio;
            await company.save();
            return res.json(company);
        }

        // Create new
        company = new Company({
            user_id: req.user.id,
            company_name: companyName,
            company_description: bio,
            verification_status: 'pending'
        });
        await company.save();

        res.json(company);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/company/post-internship
// @desc    Post a new internship - PROBLEM 4
router.post('/post-internship', protect, async (req, res) => {
    try {
        // Requirement: Check verification_status on USER object
        const user = await User.findById(req.user.id);
        if (user.verification_status !== 'verified') {
            return res.status(403).json({ msg: 'You cannot post internships until your account is verified by Admin.' });
        }

        const company = await Company.findOne({ user_id: req.user.id });
        if (!company) return res.status(400).json({ msg: 'Company profile not found.' });

        const { title, description, skills_required, location, stipend, duration } = req.body;

        // Shift ML validation to async background task to prevent blocking application
        const internship = new Internship({
            company_id: company._id,
            title,
            description,
            skills_required,
            location,
            duration: Number(duration) || 0,
            stipend: Number(stipend) || 0,
            riskScore: 0,
            riskLevel: 'Pending ML',
            status: 'pending'
        });

        await internship.save();
        res.json(internship);

        axios.post('http://127.0.0.1:5001/predict-risk', { description })
            .then(async (mlResponse) => {
                internship.riskScore = mlResponse.data.riskScore;
                internship.riskLevel = mlResponse.data.riskLevel;
                await internship.save();
            })
            .catch((mlErr) => {
                console.error('ML Service Error:', mlErr.message);
            });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const ResumeAnalysis = require('../models/ResumeAnalysis');

// @route   GET /api/company/applications
// @desc    Get applications for company internships - PROBLEM 6
router.get('/applications', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ user_id: req.user.id });
        if (!company) return res.status(400).json({ msg: 'Company profile not found.' });

        const internships = await Internship.find({ company_id: company._id }).sort({ created_at: -1 }).limit(50);
        const internshipIds = internships.map(i => i._id);

        const applications = await Application.find({ internship_id: { $in: internshipIds } })
            .populate('internship_id', 'title')
            .populate({
                path: 'student_id',
                select: 'name email',
            });

        // Enrich with Student profile details (College, Skills, Resume) in batch avoiding N+1 loops
        const studentIds = applications.map(app => app.student_id?._id).filter(Boolean);
        
        const [students, resumes, users] = await Promise.all([
            Student.find({ user_id: { $in: studentIds } }),
            ResumeAnalysis.find({ student_id: { $in: studentIds } }).sort({ parsed_at: -1 }),
            User.find({ _id: { $in: studentIds } })
        ]);

        const studentMap = new Map(students.map(s => [s.user_id.toString(), s]));
        const resumeMap = new Map(resumes.map(r => [r.student_id.toString(), r]));
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const enrichedApplications = applications.map((app) => {
            const userId = app.student_id?._id?.toString();
            
            const studentProfile = studentMap.get(userId);
            const resumeAnalysis = resumeMap.get(userId);
            const userDoc = userMap.get(userId);
            
            const rawResumeData = studentProfile?.resume || userDoc?.resume || "";
            const formattedResume = rawResumeData.startsWith('http') ? rawResumeData : (rawResumeData ? `http://localhost:5000/${rawResumeData.replace(/\\/g, '/')}` : "");

            return {
                _id: app._id,
                internship_title: app.internship_id?.title,
                student_name: app.student_id?.name || "Unknown",
                student_email: app.student_id?.email || "Unknown",
                college: studentProfile?.college_name || "Not Provided",
                skills: resumeAnalysis?.skills || studentProfile?.skills || userDoc?.skills || [],
                experience: resumeAnalysis?.experience || [],
                education: resumeAnalysis?.education || [],
                status: app.status,
                applied_at: app.applied_at
            };
        });

        res.json(enrichedApplications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/company/applications/:id
// @desc    Update application status
router.put('/applications/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findById(req.params.id).populate('internship_id');
        if (!application) return res.status(404).json({ msg: 'Application not found' });

        application.status = status;
        await application.save();

        // Notify Student
        if (application.internship_id) {
            const Notification = require('../models/Notification');
            const notification = new Notification({
                recipient: application.student_id,
                sender: req.user.id, // The company
                message: `Your application for ${application.internship_id.title} has been ${status}.`,
                type: 'application_status'
            });
            await notification.save();
        }

        res.json(application);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
