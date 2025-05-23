import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/LabsDashboard.css';
import LabResultModal from './LabResultModal';
import { FaUserCircle, FaUser, FaFileMedical, FaCalendarAlt, FaFlask, FaComments, FaSignOutAlt } from "react-icons/fa";

const API_BASE_URL = 'http://localhost:5001';

const LabsDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
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
  const [profile, setProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  
  // États pour la messagerie
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [labMessages, setLabMessages] = useState([]);
  const [newLabMessage, setNewLabMessage] = useState('');

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMessages, setPatientMessages] = useState([]);
  const [newPatientMessage, setNewPatientMessage] = useState('');

  useEffect(() => {
    const labId = localStorage.getItem('userId');
    if (!labId) {
      setError('❌ Erreur: Identifiant du laboratoire non trouvé');
      return;
    }
    setCurrentLabId(labId);
    console.log('Lab ID utilisé:', labId);
    fetchLabProfile(labId);
    fetchAppointments(labId);
    fetchDoctors();
    fetchLabs();
    fetchPatients(labId);
  }, []);

  const fetchLabProfile = async (labId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${labId}`);
      setProfile(response.data);
      setEditedProfile(response.data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error);
      setError('Erreur lors de la récupération du profil');
    }
  };

  const handleProfileEdit = () => {
    setIsEditing(true);
  };

  const handleProfileSave = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/users/${currentLabId}`, editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
      setError('✅ Profil mis à jour avec succès !');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      setError('Erreur lors de la mise à jour du profil');
    }
  };

  const handleProfileCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

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
      // S'assurer que chaque message a un _id unique
      const messagesWithIds = response.data.map(msg => ({
        ...msg,
        _id: msg._id || `${msg.senderId}-${Date.now()}-${Math.random()}`
      }));
      setMessages(messagesWithIds);
      
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
    const labId = currentLabId || localStorage.getItem('userId');
    if (!newMessage.trim() || !selectedDoctor || !labId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/lab-doctor-messages`, {
        senderId: labId,
        receiverId: selectedDoctor._id,
        content: newMessage
      });

      // S'assurer que le nouveau message a toutes les propriétés nécessaires
      const newMessageWithDetails = {
        _id: response.data._id || Date.now().toString(), // Assure une clé unique
        senderId: labId,
        receiverId: selectedDoctor._id,
        content: newMessage,
        createdAt: response.data.createdAt || new Date().toISOString()
      };

      // Mettre à jour les messages de manière immédiate
      setMessages(prevMessages => [...prevMessages, newMessageWithDetails]);
      setNewMessage('');
      
      // Rafraîchir les messages après l'envoi
      fetchMessages(selectedDoctor._id);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      setError('Impossible d\'envoyer le message.');
    }
  };

  // Gestionnaire de sélection d'un médecin
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    const labId = currentLabId || localStorage.getItem('userId');
    if (labId && doctor._id) {
      fetchMessages(doctor._id);
    }
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

  // Fonction pour récupérer la liste des laboratoires
  const fetchLabs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/labs-valides`);
      setLabs(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération laboratoires:', error);
      setError('Impossible de charger la liste des laboratoires.');
    }
  };

  // Fonction pour récupérer les messages avec un laboratoire
  const fetchLabMessages = async (labId) => {
    if (!currentLabId || !labId) return;
    
    setChatLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-lab-messages/${currentLabId}/${labId}`);
      setLabMessages(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      setError('Impossible de charger les messages.');
    } finally {
      setChatLoading(false);
    }
  };

  // Fonction pour envoyer un message à un laboratoire
  const handleSendLabMessage = async () => {
    if (!newLabMessage.trim() || !selectedLab || !currentLabId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/lab-lab-messages`, {
        senderId: currentLabId,
        receiverId: selectedLab._id,
        content: newLabMessage
      });

      setLabMessages(prev => [...prev, response.data.data]);
      setNewLabMessage('');
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      setError('Impossible d\'envoyer le message.');
    }
  };

  // Fonction pour récupérer la liste des patients
  const fetchPatients = async (labId) => {
    if (!labId) {
      console.error('❌ Erreur: Identifiant du laboratoire non disponible');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-appointments/lab/${labId}`);
      // Extraire les patients uniques des rendez-vous
      const uniquePatients = Array.from(
        new Map(
          response.data
            .filter(apt => apt.patient && apt.patient._id)
            .map(apt => [apt.patient._id, apt.patient])
        ).values()
      );
      setPatients(uniquePatients);
    } catch (error) {
      console.error('❌ Erreur récupération patients:', error);
      setError('Impossible de charger la liste des patients.');
    }
  };

  // Fonction pour récupérer les messages avec un patient
  const fetchPatientMessages = async (patientId) => {
    if (!currentLabId || !patientId) return;
    
    setChatLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-patient-messages/${currentLabId}/${patientId}`);
      setPatientMessages(response.data);
      
      // Marquer les messages comme lus
      await axios.put(`${API_BASE_URL}/api/lab-patient-messages/read`, {
        receiverId: currentLabId,
        senderId: patientId
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      setError('Impossible de charger les messages.');
    } finally {
      setChatLoading(false);
    }
  };

  // Fonction pour envoyer un message à un patient
  const handleSendPatientMessage = async () => {
    if (!newPatientMessage.trim() || !selectedPatient || !currentLabId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/lab-patient-messages`, {
        senderId: currentLabId,
        receiverId: selectedPatient._id,
        content: newPatientMessage
      });

      setPatientMessages(prev => [...prev, response.data]);
      setNewPatientMessage('');
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      setError('Impossible d\'envoyer le message.');
    }
  };

  // Ajoutez ces fonctions de filtrage et de tri
  const sortAppointments = (appointments) => {
    return appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return { icon: '✅', text: 'Confirmé', class: 'status-confirmed' };
      case 'pending':
        return { icon: '⏳', text: 'En attente', class: 'status-pending' };
      case 'cancelled':
        return { icon: '❌', text: 'Annulé', class: 'status-cancelled' };
      default:
        return { icon: '❔', text: 'Inconnu', class: '' };
    }
  };

  if (loading && activeSection === 'appointments') return <div className="loading">Chargement...</div>;

  return (
    <div className="labs-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <FaUserCircle size={32} style={{ marginRight: 8, color: "#038A91" }} />
            <span className="user-role" style={{ fontSize: "1rem", fontWeight: 500, color: "#038A91" }}>Interface Laboratoire</span>
          </div>
        </div>
        <nav className="sidebar-menu">
          <button
            className={activeSection === 'profile' ? 'active' : ''}
            onClick={() => setActiveSection('profile')}
          >
            <FaUser className="icon" />
            <span>Mon Profil</span>
          </button>
          <button
            className={activeSection === 'appointments' ? 'active' : ''}
            onClick={() => setActiveSection('appointments')}
          >
            <FaFileMedical className="icon" />
            <span>Rendez-vous</span>
          </button>
          <button
            className={activeSection === 'chat' ? 'active' : ''}
            onClick={() => setActiveSection('chat')}
          >
            <FaComments className="icon" />
            <span>Discussion Médecins</span>
          </button>
          <button
            className={activeSection === 'patient-chat' ? 'active' : ''}
            onClick={() => {
              setActiveSection('patient-chat');
              fetchPatients(currentLabId);
            }}
          >
            <FaComments className="icon" />
            <span>Discussion Patients</span>
          </button>
        </nav>
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          <span>Se déconnecter</span>
        </button>
      </aside>

      <main className="main-content">
        {error && <div className="error-message">{error}</div>}

        {activeSection === 'profile' && (
          <div className="profile-section">
            <h2>👤 Mon Profil</h2>
            <div className="profile-form">
              {isEditing ? (
                <>
                  <div className="form-group">
                    <label>Nom :</label>
                    <input
                      type="text"
                      value={editedProfile.nom || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, nom: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prénom :</label>
                    <input
                      type="text"
                      value={editedProfile.prenom || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, prenom: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email :</label>
                    <input
                      type="email"
                      value={editedProfile.email || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone :</label>
                    <input
                      type="tel"
                      value={editedProfile.telephone || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, telephone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Adresse :</label>
                    <input
                      type="text"
                      value={editedProfile.adresse || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, adresse: e.target.value})}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="save-button" onClick={handleProfileSave}>
                      ✅ Enregistrer
                    </button>
                    <button className="cancel-button" onClick={handleProfileCancel}>
                      ❌ Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Nom :</label>
                    <input type="text" value={profile.nom || ''} disabled />
                  </div>
                  <div className="form-group">
                    <label>Prénom :</label>
                    <input type="text" value={profile.prenom || ''} disabled />
                  </div>
                  <div className="form-group">
                    <label>Email :</label>
                    <input type="email" value={profile.email || ''} disabled />
                  </div>
                  <div className="form-group">
                    <label>Téléphone :</label>
                    <input type="tel" value={profile.telephone || ''} disabled />
                  </div>
                  <div className="form-group">
                    <label>Adresse :</label>
                    <input type="text" value={profile.adresse || ''} disabled />
                  </div>
                  <button className="edit-button" onClick={handleProfileEdit}>
                    ✏️ Modifier le profil
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeSection === 'appointments' && (
          <div className="appointments-container">
            <div className="appointments-header">
              <h2>📅 Rendez-vous</h2>
              <div className="appointments-filters">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  🗂️ Tous
                </button>
                <button 
                  className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilter('pending')}
                >
                  ⏳ En attente
                </button>
                <button 
                  className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
                  onClick={() => setFilter('confirmed')}
                >
                  ✅ Confirmés
                </button>
                <button 
                  className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setFilter('cancelled')}
                >
                  ❌ Annulés
                </button>
              </div>
            </div>

            {getFilteredAppointments().length === 0 ? (
              <div className="no-appointments">
                <p>🔍 Aucun rendez-vous {filter !== 'all' ? `${filter}` : ''} trouvé.</p>
              </div>
            ) : (
              <div className="appointments-grid">
                {sortAppointments(getFilteredAppointments()).map((appointment) => {
                  const status = getStatusLabel(appointment.status);
                  return (
                    <div 
                      key={appointment._id} 
                      className={`appointment-card ${status.class}`}
                    >
                      <div className="appointment-header">
                        <div className="appointment-date">
                          <div className="date-primary">
                            {new Date(appointment.date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="date-secondary">
                            {new Date(appointment.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <span className={`status-badge ${appointment.status}`}>
                          {status.icon} {status.text}
                        </span>
                      </div>

                      <div className="appointment-body">
                        <div className="patient-info">
                          <h4>👤 Patient</h4>
                          <p className="patient-name">{appointment.patient?.nom} {appointment.patient?.prenom}</p>
                          <p className="patient-contact">
                            <span>📧 {appointment.patient?.email}</span>
                            <span>📞 {appointment.patient?.telephone}</span>
                          </p>
                        </div>

                        <div className="appointment-details">
                          <h4>📝 Motif</h4>
                          <p>{appointment.reason}</p>
                        </div>

                        <div className="appointment-actions">
                          {appointment.status === 'pending' && (
                            <>
                              <button 
                                className="action-btn confirm"
                                onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                              >
                                ✅ Confirmer
                              </button>
                              <button 
                                className="action-btn cancel"
                                onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                              >
                                ❌ Annuler
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button 
                              className="action-btn results"
                              onClick={() => handleSendResults(appointment)}
                            >
                              📄 Envoyer les résultats
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                          key={message._id || `${message.senderId}-${Date.now()}`}
                          className={`message ${message.senderId === currentLabId ? 'sent' : 'received'}`}
                        >
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
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

        {activeSection === 'patient-chat' && (
          <div className="chat-section">
            <div className="doctors-list">
              <h3>👥 Liste des Patients</h3>
              {patients.map(patient => (
                <div
                  key={patient._id}
                  className={`doctor-item ${selectedPatient?._id === patient._id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedPatient(patient);
                    fetchPatientMessages(patient._id);
                  }}
                >
                  <div className="doctor-info">
                    <strong>{patient.nom} {patient.prenom}</strong>
                    <span className="specialty">{patient.email}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-container">
              {selectedPatient ? (
                <>
                  <div className="chat-header">
                    <h3>💬 Discussion avec {selectedPatient.nom} {selectedPatient.prenom}</h3>
                  </div>

                  <div className="messages-container">
                    {chatLoading ? (
                      <div className="loading">Chargement des messages...</div>
                    ) : (
                      patientMessages.map(message => (
                        <div
                          key={message._id}
                          className={`message ${message.senderId === currentLabId ? 'sent' : 'received'}`}
                        >
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('fr-FR') : ''}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="message-input">
                    <input
                      type="text"
                      value={newPatientMessage}
                      onChange={(e) => setNewPatientMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendPatientMessage()}
                    />
                    <button onClick={handleSendPatientMessage}>Envoyer</button>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  👈 Sélectionnez un patient pour commencer une discussion
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

        <LabResultModal
          isOpen={isResultModalOpen}
          onClose={handleCloseModal}
          appointment={selectedAppointment}
          labId={currentLabId}
        />
      </main>
    </div>
  );
};

export default LabsDashboard;
