import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CabinetDashboard.css';

const CabinetDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      setCabinetInfo(response.data);
      if (response.data.linkedDoctorId) {
        fetchDoctorAppointments(response.data.linkedDoctorId);
      } else {
        setError('Aucun médecin lié à ce cabinet');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const confirmedAppointments = response.data.filter(apt => apt.status === 'confirmed');
      setAppointments(confirmedAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="cabinet-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>;
  }

  return (
    <div className="cabinet-dashboard">
      <div className="cabinet-header">
        <h1>👨‍⚕️ Tableau de bord du Cabinet Médical</h1>
        {cabinetInfo && (
          <div className="cabinet-info-card">
            <h2>📍 {cabinetInfo.nom}</h2>
            <p>🏥 Spécialité: {cabinetInfo.specialty}</p>
            <p>📍 Adresse: {cabinetInfo.adresse}</p>
          </div>
        )}
      </div>

      <div className="cabinet-appointments">
        <h2>📅 Rendez-vous Confirmés</h2>
        {appointments.length === 0 ? (
          <div className="cabinet-no-appointments">
            <p>Aucun rendez-vous confirmé pour le moment</p>
          </div>
        ) : (
          <div className="cabinet-appointments-grid">
            {appointments.map(appointment => (
              <div key={appointment._id} className="cabinet-appointment-card">
                <div className="cabinet-appointment-header">
                  <h3>👤 Patient: {appointment.patient.prenom} {appointment.patient.nom}</h3>
                  <span className="cabinet-appointment-date">
                    🗓️ {formatDate(appointment.date)}
                  </span>
                </div>
                <div className="cabinet-appointment-details">
                  <p>📧 Email: {appointment.patient.email}</p>
                  <p>📞 Téléphone: {appointment.patient.telephone}</p>
                  {appointment.reason && <p>📝 Motif: {appointment.reason}</p>}
                </div>
                <div className="cabinet-status-badge">
                  ✅ Confirmé
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinetDashboard;
