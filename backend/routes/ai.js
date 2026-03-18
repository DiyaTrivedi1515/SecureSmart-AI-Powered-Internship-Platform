const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const Student = require('../models/Student');
const KYCVerification = require('../models/KYCVerification');
const User = require('../models/User');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// @route   GET /api/ai/profile
// @desc    Get student's latest parsed profile
router.get('/profile', protect, async (req, res) => {
    try {
        const profile = await ResumeAnalysis.findOne({ student_id: req.user.id }).sort({ parsed_at: -1 });
        if (!profile) return res.status(404).json({ msg: 'No profile found' });
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/ai/parse-resume
// @desc    Upload and parse student resume
router.post('/parse-resume', [protect, upload.single('resume')], async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const formData = new FormData();
        formData.append('resume', fs.createReadStream(req.file.path));

        const mlRes = await axios.post(`${ML_SERVICE_URL}/parse-resume`, formData, {
            headers: { ...formData.getHeaders() }
        });

        const resumeData = mlRes.data;

        // Save to ResumeAnalysis model according to specs
        const analysisData = {
            student_id: req.user.id,
            name: resumeData.name,
            email: resumeData.email,
            phone: resumeData.phone,
            skills: resumeData.skills,
            experience: resumeData.experience,
            education: resumeData.education,
            parsed_at: new Date()
        };

        let profile = await ResumeAnalysis.findOne({ student_id: req.user.id });
        if (profile) {
            profile = await ResumeAnalysis.findOneAndUpdate(
                { student_id: req.user.id },
                { $set: analysisData },
                { new: true }
            );
        } else {
            profile = new ResumeAnalysis(analysisData);
            await profile.save();
        }

        // Update or Create the Student profile to persistently store the resume path
        let student = await Student.findOne({ user_id: req.user.id });
        if (student) {
            student.skills = resumeData.skills;
            student.resume = req.file.path;
            await student.save();
        } else {
            student = new Student({
                user_id: req.user.id,
                college_name: 'Not Provided',
                passing_year: new Date().getFullYear().toString(),
                skills: resumeData.skills,
                resume: req.file.path
            });
            await student.save();
        }

        // Update user skills
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { skills: { $each: resumeData.skills } } });

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to parse resume' });
    }
});

// @route   POST /api/ai/verify-kyc
// @desc    Submit KYC documents for face verification
router.post('/verify-kyc', [protect, upload.fields([{ name: 'id_image', maxCount: 1 }, { name: 'selfie_image', maxCount: 1 }])], async (req, res) => {
    try {
        if (!req.files || !req.files.id_image || !req.files.selfie_image) {
            return res.status(400).json({ msg: 'Both ID and Selfie images are required' });
        }

        const formData = new FormData();
        formData.append('id_image', fs.createReadStream(req.files.id_image[0].path));
        formData.append('selfie_image', fs.createReadStream(req.files.selfie_image[0].path));

        const mlRes = await axios.post(`${ML_SERVICE_URL}/verify-kyc`, formData, {
            headers: { ...formData.getHeaders() }
        });

        const result = mlRes.data;

        const kyc = new KYCVerification({
            companyId: req.user.id,
            idDocumentPath: req.files.id_image[0].path,
            selfiePath: req.files.selfie_image[0].path,
            faceMatchConfidence: result.confidence,
            status: result.status === 'success' ? 'verified' : 'rejected'
        });

        await kyc.save();
        res.json(kyc);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'KYC Verification failed' });
    }
});

module.exports = router;
