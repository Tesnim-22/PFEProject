import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/HospitalDashboard.css';

const API_BASE_URL = 'http://localhost:5001';

const styles = {
  specialtyGroup: {
    marginBottom: '1rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  },
  specialtyHeader: {
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s ease'
  },
  specialtyHeaderHover: {
    '&:hover': {
      backgroundColor: 'var(--bg-hover)'
    }
  },
  appointmentCount: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '15px',
    fontSize: '0.9rem'
  },
  appointmentsContainer: {
    padding: '1rem'
  },
  specialtyContent: {
    maxHeight: '0',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-out',
    backgroundColor: '#fff'
  },
  expandedContent: {
    maxHeight: '2000px', // Valeur suffisamment grande pour le contenu
    transition: 'max-height 0.5s ease-in'
  },
  toggleIcon: {
    marginLeft: '10px',
    transition: 'transform 0.3s ease'
  },
  rotatedIcon: {
    transform: 'rotate(180deg)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }
};

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

  useEffect(() => {
    // Initialiser les premières sections comme ouvertes
    const initialExpandedState = {};
    const specialties = Object.keys(groupAppointmentsBySpecialty(appointments));
    specialties.forEach((specialty, index) => {
      // Ouvrir par défaut la première section ou celle qui correspond au filtre actif
      if (index === 0 || (activeFilter !== 'all' && appointments.some(apt => 
        apt.specialty === specialty && apt.status === activeFilter
      ))) {
        initialExpandedState[specialty] = true;
      }
    });
    setExpandedSpecialties(initialExpandedState);
  }, [appointments, activeFilter]);

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
        setMessage(`✅ Rendez-vous ${newStatus === 'confirmed' ? 'confirmé' : 'annulé'} avec succès !`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessage("Erreur lors de la mise à jour du statut.");
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

      setMessage('✅ Planification du rendez-vous envoyée avec succès !');
      setShowPlanningForm(false);
      setSelectedAppointment(null);
      setAppointmentDate('');
      setRequiredDocuments('');
    } catch (error) {
      console.error('❌ Erreur:', error);
      setMessage("Erreur lors de la planification du rendez-vous.");
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

  const groupAppointmentsBySpecialty = (appointments) => {
    return appointments.reduce((groups, appointment) => {
      const specialty = appointment.specialty || 'Non spécifié';
      if (!groups[specialty]) {
        groups[specialty] = [];
      }
      groups[specialty].push(appointment);
      return groups;
    }, {});
  };

  const toggleSpecialty = (specialty) => {
    setExpandedSpecialties(prev => ({
      ...prev,
      [specialty]: !prev[specialty]
    }));
  };

  return (
    <div className="hospital-dashboard">
      <aside className="hospital-sidebar">
        <div className="sidebar-header">
          <h2>🏥 Hôpital</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeFilter === 'all' ? 'active' : ''} 
            onClick={() => setActiveFilter('all')}
          >
            📋 Tous les rendez-vous
          </button>
          <button 
            className={activeFilter === 'pending' ? 'active' : ''} 
            onClick={() => setActiveFilter('pending')}
          >
            ⏳ En attente
          </button>
          <button 
            className={activeFilter === 'confirmed' ? 'active' : ''} 
            onClick={() => setActiveFilter('confirmed')}
          >
            ✅ Confirmés
          </button>
          <button 
            className={activeFilter === 'cancelled' ? 'active' : ''} 
            onClick={() => setActiveFilter('cancelled')}
          >
            ❌ Annulés
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </nav>
      </aside>

      <main className="hospital-main">
        {message && (
          <div className="alert" onClick={() => setMessage('')}>
            {message}
          </div>
        )}

        <div className="appointments-header">
          <h1>Gestion des Rendez-vous</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher un patient ou une spécialité..."
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
          <div className="loading">Chargement des rendez-vous...</div>
        ) : (
          <div className="appointments-container" style={styles.appointmentsContainer}>
            {Object.entries(groupAppointmentsBySpecialty(filteredAppointments)).map(([specialty, specialtyAppointments]) => (
              <div key={specialty} style={styles.specialtyGroup}>
                <div 
                  style={{
                    ...styles.specialtyHeader,
                    ...styles.specialtyHeaderHover
                  }}
                  onClick={() => toggleSpecialty(specialty)}
                >
                  <div style={styles.headerLeft}>
                    <h2>{specialty}</h2>
                    <span style={styles.appointmentCount}>
                      {specialtyAppointments.length} rendez-vous
                    </span>
                  </div>
                  <span 
                    style={{
                      ...styles.toggleIcon,
                      ...(expandedSpecialties[specialty] ? styles.rotatedIcon : {})
                    }}
                  >
                    ▼
                  </span>
                </div>
                <div 
                  style={{
                    ...styles.specialtyContent,
                    ...(expandedSpecialties[specialty] ? styles.expandedContent : {})
                  }}
                >
                  <div className="appointments-grid">
                    {specialtyAppointments.map((appointment) => (
                      <div key={appointment._id} className="appointment-card">
                        <div className="appointment-header">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(appointment.status) }}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="patient-info">
                          <p>
                            <strong>Patient :</strong> {appointment.patientId?.nom} {appointment.patientId?.prenom}
                          </p>
                          <p>
                            <strong>Email :</strong> {appointment.patientId?.email}
                          </p>
                          <p>
                            <strong>Téléphone :</strong> {appointment.patientId?.telephone}
                          </p>
                          <p>
                            <strong>Date de demande :</strong>{' '}
                            {new Date(appointment.createdAt).toLocaleString('fr-FR')}
                          </p>
                          {appointment.appointmentDate && (
                            <p>
                              <strong>Date du rendez-vous :</strong>{' '}
                              {new Date(appointment.appointmentDate).toLocaleString('fr-FR')}
                            </p>
                          )}
                          {appointment.requiredDocuments && (
                            <p>
                              <strong>Documents requis :</strong>{' '}
                              {appointment.requiredDocuments}
                            </p>
                          )}
                        </div>

                        {appointment.status === 'pending' && (
                          <div className="appointment-actions">
                            <button
                              className="confirm-btn"
                              onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                            >
                              Confirmer
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HospitalDashboard;
