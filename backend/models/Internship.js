const mongoose = require('mongoose');

const internshipSchema = mongoose.Schema({
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills_required: [{ type: String }],
    location: { type: String },
    duration: { type: String },
    stipend: { type: Number },
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, default: 'Low Risk' },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

internshipSchema.index({ company_id: 1 });

module.exports = mongoose.model('Internship', internshipSchema);
