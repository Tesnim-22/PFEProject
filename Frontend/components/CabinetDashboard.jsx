import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CabinetDashboard.css';

const CabinetDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('');

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
      const pendingAppts = response.data.filter(apt => apt.status === 'pending');
      setAppointments(confirmedAppointments);
      setPendingAppointments(pendingAppts);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.put(`http://localhost:5001/api/appointments/${appointmentId}/status`, {
        status: newStatus
      });
      // Rafraîchir les rendez-vous après la mise à jour
      if (cabinetInfo?.linkedDoctorId) {
        fetchDoctorAppointments(cabinetInfo.linkedDoctorId);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handlePlanningSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !appointmentDate) return;

    try {
      await axios.put(`http://localhost:5001/api/appointments/${selectedAppointment._id}/planning`, {
        appointmentDate,
        requiredDocuments,
        status: 'confirmed'
      });

      setShowPlanningForm(false);
      setSelectedAppointment(null);
      setAppointmentDate('');
      setRequiredDocuments('');

      // Rafraîchir les rendez-vous
      if (cabinetInfo?.linkedDoctorId) {
        fetchDoctorAppointments(cabinetInfo.linkedDoctorId);
      }
    } catch (error) {
      console.error('❌ Erreur planification rendez-vous:', error);
      setError('Erreur lors de la planification du rendez-vous');
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

      <div className="cabinet-pending-appointments">
        <h2>⏳ Demandes en attente</h2>
        {pendingAppointments.length === 0 ? (
          <div className="cabinet-no-appointments">
            <p>Aucune demande en attente</p>
          </div>
        ) : (
          <div className="cabinet-appointments-grid">
            {pendingAppointments.map(appointment => (
              <div key={appointment._id} className="cabinet-appointment-card pending">
                <div className="cabinet-appointment-header">
                  <h3>👤 Patient: {appointment.patient?.prenom} {appointment.patient?.nom}</h3>
                  <span className="cabinet-appointment-date">
                    🗓️ Demande reçue le: {formatDate(appointment.date)}
                  </span>
                </div>
                <div className="cabinet-appointment-details">
                  <p>📧 Email: {appointment.patient?.email}</p>
                  <p>📞 Téléphone: {appointment.patient?.telephone}</p>
                  {appointment.reason && <p>📝 Motif: {appointment.reason}</p>}
                </div>
                <div className="cabinet-appointment-actions">
                  <button
                    className="accept-btn"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowPlanningForm(true);
                    }}
                  >
                    ✅ Planifier
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                  >
                    ❌ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPlanningForm && selectedAppointment && (
        <div className="planning-modal">
          <div className="planning-modal-content">
            <h3>📅 Planifier le rendez-vous</h3>
            <form onSubmit={handlePlanningSubmit}>
              <div className="form-group">
                <label>Date et heure du rendez-vous:</label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Documents requis:</label>
                <textarea
                  value={requiredDocuments}
                  onChange={(e) => setRequiredDocuments(e.target.value)}
                  placeholder="Liste des documents à apporter..."
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Confirmer
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowPlanningForm(false);
                    setSelectedAppointment(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <h3>👤 Patient: {appointment.patient?.prenom} {appointment.patient?.nom}</h3>
                  <span className="cabinet-appointment-date">
                    🗓️ {formatDate(appointment.date)}
                  </span>
                </div>
                <div className="cabinet-appointment-details">
                  <p>📧 Email: {appointment.patient?.email}</p>
                  <p>📞 Téléphone: {appointment.patient?.telephone}</p>
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
