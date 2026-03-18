const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const Student = require('../models/Student');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics - PROBLEM 1
router.get('/dashboard', protect, admin, async (req, res) => {
    try {
        const [userStats, totalInternships, totalApplications] = await Promise.all([
            User.aggregate([
                {
                    $group: {
                        _id: { role: "$role", status: "$verification_status" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Internship.countDocuments(),
            Application.countDocuments()
        ]);

        let stats = {
            total_students: 0, total_companies: 0,
            pending_students: 0, pending_companies: 0,
            verified_students: 0, verified_companies: 0,
            total_internships: totalInternships,
            total_applications: totalApplications
        };

        userStats.forEach(stat => {
            const role = stat._id.role;
            const status = stat._id.status;
            
            if (role === 'student') stats.total_students += stat.count;
            if (role === 'company') stats.total_companies += stat.count;
            
            if (role === 'student' && status === 'pending') stats.pending_students += stat.count;
            if (role === 'company' && status === 'pending') stats.pending_companies += stat.count;
            
            if (role === 'student' && status === 'verified') stats.verified_students += stat.count;
            if (role === 'company' && status === 'verified') stats.verified_companies += stat.count;
        });

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/admin/companies
// @desc    Get all companies with verification status
router.get('/companies', protect, admin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = { role: 'company' };
        if (status) query.verification_status = status;

        const users = await User.find(query).select('name email gst_number gst_verified aadhaar_number aadhaar_verified verification_status');
        const userIds = users.map(u => u._id);
        
        const profiles = await Company.find({ user_id: { $in: userIds } }).select('company_name user_id');
        const profileMap = profiles.reduce((acc, p) => {
            acc[p.user_id.toString()] = p.company_name;
            return acc;
        }, {});

        const companiesInfo = users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            gst_number: u.gst_number,
            gst_verified: u.gst_verified,
            aadhaar_number: u.aadhaar_number,
            aadhaar_verified: u.aadhaar_verified,
            verification_status: u.verification_status,
            company_name: profileMap[u._id.toString()] || u.name
        }));
        
        res.json(companiesInfo);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/admin/students
// @desc    Get students with GST status
router.get('/students', protect, admin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = { role: 'student' };
        if (status) query.verification_status = status;

        const users = await User.find(query).select('name email aadhaar_number aadhaar_verified verification_status');
        const userIds = users.map(u => u._id);

        const profiles = await Student.find({ user_id: { $in: userIds } }).select('college_name user_id');
        const profileMap = profiles.reduce((acc, p) => {
            acc[p.user_id.toString()] = p.college_name;
            return acc;
        }, {});

        const studentsInfo = users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            aadhaar_number: u.aadhaar_number,
            aadhaar_verified: u.aadhaar_verified,
            verification_status: u.verification_status,
            college_name: profileMap[u._id.toString()]
        }));

        res.json(studentsInfo);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/admin/verify-company/:id
// @desc    Verify a company
router.put('/verify-company/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'company') return res.status(404).json({ msg: 'Company user not found' });

        const { status } = req.body;
        user.verification_status = status;
        if (status === 'verified') user.gst_verified = true;
        await user.save();
        
        const profile = await Company.findOne({ user_id: user._id });
        if (profile) {
            profile.verification_status = status;
            await profile.save();
        }
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/admin/verify-student/:id
// @desc    Verify a student
router.put('/verify-student/:id', protect, admin, async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student || student.role !== 'student') return res.status(404).json({ msg: 'Student not found' });

        student.verification_status = req.body.status;
        if (req.body.status === 'verified') student.aadhaar_verified = true;
        await student.save();

        // Optional: sync with student profile if we add validation there later
        // const profile = await Student.findOne({ user_id: student._id });
        
        res.json(student);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/admin/verify-internship/:id
// @desc    Verify or reject an internship
router.put('/verify-internship/:id', protect, admin, async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);
        if (!internship) return res.status(404).json({ msg: 'Internship not found' });

        const { status } = req.body;
        internship.status = status;
        await internship.save();
        
        res.json(internship);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/admin/internships/all
router.get('/internships/all', protect, admin, async (req, res) => {
    try {
        const internships = await Internship.find().sort({ created_at: -1 }).limit(50).populate('company_id', 'company_name verification_status');
        res.json(internships);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/admin/high-risk
// @desc    Get high-risk flagged jobs (Mock for now)
router.get('/high-risk', protect, admin, async (req, res) => {
    try {
        // Placeholder returning empty array to satisfy frontend
        res.json([]);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
