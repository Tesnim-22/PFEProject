const mongoose = require('mongoose');

const ambulanceReportSchema = new mongoose.Schema({
    ambulancierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ambulancierDetails: {
        nom: String,
        prenom: String,
        telephone: String,
        matricule: String
    },
    patientInfo: {
        nom: String,
        prenom: String,
        age: Number,
        telephone: String
    },
    missionDetails: {
        pickupLocation: {
            type: String,
            required: true
        },
        dropoffLocation: {
            type: String,
            required: true
        },
        pickupTime: {
            type: Date,
            required: true
        },
        dropoffTime: {
            type: Date,
            required: true
        },
        distance: Number,
        vehiculeId: String
    },
    medicalInfo: {
        condition: String,
        consciousness: {
            type: String,
            enum: ['Conscient', 'Semi-conscient', 'Inconscient']
        },
        vitals: {
            bloodPressure: String,
            heartRate: Number,
            temperature: Number,
            oxygenSaturation: Number
        },
        interventions: [String],
        medications: [String]
    },
    urgencyLevel: {
        type: String,
        enum: ['Faible', 'Moyenne', 'Élevée', 'Critique'],
        required: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String,
    status: {
        type: String,
        enum: ['draft', 'submitted', 'validated'],
        default: 'draft'
    },
    lastModified: {
        date: Date,
        by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AmbulanceReport', ambulanceReportSchema); 