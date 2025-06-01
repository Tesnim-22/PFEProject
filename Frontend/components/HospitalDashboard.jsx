import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/HospitalDashboard.css';
import { 
  FaUserCircle, 
  FaCalendarAlt, 
  FaHospital, 
  FaSignOutAlt, 
  FaBell,
  FaUser,
  FaPhone,
  FaCalendarCheck,
  FaCalendarPlus,
  FaHeart,
  FaBaby,
  FaMicroscope,
  FaBrain,
  FaEye,
  FaBone,
  FaUserMd,
  FaXRay,
  FaAmbulance,
  FaMedkit,
  FaStethoscope,
  FaCheck,
  FaTimes,
  FaClock
} from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5001';

const HospitalDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('');
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [expandedSpecialties, setExpandedSpecialties] = useState({});
  const [activeSection, setActiveSection] = useState('appointments');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const hospitalId = localStorage.getItem('userId');
    if (hospitalId) {
      fetchAppointments(hospitalId);
      fetchUnreadNotifications(hospitalId);
      // Actualiser les notifications toutes les 30 secondes
      const interval = setInterval(() => fetchUnreadNotifications(hospitalId), 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Ouvrir automatiquement toutes les spécialités par défaut
  useEffect(() => {
    if (appointments.length > 0) {
      const specialties = [...new Set(appointments.map(apt => apt.specialty || 'Non spécifié'))];
      const initialExpanded = {};
      specialties.forEach(specialty => {
        initialExpanded[specialty] = true;
      });
      setExpandedSpecialties(initialExpanded);
    }
  }, [appointments]);

  const fetchAppointments = async (hospitalId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/hospital-appointments/hospital/${hospitalId}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessage('Erreur lors de la récupération des rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifications = async (hospitalId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/hospital/${hospitalId}/unread-count`);
      setUnreadNotifications(response.data.total || 0);
    } catch (error) {
      console.error('Erreur récupération notifications non lues:', error);
    }
  };

  const setMessageWithTimeout = (msg) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage('');
    }, 2000);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/hospital-appointments/${appointmentId}/status`, {
        status: newStatus
      });
      
      if (newStatus === 'confirmed') {
        setSelectedAppointment(appointments.find(apt => apt._id === appointmentId));
        setShowPlanningForm(true);
      } else {
        setAppointments(appointments.map(apt => 
          apt._id === appointmentId ? { ...apt, status: newStatus } : apt
        ));
        setMessageWithTimeout(`✅ Rendez-vous ${newStatus === 'confirmed' ? 'confirmé' : 'annulé'} avec succès !`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessageWithTimeout("Erreur lors de la mise à jour du statut.");
    }
  };

  const handlePlanningSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/hospital-appointments/${selectedAppointment._id}/planning`, {
        appointmentDate,
        requiredDocuments,
        status: 'confirmed'
      });

      setAppointments(appointments.map(apt => 
        apt._id === selectedAppointment._id 
          ? { ...apt, status: 'confirmed', appointmentDate, requiredDocuments } 
          : apt
      ));

      setMessageWithTimeout('✅ Planification du rendez-vous envoyée avec succès !');
      setShowPlanningForm(false);
      setSelectedAppointment(null);
      setAppointmentDate('');
      setRequiredDocuments('');
    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessageWithTimeout("Erreur lors de la planification du rendez-vous.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const filteredAppointments = appointments
    .filter(apt => {
      if (activeFilter === 'all') return true;
      return apt.status === activeFilter;
    })
    .filter(apt => {
      const searchLower = searchTerm.toLowerCase();
      return (
        apt.patientId?.nom?.toLowerCase().includes(searchLower) ||
        apt.patientId?.prenom?.toLowerCase().includes(searchLower) ||
        apt.specialty?.toLowerCase().includes(searchLower)
      );
    });

  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const specialty = appointment.specialty || 'Non spécifié';
    if (!groups[specialty]) {
      groups[specialty] = [];
    }
    groups[specialty].push(appointment);
    return groups;
  }, {});

  const toggleSpecialty = (specialty) => {
    setExpandedSpecialties(prev => ({
      ...prev,
      [specialty]: !prev[specialty]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'var(--color-success)';
      case 'cancelled': return 'var(--color-danger)';
      default: return 'var(--color-warning)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <FaCheck />;
      case 'cancelled': return <FaTimes />;
      default: return <FaClock />;
    }
  };

  const getSpecialtyIcon = (specialty) => {
    const icons = {
      'Cardiologie': <FaHeart />,
      'Pédiatrie': <FaBaby />,
      'Dermatologie': <FaMicroscope />,
      'Neurologie': <FaBrain />,
      'Ophtalmologie': <FaEye />,
      'Orthopédie': <FaBone />,
      'Psychiatrie': <FaUserMd />,
      'Radiologie': <FaXRay />,
      'Urgences': <FaAmbulance />,
    };
    return icons[specialty] || <FaStethoscope />;
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <aside className="medical-sidebar">
        <div className="sidebar-header">
            <div className="medical-logo">
              <div className="logo-text">
                <h2>PatientPath</h2>
                <span>Hôpital</span>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-navigation">
            <div className="nav-section">
              <span className="nav-section-title">Gestion</span>
          <button 
                className={`nav-item ${activeSection === 'appointments' && activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('appointments');
              setActiveFilter('all');
            }}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Tous les RDV</span>
          </button>
          <button 
                className={`nav-item ${activeSection === 'appointments' && activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('appointments');
              setActiveFilter('pending');
            }}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">En attente</span>
          </button>
          <button 
                className={`nav-item ${activeSection === 'appointments' && activeFilter === 'confirmed' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('appointments');
              setActiveFilter('confirmed');
            }}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Confirmés</span>
          </button>
          <button 
                className={`nav-item ${activeSection === 'appointments' && activeFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('appointments');
              setActiveFilter('cancelled');
            }}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Annulés</span>
          </button>
            </div>

            <div className="nav-section">
              <span className="nav-section-title">COMMUNICATION</span>
              <button 
                className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSection('notifications')}
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
              <span className="nav-text">Se déconnecter</span>
        </button>
          </div>
      </aside>

        <main className="main-content">
        {message && (
          <div className="alert" onClick={() => setMessage('')}>
            {message.includes('✅') ? '✅' : '❌'} {message}
          </div>
        )}

        {activeSection === 'appointments' && (
          <>
        <div className="profile-header-content">
          <div className="profile-title">
            <h1>
              <FaHospital style={{ color: '#0f766e' }} />
              Gestion des Rendez-vous
            </h1>
            {!loading && appointments.length > 0 && (
              <div className="stats-summary">
                <span className="stat-item pending">
                  <FaClock /> {appointments.filter(apt => apt.status === 'pending').length} en attente
                </span>
                <span className="stat-item confirmed">
                  <FaCheck /> {appointments.filter(apt => apt.status === 'confirmed').length} confirmés
                </span>
                <span className="stat-item cancelled">
                  <FaTimes /> {appointments.filter(apt => apt.status === 'cancelled').length} annulés
                </span>
              </div>
            )}
          </div>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher un patient ou une spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
          </>
        )}

        {showPlanningForm && selectedAppointment && (
          <div className="planning-form-overlay">
            <div className="planning-form-container">
              <h2>Planifier le rendez-vous</h2>
              <p>Patient: {selectedAppointment.patientId?.nom} {selectedAppointment.patientId?.prenom}</p>
              <p>Spécialité: {selectedAppointment.specialty}</p>
              
              <form onSubmit={handlePlanningSubmit} className="planning-form">
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
                    placeholder="Liste des documents nécessaires..."
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="confirm-btn">
                    Confirmer la planification
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

        {activeSection === 'notifications' && (
          <div className="notifications-container">
            <div className="notifications-header">
              <div className="header-content">
                <div className="header-title">
                  <FaBell className="header-icon" />
                  <div>
                    <h1>Notifications</h1>
                    <p>Gestion des notifications de l'hôpital</p>
                  </div>
                </div>
                <div className="header-stats">
                  <div className="stat-badge">
                    <span className="stat-number">{unreadNotifications}</span>
                    <span className="stat-label">Non lues</span>
                  </div>
                </div>
              </div>
            </div>

            <NotificationsContent 
              hospitalId={localStorage.getItem('userId')} 
              onNotificationRead={() => fetchUnreadNotifications(localStorage.getItem('userId'))} 
            />
          </div>
        )}

        {activeSection === 'appointments' && (
          loading ? (
            <div className="loading">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><FaClock /></div>
              <div>Chargement des rendez-vous...</div>
            </div>
          ) : (
            <div className="appointments-container">
              {Object.keys(groupedAppointments).length === 0 ? (
                <div className="no-appointments">
                  <h3><FaMedkit /> Aucun rendez-vous trouvé</h3>
                  <p>
                    {activeFilter !== 'all' 
                      ? `Aucun rendez-vous ${getStatusText(activeFilter).toLowerCase()} pour le moment.`
                      : searchTerm 
                        ? `Aucun rendez-vous trouvé pour "${searchTerm}".`
                        : 'Aucun rendez-vous disponible pour le moment.'
                    }
                  </p>
                </div>
              ) : (
                Object.entries(groupedAppointments)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([specialty, specialtyAppointments]) => (
                  <div key={specialty} className="appointment-category">
                    <div 
                      className="category-header"
                      onClick={() => toggleSpecialty(specialty)}
                    >
                      <div className="category-title">
                        <h2>
                          {getSpecialtyIcon(specialty)} {specialty}
                        </h2>
                        <span className="toggle-icon">
                          {expandedSpecialties[specialty] ? '−' : '+'}
                        </span>
                      </div>
                      <div className="appointment-count">
                        {specialtyAppointments.length} rendez-vous
                      </div>
                    </div>
                    {expandedSpecialties[specialty] && (
                      <div className="appointments-grid">
                        {specialtyAppointments
                          .sort((a, b) => {
                            // Trier par statut (pending en premier) puis par date
                            if (a.status === 'pending' && b.status !== 'pending') return -1;
                            if (a.status !== 'pending' && b.status === 'pending') return 1;
                            return new Date(b.createdAt) - new Date(a.createdAt);
                          })
                          .map((appointment) => {
                            const isRecent = new Date() - new Date(appointment.createdAt) < 24 * 60 * 60 * 1000; // 24h
                            const isUrgent = appointment.status === 'pending' && isRecent;
                            
                            return (
                          <div 
                            key={appointment._id} 
                            className={`appointment-item ${appointment.status} ${isUrgent ? 'urgent' : isRecent ? 'recent' : ''}`}
                          >
                            <div className="appointment-info">
                              <div className="patient-name">
                                <FaUser className="icon" />
                                  <span>{appointment.patientId?.nom || 'N/A'} {appointment.patientId?.prenom || ''}</span>
                              </div>
                              <div className="patient-phone">
                                <FaPhone className="icon" />
                                  <span>{appointment.patientId?.telephone || 'Non renseigné'}</span>
                              </div>
                              <div className="request-date">
                                <FaCalendarPlus className="icon" />
                                <span>Demande: {new Date(appointment.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              {appointment.appointmentDate && (
                                <div className="scheduled-date">
                                  <FaCalendarCheck className="icon" />
                                  <span>RDV: {new Date(appointment.appointmentDate).toLocaleDateString('fr-FR')} à {new Date(appointment.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}
                            </div>

                            <div className="appointment-status">
                              <span className={`status ${appointment.status}`}>
                                {getStatusIcon(appointment.status)} {getStatusText(appointment.status)}
                              </span>
                            </div>

                            <div className="appointment-actions">
                              {appointment.status === 'pending' && (
                                <>
                                  <button
                                    className="btn-confirm"
                                    onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                                  >
                                    <FaCheck /> Confirmer
                                  </button>
                                  <button
                                    className="btn-cancel"
                                    onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                                  >
                                    <FaTimes /> Refuser
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )
        )}
      </main>
      </div>
    </div>
  );
};

// Composant pour le contenu des notifications
const NotificationsContent = ({ hospitalId, onNotificationRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);

  useEffect(() => {
    if (hospitalId) {
      fetchNotifications();
    }
  }, [hospitalId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/notifications/hospital/${hospitalId}`);
      
      // Dédupliquer les notifications par _id côté frontend pour plus de sécurité
      const uniqueNotifications = response.data.filter((notif, index, self) => 
        index === self.findIndex(n => n._id === notif._id)
      );
      
      console.log(`📱 Notifications reçues pour l'hôpital:`, {
        total: response.data.length,
        unique: uniqueNotifications.length,
        duplicatesRemoved: response.data.length - uniqueNotifications.length
      });
      
      // Log pour examiner la structure des notifications
      console.log('📋 Structure des notifications:', uniqueNotifications.slice(0, 2).map(n => ({
        id: n._id,
        title: n.title,
        isRead: n.isRead,
        source: n.source,
        type: typeof n.isRead
      })));
      
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
      console.log('🔄 Tentative de marquage comme lu:', { notificationId, isAdminNotification, hospitalId });
      
      const response = await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        userId: hospitalId,
        isAdminNotification: isAdminNotification
      });
      
      console.log('✅ Réponse API marquage comme lu:', response.data);
      
      // Mettre à jour l'état local des notifications
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      console.log('📝 Notification mise à jour localement');
      
      // Mettre à jour le compteur de notifications non lues dans la sidebar
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('❌ Erreur marquage notification comme lue:', error);
      console.error('Détails erreur:', error.response?.data);
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Erreur</h3>
        <p>{error}</p>
        <button onClick={fetchNotifications} className="retry-btn">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="notifications-content">
      {notifications.length === 0 ? (
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
                  
                  {!notification.isRead && (
                    <div className="notification-actions">
                      <button
                        className="mark-as-read-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🖱️ Clic sur icône "Marquer comme lu":', { 
                            id: notification._id, 
                            title: notification.title 
                          });
                          markAsRead(notification._id, notification.source === 'admin');
                        }}
                        title="Marquer comme lu"
                      >
                        <FaCheck />
                      </button>
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

export default HospitalDashboard;
