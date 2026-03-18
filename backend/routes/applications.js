const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const Notification = require('../models/Notification');
const Company = require('../models/Company');
const User = require('../models/User');

// @route   POST /api/applications
// @desc    Apply for an internship
// @access  Private (Student)
router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Only students can apply' });
        }

        const student = await User.findById(req.user.id);
        if (student.verification_status !== 'verified') {
            return res.status(403).json({ msg: 'Your profile must be verified by admin before applying.' });
        }

        const { internshipId, coverLetter } = req.body;

        // Check company verification status
        const internship = await Internship.findById(internshipId).populate('company_id');
        if (!internship) return res.status(404).json({ msg: 'Internship not found' });

        const companyUser = await User.findById(internship.company_id.user_id);
        if (!companyUser || companyUser.verification_status !== 'verified') {
            return res.status(403).json({ msg: 'You can only apply to verified companies.' });
        }

        // Check if already applied
        const existing = await Application.findOne({ 
            internship_id: internshipId, 
            student_id: req.user.id 
        });

        if (existing) {
            return res.status(400).json({ msg: 'Already applied' });
        }

        const application = new Application({
            internship_id: internshipId,
            student_id: req.user.id,
            coverLetter
        });

        await application.save();

        // Notify Company
        const internshipFound = await Internship.findById(internshipId).populate('company_id');
        if (internshipFound && internshipFound.company_id) {
            const company = await Company.findById(internshipFound.company_id);
            if (company) {
                const notification = new Notification({
                    recipient: company.user_id,
                    sender: req.user.id,
                    message: `New application received for ${internship.title}`,
                    type: 'application'
                });
                await notification.save();
            }
        }

        res.json(application);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/applications/my
// @desc    Get student's applications
// @access  Private (Student)
router.get('/my', protect, async (req, res) => {
    try {
        const applications = await Application.find({ student_id: req.user.id })
            .populate('internship_id')
            .sort({ appliedAt: -1 });
        res.json(applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/applications/internship/:id
// @desc    Get applications for a specific internship (Company view)
// @access  Private (Company)
router.get('/internship/:id', protect, async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);
        if (!internship) return res.status(404).json({ msg: 'Internship not found' });

        if (req.user.role !== 'company') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const applications = await Application.find({ internship_id: req.params.id })
            .populate('student_id', 'name email')
            .sort({ appliedAt: -1 });
        res.json(applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/applications/company/me
// @desc    Get applications for all internships of the logged-in company
// @access  Private (Company)
router.get('/company/me', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ user_id: req.user.id });
        if (!company) return res.json([]); // No profile yet, so no applications possible

        const internships = await Internship.find({ company_id: company._id }).sort({ created_at: -1 }).limit(50);
        const internshipIds = internships.map(i => i._id);

        const applications = await Application.find({ internship_id: { $in: internshipIds } })
            .populate('internship_id')
            .populate('student_id', 'name email')
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/applications/:id
// @desc    Update application status
// @access  Private (Company)
router.put('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'company') {
            return res.status(403).json({ msg: 'Only companies can update application status' });
        }

        const { status } = req.body;
        if (!['Accepted', 'Rejected', 'Selected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        let application = await Application.findById(req.params.id).populate('internship_id');
        if (!application) return res.status(404).json({ msg: 'Application not found' });

        // Verify company owns the internship
        const company = await Company.findOne({ user_id: req.user.id });
        if (application.internship_id.company_id.toString() !== company._id.toString()) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        application.status = status;
        await application.save();

        // Notify Student
        const notification = new Notification({
            recipient: application.student_id,
            sender: req.user.id,
            message: `Your application for ${application.internship_id.title} has been ${status}`,
            type: 'application_status'
        });
        await notification.save();

        res.json(application);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
