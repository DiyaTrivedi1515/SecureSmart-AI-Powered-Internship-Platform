const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student', 'company'], required: true },
    gst_number: { type: String },
    gst_verified: { type: Boolean, default: false },
    aadhaar_number: { type: String },
    aadhaar_verified: { type: Boolean, default: false },
    verification_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.index({ role: 1, verification_status: 1 });

module.exports = mongoose.model('User', userSchema);
