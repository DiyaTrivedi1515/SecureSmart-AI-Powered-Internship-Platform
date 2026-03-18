const mongoose = require('mongoose');

const resumeAnalysisSchema = mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    skills: [{ type: String }],
    experience: [{ type: String }],
    education: [{ type: String }],
    parsed_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
