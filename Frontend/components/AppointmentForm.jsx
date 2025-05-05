import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AppointmentForm.css';

const API_BASE_URL = 'http://localhost:5001';

const AppointmentForm = ({ userId }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/medecins-valides`);
      setDoctors(response.data);
    } catch (error) {
      setMessage("Erreur lors de la récupération des médecins.");
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/appointments`, {
        doctorId: selectedDoctor,
        patientId: userId,
        date: appointmentDate,
        reason
      });
      setMessage("✅ Rendez-vous enregistré avec succès !");
      setSelectedDoctor('');
      setAppointmentDate('');
      setReason('');
    } catch (error) {
      setMessage("❌ Erreur lors de l'enregistrement du rendez-vous.");
    }
  };

  return (
    <div className="appointment-form">
      {message && <div className="alert">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Médecin :</label>
          <select 
            value={selectedDoctor} 
            onChange={(e) => setSelectedDoctor(e.target.value)}
            required
          >
            <option value="">Sélectionnez un médecin</option>
            {doctors.map(doctor => (
              <option key={doctor._id} value={doctor._id}>
                Dr. {doctor.nom} {doctor.prenom} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date et heure :</label>
          <input
            type="datetime-local"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            min={getMinDateTime()}
            required
          />
        </div>

        <div className="form-group">
          <label>Motif de la consultation :</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Décrivez brièvement la raison de votre visite"
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          Prendre rendez-vous
        </button>
      </form>
    </div>
  );
};

export default AppointmentForm;
