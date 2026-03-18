const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
    const { name, email, password, role, gstNumber, aadhaarNumber } = req.body;
    console.log(`\n--- Registration Attempt ---`);
    console.log(`Email: ${email}, Role: ${role}`);

    try {
        let user = await User.findOne({ email });
        if (user) {
            console.log(`Result: User already exists`);
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Validation based on role
        let isGstValid = false;
        let isAadhaarValid = false;

        if (role === 'student') {
            const aadhaarRegex = /^\d{12}$/;
            isAadhaarValid = aadhaarRegex.test(aadhaarNumber);
            if (!isAadhaarValid) {
                console.log(`Result: Invalid Aadhaar format`);
                return res.status(400).json({ msg: 'Invalid Aadhaar format. Must be 12 digits.' });
            }
        } else if (role === 'company') {
            const gstRegex = /^[A-Z0-9]{15}$/i;
            isGstValid = gstRegex.test(gstNumber);
            if (!isGstValid) {
                console.log(`Result: Invalid GST format`);
                return res.status(400).json({ msg: 'Invalid GST format. Must be 15 alphanumeric characters.' });
            }
        }

        console.log(`Result: Creating new user...`);
        user = new User({ 
            name, 
            email, 
            password, 
            role, 
            gst_number: role === 'company' ? gstNumber : undefined,
            gst_verified: isGstValid,
            aadhaar_number: role === 'student' ? aadhaarNumber : undefined,
            aadhaar_verified: isAadhaarValid,
            verification_status: 'pending' 
        });

        console.log(`Result: Hashing password...`);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        console.log(`Result: Saving user to DB...`);
        await user.save();

        // Create Profile
        if (role === 'student') {
            const student = new Student({
                user_id: user.id,
                college_name: 'Pending Profile Setup',
                passing_year: 'TBD',
                aadhaar_number: aadhaarNumber
            });
            await student.save();
        } else if (role === 'company') {
            const company = new Company({
                user_id: user.id,
                company_name: name,
                company_description: 'Edit your profile to add a description.',
                gst_number: gstNumber
            });
            await company.save();
        }

        console.log(`Result: User saved. Signing JWT...`);
        const payload = { user: { id: user.id, role: user.role } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error('JWT Error:', err.message);
                return res.status(500).json({ msg: 'Token generation failed' });
            }
            console.log(`Result: Registration Successful`);
            res.json({ 
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    role: user.role,
                    verification_status: user.verification_status,
                    gst_number: user.gst_number,
                    gst_verified: user.gst_verified,
                    aadhaar_number: user.aadhaar_number,
                    aadhaar_verified: user.aadhaar_verified
                }
            });
        });
    } catch (err) {
        console.error('Catch Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`\n--- Login Attempt ---`);
    console.log(`Email: ${email}`);

    try {
        let user = await User.findOne({ email });
        if (!user) {
            console.log(`Result: User not found`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        console.log(`Result: User found, comparing passwords...`);
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Result: Password mismatch`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        console.log(`Result: Password matched. Signing JWT...`);
        const payload = { user: { id: user.id, role: user.role } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                console.error('JWT Error:', err.message);
                return res.status(500).json({ msg: 'Token generation failed' });
            }
            console.log(`Result: Login Successful`);
            res.json({ 
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    role: user.role,
                    verification_status: user.verification_status,
                    gst_number: user.gst_number,
                    gst_verified: user.gst_verified,
                    aadhaar_number: user.aadhaar_number,
                    aadhaar_verified: user.aadhaar_verified
                }
            });
        });
    } catch (err) {
        console.error('Catch Error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

const { protect } = require('../middleware/auth');

// @route   GET /api/auth/me
// @desc    Get current user data
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
