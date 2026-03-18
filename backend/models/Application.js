const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    internship_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true
    },
    status: {
        type: String,
        enum: ['Applied', 'Accepted', 'Rejected', 'Selected'],
        default: 'Applied'
    }
}, { timestamps: { createdAt: 'applied_at', updatedAt: 'updated_at' } });

ApplicationSchema.index({ student_id: 1 });
ApplicationSchema.index({ internship_id: 1 });

module.exports = mongoose.model('Application', ApplicationSchema);
