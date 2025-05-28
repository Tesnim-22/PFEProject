import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/HospitalDashboard.css';
import { FaUserCircle, FaCalendarAlt, FaHospital, FaSignOutAlt } from 'react-icons/fa';

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

  useEffect(() => {
    const hospitalId = localStorage.getItem('userId');
    if (hospitalId) {
      fetchAppointments(hospitalId);
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
      case 'confirmed': return '✅';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  const getSpecialtyIcon = (specialty) => {
    const icons = {
      'Cardiologie': '❤️',
      'Pédiatrie': '👶',
      'Dermatologie': '🔬',
      'Neurologie': '🧠',
      'Ophtalmologie': '👁️',
      'Orthopédie': '🦴',
      'Psychiatrie': '🧑‍⚕️',
      'Radiologie': '📷',
      'Urgences': '🚑',
    };
    return icons[specialty] || '🏥';
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
                className={`nav-item ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Tous les RDV</span>
          </button>
          <button 
                className={`nav-item ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">En attente</span>
          </button>
          <button 
                className={`nav-item ${activeFilter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('confirmed')}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Confirmés</span>
          </button>
          <button 
                className={`nav-item ${activeFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveFilter('cancelled')}
          >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Annulés</span>
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

        <div className="profile-header-content">
          <div className="profile-title">
            <h1>
              <FaHospital style={{ color: '#0f766e' }} />
              Gestion des Rendez-vous
            </h1>
            {!loading && appointments.length > 0 && (
              <div className="stats-summary">
                <span className="stat-item pending">
                  ⏳ {appointments.filter(apt => apt.status === 'pending').length} en attente
                </span>
                <span className="stat-item confirmed">
                  ✅ {appointments.filter(apt => apt.status === 'confirmed').length} confirmés
                </span>
                <span className="stat-item cancelled">
                  ❌ {appointments.filter(apt => apt.status === 'cancelled').length} annulés
                </span>
              </div>
            )}
          </div>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Rechercher un patient ou une spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

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

        {loading ? (
          <div className="loading">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⌛</div>
            <div>Chargement des rendez-vous...</div>
          </div>
        ) : (
          <div className="appointments-container">
            {Object.keys(groupedAppointments).length === 0 ? (
              <div className="no-appointments">
                <h3>📭 Aucun rendez-vous trouvé</h3>
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
                          className={`appointment-card ${isUrgent ? 'urgent' : isRecent ? 'recent' : ''}`}
                        >
                          <div className="appointment-info">
                            <h3>
                              {getSpecialtyIcon(appointment.specialty)} {appointment.specialty}
                            </h3>
                            <div className="patient-details">
                              <p>
                                <strong>👤</strong>
                                <span>{appointment.patientId?.nom || 'N/A'} {appointment.patientId?.prenom || ''}</span>
                              </p>
                              <p>
                                <strong>📧</strong>
                                <span>{appointment.patientId?.email || 'Non renseigné'}</span>
                              </p>
                              <p>
                                <strong>📞</strong>
                                <span>{appointment.patientId?.telephone || 'Non renseigné'}</span>
                              </p>
                              <p className="appointment-date">
                                <strong>📅</strong>
                                <span>{new Date(appointment.createdAt).toLocaleDateString('fr-FR')}</span>
                              </p>
                              {appointment.appointmentDate && (
                                <p className="appointment-date">
                                  <strong>🗓️</strong>
                                  <span>{new Date(appointment.appointmentDate).toLocaleDateString('fr-FR')} à {new Date(appointment.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </p>
                            )}
                            </div>
                          </div>

                          {appointment.status === 'pending' && (
                            <div className="appointment-actions">
                              <button
                                className="confirm-btn"
                                onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                                title="Confirmer et planifier le rendez-vous"
                              >
                                ✅ Confirmer
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                                title="Refuser le rendez-vous"
                              >
                                ❌ Refuser
                              </button>
                            </div>
                          )}

                          <div className="appointment-status">
                            <span 
                              className={`status-badge ${appointment.status}`}
                            >
                              {getStatusIcon(appointment.status)} {getStatusText(appointment.status)}
                            </span>
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
        )}
      </main>
      </div>
    </div>
  );
};

export default HospitalDashboard;
