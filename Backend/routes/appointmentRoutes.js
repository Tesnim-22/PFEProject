// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const {
    createAppointment,
    getAppointmentsByPatient,
    getAppointmentsByDoctor,
    updateAppointmentStatus,
} = require('../controllers/appointmentController');

router.post('/', createAppointment); // créer un rendez-vous
router.get('/patient/:email', getAppointmentsByPatient); // rdv par email patient
router.get('/doctor/:doctorId', getAppointmentsByDoctor); // rdv par id médecin
router.put('/:id', updateAppointmentStatus); // mettre à jour (statut)

module.exports = router;