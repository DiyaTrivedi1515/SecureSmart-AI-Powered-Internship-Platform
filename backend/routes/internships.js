const express = require('express');
const axios = require('axios');
const Internship = require('../models/Internship');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/internships
// @desc    Get all internships with filtering
router.get('/', async (req, res) => {
    try {
        const { location, domain, minStipend, duration } = req.query;
        let query = { status: 'verified' }; // Only show verified internships to students/authenticated users

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        if (domain) {
            // Match any similar word in title, description, or required_skills
            const keywords = domain.split(' ').filter(k => k.trim() !== '').join('|');
            query.$or = [
                { title: { $regex: keywords, $options: 'i' } },
                { description: { $regex: keywords, $options: 'i' } },
                { required_skills: { $regex: keywords, $options: 'i' } }
            ];
        }
        if (minStipend) {
            query.stipend = { $gte: Number(minStipend) };
        }
        if (duration) {
            query.duration = { $lte: Number(duration) };
        }

        const internships = await Internship.find(query).sort({ created_at: -1 }).limit(50).populate('company_id', 'company_name verification_status');
        res.json(internships);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/internships/company/me
// @desc    Get all internships posted by the logged-in company
router.get('/company/me', protect, async (req, res) => {
    try {
        const company = await Company.findOne({ user_id: req.user.id });
        if (!company) return res.json([]);

        const internships = await Internship.find({ company_id: company._id }).sort({ created_at: -1 }).limit(50);
        res.json(internships);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/internships/:id
// @desc    Get internship by ID
router.get('/:id', async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id).populate('company_id', 'company_name');
        if (!internship) return res.status(404).json({ msg: 'Internship not found' });
        res.json(internship);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Internship not found' });
        res.status(500).send('Server Error');
    }
});



// @route   POST /api/internships
// @desc    Create an internship
router.post('/', protect, async (req, res) => {
    const { title, description, skills, tags, location, stipend } = req.body;
    const finalSkills = skills || tags; // Fallback to tags if skills is not provided

    try {
        // Find company associated with this user
        const user = await User.findById(req.user.id);
        if (user.verification_status !== 'verified') {
            return res.status(403).json({ msg: 'Your account must be verified by admin before posting internships.' });
        }

        const company = await Company.findOne({ user_id: req.user.id });
        if (!company) return res.status(400).json({ msg: 'Please complete your company profile/KYC before posting.' });

        // 1. Call ML Service for Risk Score
        let riskScore = 0;
        let riskLevel = 'Low Risk';

        try {
            const mlResponse = await axios.post('http://127.0.0.1:5001/predict-risk', { description });
            riskScore = mlResponse.data.riskScore;
            riskLevel = mlResponse.data.riskLevel;
        } catch (mlErr) {
            console.error('ML Service Error:', mlErr.message);
        }

        // 2. Create Internship in MongoDB
        const newInternship = new Internship({
            title,
            company_id: company._id,
            description,
            required_skills: finalSkills,
            location,
            stipend,
            riskScore,
            riskLevel,
            status: 'pending' // Always start as pending
        });

        const internship = await newInternship.save();
        res.json(internship);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route   GET /api/internships/recommend
// @desc    Get recommended internships for a student
router.get('/recommend', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const internships = await Internship.find({ status: 'verified' }).sort({ created_at: -1 }).limit(50).populate('company_id').lean();
        
        if (internships.length === 0) return res.json([]);

        try {
            const mlResponse = await axios.post('http://127.0.0.1:5001/recommend-internships', {
                studentSkills: user.skills,
                internships: internships.map(i => ({ ...i, required_skills: i.required_skills }))
            });
            res.json(mlResponse.data.recommended_internships);
        } catch (mlErr) {
            console.error('Recommendation ML Error:', mlErr.message);
            res.json(internships.slice(0, 5));
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
