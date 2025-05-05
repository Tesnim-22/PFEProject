import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/LabsDashboard.css';
import LabResultModal from './LabResultModal';

const API_BASE_URL = 'http://localhost:5001';

const LabsDashboard = () => {
  const [activeSection, setActiveSection] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'cancelled'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentLabId, setCurrentLabId] = useState(null);
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('');
  
  // États pour la messagerie
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const labId = localStorage.getItem('userId');
    setCurrentLabId(labId);
    console.log('Lab ID utilisé:', labId);
    if (labId) {
      fetchAppointments(labId);
      fetchDoctors();
    }
  }, []);

  const fetchAppointments = async (labId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/lab-appointments/lab/${labId}`);
      
      // S'assurer que chaque rendez-vous a les informations complètes du patient
      const appointmentsWithFullData = response.data.map(apt => ({
        ...apt,
        patient: {
          _id: apt.patient?._id,
          nom: apt.patient?.nom || '',
          prenom: apt.patient?.prenom || '',
          email: apt.patient?.email || '',
          telephone: apt.patient?.telephone || ''
        }
      }));
      
      setAppointments(appointmentsWithFullData);
      setError('');
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des rendez-vous:', err);
      setError('Impossible de charger les rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      if (newStatus === 'confirmed') {
        setSelectedAppointment(appointments.find(apt => apt._id === appointmentId));
        setShowPlanningForm(true);
      } else {
        await axios.put(`${API_BASE_URL}/api/lab-appointments/${appointmentId}/status`, {
          status: newStatus
        });
        
        setAppointments(appointments.map(apt => 
          apt._id === appointmentId ? {...apt, status: newStatus} : apt
        ));

        setError(`✅ Statut mis à jour avec succès : ${newStatus}`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour du statut:', err);
      setError('Impossible de mettre à jour le statut.');
    }
  };

  const getFilteredAppointments = () => {
    if (filter === 'all') return appointments;
    return appointments.filter(apt => apt.status === filter);
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

  const handleSendResults = (appointment) => {
    // Vérifier que nous avons toutes les informations nécessaires
    if (!appointment.patient || !appointment.patient._id) {
      setError('❌ Informations du patient manquantes. Veuillez rafraîchir la page.');
      return;
    }
    setSelectedAppointment(appointment);
    setIsResultModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsResultModalOpen(false);
    setSelectedAppointment(null);
  };

  // Fonction pour récupérer la liste des médecins
  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctors-for-labs`);
      setDoctors(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération médecins:', error);
      setError('Impossible de charger la liste des médecins.');
    }
  };

  // Fonction pour récupérer les messages avec un médecin
  const fetchMessages = async (doctorId) => {
    if (!currentLabId || !doctorId) return;
    
    setChatLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-doctor-messages/${currentLabId}/${doctorId}`);
      setMessages(response.data);
      
      // Marquer les messages comme lus
      await axios.put(`${API_BASE_URL}/api/lab-doctor-messages/read`, {
        receiverId: currentLabId,
        senderId: doctorId
      });
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      setError('Impossible de charger les messages.');
    } finally {
      setChatLoading(false);
    }
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDoctor || !currentLabId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/lab-doctor-messages`, {
        senderId: currentLabId,
        receiverId: selectedDoctor._id,
        content: newMessage
      });

      // Ajouter le nouveau message à la liste
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      setError('Impossible d\'envoyer le message.');
    }
  };

  // Gestionnaire de sélection d'un médecin
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    fetchMessages(doctor._id);
  };

  const handlePlanningSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/lab-appointments/${selectedAppointment._id}/planning`, {
        appointmentDate,
        requiredDocuments,
        status: 'confirmed'
      });

      setAppointments(appointments.map(apt => 
        apt._id === selectedAppointment._id 
          ? { ...apt, status: 'confirmed', appointmentDate, requiredDocuments } 
          : apt
      ));

      setError('✅ Planification du rendez-vous envoyée avec succès !');
      setShowPlanningForm(false);
      setSelectedAppointment(null);
      setAppointmentDate('');
      setRequiredDocuments('');
    } catch (error) {
      console.error('❌ Erreur:', error);
      setError("Erreur lors de la planification du rendez-vous.");
    }
  };

  if (loading && activeSection === 'appointments') return <div className="loading">Chargement...</div>;

  return (
    <div className="labs-dashboard">
      <div className="dashboard-header">
        <h1>🔬 Tableau de bord du laboratoire</h1>
        <div className="section-tabs">
          <button
            className={activeSection === 'appointments' ? 'active' : ''}
            onClick={() => setActiveSection('appointments')}
          >
            📅 Rendez-vous
          </button>
          <button
            className={activeSection === 'chat' ? 'active' : ''}
            onClick={() => setActiveSection('chat')}
          >
            💬 Discussion Médecins
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeSection === 'appointments' && (
        <div className="appointments-container">
          <h2>📅 Rendez-vous</h2>
          {getFilteredAppointments().length === 0 ? (
            <p className="no-appointments">Aucun rendez-vous trouvé.</p>
          ) : (
            <div className="appointments-grid">
              {getFilteredAppointments().map((appointment) => (
                <div 
                  key={appointment._id} 
                  className={`appointment-card status-${appointment.status}`}
                  onClick={() => setSelectedAppointment(
                    selectedAppointment?._id === appointment._id ? null : appointment
                  )}
                >
                  <div className="appointment-header">
                    <span className="appointment-date">
                      🗓️ {formatDate(appointment.date)}
                    </span>
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status === 'confirmed' ? '✅ Confirmé' :
                       appointment.status === 'pending' ? '⏳ En attente' : '❌ Annulé'}
                    </span>
                  </div>

                  <div className="patient-info">
                    <h3>👤 Patient</h3>
                    <p>Nom: {appointment.patient?.nom} {appointment.patient?.prenom}</p>
                    <p>📧 {appointment.patient?.email}</p>
                    <p>📞 {appointment.patient?.telephone}</p>
                  </div>

                  <div className="appointment-details">
                    <h4>📝 Détails de l'analyse</h4>
                    <p>{appointment.reason}</p>
                  </div>

                  {selectedAppointment?._id === appointment._id && (
                    <div className="appointment-actions">
                      {appointment.status === 'pending' && (
                        <>
                          <button 
                            className="confirm-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(appointment._id, 'confirmed');
                            }}
                          >
                            ✅ Confirmer
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(appointment._id, 'cancelled');
                            }}
                          >
                            ❌ Annuler
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button 
                          className="send-results-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendResults(appointment);
                          }}
                        >
                          📄 Envoyer les résultats
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'chat' && (
        <div className="chat-section">
          <div className="doctors-list">
            <h3>🩺 Liste des Médecins</h3>
            {doctors.map(doctor => (
              <div
                key={doctor._id}
                className={`doctor-item ${selectedDoctor?._id === doctor._id ? 'selected' : ''}`}
                onClick={() => handleDoctorSelect(doctor)}
              >
                <div className="doctor-info">
                  <strong>Dr. {doctor.prenom} {doctor.nom}</strong>
                  <span className="specialty">{doctor.specialty}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-container">
            {selectedDoctor ? (
              <>
                <div className="chat-header">
                  <h3>💬 Discussion avec Dr. {selectedDoctor.prenom} {selectedDoctor.nom}</h3>
                </div>

                <div className="messages-container">
                  {chatLoading ? (
                    <div className="loading">Chargement des messages...</div>
                  ) : (
                    messages.map(message => (
                      <div
                        key={message._id}
                        className={`message ${message.senderId === currentLabId ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">{message.content}</div>
                        <div className="message-time">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="message-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={handleSendMessage}>Envoyer</button>
                </div>
              </>
            ) : (
              <div className="no-selection">
                👈 Sélectionnez un médecin pour commencer une discussion
              </div>
            )}
          </div>
        </div>
      )}

      {showPlanningForm && selectedAppointment && (
        <div className="planning-form-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="planning-form-container" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2>Planifier le rendez-vous</h2>
            <p>Patient: {selectedAppointment.patient?.nom} {selectedAppointment.patient?.prenom}</p>
            
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

              <div className="form-actions" style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
              }}>
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

      {/* Modal pour l'envoi des résultats */}
      <LabResultModal
        isOpen={isResultModalOpen}
        onClose={handleCloseModal}
        appointment={selectedAppointment}
        labId={currentLabId}
      />
    </div>
  );
};

export default LabsDashboard;
