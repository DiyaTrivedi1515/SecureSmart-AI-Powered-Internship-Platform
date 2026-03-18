const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const User = require('../models/User');
const Student = require('../models/Student');

// @route   GET /api/student/me
// @desc    Get current student profile
router.get('/me', protect, async (req, res) => {
    try {
        const student = await Student.findOne({ user_id: req.user.id });
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            ...user._doc,
            profile: student
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});
const Company = require('../models/Company');

router.get('/internships', protect, async (req, res) => {
    try {
        const internships = await Internship.find({ status: 'verified' })
            .sort({ created_at: -1 })
            .limit(50)
            .populate('company_id', 'company_name verification_status');
        
        res.json(internships);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/student/apply/:internship_id
// @desc    Apply for an internship - PROBLEM 5
router.post('/apply/:internship_id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.verification_status !== 'verified') {
            return res.status(403).json({ msg: 'You must be verified by admin before applying.' });
        }

        const { internship_id } = req.params;

        // PROBLEM 5 FIX: Zero-Trust Verify Internship Status!
        const internship = await Internship.findById(internship_id).populate('company_id');
        if (!internship) {
            return res.status(404).json({ msg: 'Internship not found.' });
        }
        if (internship.status !== 'verified') {
            return res.status(400).json({ msg: 'You can only apply to verified internships.' });
        }
        
        // Ensure student profile exists and is updated with User data
        let studentProfile = await Student.findOne({ user_id: req.user.id });
        if (!studentProfile) {
            studentProfile = new Student({
                user_id: req.user.id,
                college_name: 'Not Provided',
                passing_year: new Date().getFullYear().toString(),
                skills: user.skills || [],
                resume: user.resume || ''
            });
            await studentProfile.save();
        } else {
            // Hotfix: Ensure legacy profiles get the resume string from User if it's missing on Student
            if (!studentProfile.resume && user.resume) {
                studentProfile.resume = user.resume;
                await studentProfile.save();
            }
        }

        // Check if already applied
        const existing = await Application.findOne({ 
            student_id: user._id, 
            internship_id 
        });
        
        if (existing) return res.status(400).json({ msg: 'Already applied for this internship.' });

        const application = new Application({
            student_id: user._id,
            internship_id,
            status: 'Applied'
        });

        await application.save();

        // Notify Company
        if (internship && internship.company_id) {
            const Notification = require('../models/Notification');
            const notification = new Notification({
                recipient: internship.company_id.user_id,
                sender: req.user.id,
                message: `New application received for ${internship.title}`,
                type: 'application'
            });
            await notification.save();
        }

        res.json(application);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/student/my-applications
router.get('/my-applications', protect, async (req, res) => {
    try {
        const applications = await Application.find({ student_id: req.user.id })
            .populate({
                path: 'internship_id',
                populate: { path: 'company_id', select: 'company_name' }
            });
        res.json(applications);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
