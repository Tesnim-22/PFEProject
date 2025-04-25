const Appointment = require('../models/Appointment');

// 🔸 Créer un rendez-vous
exports.createAppointment = async(req, res) => {
    try {
        const { patientEmail, doctorId, date, time, reason } = req.body;
        console.log("📥 Données reçues :", { patientEmail, doctorId, date, time, reason });

        const existing = await Appointment.findOne({ doctorId, date, time });
        if (existing) {
            return res.status(400).json({ message: 'Ce créneau est déjà réservé. Veuillez choisir un autre.' });
        }

        const appointment = new Appointment({ patientEmail, doctorId, date, time, reason });
        await appointment.save();

        res.status(201).json({ message: 'Rendez-vous créé avec succès', appointment });
    } catch (error) {
        console.error("❌ Erreur lors de la création :", error);
        res.status(500).json({ message: "Erreur lors de la création", error });
    }
};

// 🔹 Obtenir les rendez-vous d’un patient
exports.getAppointmentsByPatient = async(req, res) => {
    try {
        const appointments = await Appointment.find({ patientEmail: req.params.email });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des rendez-vous" });
    }
};

// 🔹 Obtenir les rendez-vous d’un médecin
exports.getAppointmentsByDoctor = async(req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.params.doctorId });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des rendez-vous" });
    }
};

// 🔹 Mettre à jour le statut d’un rendez-vous
exports.updateAppointmentStatus = async(req, res) => {
    try {
        const updated = await Appointment.findByIdAndUpdate(
            req.params.id, { status: req.body.status }, { new: true }
        );
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
};