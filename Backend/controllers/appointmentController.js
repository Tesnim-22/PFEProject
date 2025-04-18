// controllers/appointmentController.js
const Appointment = require('../models/Appointment');

// 🔸 Créer un rendez-vous
exports.createAppointment = async(req, res) => {
    try {
        const { patientEmail, doctorId, date, time, reason } = req.body;
        const appointment = new Appointment({ patientEmail, doctorId, date, time, reason });
        await appointment.save();
        res.status(201).json({ message: 'Rendez-vous créé avec succès', appointment });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création", error });
    }
};

// 🔸 Lister tous les rendez-vous d’un patient
exports.getAppointmentsByPatient = async(req, res) => {
    try {
        const { email } = req.params;
        const appointments = await Appointment.find({ patientEmail: email }).sort({ date: 1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors du chargement", error });
    }
};

// 🔸 Lister tous les rendez-vous d’un médecin
exports.getAppointmentsByDoctor = async(req, res) => {
    try {
        const { doctorId } = req.params;
        const appointments = await Appointment.find({ doctorId }).sort({ date: 1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors du chargement", error });
    }
};

// 🔸 Mettre à jour le statut d’un rendez-vous
exports.updateAppointmentStatus = async(req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
        if (!appointment) return res.status(404).json({ message: "RDV introuvable" });

        res.status(200).json({ message: 'Statut mis à jour', appointment });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour", error });
    }
};