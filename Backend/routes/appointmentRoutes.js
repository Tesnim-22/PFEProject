const express = require('express');
const router = express.Router();
const Appointment = require('../models/models/Appointment');
const User = require('../models/models/User');

// Créer un rendez-vous
router.post('/', async(req, res) => {
    try {
        const { patientId, patientEmail, doctorId, date, time, reason } = req.body;

        // Fusionner la date et l'heure manuellement
        const combinedDateTime = new Date(`${date}T${time}`); // Exemple: "2025-05-01T14:30"

        const appointment = new Appointment({
            patientId,
            patientEmail,
            doctorId,
            date: combinedDateTime, // 🛠️ correction ici
            time,
            reason
        });



        await appointment.save();
        res.status(201).json({ message: "Rendez-vous créé ✅", appointment });
    } catch (error) {
        console.error('❌ Erreur création rdv:', error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Récupérer les rdv d’un docteur
router.get('/doctor/:doctorId', async(req, res) => {
    try {
        const { doctorId } = req.params;

        const appointments = await Appointment.find({ doctorId })
            .populate('doctorId', 'nom prenom email')
            .lean();

        // Récupère infos du patient à partir de son email
        for (let appt of appointments) {
            const patient = await User.findOne({ email: appt.patientEmail }).select('nom prenom email telephone');
            appt.patient = patient;
        }

        res.status(200).json(appointments);
    } catch (error) {
        console.error("❌ Erreur récupération des rdv médecin :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Mettre à jour le statut
router.put('/:appointmentId/status', async(req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        const updated = await Appointment.findByIdAndUpdate(
            appointmentId, { status }, { new: true }
        );

        res.status(200).json(updated);
    } catch (error) {
        console.error("❌ Erreur maj statut :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;