import React, { useState, useEffect } from 'react';
import AppointmentForm from './AppointmentForm';
import '../styles/PatientDashboard.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const styles = {
  formGroup: {
    marginBottom: '1rem'
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginTop: '0.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  },
  textarea: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minHeight: '100px',
    marginTop: '0.5rem'
  },
  newMessageBadge: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    marginLeft: '8px',
    fontWeight: 'bold'
  },
  unreadCount: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    marginLeft: '8px'
  },
  hasUnread: {
    borderLeft: '3px solid #ff4444'
  }
};

const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDescription, setUploadDescription] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [labAppointmentReason, setLabAppointmentReason] = useState('');
  const [labAppointments, setLabAppointments] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [hospitalAppointments, setHospitalAppointments] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Liste des régions de la Tunisie
  const regions = [
    'Tunis',
    'Ariana',
    'Ben Arous',
    'Manouba',
    'Nabeul',
    'Zaghouan',
    'Bizerte',
    'Béja',
    'Jendouba',
    'Le Kef',
    'Siliana',
    'Sousse',
    'Monastir',
    'Mahdia',
    'Sfax',
    'Kairouan',
    'Kasserine',
    'Sidi Bouzid',
    'Gabès',
    'Medenine',
    'Tataouine',
    'Gafsa',
    'Tozeur',
    'Kebili'
  ];

  // Liste des spécialités
  const specialties = [
    'Cardiologie',
    'Dermatologie',
    'Gastro-entérologie',
    'Neurologie',
    'Ophtalmologie',
    'Orthopédie',
    'Pédiatrie',
    'Psychiatrie',
    'Radiologie',
    'Urologie'
  ];

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    console.log('📱 Stored userId:', storedId);
    if (!storedId) {
      setMessage("ID utilisateur non trouvé.");
      setIsLoading(false);
      return;
    }

    setUserId(storedId);
    fetchProfile(storedId);
    fetchNotifications(storedId);
    
    // Charger les documents médicaux si nécessaire
    if (activeSection === 'documents') {
      fetchMedicalDocuments(storedId);
    }
    
    // Charger les rendez-vous si on est dans la section messages ou rendez-vous
    if (activeSection === 'messages' || activeSection === 'all-appointments') {
      console.log('🔄 Chargement des rendez-vous...');
      fetchAllAppointments(storedId);
    }
    if (activeSection === 'lab-appointment') {
      fetchLabs();
      fetchLabAppointments(storedId);
    }
    if (activeSection === 'lab-results') {
      fetchLabResults(storedId);
    }
    if (activeSection === 'hospital-appointment') {
      fetchHospitals();
      fetchHospitalAppointments(storedId);
    }
    if (activeSection === 'all-appointments') {
      fetchHospitalAppointments(storedId);
    }
    if (activeSection === 'medical-reports') {
      fetchMedicalReports(storedId);
    }
    if (userId) {
      fetchDoctors();
    }
  }, [activeSection, userId]);

  // Ajout d'un useEffect spécifique pour les médecins
  useEffect(() => {
    if (activeSection === 'appointment') {
      console.log("🏥 Section rendez-vous médecin active, chargement des médecins...");
      fetchDoctors();
    }
  }, [activeSection]);

  // Ajout d'un useEffect pour filtrer les médecins quand la région ou la spécialité change
  useEffect(() => {
    if (selectedRegion || selectedSpecialty) {
      console.log("🔄 Filtrage des médecins avec:", { selectedRegion, selectedSpecialty });
      const filteredDoctors = doctors.filter(doctor => 
        (!selectedRegion || doctor.region === selectedRegion) &&
        (!selectedSpecialty || doctor.specialty === selectedSpecialty)
      );
      console.log("✅ Médecins filtrés:", filteredDoctors);
    }
  }, [selectedRegion, selectedSpecialty]);

  const fetchProfile = async (id) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/users/${id}`);
      setProfile(res.data);
    } catch (error) {
      setMessage("❌ Erreur récupération profil.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications/${id}`);
      setNotifications(res.data);
    } catch (error) {
      console.error("❌ Erreur notifications:", error);
    }
  };

  const fetchMedicalDocuments = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patient/medical-documents/${id}`);
      setMedicalDocuments(res.data);
    } catch (error) {
      console.error("❌ Erreur récupération documents:", error);
      setMessage("Erreur lors de la récupération des documents médicaux.");
    }
  };

  const fetchAllAppointments = async (patientId) => {
    try {
      console.log("🔄 Chargement des rendez-vous pour le patient:", patientId);
      const medicalRes = await axios.get(`${API_BASE_URL}/api/appointments?patientId=${patientId}`);
      console.log("✅ Rendez-vous médicaux reçus:", medicalRes.data);
      
      // S'assurer que tous les rendez-vous ont les informations nécessaires
      const formattedAppointments = medicalRes.data.map(apt => ({
        ...apt,
        doctorName: apt.doctorId?.nom ? `Dr. ${apt.doctorId.nom} ${apt.doctorId.prenom}` : apt.doctorEmail,
        doctorEmail: apt.doctorId?.email || '',
        doctorId: apt.doctorId?._id || apt.doctorId
      }));
      
      setAppointments(formattedAppointments);
      
      // Charger les rendez-vous de laboratoire
      const labRes = await axios.get(`${API_BASE_URL}/api/lab-appointments/patient/${patientId}`);
      setLabAppointments(labRes.data);

      // Charger les rendez-vous d'hôpital
      const hospitalRes = await axios.get(`${API_BASE_URL}/api/hospital-appointments/patient/${patientId}`);
      setHospitalAppointments(hospitalRes.data);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setMessage("Erreur lors de la récupération des rendez-vous.");
    }
  };

  const fetchChatMessages = async (appointmentId) => {
    setChatLoading(true);
    try {
      console.log("🔄 Chargement des messages pour le rendez-vous:", appointmentId);
      const res = await axios.get(`${API_BASE_URL}/api/messages/${appointmentId}?userId=${userId}`);
      console.log("✅ Messages reçus:", res.data);
      setChatMessages(res.data);
      checkUnreadMessages();
    } catch (error) {
      console.error("❌ Erreur lors du chargement des messages:", error);
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newChatMessage.trim() || !selectedAppointment) return;
    try {
      await axios.post(`${API_BASE_URL}/api/messages`, {
        senderId: userId,
        receiverId: selectedAppointment.doctorId,
        appointmentId: selectedAppointment._id,
        content: newChatMessage
      });
      setNewChatMessage('');
      fetchChatMessages(selectedAppointment._id);
    } catch (error) {
      // Optionnel : afficher une erreur
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('description', uploadDescription);

    try {
      setIsLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/patient/medical-documents/${userId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMessage("✅ Document téléchargé avec succès !");
      setUploadDescription('');
      fetchMedicalDocuments(userId);
    } catch (error) {
      setMessage("❌ Erreur lors du téléchargement du document.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/patient/medical-documents/${userId}/${documentId}`);
      setMessage("✅ Document supprimé avec succès !");
      fetchMedicalDocuments(userId);
    } catch (error) {
      setMessage("❌ Erreur lors de la suppression du document.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const fetchLabs = async () => {
    try {
      console.log("🔍 Récupération des laboratoires...");
      const response = await axios.get(`${API_BASE_URL}/api/labs-valides`);
      console.log("✅ Réponse reçue:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setLabs(response.data);
        if (response.data.length === 0) {
          setMessage("Aucun laboratoire disponible pour le moment.");
        }
      } else {
        setMessage("Format de données incorrect pour les laboratoires.");
        console.error("Format incorrect:", response.data);
      }
    } catch (error) {
      console.error("❌ Erreur détaillée:", error.response || error);
      setMessage("❌ Erreur lors de la récupération des laboratoires.");
      setLabs([]);
    }
  };

  const fetchLabAppointments = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-appointments/patient/${id}`);
      setLabAppointments(response.data);
    } catch (error) {
      setLabAppointments([]);
      console.error("❌ Erreur lors de la récupération des rendez-vous laboratoire:", error);
    }
  };

  const handleLabAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/lab-appointments`, {
        labId: selectedLab,
        patientId: userId,
        reason: labAppointmentReason
      });
      setMessage("✅ Rendez-vous laboratoire enregistré avec succès !");
      setSelectedLab('');
      setLabAppointmentReason('');
      fetchLabAppointments(userId);
    } catch (error) {
      console.error("❌ Erreur détaillée:", error.response || error);
      setMessage("❌ Erreur lors de l'enregistrement du rendez-vous laboratoire.");
    }
  };

  const fetchLabResults = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-results/patient/${id}`);
      console.log('Résultats de laboratoire reçus:', response.data);
      setLabResults(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
      setError("Erreur lors de la récupération des résultats de laboratoire");
    }
  };

  const fetchHospitals = async () => {
    try {
      console.log("🏥 Récupération des hôpitaux...");
      const response = await axios.get(`${API_BASE_URL}/api/medecins-valides`);
      console.log("✅ Données reçues:", response.data);
      // Filtrer uniquement les hôpitaux
      const validatedHospitals = response.data.filter(user => 
        user.roles.includes('Hospital') || user.roles.includes('hopital')
      );
      console.log("🏥 Hôpitaux filtrés:", validatedHospitals);
      setHospitals(validatedHospitals);
    } catch (error) {
      console.error("❌ Erreur récupération hôpitaux:", error);
      setMessage("Erreur lors de la récupération des hôpitaux.");
    }
  };

  const fetchHospitalAppointments = async (patientId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/hospital-appointments/patient/${patientId}`);
      setHospitalAppointments(response.data);
    } catch (error) {
      console.error("❌ Erreur récupération rendez-vous hôpital:", error);
      setMessage("Erreur lors de la récupération des rendez-vous d'hôpital.");
    }
  };

  const handleHospitalAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/hospital-appointments`, {
        hospitalId: selectedHospital,
        patientId: userId,
        specialty: selectedSpecialty
      });
      setMessage("✅ Demande de rendez-vous envoyée avec succès !");
      setSelectedHospital('');
      setSelectedSpecialty('');
      fetchHospitalAppointments(userId);
    } catch (error) {
      console.error("❌ Erreur création rendez-vous hôpital:", error);
      setMessage("Erreur lors de la création du rendez-vous.");
    }
  };

  const fetchMedicalReports = async (patientId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/medical-reports/patient/${patientId}`);
      setMedicalReports(response.data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rapports médicaux:', error);
      setMessage("Erreur lors de la récupération des rapports médicaux.");
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCancelAppointment = async (appointmentId, type) => {
    try {
      let endpoint;
      switch(type) {
        case 'medical':
          endpoint = '/api/appointments';
          break;
        case 'laboratory':
          endpoint = '/api/lab-appointments';
          break;
        case 'hospital':
          endpoint = '/api/hospital-appointments';
          break;
        default:
          throw new Error('Type de rendez-vous invalide');
      }

      await axios.put(`${API_BASE_URL}${endpoint}/${appointmentId}/status`, {
        status: 'cancelled'
      });

      setMessage("✅ Rendez-vous annulé avec succès !");

      // Rafraîchir les listes de rendez-vous
      fetchAllAppointments(userId);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      setMessage("❌ Erreur lors de l'annulation du rendez-vous.");
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/appointments`, {
        doctorId: selectedDoctor,
        patientId: userId,
        reason: appointmentReason
      });
      setMessage("✅ Demande de rendez-vous envoyée avec succès !");
      setSelectedDoctor('');
      setAppointmentReason('');
      fetchAllAppointments(userId);
    } catch (error) {
      console.error("❌ Erreur création rendez-vous:", error);
      setMessage("Erreur lors de la création du rendez-vous.");
    }
  };

  const fetchDoctors = async () => {
    try {
      console.log("🔍 Récupération des médecins...");
      const response = await axios.get(`${API_BASE_URL}/api/medecins-valides`);
      console.log("✅ Médecins reçus:", response.data);
      setDoctors(response.data.filter(user => 
        user.roles.includes('Doctor') || 
        user.roles.includes('doctor')
      ));
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des médecins:", error);
      setMessage("Erreur lors de la récupération de la liste des médecins.");
    }
  };

  const checkUnreadMessages = async () => {
    try {
      // Vérifier si userId existe avant de faire la requête
      if (!userId) {
        console.log("⚠️ Pas d'userId disponible pour vérifier les messages non lus");
        return;
      }
      console.log("🔍 Vérification des messages non lus pour userId:", userId);
      const response = await axios.get(`${API_BASE_URL}/api/messages/unread/${userId}`);
      console.log("✅ Messages non lus reçus:", response.data);
      setUnreadMessages(response.data.length);
    } catch (error) {
      console.error('❌ Erreur vérification messages non lus:', error);
    }
  };

  // Modifier l'useEffect pour vérifier les messages non lus uniquement quand userId est disponible
  useEffect(() => {
    if (userId) {
      checkUnreadMessages();
      const interval = setInterval(checkUnreadMessages, 900000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-role">Patient</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-group">
            <div className="menu-group-title">Profil</div>
            <button 
              className={activeSection === 'profile' ? 'active' : ''} 
              onClick={() => setActiveSection('profile')}
            >
              <span className="icon">👤</span>
              Mon Profil
            </button>
            <button 
              className={activeSection === 'documents' ? 'active' : ''} 
              onClick={() => setActiveSection('documents')}
            >
              <span className="icon">📄</span>
              Documents Médicaux
            </button>
          </div>

          <div className="menu-group">
            <div className="menu-group-title">Rendez-vous</div>
            <button 
              className={activeSection === 'all-appointments' ? 'active' : ''} 
              onClick={() => setActiveSection('all-appointments')}
            >
              <span className="icon">📋</span>
              Tous mes rendez-vous
            </button>
            <button 
              className={activeSection === 'appointment' ? 'active' : ''} 
              onClick={() => setActiveSection('appointment')}
            >
              <span className="icon">👨‍⚕️</span>
              Nouveau RDV Médecin
            </button>
            <button 
              className={activeSection === 'lab-appointment' ? 'active' : ''} 
              onClick={() => setActiveSection('lab-appointment')}
            >
              <span className="icon">🔬</span>
              Nouveau RDV Laboratoire
            </button>
            <button 
              className={activeSection === 'hospital-appointment' ? 'active' : ''} 
              onClick={() => setActiveSection('hospital-appointment')}
            >
              <span className="icon">🏥</span>
              Nouveau RDV Hôpital
            </button>
          </div>

          <div className="menu-group">
            <div className="menu-group-title">Résultats & Communication</div>
            <button 
              className={activeSection === 'medical-reports' ? 'active' : ''} 
              onClick={() => setActiveSection('medical-reports')}
            >
              <span className="icon">📋</span>
              Rapports Médicaux
            </button>
            <button 
              className={activeSection === 'lab-results' ? 'active' : ''} 
              onClick={() => setActiveSection('lab-results')}
            >
              <span className="icon">🔬</span>
              Résultats Laboratoire
            </button>
            <button 
              className={`nav-button ${activeSection === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveSection('messages')}
            >
              <span>💬 Messagerie</span>
              {unreadMessages > 0 && (
                <span className="unread-badge">
                  {unreadMessages}
                </span>
              )}
            </button>
            <button 
              className={activeSection === 'notifications' ? 'active' : ''} 
              onClick={() => setActiveSection('notifications')}
            >
              <span className="icon">🔔</span>
              Notifications
            </button>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <span className="icon">🚪</span>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="dashboard">
        {message && <div className="alert">{message}</div>}

        {isLoading ? (
          <div className="loading">Chargement...</div>
        ) : (
          <>
            {activeSection === 'profile' && (
              <>
                <h2>👤 Mon profil</h2>
                <div className="profile-card">
                  {profile.photo && (
                    <img 
                      src={`${API_BASE_URL}${profile.photo}`} 
                      alt="Profil" 
                      className="profile-photo" 
                    />
                  )}
                  <div className="profile-grid">
                    <p><strong>Nom :</strong> {profile.nom}</p>
                    <p><strong>Prénom :</strong> {profile.prenom}</p>
                    <p><strong>Email :</strong> {profile.email}</p>
                    <p><strong>Téléphone :</strong> {profile.telephone}</p>
                    <p><strong>Adresse :</strong> {profile.adresse}</p>
                    <p><strong>CIN :</strong> {profile.cin}</p>
                    <p><strong>Urgence :</strong> {profile.emergencyPhone}</p>
                    <p><strong>Groupe sanguin :</strong> {profile.bloodType}</p>
                    <p><strong>Maladies :</strong> {profile.chronicDiseases}</p>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'appointment' && (
              <>
                <h2>🏥 Nouveau rendez-vous médecin</h2>
                <div className="appointment-form">
                  <form onSubmit={handleAppointmentSubmit}>
                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Région :</label>
                      <select 
                        value={selectedRegion} 
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une région</option>
                        {regions.map(region => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Spécialité :</label>
                      <select 
                        value={selectedSpecialty} 
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une spécialité</option>
                        {specialties.map(specialty => (
                          <option key={specialty} value={specialty}>
                            {specialty}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Médecin :</label>
                      <select 
                        value={selectedDoctor} 
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez un médecin</option>
                        {doctors
                          .filter(doctor => 
                            (!selectedRegion || doctor.region === selectedRegion) &&
                            (!selectedSpecialty || doctor.specialty === selectedSpecialty)
                          )
                          .map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                              Dr. {doctor.nom} {doctor.prenom} {doctor.specialty ? `- ${doctor.specialty}` : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Motif de la consultation :</label>
                      <textarea
                        value={appointmentReason}
                        onChange={(e) => setAppointmentReason(e.target.value)}
                        placeholder="Décrivez brièvement la raison de votre visite"
                        required
                        style={styles.textarea}
                      />
                    </div>

                    <button type="submit" className="submit-btn">
                      Demander un rendez-vous
                    </button>
                  </form>
                </div>
              </>
            )}

            {activeSection === 'documents' && (
              <>
                <h2>📄 Mes documents médicaux</h2>
                <div className="medical-docs-section">
                  <div className="upload-section">
                    <h3>Ajouter un document</h3>
                    <div className="upload-form">
                      <input
                        type="text"
                        placeholder="Description du document"
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="description-input"
                      />
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="file-input"
                      />
                      <p className="file-info">Formats acceptés : PDF, JPEG, PNG (max 5MB)</p>
                    </div>
                  </div>

                  <div className="documents-list">
                    <h3>Documents téléchargés</h3>
                    {medicalDocuments.length === 0 ? (
                      <p>Aucun document médical téléchargé.</p>
                    ) : (
                      <div className="documents-grid">
                        {medicalDocuments.map((doc) => (
                          <div key={doc._id} className="document-card">
                            <div className="document-info">
                              <h4>{doc.fileName}</h4>
                              <p>{doc.description}</p>
                              <p className="upload-date">
                                Téléchargé le : {new Date(doc.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="document-actions">
                              <a
                                href={`${API_BASE_URL}/${doc.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-btn"
                              >
                                Voir
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(doc._id)}
                                className="delete-btn"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'notifications' && (
              <>
                <h2>🔔 Mes notifications</h2>
                {notifications.length === 0 ? (
                  <p>Aucune notification pour l'instant.</p>
                ) : (
                  <ul className="notif-list">
                    {notifications
                      .sort((a, b) => {
                        const dateA = a.createdAt || a.date || new Date();
                        const dateB = b.createdAt || b.date || new Date();
                        return new Date(dateB) - new Date(dateA);
                      })
                      .map((notif, idx) => (
                        <li key={idx} className="notif-item">
                          <div className="notif-content">
                            {notif.message}
                          </div>
                          <div className="notif-date">
                            {(notif.createdAt || notif.date) ? 
                              new Date(notif.createdAt || notif.date).toLocaleString('fr-FR') : 
                              'Date non disponible'}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </>
            )}

            {activeSection === 'messages' && (
              <div className="messagerie-section">
                <h2>💬 Messagerie avec mes médecins</h2>
                <div className="messagerie-layout">
                  <div className="doctors-list">
                    <h3>Mes médecins</h3>
                    {appointments.length === 0 ? (
                      <p>Aucun médecin trouvé.</p>
                    ) : (
                      <ul>
                        {Object.values(
                          appointments.reduce((acc, apt) => {
                            if (!acc[apt.doctorId]) {
                              acc[apt.doctorId] = {
                                id: apt.doctorId,
                                name: apt.doctorName || apt.doctorEmail || 'Médecin',
                                lastAppointment: apt.date,
                                appointments: [apt]
                              };
                            } else {
                              acc[apt.doctorId].appointments.push(apt);
                              if (new Date(apt.date) > new Date(acc[apt.doctorId].lastAppointment)) {
                                acc[apt.doctorId].lastAppointment = apt.date;
                              }
                            }
                            return acc;
                          }, {})
                        )
                        .sort((a, b) => new Date(b.lastAppointment) - new Date(a.lastAppointment))
                        .map((doctor) => (
                          <li
                            key={doctor.id}
                            className={`doctor-chat-item ${selectedAppointment && selectedAppointment.doctorId === doctor.id ? 'selected' : ''} ${unreadMessages[doctor.id] ? 'has-unread' : ''}`}
                            onClick={() => {
                              const lastAppointment = doctor.appointments
                                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                              setSelectedAppointment(lastAppointment);
                              fetchChatMessages(lastAppointment._id);
                            }}
                          >
                            <div className="doctor-info">
                              <strong>{doctor.name}</strong>
                              {unreadMessages[doctor.id] && (
                                <span className="unread-count">
                                  {unreadMessages[doctor.id]} nouveau{unreadMessages[doctor.id] > 1 ? 'x' : ''}
                                </span>
                              )}
                              <span className="appointment-count">
                                {doctor.appointments.length} rendez-vous
                              </span>
                            </div>
                            <small className="last-appointment">
                              Dernier RDV: {new Date(doctor.lastAppointment).toLocaleDateString('fr-FR')}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="chat-box">
                    {selectedAppointment ? (
                      <>
                        <div className="chat-header">
                          <h3>{selectedAppointment.doctorName || selectedAppointment.doctorEmail || 'Médecin'}</h3>
                          <p>Rendez-vous du: {new Date(selectedAppointment.date).toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="chat-messages">
                          {chatLoading ? (
                            <div className="loading-messages">Chargement...</div>
                          ) : chatMessages.length === 0 ? (
                            <div className="no-messages">Aucun message. Commencez la conversation !</div>
                          ) : (
                            <div className="messages-container">
                              {chatMessages.map((msg) => (
                              <div 
                                key={msg._id} 
                                  className={`message ${msg.senderId === userId ? 'message-sent' : 'message-received'}`}
                              >
                                <div className="message-content">{msg.content}</div>
                                  <div className="message-time">
                                  {new Date(msg.sentAt || msg.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="chat-input">
                          <input
                            type="text"
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button onClick={handleSendMessage}>
                            <span>Envoyer</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="no-chat-selected">
                        <div className="empty-state">
                          <span className="icon">💬</span>
                          <p>Sélectionnez un médecin pour voir vos messages</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'all-appointments' && (
              <>
                <h2>📋 Tous mes rendez-vous</h2>
                <div className="all-appointments-section">
                  <div className="appointments-category">
                    <h3>🏥 Rendez-vous Médecins</h3>
                    {appointments.length === 0 ? (
                      <p className="no-appointments-message">Aucun rendez-vous médical trouvé.</p>
                    ) : (
                      <div className="appointments-list">
                        <table>
                          <thead>
                            <tr>
                              <th>Médecin</th>
                              <th>Date</th>
                              <th>Motif</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map(apt => (
                              <tr key={apt._id} className={`appointment-row ${apt.status}`}>
                                <td>{apt.doctorName}</td>
                                <td>{new Date(apt.date).toLocaleString('fr-FR')}</td>
                                <td>{apt.reason}</td>
                                <td>
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                                </td>
                                <td>
                                  <div className="appointment-actions">
                                  {apt.status !== 'cancelled' && (
                                      <>
                                    <button
                                      onClick={() => {
                                        setSelectedAppointment(apt);
                                        fetchChatMessages(apt._id);
                                        setActiveSection('messages');
                                      }}
                                      className="chat-button"
                                    >
                                      💬 Chat
                                    </button>
                                        <button
                                          onClick={() => handleCancelAppointment(apt._id, 'medical')}
                                          className="cancel-button"
                                        >
                                          ❌ Annuler
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="appointments-category">
                    <h3>🔬 Rendez-vous Laboratoire</h3>
                    {labAppointments.length === 0 ? (
                      <p className="no-appointments-message">Aucun rendez-vous laboratoire trouvé.</p>
                    ) : (
                      <div className="appointments-list">
                        <table>
                          <thead>
                            <tr>
                              <th>Laboratoire</th>
                              <th>Date</th>
                              <th>Motif</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {labAppointments.map(apt => (
                              <tr key={apt._id} className={`appointment-row ${apt.status}`}>
                                <td>{apt.lab?.nom || 'Laboratoire'}</td>
                                <td>{new Date(apt.date).toLocaleString('fr-FR')}</td>
                                <td>{apt.reason}</td>
                                <td>
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                                </td>
                                <td>
                                  {apt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelAppointment(apt._id, 'laboratory')}
                                      className="cancel-button"
                                    >
                                      ❌ Annuler
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="appointments-category">
                    <h3>🏥 Rendez-vous Hôpital</h3>
                    {hospitalAppointments.length === 0 ? (
                      <p className="no-appointments-message">Aucun rendez-vous hospitalier trouvé.</p>
                    ) : (
                      <div className="appointments-list">
                        <table>
                          <thead>
                            <tr>
                              <th>Hôpital</th>
                              <th>Date</th>
                              <th>Service</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hospitalAppointments.map(apt => (
                              <tr key={apt._id} className={`appointment-row ${apt.status}`}>
                                <td>{apt.hospitalId?.nom || 'Hôpital'}</td>
                                <td>{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleString('fr-FR') : 'Non planifié'}</td>
                                <td>{apt.specialty}</td>
                                <td>
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                                </td>
                                <td>
                                  {apt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelAppointment(apt._id, 'hospital')}
                                      className="cancel-button"
                                    >
                                      ❌ Annuler
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'lab-appointment' && (
              <>
                <h2>🔬 Rendez-vous Laboratoire</h2>
                <div className="appointment-form">
                  <form onSubmit={handleLabAppointmentSubmit}>
                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Région :</label>
                      <select 
                        value={selectedRegion} 
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une région</option>
                        {regions.map(region => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Spécialité d'analyse :</label>
                      <select 
                        value={selectedSpecialty} 
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une spécialité</option>
                        <option value="Analyses sanguines">Analyses sanguines</option>
                        <option value="Analyses d'urine">Analyses d'urine</option>
                        <option value="Microbiologie">Microbiologie</option>
                        <option value="Immunologie">Immunologie</option>
                        <option value="Hormonologie">Hormonologie</option>
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Laboratoire :</label>
                      <select 
                        value={selectedLab} 
                        onChange={(e) => setSelectedLab(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez un laboratoire</option>
                        {labs
                          .filter(lab => !selectedRegion || lab.region === selectedRegion)
                          .map(lab => (
                          <option key={lab._id} value={lab._id}>
                            {lab.nom} - {lab.adresse}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Motif / Type d'analyse :</label>
                      <textarea
                        value={labAppointmentReason}
                        onChange={(e) => setLabAppointmentReason(e.target.value)}
                        placeholder="Décrivez le type d'analyse ou la raison de votre visite"
                        required
                        style={styles.textarea}
                      />
                    </div>

                    <button type="submit" className="submit-btn">
                      Prendre rendez-vous
                    </button>
                  </form>
                </div>

                <div className="appointments-list">
                  <h3>Mes rendez-vous laboratoire</h3>
                  {labAppointments.length === 0 ? (
                    <p>Aucun rendez-vous laboratoire trouvé.</p>
                  ) : (
                    <div className="appointments-grid">
                      {labAppointments.map((apt) => (
                        <div key={apt._id} className="appointment-card">
                          <h4>{apt.lab?.nom}</h4>
                          <p>📍 {apt.lab?.adresse}</p>
                          <p>🗓️ {new Date(apt.date).toLocaleString('fr-FR')}</p>
                          <p>📝 {apt.reason}</p>
                          <p className={`status ${apt.status}`}>
                            {apt.status === 'confirmed' ? 'Confirmé' : 
                             apt.status === 'pending' ? 'En attente' : 'Annulé'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === 'lab-results' && (
              <>
                <h2>📋 Mes résultats d'analyses</h2>
                <div className="lab-results-section">
                  {labResults.length === 0 ? (
                    <p>Aucun résultat d'analyse disponible.</p>
                  ) : (
                    <div className="results-grid">
                      {labResults.map((result) => (
                        <div key={result._id} className="result-card">
                          <div className="result-info">
                            <h4>Laboratoire: {result.labId?.nom || 'Non spécifié'}</h4>
                            <p>📅 Date: {new Date(result.appointmentId?.date || result.createdAt).toLocaleString('fr-FR')}</p>
                            <p>🔬 Type de test: {result.testType}</p>
                            <p>📝 Résultats: {result.results}</p>
                          </div>
                          {result.fileUrl && (
                            <div className="result-actions">
                              <a
                                href={`${API_BASE_URL}/${result.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-btn"
                              >
                                Voir le fichier
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === 'medical-reports' && (
              <>
                <h2>📋 Rapports Médicaux</h2>
                <div className="medical-reports-section">
                  {medicalReports.length === 0 ? (
                    <p>Aucun rapport médical disponible.</p>
                  ) : (
                    <div className="reports-by-doctor">
                      {Object.entries(
                        medicalReports.reduce((acc, report) => {
                          const doctorId = report.doctorId?._id;
                          const doctorName = `Dr. ${report.doctorId?.nom} ${report.doctorId?.prenom}`;
                          if (!acc[doctorId]) {
                            acc[doctorId] = {
                              doctorName,
                              reports: []
                            };
                          }
                          acc[doctorId].reports.push(report);
                          return acc;
                        }, {})
                      ).map(([doctorId, { doctorName, reports }]) => (
                        <div key={doctorId} className="doctor-reports-section">
                          <h3 className="doctor-name">{doctorName}</h3>
                          <div className="reports-grid">
                            {reports.map((report) => (
                              <div key={report._id} className="report-card">
                                <div className="report-header">
                                  <span className="report-date">
                                    {new Date(report.createdAt).toLocaleString('fr-FR')}
                                  </span>
                                </div>
                                <div className="report-content">
                                  <p><strong>Rendez-vous du:</strong> {new Date(report.appointmentId?.date).toLocaleString('fr-FR')}</p>
                                  <p><strong>Description:</strong> {report.description}</p>
                                </div>
                                <div className="report-actions">
                                  <a
                                    href={`${API_BASE_URL}/${report.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-btn"
                                  >
                                    📄 Voir le rapport
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === 'hospital-appointment' && (
              <>
                <h2>🏥 Rendez-vous Hôpital</h2>
                <div className="hospital-appointment-section">
                  <form onSubmit={handleHospitalAppointmentSubmit} className="hospital-form">
                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Région :</label>
                      <select 
                        value={selectedRegion} 
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une région</option>
                        {regions.map(region => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Spécialité :</label>
                      <select 
                        value={selectedSpecialty} 
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une spécialité</option>
                        {specialties.map(specialty => (
                          <option key={specialty} value={specialty}>
                            {specialty}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={styles.formGroup}>
                      <label style={styles.label}>Hôpital :</label>
                      <select 
                        value={selectedHospital} 
                        onChange={(e) => setSelectedHospital(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez un hôpital</option>
                        {hospitals
                          .filter(hospital => 
                            (!selectedRegion || hospital.region === selectedRegion)
                          )
                          .map(hospital => (
                            <option key={hospital._id} value={hospital._id}>
                              {hospital.nom} - {hospital.adresse}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="submit-btn">
                      Demander un rendez-vous
                    </button>
                  </form>

                  <div className="hospital-appointments-list">
                    <h3>Mes demandes de rendez-vous</h3>
                    {hospitalAppointments.length === 0 ? (
                      <p>Aucune demande de rendez-vous en cours.</p>
                    ) : (
                      <div className="appointments-grid">
                        {hospitalAppointments.map((apt) => (
                          <div key={apt._id} className="appointment-card">
                            <h4>{apt.hospitalId?.nom || "Hôpital"}</h4>
                            <p>📍 {apt.hospitalId?.adresse || "Adresse non spécifiée"}</p>
                            <p>👨‍⚕️ Spécialité : {apt.specialty}</p>
                            <p className={`status ${apt.status}`}>
                              {apt.status === 'confirmed' ? 'Confirmé' : 
                               apt.status === 'pending' ? 'En attente' : 'Annulé'}
                            </p>
                            <p className="created-date">
                              Demande effectuée le : {new Date(apt.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
