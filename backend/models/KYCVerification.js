const mongoose = require('mongoose');

const kycSchema = mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    idDocumentPath: { type: String, required: true },
    selfiePath: { type: String, required: true },
    faceMatchConfidence: { type: Number },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    adminFeedback: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('KYCVerification', kycSchema);
