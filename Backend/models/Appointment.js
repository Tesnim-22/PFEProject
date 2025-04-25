const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientEmail: { type: String, required: true },
    doctorId: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String },
    status: { type: String, default: 'en attente' }
});

module.exports = mongoose.model('Appointment', appointmentSchema);