const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['info', 'warning', 'urgent'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    recipientType: {
        type: String,
        enum: ['all', 'doctors', 'patients', 'labs', 'hospitals', 'cabinets', 'specific'],
        required: true
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['draft', 'sent', 'archived'],
        default: 'sent'
    },
    // Informations sur l'expéditeur
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AdminNotification', adminNotificationSchema); 