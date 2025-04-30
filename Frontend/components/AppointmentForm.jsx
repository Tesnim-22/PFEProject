import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AppointmentForm.css';

const API_BASE_URL = 'http://localhost:5001';

const AppointmentForm = ({ userId }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
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
      setMessage("❌ Erreur lors de la récupération des médecins.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/appointments`, {
        doctorId: selectedDoctor,
        patientId: userId,
        date,
        reason
      });
      setMessage("✅ Rendez-vous enregistré avec succès !");
      setSelectedDoctor('');
      setDate('');
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
                Dr. {doctor.prenom} {doctor.nom} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date et heure :</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Motif de consultation :</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Décrivez brièvement le motif de votre consultation..."
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
