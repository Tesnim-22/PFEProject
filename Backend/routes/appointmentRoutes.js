const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Créer un nouveau rendez-vous
router.post('/', appointmentController.createAppointment);

// Liste des rendez-vous par patient
router.get('/patient/:email', appointmentController.getAppointmentsByPatient);

// Liste des rendez-vous par médecin
router.get('/doctor/:doctorId', appointmentController.getAppointmentsByDoctor);

// Mise à jour du statut d’un rendez-vous
router.put('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;