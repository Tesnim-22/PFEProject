import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CabinetDashboard.css';
import Calendar from 'react-calendar';

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
  const [activeSection, setActiveSection] = useState('profile');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  useEffect(() => {
    if (cabinetInfo && !editedInfo) {
      setEditedInfo({
        nom: cabinetInfo.nom || '',
        specialty: cabinetInfo.specialty || '',
        adresse: cabinetInfo.adresse || '',
        telephone: cabinetInfo.telephone || '',
        email: cabinetInfo.email || '',
        description: cabinetInfo.description || '',
        horaires: cabinetInfo.horaires || '',
      });
    }
  }, [cabinetInfo]);

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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    setUpdateError(null);

    try {
      const cabinetId = localStorage.getItem('userId');
      const response = await axios.put(`http://localhost:5001/api/users/${cabinetId}`, editedInfo);
      
      setCabinetInfo(response.data);
      setIsEditing(false);
      setUpdateSuccess(true);
      
      // Afficher le message de succès pendant 3 secondes
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      setUpdateError('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="profile-section">
            <div className="cabinet-header">
              <h1>👨‍⚕️ Profil du Cabinet Médical</h1>

              {updateSuccess && (
                <div className="success-message">
                  ✅ Profil mis à jour avec succès !
                </div>
              )}

              {updateError && (
                <div className="error-message">
                  ❌ {updateError}
                </div>
              )}

              {cabinetInfo && !isEditing && (
                <div className="cabinet-info-card">
                  <div className="cabinet-info-header">
                    <div className="cabinet-avatar">
                      {cabinetInfo.nom?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="cabinet-main-info">
                      <h2>{cabinetInfo.nom}</h2>
                      <span className="cabinet-specialty">
                        <i className="fas fa-stethoscope"></i>
                        {cabinetInfo.specialty}
                      </span>
                    </div>
                  </div>
                  
                  <div className="cabinet-info-grid">
                    <div className="info-item">
                      <div className="info-icon">
                        <i className="fas fa-map-marker-alt"></i>
                      </div>
                      <div className="info-content">
                        <label>Adresse</label>
                        <p>{cabinetInfo.adresse || 'Non spécifiée'}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <div className="info-icon">
                        <i className="fas fa-phone"></i>
                      </div>
                      <div className="info-content">
                        <label>Téléphone</label>
                        <p>{cabinetInfo.telephone || 'Non spécifié'}</p>
                      </div>
                    </div>

                    <div className="info-item">
                      <div className="info-icon">
                        <i className="fas fa-envelope"></i>
                      </div>
                      <div className="info-content">
                        <label>Email</label>
                        <p>{cabinetInfo.email || 'Non spécifié'}</p>
                      </div>
                    </div>

                    {cabinetInfo.description && (
                      <div className="info-item full-width">
                        <div className="info-icon">
                          <i className="fas fa-info-circle"></i>
                        </div>
                        <div className="info-content">
                          <label>Description</label>
                          <p>{cabinetInfo.description}</p>
                        </div>
                      </div>
                    )}

                    {cabinetInfo.horaires && (
                      <div className="info-item full-width">
                        <div className="info-icon">
                          <i className="fas fa-clock"></i>
                        </div>
                        <div className="info-content">
                          <label>Horaires d'ouverture</label>
                          <p>{cabinetInfo.horaires}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="cabinet-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="fas fa-pen"></i>
                      Modifier le profil
                    </button>
                  </div>
                </div>
              )}

              {isEditing && editedInfo && (
                <div className="cabinet-edit-form">
                  <form onSubmit={handleUpdateProfile}>
                    <div className="form-group">
                      <label>Nom du cabinet:</label>
                      <input
                        type="text"
                        name="nom"
                        value={editedInfo.nom}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Spécialité:</label>
                      <input
                        type="text"
                        name="specialty"
                        value={editedInfo.specialty}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Adresse:</label>
                      <input
                        type="text"
                        name="adresse"
                        value={editedInfo.adresse}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Téléphone:</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={editedInfo.telephone}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        name="email"
                        value={editedInfo.email}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        name="description"
                        value={editedInfo.description}
                        onChange={handleInputChange}
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Horaires d'ouverture:</label>
                      <textarea
                        name="horaires"
                        value={editedInfo.horaires}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Ex: Lun-Ven: 9h-18h, Sam: 9h-12h"
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="submit-btn">
                        💾 Enregistrer
                      </button>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedInfo({
                            nom: cabinetInfo.nom || '',
                            specialty: cabinetInfo.specialty || '',
                            adresse: cabinetInfo.adresse || '',
                            telephone: cabinetInfo.telephone || '',
                            email: cabinetInfo.email || '',
                            description: cabinetInfo.description || '',
                            horaires: cabinetInfo.horaires || '',
                          });
                        }}
                      >
                        ❌ Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        );

      case 'pending':
        return (
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
        );

      case 'confirmed':
        return (
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
        );

      case 'calendar':
        return (
          <div className="calendar-view">
            <div className="calendar-container">
              <div className="calendar-wrapper">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  locale="fr-FR"
                  className="custom-calendar"
                  navigationLabel={({ date }) => {
                    return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                  }}
                  formatShortWeekday={(locale, date) => {
                    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
                    return days[date.getDay()];
                  }}
                  tileClassName={({ date }) => {
                    const hasAppointment = appointments.some(apt => 
                      new Date(apt.date).toDateString() === date.toDateString()
                    );
                    return hasAppointment ? 'has-appointment' : '';
                  }}
                />
              </div>
              <div className="day-appointments">
                <h3>
                  {selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                {appointments.filter(apt => 
                  new Date(apt.date).toDateString() === selectedDate.toDateString()
                ).length === 0 ? (
                  <div className="no-appointments">
                    <p>Aucun rendez-vous prévu pour cette date</p>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {appointments
                      .filter(apt => new Date(apt.date).toDateString() === selectedDate.toDateString())
                      .map(apt => (
                        <div key={apt._id} className="appointment-item">
                          <div className="appointment-time">
                            {new Date(apt.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="appointment-patient">
                            <strong>{apt.patient?.prenom} {apt.patient?.nom}</strong>
                            <div>📞 {apt.patient?.telephone}</div>
                            <div>📧 {apt.patient?.email}</div>
                          </div>
                          {apt.reason && (
                            <div className="appointment-reason">
                              📝 {apt.reason}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="cabinet-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <h2>Cabinet Médical</h2>
        <nav>
          <ul>
            <li>
              <button 
                className={activeSection === 'profile' ? 'active' : ''} 
                onClick={() => setActiveSection('profile')}
              >
                👤 Profil
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'pending' ? 'active' : ''} 
                onClick={() => setActiveSection('pending')}
              >
                ⏳ En attente
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'confirmed' ? 'active' : ''} 
                onClick={() => setActiveSection('confirmed')}
              >
                ✅ Confirmés
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'calendar' ? 'active' : ''} 
                onClick={() => setActiveSection('calendar')}
              >
                📅 Calendrier
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'settings' ? 'active' : ''} 
                onClick={() => setActiveSection('settings')}
              >
                ⚙️ Paramètres
              </button>
            </li>
            <li>
              <button 
                className="logout-btn"
                onClick={handleLogout}
              >
                🚪 Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        {renderContent()}

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
      </main>
    </div>
  );
};

export default CabinetDashboard;
