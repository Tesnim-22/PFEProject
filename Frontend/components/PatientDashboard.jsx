import React, { useState, useEffect } from 'react';
import AppointmentForm from './AppointmentForm';
import '../styles/PatientDashboard.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

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
  const [labAppointmentDate, setLabAppointmentDate] = useState('');
  const [labAppointmentReason, setLabAppointmentReason] = useState('');
  const [labAppointments, setLabAppointments] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [hospitalAppointments, setHospitalAppointments] = useState([]);

  // Liste des spécialités disponibles
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
    
    // Charger les rendez-vous appropriés selon la section
    if (activeSection === 'messagerie' || activeSection === 'all-appointments') {
      console.log('🔄 Fetching all appointments...');
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
  }, [activeSection]);

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
      // Charger les rendez-vous médicaux
      const medicalRes = await axios.get(`${API_BASE_URL}/api/appointments?patientId=${patientId}`);
      setAppointments(medicalRes.data);

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
      const res = await axios.get(`${API_BASE_URL}/api/messages/${appointmentId}`);
      setChatMessages(res.data);
    } catch (error) {
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
        date: labAppointmentDate,
        reason: labAppointmentReason
      });
      setMessage("✅ Rendez-vous laboratoire enregistré avec succès !");
      setSelectedLab('');
      setLabAppointmentDate('');
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
              className={activeSection === 'lab-results' ? 'active' : ''} 
              onClick={() => setActiveSection('lab-results')}
            >
              <span className="icon">📋</span>
              Résultats Laboratoire
            </button>
            <button 
              className={activeSection === 'messagerie' ? 'active' : ''} 
              onClick={() => setActiveSection('messagerie')}
            >
              <span className="icon">💬</span>
              Messagerie
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
                <h2>📅 Nouveau rendez-vous</h2>
                <AppointmentForm userId={userId} />
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

            {activeSection === 'messagerie' && (
              <div className="messagerie-section">
                <h2>💬 Messagerie avec mes médecins</h2>
                <div className="messagerie-layout">
                  <div className="appointments-list">
                    <h3>Mes rendez-vous</h3>
                    {appointments.length === 0 ? (
                      <p>Aucun rendez-vous trouvé.</p>
                    ) : (
                      <ul>
                        {appointments.map((apt) => (
                          <li
                            key={apt._id}
                            className={selectedAppointment && selectedAppointment._id === apt._id ? 'selected' : ''}
                            onClick={() => {
                              setSelectedAppointment(apt);
                              fetchChatMessages(apt._id);
                            }}
                          >
                            <strong>{apt.doctorName || apt.doctorEmail || 'Médecin'}</strong>
                            <br />
                            <small>{apt.date ? new Date(apt.date).toLocaleString('fr-FR') : ''}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div className="chat-box">
                    {selectedAppointment ? (
                      <>
                        <div className="chat-messages">
                          {chatLoading ? (
                            <div className="loading-messages">Chargement...</div>
                          ) : chatMessages.length === 0 ? (
                            <div className="no-messages">Aucun message.</div>
                          ) : (
                            chatMessages.map((msg) => (
                              <div 
                                key={msg._id} 
                                className={msg.senderId === userId ? 'msg-patient' : 'msg-doctor'}
                              >
                                <div className="message-content">{msg.content}</div>
                                <div className="msg-date">
                                  {new Date(msg.sentAt || msg.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                            ))
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
                          <button onClick={handleSendMessage}>Envoyer</button>
                        </div>
                      </>
                    ) : (
                      <div>Sélectionnez un rendez-vous pour discuter avec le médecin.</div>
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
                                  {apt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => {
                                        setSelectedAppointment(apt);
                                        fetchChatMessages(apt._id);
                                        setActiveSection('messagerie');
                                      }}
                                      className="chat-button"
                                    >
                                      💬 Chat
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
                            </tr>
                          </thead>
                          <tbody>
                            {labAppointments.map(apt => (
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
                            </tr>
                          </thead>
                          <tbody>
                            {hospitalAppointments.map(apt => (
                              <tr key={apt._id} className={`appointment-row ${apt.status}`}>
                                <td>{apt.hospitalName}</td>
                                <td>{new Date(apt.date).toLocaleString('fr-FR')}</td>
                                <td>{apt.service}</td>
                                <td>
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
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
                    <div className="form-group">
                      <label>Laboratoire :</label>
                      <select 
                        value={selectedLab} 
                        onChange={(e) => setSelectedLab(e.target.value)}
                        required
                      >
                        <option value="">Sélectionnez un laboratoire</option>
                        {labs.map(lab => (
                          <option key={lab._id} value={lab._id}>
                            {lab.nom} - {lab.adresse}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Date et heure :</label>
                      <input
                        type="datetime-local"
                        value={labAppointmentDate}
                        onChange={(e) => setLabAppointmentDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Raison / Type d'analyse :</label>
                      <textarea
                        value={labAppointmentReason}
                        onChange={(e) => setLabAppointmentReason(e.target.value)}
                        placeholder="Décrivez le type d'analyse ou la raison de votre visite"
                        required
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

            {activeSection === 'hospital-appointment' && (
              <>
                <h2>🏥 Rendez-vous Hôpital</h2>
                <div className="hospital-appointment-section">
                  <form onSubmit={handleHospitalAppointmentSubmit} className="hospital-form">
                    <div className="form-group">
                      <label>Hôpital :</label>
                      <select 
                        value={selectedHospital} 
                        onChange={(e) => setSelectedHospital(e.target.value)}
                        required
                      >
                        <option value="">Sélectionnez un hôpital</option>
                        {hospitals.map(hospital => (
                          <option key={hospital._id} value={hospital._id}>
                            {hospital.nom} - {hospital.adresse}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Spécialité :</label>
                      <select 
                        value={selectedSpecialty} 
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        required
                      >
                        <option value="">Sélectionnez une spécialité</option>
                        {specialties.map(specialty => (
                          <option key={specialty} value={specialty}>
                            {specialty}
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
