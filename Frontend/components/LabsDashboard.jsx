import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/LabsDashboard.css';
import '../styles/DoctorDashboard.css';
import LabResultModal from './LabResultModal';
import { FaUser, FaCalendarAlt, FaFlask, FaComments, FaSignOutAlt, FaUserCircle, FaEdit, FaCheck, FaTimes } from "react-icons/fa";

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
  const [successMessage, setSuccessMessage] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(5); // 5 rendez-vous par page
  const [searchTerm, setSearchTerm] = useState(''); // État pour la recherche
  const [expandedPatients, setExpandedPatients] = useState(new Set()); // Patients dont les RDV sont affichés
  
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
    let filteredAppointments = appointments;
    
    // Filtrer par statut
    if (filter !== 'all') {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === filter);
    }
    
    // Filtrer par nom de patient
    if (searchTerm.trim()) {
      filteredAppointments = filteredAppointments.filter(apt => {
        const patientName = `${apt.patient?.nom || ''} ${apt.patient?.prenom || ''}`.toLowerCase();
        return patientName.includes(searchTerm.toLowerCase());
      });
    }
    
    return filteredAppointments;
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

  // Fonction pour grouper les rendez-vous par patient
  const getGroupedAppointments = () => {
    const filteredAppointments = getFilteredAppointments();
    const sortedAppointments = sortAppointments(filteredAppointments);
    
    // Grouper par patient
    const grouped = sortedAppointments.reduce((acc, appointment) => {
      const patientId = appointment.patient?._id;
      if (!patientId) return acc;
      
      if (!acc[patientId]) {
        acc[patientId] = {
          patient: appointment.patient,
          appointments: []
        };
      }
      acc[patientId].appointments.push(appointment);
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  // Fonctions de pagination
  const getPaginatedAppointments = () => {
    const groupedAppointments = getGroupedAppointments();
    const indexOfLastGroup = currentPage * appointmentsPerPage;
    const indexOfFirstGroup = indexOfLastGroup - appointmentsPerPage;
    return groupedAppointments.slice(indexOfFirstGroup, indexOfLastGroup);
  };

  const getTotalPages = () => {
    const groupedAppointments = getGroupedAppointments();
    return Math.ceil(groupedAppointments.length / appointmentsPerPage);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset à la première page lors du changement de filtre
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset à la première page lors de la recherche
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const togglePatientExpansion = (patientId) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientId)) {
      newExpanded.delete(patientId);
    } else {
      newExpanded.add(patientId);
    }
    setExpandedPatients(newExpanded);
  };

  if (loading && activeSection === 'appointments') return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-container">
      <aside className="medical-sidebar">
        <div className="sidebar-header">
          <div className="medical-logo">
            <div className="logo-text">
              <h2>PatientPath</h2>
              <span>Espace Laboratoire</span>
          </div>
        </div>
        </div>

        <nav className="sidebar-navigation">
          <div className="nav-section">
            <span className="nav-section-title">TABLEAU DE BORD</span>
            <button 
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <FaUser className="nav-icon" />
              <span className="nav-text">Mon Profil</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">RENDEZ-VOUS</span>
            <button 
              className={`nav-item ${activeSection === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveSection('appointments')}
            >
              <FaCalendarAlt className="nav-icon" />
              <span className="nav-text">Rendez-vous</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">COMMUNICATION</span>
            <button 
              className={`nav-item ${activeSection === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveSection('chat')}
            >
              <FaComments className="nav-icon" />
              <span className="nav-text">Discussion Médecins</span>
            </button>
            <button 
              className={`nav-item ${activeSection === 'patient-chat' ? 'active' : ''}`}
              onClick={() => {
              setActiveSection('patient-chat');
              fetchPatients(currentLabId);
              }}
            >
              <FaComments className="nav-icon" />
              <span className="nav-text">Discussion Patients</span>
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
        {error && !error.includes('✅') && <div className="error-message">{error}</div>}

        {activeSection === 'profile' && (
          <div className="doctor-profile" style={{ color: '#000000' }}>
            {error && error.includes('✅') && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {error.replace('✅ ', '')}
              </div>
            )}

            <div className="profile-header">
              <div className="profile-avatar">
                <img 
                  src={profile.photo ? `http://localhost:5001${profile.photo}` : '../assets/images/default-avatar.png'}
                  alt="Avatar"
                  className="avatar-image"
                  onError={(e) => { e.target.src = '../assets/images/default-avatar.png'; }}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div className="profile-title">
                <h1>Mon Profil Laboratoire</h1>
              </div>
            </div>

            {!isEditing ? (
              <div className="profile-info-simple">
                <div className="info-section-simple">
                  <h3>Informations du laboratoire</h3>
                  <div className="info-grid-simple">
                    <div className="info-item-simple">
                      <span className="label">Nom :</span>
                      <span className="value">{profile.nom || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item-simple">
                      <span className="label">Prénom :</span>
                      <span className="value">{profile.prenom || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item-simple">
                      <span className="label">Email :</span>
                      <span className="value">{profile.email || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item-simple">
                      <span className="label">Téléphone :</span>
                      <span className="value">{profile.telephone || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item-simple">
                      <span className="label">Adresse :</span>
                      <span className="value">{profile.adresse || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item-simple">
                      <span className="label">Type :</span>
                      <span className="value">Laboratoire d'analyses médicales</span>
                    </div>
                  </div>
                </div>

                <button className="edit-profile-btn-simple" onClick={handleProfileEdit}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{marginRight: '0.5rem'}}>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Modifier le profil
                </button>
              </div>
            ) : (
              <form className="edit-form-simple" onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }}>
                <div className="form-section-simple">
                  <h3>Modifier les informations</h3>
                  
                  <div className="form-group">
                    <label>Nom du laboratoire</label>
                    <input
                      type="text"
                      name="nom"
                      value={editedProfile.nom || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, nom: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Prénom du responsable</label>
                    <input
                      type="text"
                      name="prenom"
                      value={editedProfile.prenom || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, prenom: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editedProfile.email || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={editedProfile.telephone || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, telephone: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Adresse du laboratoire</label>
                    <input
                      type="text"
                      name="adresse"
                      value={editedProfile.adresse || ''}
                      onChange={(e) => setEditedProfile({...editedProfile, adresse: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions-simple">
                  <button type="submit" className="save-btn-simple">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{marginRight: '0.5rem'}}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Enregistrer
                    </button>
                  <button 
                    type="button" 
                    className="cancel-btn-simple"
                    onClick={handleProfileCancel}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{marginRight: '0.5rem'}}>
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Annuler
                    </button>
                  </div>
              </form>
            )}
                  </div>
        )}

                {activeSection === 'appointments' && (
          <div className="appointments-medical-view">
            <div className="medical-header">
              <div className="header-info">
                <h2>Gestion des Rendez-vous</h2>
                <p className="header-subtitle">Laboratoire d'analyses médicales</p>
              </div>
              <div className="appointments-summary">
                <div className="summary-item">
                  <span className="summary-count">{appointments.filter(apt => apt.status === 'pending').length}</span>
                  <span className="summary-label">En attente</span>
                </div>
                <div className="summary-item">
                  <span className="summary-count">{appointments.filter(apt => apt.status === 'confirmed').length}</span>
                  <span className="summary-label">Confirmés</span>
                </div>
                <div className="summary-item">
                  <span className="summary-count">{appointments.length}</span>
                  <span className="summary-label">Total</span>
                </div>
              </div>
            </div>

            <div className="medical-controls">
              <div className="search-section">
                <div className="search-input-container">
                  <input
                    type="text"
                    placeholder="Rechercher par nom de patient..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      onClick={clearSearch}
                      className="clear-search-btn"
                      title="Effacer la recherche"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <div className="search-results-info">
                    {getFilteredAppointments().length} résultat(s) pour "{searchTerm}"
                  </div>
                )}
              </div>

              <div className="medical-filters">
                <button 
                  className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  Tous les rendez-vous
                </button>
                <button 
                  className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('pending')}
                >
                  En attente
                </button>
                <button 
                  className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('confirmed')}
                >
                  Confirmés
                </button>
                <button 
                  className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('cancelled')}
                >
                  Annulés
                </button>
              </div>
            </div>

            {loading ? (
              <div className="medical-loading">
                <div className="loading-spinner"></div>
                <p>Chargement des rendez-vous...</p>
              </div>
            ) : getFilteredAppointments().length === 0 ? (
              <div className="medical-empty">
                <div className="empty-icon">📋</div>
                <h3>Aucun rendez-vous trouvé</h3>
                <p>Les nouveaux rendez-vous apparaîtront dans cette section</p>
              </div>
            ) : (
              <>
                <div className="appointments-list-medical">
                  {getPaginatedAppointments().map((patientGroup) => {
                    const isExpanded = expandedPatients.has(patientGroup.patient._id);
                    return (
                      <div key={patientGroup.patient._id} className="patient-group-medical">
                        <div 
                          className="patient-group-header clickable"
                          onClick={() => togglePatientExpansion(patientGroup.patient._id)}
                        >
                          <div className="patient-info-header">
                            <h3 className="patient-name-header">
                              {patientGroup.patient.nom} {patientGroup.patient.prenom}
                            </h3>
                            <p className="patient-contact-header">{patientGroup.patient.email}</p>
                          </div>
                          <div className="patient-header-actions">
                            <div className="appointments-count">
                              {patientGroup.appointments.length} rendez-vous
                            </div>
                            <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                              ▼
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="patient-appointments-list">
                            {patientGroup.appointments.map((appointment) => {
                              const status = getStatusLabel(appointment.status);
                              return (
                                <div key={appointment._id} className={`appointment-item-grouped ${appointment.status}`}>
                                  <div className="appointment-header-grouped">
                                    <div className="date-info-grouped">
                                      <div className="date-primary">
                                        {new Date(appointment.date).toLocaleDateString('fr-FR', {
                                          weekday: 'long',
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </div>
                                      <div className="time-primary">
                                        {new Date(appointment.date).toLocaleTimeString('fr-FR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                    <div className={`status-badge-medical ${appointment.status}`}>
                                      {status.text}
                                    </div>
                                  </div>

                                  <div className="appointment-content-grouped">
                                    <div className="reason-info-grouped">
                                      <h4>Motif de consultation</h4>
                                      <p>{appointment.reason}</p>
                                    </div>

                                    <div className="actions-grouped">
                                      {appointment.status === 'pending' && (
                                        <>
                                          <button 
                                            className="btn-medical confirm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStatusChange(appointment._id, 'confirmed');
                                            }}
                                          >
                                            Confirmer
                                          </button>
                                          <button 
                                            className="btn-medical cancel"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStatusChange(appointment._id, 'cancelled');
                                            }}
                                          >
                                            Refuser
                                          </button>
                                        </>
                                      )}
                                      {appointment.status === 'confirmed' && (
                                        <button 
                                          className="btn-medical results"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSendResults(appointment);
                                          }}
                                        >
                                          Envoyer les résultats
                                        </button>
                                      )}
                                      {appointment.status === 'cancelled' && (
                                        <span className="status-text cancelled">Rendez-vous annulé</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination médicale */}
                {getTotalPages() > 1 && (
                  <div className="pagination-medical">
                    <div className="pagination-info">
                      Page {currentPage} sur {getTotalPages()} - {getGroupedAppointments().length} patient(s) avec {getFilteredAppointments().length} rendez-vous au total
                    </div>
                    
                    <div className="pagination-controls">
                      <button 
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </button>
                      
                      <div className="pagination-numbers">
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(pageNumber => (
                          <button
                            key={pageNumber}
                            className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        ))}
                      </div>
                      
                      <button 
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
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
