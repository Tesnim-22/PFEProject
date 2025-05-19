const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    description: { type: String }
});

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicalDocuments: [medicalDocumentSchema],
    medicalHistory: { type: String },
    allergies: [String],
    bloodType: { type: String },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    }
});

module.exports = mongoose.model('Patient', patientSchema);
