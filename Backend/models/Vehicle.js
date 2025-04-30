const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    matricule: {
        type: String,
        required: true,
        unique: true
    },
    modele: {
        type: String,
        required: true
    },
    annee: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['Type A', 'Type B', 'Type C'],
        required: true
    },
    statut: {
        type: String,
        enum: ['Disponible', 'En service', 'En maintenance', 'Hors service'],
        default: 'Disponible'
    },
    derniereMaintenance: {
        date: Date,
        description: String
    },
    prochaineMaintenance: {
        date: Date,
        description: String
    },
    equipements: [{
        nom: String,
        quantite: Number,
        dernierControle: Date
    }],
    carburant: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    kilometrage: {
        type: Number,
        default: 0
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema); 