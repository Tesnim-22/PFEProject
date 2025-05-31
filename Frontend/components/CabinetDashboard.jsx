import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CabinetDashboard.css';
import Calendar from 'react-calendar';
import { 
  FaUserMd, 
  FaCalendarAlt, 
  FaClock, 
  FaBook, 
  FaSignOutAlt, 
  FaHistory, 
  FaFileMedical,
  FaHospital,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaStethoscope,
  FaCertificate,
  FaChartLine,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheck,
  FaHourglassHalf,
  FaBan,
  FaBell
} from 'react-icons/fa';

const CabinetDashboard = () => {
  const navigate = useNavigate();
  const [activeRoute, setActiveRoute] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const cabinetId = localStorage.getItem('userId');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleNavigation = (route) => {
    setActiveRoute(route);
    navigate(route);
  };

  // Fonction pour récupérer le nombre de notifications non lues
  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/notifications/cabinet/${cabinetId}/unread-count`);
      setUnreadNotifications(response.data.total || 0);
    } catch (error) {
      console.error('Erreur récupération notifications non lues:', error);
    }
  };

  // Récupérer le nombre de notifications non lues au chargement
  useEffect(() => {
    if (cabinetId) {
      fetchUnreadNotifications();
      // Actualiser toutes les 30 secondes pour détecter les nouvelles notifications
      const interval = setInterval(fetchUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [cabinetId]);

  return (
    <div className="dashboard-container">
      <aside className="medical-sidebar">
        <div className="sidebar-header">
          <div className="medical-logo">
            <div className="logo-text">
              <h2>PatientPath</h2>
              <span>Interface Cabinet</span>
          </div>
        </div>
        </div>

        <nav className="sidebar-navigation">
          <div className="nav-section">
            <span className="nav-section-title">TABLEAU DE BORD</span>
            <button 
              className={`nav-item ${activeRoute === '' ? 'active' : ''}`}
              onClick={() => handleNavigation('')}
            >
              <FaUserMd className="nav-icon" />
              <span className="nav-text">Mon Profil</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">RENDEZ-VOUS</span>
            <button 
              className={`nav-item ${activeRoute === 'calendar' ? 'active' : ''}`}
              onClick={() => handleNavigation('calendar')}
            >
              <FaCalendarAlt className="nav-icon" />
              <span className="nav-text">Calendrier</span>
            </button>
            <button 
              className={`nav-item ${activeRoute === 'upcoming-appointments' ? 'active' : ''}`}
              onClick={() => handleNavigation('upcoming-appointments')}
            >
              <FaClock className="nav-icon" />
              <span className="nav-text">Rendez-vous à venir</span>
            </button>
            <button 
              className={`nav-item ${activeRoute === 'pending-appointments' ? 'active' : ''}`}
              onClick={() => handleNavigation('pending-appointments')}
            >
              <FaFileMedical className="nav-icon" />
              <span className="nav-text">Demandes en attente</span>
            </button>
            <button 
              className={`nav-item ${activeRoute === 'past-appointments' ? 'active' : ''}`}
              onClick={() => handleNavigation('past-appointments')}
            >
              <FaHistory className="nav-icon" />
              <span className="nav-text">Historique</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">COMMUNICATION</span>
            <button 
              className={`nav-item ${activeRoute === 'notifications' ? 'active' : ''}`}
              onClick={() => handleNavigation('notifications')}
              style={{ position: 'relative' }}
            >
              <FaBell className="nav-icon" />
              <span className="nav-text">Notifications</span>
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1',
                  animation: 'pulse 2s infinite'
                }}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-text">Déconnexion</span>
        </button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CabinetMainView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="upcoming-appointments" element={<UpcomingAppointmentsView />} />
          <Route path="pending-appointments" element={<PendingAppointmentsView />} />
          <Route path="past-appointments" element={<PastAppointmentsView />} />
          <Route path="notifications" element={<NotificationsView onNotificationRead={fetchUnreadNotifications} />} />
        </Routes>
      </main>
    </div>
  );
};

const CabinetMainView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    averageRating: 0
  });

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
      fetchCabinetStats(cabinetId);
    }
  }, []);

  const fetchCabinetStats = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/cabinet/stats/${cabinetId}`);
      setStats(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
    }
  };

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
      }
      
      setCabinetInfo(cabinetData);
      setEditedInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cabinetId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5001/api/users/${cabinetId}`, {
        nom: editedInfo.nom,
        telephone: editedInfo.telephone,
        email: editedInfo.email,
        adresse: editedInfo.adresse
      });
      
      setCabinetInfo(editedInfo);
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      setError('Erreur lors de la mise à jour du profil');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des informations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FaBan className="error-icon" />
        <h3>Erreur</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header Principal */}
      <div className="profile-hero">
        <div className="hero-content">
          <div className="profile-avatar-large">
            <FaHospital className="avatar-icon" />
          </div>
          <div className="profile-header-info">
            <h1 className="cabinet-name">{cabinetInfo?.nom}</h1>
            <p className="cabinet-type">Cabinet Médical</p>
            <div className="profile-status">
              <span className="status-indicator active"></span>
              <span className="status-text">En service</span>
            </div>
          </div>
          <div className="profile-actions">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`edit-toggle-btn ${isEditing ? 'editing' : ''}`}
            >
              {isEditing ? (
                <>
                  <FaTimes className="btn-icon" />
                  Annuler
                </>
              ) : (
                <>
                  <FaEdit className="btn-icon" />
                  Modifier
                </>
              )}
            </button>
          </div>
          </div>
        </div>

      {/* Contenu Principal */}
      <div className="profile-content">
          {isEditing ? (
          // Mode Édition
          <form onSubmit={handleSubmit} className="edit-form-modern">
            <div className="form-card">
              <div className="form-card-header">
                <FaHospital className="card-icon" />
                <h3>Informations du Cabinet</h3>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>
                    <FaHospital className="field-icon" />
                    Nom du cabinet
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={editedInfo?.nom || ''}
                    onChange={handleInputChange}
                    placeholder="Nom du cabinet médical"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>
                    <FaMapMarkerAlt className="field-icon" />
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={editedInfo?.adresse || ''}
                    onChange={handleInputChange}
                    placeholder="Adresse complète"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>
                    <FaPhone className="field-icon" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={editedInfo?.telephone || ''}
                    onChange={handleInputChange}
                    placeholder="+216 XX XXX XXX"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>
                    <FaEnvelope className="field-icon" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editedInfo?.email || ''}
                    onChange={handleInputChange}
                    placeholder="cabinet@email.com"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  <FaSave className="btn-icon" />
                  Enregistrer les modifications
                </button>
              </div>
              </div>
            </form>
          ) : (
          // Mode Affichage
          <div className="profile-grid">
            {/* Informations du Cabinet */}
            <div className="info-card compact">
              <div className="card-header">
                <FaHospital className="card-icon" />
                <h3>Informations du Cabinet</h3>
              </div>
              <div className="card-content">
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <div className="info-details">
                    <span className="info-label">Adresse</span>
                    <span className="info-value">{cabinetInfo?.adresse}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaPhone className="info-icon" />
                  <div className="info-details">
                    <span className="info-label">Téléphone</span>
                    <span className="info-value">{cabinetInfo?.telephone}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaEnvelope className="info-icon" />
                  <div className="info-details">
                    <span className="info-label">Email</span>
                    <span className="info-value">{cabinetInfo?.email}</span>
                  </div>
                </div>
                {cabinetInfo?.linkedDoctor && (
                  <div className="info-item">
                    <FaStethoscope className="info-icon" />
                    <div className="info-details">
                      <span className="info-label">Médecin Associé</span>
                      <span className="info-value">Dr. {cabinetInfo.linkedDoctor.nom} {cabinetInfo.linkedDoctor.prenom}</span>
                      <span className="info-specialty">{cabinetInfo.linkedDoctor.specialty}</span>
                    </div>
                  </div>
                )}
              </div>
              </div>

            {/* Horaires d'ouverture */}
            <div className="info-card">
              <div className="card-header">
                <FaClock className="card-icon" />
                <h3>Horaires d'ouverture</h3>
              </div>
              <div className="card-content">
                <div className="schedule-list">
                  <div className="schedule-item">
                    <span className="schedule-day">Lundi - Vendredi</span>
                    <span className="schedule-time">9h00 - 18h00</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-day">Samedi</span>
                    <span className="schedule-time">9h00 - 12h00</span>
                  </div>
                  <div className="schedule-item closed">
                    <span className="schedule-day">Dimanche</span>
                    <span className="schedule-time">-Fermé</span>
                  </div>
                </div>
              </div>
              </div>

            {/* Statistiques */}
            <div className="info-card stats-card-modern">
              <div className="card-header">
                <FaChartLine className="card-icon" />
                <h3>Statistiques des rendez-vous</h3>
                  </div>
              <div className="card-content">
                <div className="stats-grid-modern">
                  <div className="stat-item-modern total">
                    <div className="stat-icon">
                      <FaCalendarAlt />
                  </div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.totalAppointments || 0}</span>
                      <span className="stat-label">Total</span>
                  </div>
                  </div>
                  <div className="stat-item-modern pending">
                    <div className="stat-icon">
                      <FaHourglassHalf />
                </div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.pendingAppointments || 0}</span>
                      <span className="stat-label">En attente</span>
              </div>
        </div>
                  <div className="stat-item-modern completed">
                    <div className="stat-icon">
                      <FaCheck />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.completedAppointments || 0}</span>
                      <span className="stat-label">Terminés</span>
                    </div>
                  </div>
                  <div className="stat-item-modern cancelled">
                    <div className="stat-icon">
                      <FaBan />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.cancelledAppointments || 0}</span>
                      <span className="stat-label">Annulés</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PendingAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('');
  const [cabinetInfo, setCabinetInfo] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      // Si le cabinet a un médecin associé, récupérer ses informations
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
        // Récupérer les rendez-vous du médecin
        await fetchDoctorAppointments(cabinetData.linkedDoctorId);
      }
      
      setCabinetInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pendingAppointments = response.data.filter(apt => apt.status === 'pending');
      setAppointments(pendingAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
      setLoading(false);
    }
  };

  const toggleCardExpansion = (appointmentId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.put(`http://localhost:5001/api/appointments/${appointmentId}/status`, {
        status: newStatus
      });
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

  // Fonction pour obtenir la date/heure minimale (maintenant)
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (loading) {
    return <div className="cabinet-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>;
  }

  return (
      <div className="pending-appointments-view">
      {/* Header moderne avec statistiques */}
      <div className="pending-header">
        <div className="pending-header-content">
          <div className="pending-header-title">
            <FaHourglassHalf className="pending-header-icon" />
            <div>
              <h1>Demandes en attente</h1>
              <p>Gestion des demandes de rendez-vous</p>
            </div>
          </div>
          <div className="pending-header-stats">
            <div className="pending-stat-badge">
              <FaClock className="pending-stat-icon" />
              <span className="pending-stat-number">{appointments.length}</span>
              <span className="pending-stat-label">En attente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="pending-content">
        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaHourglassHalf />
            </div>
            <h3>Aucune demande en attente</h3>
            <p>Toutes les demandes de rendez-vous apparaîtront ici</p>
          </div>
        ) : (
          <div className="pending-appointments-grid">
            {appointments.map(appointment => {
              const isExpanded = expandedCards.has(appointment._id);
              return (
                <div 
                  key={appointment._id} 
                  className={`appointment-card-pending ${isExpanded ? 'expanded' : ''}`}
                  onClick={(e) => {
                    // Ne pas déclencher l'expansion si on clique sur un bouton
                    if (!e.target.closest('.appointment-actions')) {
                      toggleCardExpansion(appointment._id);
                    }
                  }}
                >
                  <div className="pending-card-header">
                    <div className="pending-time-badge">
                      <span className="pending-label">Demande reçue</span>
                      <span className="pending-date">{formatDate(appointment.date)}</span>
                </div>
                    <div className="pending-status-badge">
                      En attente
                </div>
                  </div>

                  <div className="pending-card-body">
                    <div className="patient-section-compact">
                      <div className="patient-avatar pending">
                        <FaUserMd />
                      </div>
                      <div className="patient-info-compact">
                        <h3 className="patient-name">
                          {appointment.patient?.prenom} {appointment.patient?.nom}
                        </h3>
                        <div className="expand-indicator">
                          {isExpanded ? 'Cliquez pour réduire' : 'Cliquez pour voir les détails'}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="expanded-details">
                        <div className="contact-info">
                          <div className="contact-item">
                            <FaPhone className="contact-icon" />
                            <span>{appointment.patient?.telephone}</span>
                          </div>
                          <div className="contact-item">
                            <FaEnvelope className="contact-icon" />
                            <span>{appointment.patient?.email}</span>
                          </div>
                        </div>

                        {appointment.reason && (
                          <div className="reason-section">
                            <div className="reason-header">
                              <FaStethoscope className="reason-icon" />
                              <span className="reason-label">Motif de consultation</span>
                            </div>
                            <p className="reason-text">{appointment.reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pending-card-footer">
                    <div className="appointment-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="action-button accept-button"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowPlanningForm(true);
                    }}
                  >
                    ✅ Planifier
                  </button>
                  <button
                    className="action-button reject-button"
                    onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                  >
                    ❌ Refuser
                  </button>
                </div>
              </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPlanningForm && selectedAppointment && (
        <div className="planning-modal">
          <div className="planning-modal-content">
              <div className="modal-header">
            <h3>📅 Planifier le rendez-vous</h3>
              </div>
            <form onSubmit={handlePlanningSubmit}>
              <div className="form-group">
                <label>Date et heure du rendez-vous:</label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={getMinDateTime()}
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
                <div className="modal-actions">
                  <button type="submit" className="submit-button">
                  Confirmer
                </button>
                <button
                  type="button"
                    className="cancel-button"
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
    </div>
  );
};

const CalendarView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkedDoctorId, setLinkedDoctorId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayAppointments, setDayAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 2;

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      // 1. Charger les infos du cabinet pour obtenir linkedDoctorId
      axios.get(`http://localhost:5001/api/users/${cabinetId}`)
        .then(res => {
          if (res.data.linkedDoctorId) {
            setLinkedDoctorId(res.data.linkedDoctorId);
          } else {
            setError("Aucun médecin lié à ce cabinet.");
            setLoading(false);
          }
        })
        .catch(() => {
          setError("Impossible de charger les infos du cabinet.");
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (linkedDoctorId) {
      // 2. Charger les rendez-vous du docteur lié
      axios.get(`http://localhost:5001/api/doctor/appointments/${linkedDoctorId}`)
        .then(res => {
          setAppointments(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError("Impossible de charger les rendez-vous du médecin lié.");
          setLoading(false);
        });
    }
  }, [linkedDoctorId]);

  useEffect(() => {
    if (appointments.length > 0) {
      filterAppointmentsByDate(selectedDate);
    }
  }, [selectedDate, appointments]);

  useEffect(() => {
    // Reset la pagination quand on change de date
    setCurrentPage(1);
  }, [selectedDate]);

  const filterAppointmentsByDate = (date) => {
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
    setDayAppointments(filtered.sort((a, b) => new Date(a.date) - new Date(b.date)));
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return '✅ Confirmé';
      case 'pending': return '⏳ En attente';
      case 'cancelled': return '❌ Annulé';
      case 'completed': return '✅ Terminé';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-confirmed';
      default: return '';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(dayAppointments.length / appointmentsPerPage);
  const indexOfFirstAppointment = (currentPage - 1) * appointmentsPerPage;
  const indexOfLastAppointment = indexOfFirstAppointment + appointmentsPerPage;
  const currentAppointments = dayAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="calendar-view" style={{ color: '#000000' }}>
      <div className="calendar-container">
        <div className="calendar-wrapper">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="fr-FR"
            className="react-calendar"
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

          {dayAppointments.length === 0 ? (
            <div className="no-appointments">
              <p>Aucun rendez-vous prévu pour cette date</p>
            </div>
          ) : (
            <>
            <div className="appointment-list">
                {currentAppointments.map(apt => (
                <div key={apt._id} className="appointment-item">
                  <div className="appointment-time">
                      {formatTime(apt.date)}
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
                    <span className={`appointment-status ${getStatusClass(apt.status)}`}>
                      {getStatusText(apt.status)}
                  </span>
                </div>
              ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  padding: '1rem'
                }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                      color: currentPage === 1 ? '#999' : '#333',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    ← Précédent
                  </button>
                  
                  <span style={{
                    padding: '0.5rem 1rem',
                    color: '#666',
                    fontSize: '0.9rem'
                  }}>
                    Page {currentPage} sur {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      background: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                      color: currentPage === totalPages ? '#999' : '#333',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const UpcomingAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'patient'
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const appointmentsPerPage = 5;

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      // Si le cabinet a un médecin associé, récupérer ses informations
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
        // Récupérer les rendez-vous du médecin
        await fetchDoctorAppointments(cabinetData.linkedDoctorId);
      }
      
      setCabinetInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const confirmedAppointments = response.data.filter(apt => 
        apt.status === 'confirmed' && new Date(apt.date) > new Date()
      );
      setAppointments(confirmedAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
      setLoading(false);
    }
  };

  const toggleCardExpansion = (appointmentId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
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

  const formatTimeOnly = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTimeUntilAppointment = (dateString) => {
    const appointmentDate = new Date(dateString);
    const now = new Date();
    const diffMs = appointmentDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Demain";
    } else if (diffDays <= 7) {
      return `Dans ${diffDays} jours`;
    } else {
      return `Dans ${diffDays} jours`;
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date) - new Date(b.date);
    } else {
      return `${a.patient?.nom} ${a.patient?.prenom}`.localeCompare(`${b.patient?.nom} ${b.patient?.prenom}`);
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedAppointments.length / appointmentsPerPage);
  const indexOfFirstAppointment = (currentPage - 1) * appointmentsPerPage;
  const indexOfLastAppointment = indexOfFirstAppointment + appointmentsPerPage;
  const currentAppointments = sortedAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des rendez-vous...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FaBan className="error-icon" />
        <h3>Erreur</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="upcoming-appointments-container">
      {/* Header moderne avec statistiques */}
      <div className="upcoming-header">
        <div className="header-content">
          <div className="header-title">
            <FaCalendarAlt className="header-icon" />
            <div>
              <h1>Rendez-vous à venir</h1>
              <p>Gestion des consultations confirmées</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <FaCheck className="stat-icon" />
              <span className="stat-number">{appointments.length}</span>
              <span className="stat-label">Confirmés</span>
            </div>
          </div>
        </div>

        {/* Contrôles de tri et filtres */}
        {appointments.length > 0 && (
          <div className="controls-bar">
            <div className="sort-controls">
              <label>Trier par :</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date">Date</option>
                <option value="patient">Patient</option>
              </select>
            </div>
            <div className="view-info">
              <span>{appointments.length} rendez-vous au total</span>
            </div>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="upcoming-content">
        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaCalendarAlt />
            </div>
            <h3>Aucun rendez-vous à venir</h3>
            <p>Tous les rendez-vous confirmés apparaîtront ici</p>
          </div>
        ) : (
          <>
            <div className="appointments-grid-modern">
              {currentAppointments.map(appointment => {
                const isExpanded = expandedCards.has(appointment._id);
                return (
                  <div 
                    key={appointment._id} 
                    className={`appointment-card-modern upcoming ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleCardExpansion(appointment._id)}
                  >
                    <div className="card-header-modern">
                      <div className="appointment-time-badge">
                        <FaClock className="time-icon" />
                        <div className="time-details">
                          <span className="time">{formatTimeOnly(appointment.date)}</span>
                          <span className="date">{formatDateOnly(appointment.date)}</span>
                </div>
                      </div>
                      <div className="urgency-badge">
                        {getTimeUntilAppointment(appointment.date)}
                      </div>
                    </div>

                    <div className="card-body-modern">
                      <div className="patient-section-compact">
                        <div className="patient-avatar">
                          <FaUserMd />
                        </div>
                        <div className="patient-info-compact">
                          <h3 className="patient-name">
                            {appointment.patient?.prenom} {appointment.patient?.nom}
                          </h3>
                          <div className="expand-indicator">
                            {isExpanded ? 'Cliquez pour réduire' : 'Cliquez pour voir les détails'}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="expanded-details">
                          <div className="contact-info">
                            <div className="contact-item">
                              <FaPhone className="contact-icon" />
                              <span>{appointment.patient?.telephone}</span>
                            </div>
                            <div className="contact-item">
                              <FaEnvelope className="contact-icon" />
                              <span>{appointment.patient?.email}</span>
                            </div>
                          </div>

                          {appointment.reason && (
                            <div className="reason-section">
                              <div className="reason-header">
                                <FaStethoscope className="reason-icon" />
                                <span className="reason-label">Motif de consultation</span>
                              </div>
                              <p className="reason-text">{appointment.reason}</p>
                            </div>
                          )}

                  {appointment.requiredDocuments && (
                            <div className="documents-section">
                              <div className="documents-header">
                                <FaFileMedical className="documents-icon" />
                                <span className="documents-label">Documents requis</span>
                              </div>
                              <p className="documents-text">{appointment.requiredDocuments}</p>
                            </div>
                  )}
                </div>
                      )}
                    </div>

                    <div className="card-footer-modern">
                      <div className="status-section">
                        <div className="status-badge-modern confirmed">
                          <FaCheck className="status-icon" />
                          <span>Confirmé</span>
              </div>
                      </div>
                      <div className="appointment-id">
                        <span>#{appointment._id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-controls" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
                padding: '1rem'
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                    color: currentPage === 1 ? '#999' : '#333',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ← Précédent
                </button>
                
                <span style={{
                  padding: '0.5rem 1rem',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  Page {currentPage} sur {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                    color: currentPage === totalPages ? '#999' : '#333',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const PastAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const appointmentsPerPage = 5;

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
        await fetchDoctorAppointments(cabinetData.linkedDoctorId);
      }
      
      setCabinetInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pastAppointments = response.data.filter(apt => {
        const appointmentDate = new Date(apt.date);
        return appointmentDate < new Date();
      }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Tri du plus récent au plus ancien
      setAppointments(pastAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
      setLoading(false);
    }
  };

  const toggleCardExpansion = (appointmentId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { text: 'Terminé', class: 'status-completed', icon: '✅' };
      case 'cancelled':
        return { text: 'Annulé', class: 'status-cancelled', icon: '❌' };
      case 'no-show':
        return { text: 'Non présenté', class: 'status-no-show', icon: '⚠️' };
      default:
        return { text: 'Inconnu', class: 'status-unknown', icon: '❓' };
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      apt.patient?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const indexOfFirstAppointment = (currentPage - 1) * appointmentsPerPage;
  const indexOfLastAppointment = indexOfFirstAppointment + appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll vers le haut lors du changement de page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <FaBan className="error-icon" />
        <h3>Erreur</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="history-table-view">
      {/* Header moderne */}
      <div className="table-header">
        <div className="header-title">
          <FaHistory className="header-icon" />
          <div>
            <h1>Historique des rendez-vous <span style={{fontSize: '0.875rem', color: '#6b7280', fontWeight: 400, marginLeft: '1rem'}}>{appointments.length} consultations au total</span></h1>
          </div>
        </div>
      </div>

      {/* Contrôles de filtrage */}
      <div className="table-controls">
        <div className="search-group">
          <FaUserMd className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            className="table-search"
            />
          </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
          className="table-filter"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Terminés</option>
              <option value="cancelled">Annulés</option>
              <option value="no-show">Non présentés</option>
            </select>
        <div className="results-count">
          {filteredAppointments.length} résultat(s)
            </div>
          </div>

      {/* Tableau moderne */}
      <div className="table-container">
        {filteredAppointments.length === 0 ? (
          <div className="table-empty">
            <FaHistory className="empty-icon" />
            <h3>Aucun rendez-vous trouvé</h3>
            <p>Essayez de modifier vos critères de recherche</p>
        </div>
        ) : (
          <>
            {/* Liste simple des cartes d'historique */}
            <div className="history-cards-grid">
              {currentAppointments.map((appointment, index) => {
                const status = getStatusBadge(appointment.status);
                const isExpanded = expandedCards.has(appointment._id);
                return (
                  <div 
                    key={appointment._id} 
                    className={`history-appointment-card ${status.class.replace('status-', '')} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleCardExpansion(appointment._id)}
                  >
                    {/* Contenu simple en une ligne */}
                    <div className="history-card-content">
                      {/* Date et heure */}
                      <div className="history-datetime">
                        <div className="history-time-simple">{formatTime(appointment.date)}</div>
                        <div className="history-date-simple">{formatDate(appointment.date)}</div>
                      </div>

                      {/* Informations patient */}
                      <div className="history-patient-simple">
                        <div className="history-patient-name-simple">
                          {appointment.patient?.prenom} {appointment.patient?.nom}
                        </div>
                        <div className="history-patient-contact-simple">
                          📞 {appointment.patient?.telephone}
                        </div>
                      </div>

                      {/* Motif de consultation */}
                      <div className="history-reason-simple">
                        {appointment.reason ? (
                          <span>{appointment.reason}</span>
                        ) : (
                          <span className="history-reason-empty-simple">Non spécifié</span>
                        )}
                      </div>

                      {/* Statut */}
                      <div className={`history-status-simple ${status.class.replace('status-', '')}`}>
                        {status.text}
                      </div>
                    </div>

                    {/* Détails expandus */}
                    {isExpanded && (
                      <div className="history-expanded-simple">
                        <div className="history-contact-row">
                          <div className="history-contact-item-simple">
                            <FaPhone className="history-contact-icon-simple" />
                            <span>{appointment.patient?.telephone}</span>
                          </div>
                          <div className="history-contact-item-simple">
                            <FaEnvelope className="history-contact-icon-simple" />
                            <span>{appointment.patient?.email}</span>
                          </div>
                        </div>

                        {appointment.reason && (
                          <div className="history-reason-expanded">
                            <div className="history-reason-label-simple">Motif de consultation</div>
                            <div className="history-reason-text-simple">{appointment.reason}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination moderne complète */}
            {totalPages > 1 && (
              <div className="pagination-controls" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
                padding: '1rem'
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                    color: currentPage === 1 ? '#999' : '#333',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ← Précédent
                </button>
                
                <span style={{
                  padding: '0.5rem 1rem',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  Page {currentPage} sur {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                    color: currentPage === totalPages ? '#999' : '#333',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
      )}
      </div>
    </div>
  );
};

const NotificationsView = ({ onNotificationRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);
  const cabinetId = localStorage.getItem('userId');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5001/api/notifications/cabinet/${cabinetId}`);
      
      // Dédupliquer les notifications par _id côté frontend pour plus de sécurité
      const uniqueNotifications = response.data.filter((notif, index, self) => 
        index === self.findIndex(n => n._id === notif._id)
      );
      
      console.log(`📱 Notifications reçues pour le cabinet:`, {
        total: response.data.length,
        unique: uniqueNotifications.length,
        duplicatesRemoved: response.data.length - uniqueNotifications.length
      });
      
      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId, isAdminNotification = false) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${notificationId}/read`, {
        userId: cabinetId,
        isAdminNotification: isAdminNotification
      });
      
      // Mettre à jour l'état local des notifications
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Mettre à jour le compteur de notifications non lues dans la sidebar
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('Erreur marquage notification comme lue:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Aujourd'hui";
    } else if (diffDays === 2) {
      return "Hier";
    } else if (diffDays <= 7) {
      return `Il y a ${diffDays - 1} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'notification-priority-high';
      case 'medium':
        return 'notification-priority-medium';
      case 'low':
        return 'notification-priority-low';
      default:
        return 'notification-priority-normal';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info':
        return '📢';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  };

  // Pagination
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-content">
          <div className="header-title">
            <FaBell className="header-icon" />
            <div>
              <h1>Notifications</h1>
              <p>Gestion des notifications du cabinet</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-number">{notifications.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-badge unread">
              <span className="stat-number">{notifications.filter(n => !n.isRead).length}</span>
              <span className="stat-label">Non lues</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <FaBan className="error-icon" />
          <h3>Erreur</h3>
          <p>{error}</p>
          <button onClick={fetchNotifications} className="retry-btn">
            Réessayer
          </button>
        </div>
      )}

      {notifications.length === 0 && !loading && !error ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FaBell />
          </div>
          <h3>Aucune notification</h3>
          <p>Vous n'avez reçu aucune notification pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="notifications-list">
            {currentNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                onClick={() => !notification.isRead && markAsRead(notification._id, notification.source === 'admin')}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <div className="notification-type">
                      <span className="type-icon">{getTypeIcon(notification.type)}</span>
                      <span className="notification-title">{notification.title}</span>
                    </div>
                    <div className="notification-meta">
                      <span className="notification-date">{formatDate(notification.createdAt)}</span>
                      {!notification.isRead && <span className="unread-indicator">•</span>}
                    </div>
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  {notification.priority && notification.priority !== 'normal' && (
                    <div className="notification-priority">
                      Priorité: {notification.priority === 'high' ? 'Haute' : notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </div>
                  )}
                  {notification.sentBy && (
                    <div className="notification-sender">
                      Envoyé par: {notification.sentBy.prenom} {notification.sentBy.nom}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '1rem'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                  color: currentPage === 1 ? '#999' : '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ← Précédent
              </button>
              
              <span style={{
                padding: '0.5rem 1rem',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                  color: currentPage === totalPages ? '#999' : '#333',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CabinetDashboard;
