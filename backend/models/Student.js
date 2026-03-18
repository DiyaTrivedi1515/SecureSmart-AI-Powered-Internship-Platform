const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    college_name: { type: String },
    passing_year: { type: String, required: true },
    skills: { type: [String], default: [] },
    resume: { type: String },
    aadhaar_number: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Student', studentSchema);
