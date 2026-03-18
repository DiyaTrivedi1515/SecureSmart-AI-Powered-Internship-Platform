const mongoose = require('mongoose');

const fraudLogSchema = mongoose.Schema({
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    riskScore: { type: Number, required: true },
    descriptionSnippet: { type: String },
    riskLevel: { type: String },
    actionTaken: { type: String, enum: ['flagged', 'blocked', 'manual_review'], default: 'flagged' }
}, { timestamps: true });

module.exports = mongoose.model('FraudLog', fraudLogSchema);
