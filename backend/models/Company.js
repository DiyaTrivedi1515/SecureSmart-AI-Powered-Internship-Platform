const mongoose = require('mongoose');

const companySchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company_name: { type: String, required: true },
    company_description: { type: String },
    verification_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Company', companySchema);
