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
    if (activeSection === 'documents') {
      fetchMedicalDocuments(storedId);
    }
    if (activeSection === 'messagerie' || activeSection === 'all-appointments') {
      console.log('🔄 Fetching appointments due to section:', activeSection);
      fetchAppointments(storedId);
    }
    if (activeSection === 'lab-appointment') {
      fetchLabs();
      fetchLabAppointments(storedId);
    }
    if (activeSection === 'lab-results') {
      fetchLabResults(storedId);
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

  const fetchAppointments = async (id) => {
    try {
      console.log('🔍 Fetching appointments for patient ID:', id);
      const res = await axios.get(`${API_BASE_URL}/api/appointments?patientId=${id}`);
      console.log('✅ Appointments received:', res.data);
      setAppointments(res.data);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error.response || error);
      setAppointments([]);
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

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">🧑‍⚕️ Patient</div>
        <div className="sidebar-menu">
          <button 
            className={activeSection === 'profile' ? 'active' : ''} 
            onClick={() => setActiveSection('profile')}
          >
            👤 Profil
          </button>
          <button 
            className={activeSection === 'appointment' ? 'active' : ''} 
            onClick={() => setActiveSection('appointment')}
          >
            📅 Rendez-vous Médecin
          </button>
          <button 
            className={activeSection === 'all-appointments' ? 'active' : ''} 
            onClick={() => setActiveSection('all-appointments')}
          >
            📋 Tous mes rendez-vous
          </button>
          <button 
            className={activeSection === 'lab-appointment' ? 'active' : ''} 
            onClick={() => setActiveSection('lab-appointment')}
          >
            🔬 Rendez-vous Laboratoire
          </button>
          <button 
            className={activeSection === 'lab-results' ? 'active' : ''} 
            onClick={() => setActiveSection('lab-results')}
          >
            📋 Résultats Laboratoire
          </button>
          <button 
            className={activeSection === 'documents' ? 'active' : ''} 
            onClick={() => setActiveSection('documents')}
          >
            📄 Documents Médicaux
          </button>
          <button 
            className={activeSection === 'notifications' ? 'active' : ''} 
            onClick={() => setActiveSection('notifications')}
          >
            🔔 Notifications
          </button>
          <button 
            className={activeSection === 'messagerie' ? 'active' : ''} 
            onClick={() => setActiveSection('messagerie')}
          >
            💬 Messagerie
          </button>
          <button onClick={handleLogout}>🚪 Déconnexion</button>
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
                    {notifications.map((notif, idx) => (
                      <li key={idx} className="notif-item">
                        {notif.message}
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
                            {apt.date ? new Date(apt.date).toLocaleString() : ''} <br />
                            {apt.doctorName || apt.doctorEmail || apt.doctorId}
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
                            <div>Chargement...</div>
                          ) : chatMessages.length === 0 ? (
                            <div>Aucun message.</div>
                          ) : (
                            chatMessages.map((msg) => (
                              <div key={msg._id} className={msg.senderId === userId ? 'msg-patient' : 'msg-doctor'}>
                                <span>{msg.content}</span>
                                <div className="msg-date">{new Date(msg.sentAt).toLocaleString()}</div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="chat-input">
                          <input
                            type="text"
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            placeholder="Votre message..."
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
                      <p>Aucun rendez-vous médical trouvé.</p>
                    ) : (
                      <div className="appointments-grid">
                        {appointments.map((apt) => (
                          <div key={apt._id} className="appointment-card">
                            <h4>{apt.doctorName || "Dr. " + apt.doctorId}</h4>
                            <p>🗓️ {new Date(apt.date).toLocaleString('fr-FR')}</p>
                            <p>📝 {apt.reason || "Non spécifié"}</p>
                            <p className={`status ${apt.status}`}>
                              {apt.status === 'confirmed' ? 'Confirmé' : 
                               apt.status === 'pending' ? 'En attente' : 'Annulé'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="appointments-category">
                    <h3>🔬 Rendez-vous Laboratoires</h3>
                    {labAppointments.length === 0 ? (
                      <p>Aucun rendez-vous laboratoire trouvé.</p>
                    ) : (
                      <div className="appointments-grid">
                        {labAppointments.map((apt) => (
                          <div key={apt._id} className="appointment-card">
                            <h4>{apt.lab?.nom || "Laboratoire"}</h4>
                            <p>📍 {apt.lab?.adresse || "Adresse non spécifiée"}</p>
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
          </>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
