import React, { useEffect, useState, useRef } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/Dashboard.css';

const MessagesView = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupedAppointments, setGroupedAppointments] = useState({});
  const messagesEndRef = useRef(null);
  const doctorId = localStorage.getItem('userId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchAppointments();
  }, [doctorId]);

  useEffect(() => {
    if (selectedAppointment) {
      setMessages([]);
      setError(null);
      fetchMessages(selectedAppointment._id);
    }
  }, [selectedAppointment]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const appointments = res.data;

      // Grouper les rendez-vous par patient
      const grouped = appointments.reduce((acc, apt) => {
        const patientId = apt.patient._id;
        if (!acc[patientId]) {
          acc[patientId] = {
            patient: apt.patient,
            appointments: []
          };
        }
        acc[patientId].appointments.push(apt);
        return acc;
      }, {});

      setGroupedAppointments(grouped);
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de charger les rendez-vous");
      setLoading(false);
    }
  };

  const fetchMessages = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/messages/${appointmentId}?userId=${doctorId}`);
      setMessages(response.data);
      
      // Marquer les messages comme lus
      const unreadMessages = response.data
        .filter(msg => msg.receiverId === doctorId && !msg.isRead)
        .map(msg => msg._id);
      
      if (unreadMessages.length > 0) {
        await axios.put('http://localhost:5001/api/messages/read', {
          messageIds: unreadMessages
        });
      }
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedAppointment || loading) return;

    try {
      setLoading(true);
      setError(null);
      const messageData = {
        senderId: doctorId,
        receiverId: selectedAppointment.patient._id,
        appointmentId: selectedAppointment._id,
        content: newMessage
      };
      
      console.log('Envoi du message:', messageData);
      const response = await axios.post('http://localhost:5001/api/messages', messageData);
      console.log('Message envoyé:', response.data);
      
      let messageToAdd = null;
      if (response.data && response.data._id) {
        messageToAdd = response.data;
      } else if (response.data && response.data.data && response.data.data._id) {
        messageToAdd = response.data.data;
      }

      if (messageToAdd) {
        setMessages(prev => [...prev, {
          ...messageToAdd,
          createdAt: messageToAdd.createdAt || new Date().toISOString()
        }]);
        setNewMessage('');
        scrollToBottom();
      } else {
        console.error('Structure de message invalide:', response.data);
        setError('Erreur lors de l\'envoi du message: format invalide');
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Date invalide:', dateString);
        return '';
      }
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };

  const isMessageFromDoctor = (message) => {
    return message.senderId === doctorId;
  };

  return (
    <div className="messages-container" style={{ height: '100vh', display: 'flex' }}>
      <div className="appointments-list" style={{
        flex: '0 0 300px',
        overflowY: 'auto',
        borderRight: '1px solid #e0e0e0',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          marginBottom: '20px',
          color: '#2c3e50'
        }}>Mes Patients</h3>
        {error && <div className="error-message" key="error">{error}</div>}
        {loading && Object.keys(groupedAppointments).length === 0 ? (
          <div className="loading" key="loading">Chargement des patients...</div>
        ) : Object.keys(groupedAppointments).length === 0 ? (
          <div className="no-appointments" key="no-appointments">Aucun patient trouvé</div>
        ) : (
          Object.values(groupedAppointments).map(({ patient, appointments }) => (
            <div 
              key={`patient-${patient._id}`}
              className="patient-group"
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div className="patient-header" style={{
                borderBottom: '1px solid #eee',
                paddingBottom: '10px',
                marginBottom: '10px'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: '#2c3e50',
                  fontSize: '1.1rem'
                }}>{patient.prenom} {patient.nom}</h4>
                <p style={{ margin: '4px 0', color: '#666' }}>📧 {patient.email}</p>
                <p style={{ margin: '4px 0', color: '#666' }}>📞 {patient.telephone}</p>
              </div>
              <div className="patient-appointments">
                {appointments.map(apt => (
                  <div 
                    key={`appointment-${apt._id}`}
                    className={`appointment-item ${selectedAppointment?._id === apt._id ? 'selected' : ''}`}
                    onClick={() => setSelectedAppointment(apt)}
                    style={{
                      padding: '8px',
                      margin: '5px 0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: selectedAppointment?._id === apt._id ? '#e3f2fd' : '#f8f9fa',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <p style={{ margin: '2px 0' }}>🗓️ {formatDate(apt.date)}</p>
                    <p className={`status ${apt.status}`} style={{
                      margin: '2px 0',
                      color: apt.status === 'confirmed' ? '#4caf50' : 
                             apt.status === 'pending' ? '#ff9800' : '#f44336'
                    }}>
                      {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : 'Annulé'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="chat-section" style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {selectedAppointment ? (
          <>
            <div className="chat-header" style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fff'
            }}>
              <h3 style={{
                margin: '0 0 8px 0',
                color: '#2c3e50',
                fontSize: '1.3rem'
              }}>Discussion avec {selectedAppointment.patient?.prenom} {selectedAppointment.patient?.nom}</h3>
              <p style={{ margin: '0', color: '#666' }}>📅 {formatDate(selectedAppointment.date)}</p>
            </div>

            <div className="messages-list" style={{
              flex: '1',
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#f8f9fa'
            }}>
              {error && <div className="error-message" key="chat-error">{error}</div>}
              {loading ? (
                <div className="loading" key="chat-loading">Chargement des messages...</div>
              ) : messages.length === 0 ? (
                <div className="no-messages" key="no-messages" style={{
                  textAlign: 'center',
                  color: '#666',
                  marginTop: '20px'
                }}>Aucun message dans cette discussion</div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div 
                      key={msg._id || `msg-${index}-${Date.now()}`}
                      className={`message ${isMessageFromDoctor(msg) ? 'sent' : 'received'}`}
                      style={{
                        maxWidth: '70%',
                        margin: '10px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: isMessageFromDoctor(msg) ? '#1976d2' : '#fff',
                        color: isMessageFromDoctor(msg) ? '#fff' : '#2c3e50',
                        alignSelf: isMessageFromDoctor(msg) ? 'flex-end' : 'flex-start',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <p style={{ margin: '0 0 4px 0' }}>{msg.content}</p>
                      <small style={{
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        alignSelf: isMessageFromDoctor(msg) ? 'flex-end' : 'flex-start'
                      }}>{formatDate(msg.createdAt)}</small>
                    </div>
                  ))}
                  <div ref={messagesEndRef} key="messages-end" />
                </>
              )}
            </div>

            <form onSubmit={sendMessage} className="message-form" style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              display: 'flex',
              gap: '10px'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                disabled={loading}
                style={{
                  flex: '1',
                  padding: '12px',
                  borderRadius: '24px',
                  border: '1px solid #e0e0e0',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
              <button 
                type="submit" 
                disabled={loading || !newMessage.trim()}
                style={{
                  padding: '12px 24px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  opacity: loading || !newMessage.trim() ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected" key="no-chat" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            fontSize: '1.1rem'
          }}>
            <p>👈 Sélectionnez un rendez-vous pour voir la discussion</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LabMessagesView = () => {
  const [laboratories, setLaboratories] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const doctorId = localStorage.getItem('userId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchLaboratories();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      fetchMessages(selectedLab._id);
    }
  }, [selectedLab]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchLaboratories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/labs-valides');
      setLaboratories(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération laboratoires:', error);
      setError('Impossible de charger la liste des laboratoires.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (labId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/lab-doctor-messages/${labId}/${doctorId}`);
      setMessages(response.data);
      
      // Marquer les messages comme lus
      await axios.put(`http://localhost:5001/api/lab-doctor-messages/read`, {
        receiverId: doctorId,
        senderId: labId
      });
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      setError('Impossible de charger les messages.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLab) return;

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5001/api/lab-doctor-messages', {
        senderId: doctorId,
        receiverId: selectedLab._id,
        content: newMessage
      });

      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      setError('Impossible d\'envoyer le message.');
    } finally {
      setLoading(false);
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

  return (
    <div className="messages-container">
      <div className="laboratories-list">
        <h3>🔬 Laboratoires</h3>
        {loading && laboratories.length === 0 ? (
          <div className="loading">Chargement des laboratoires...</div>
        ) : laboratories.length === 0 ? (
          <div className="no-labs">Aucun laboratoire disponible</div>
        ) : (
          laboratories.map(lab => (
            <div
              key={lab._id}
              className={`lab-item ${selectedLab?._id === lab._id ? 'selected' : ''}`}
              onClick={() => setSelectedLab(lab)}
            >
              <h4>{lab.nom}</h4>
              <p>📍 {lab.adresse}</p>
            </div>
          ))
        )}
      </div>

      <div className="chat-section">
        {selectedLab ? (
          <>
            <div className="chat-header">
              <h3>Discussion avec {selectedLab.nom}</h3>
              <p>📍 {selectedLab.adresse}</p>
            </div>

            <div className="messages-list">
              {error && <div className="error-message">{error}</div>}
              {loading ? (
                <div className="loading">Chargement des messages...</div>
              ) : messages.length === 0 ? (
                <div className="no-messages">Aucun message dans cette discussion</div>
              ) : (
                <>
                  {messages.map(message => (
                    <div
                      key={message._id}
                      className={`message ${message.senderId === doctorId ? 'sent' : 'received'}`}
                    >
                      <p>{message.content}</p>
                      <small>{formatDate(message.createdAt)}</small>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newMessage.trim()}>
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>👈 Sélectionnez un laboratoire pour commencer une discussion</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UpcomingAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const now = new Date();
      const upcomingAppointments = res.data
        .filter(apt => new Date(apt.date) > now && apt.status === 'confirmed')
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setAppointments(upcomingAppointments);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    await axios.put(`http://localhost:5001/api/appointments/${id}/status`, { status: newStatus });
    fetchAppointments();
  };

  return (
    <div className="dashboard-content">
      <h2>📅 Rendez-vous à venir</h2>
      {appointments.length === 0 ? (
        <p>Aucun rendez-vous à venir</p>
      ) : (
        appointments.map(apt => (
          <div key={apt._id} className="appointment-card upcoming">
            <h4>{apt.patient?.prenom} {apt.patient?.nom}</h4>
            <p>📧 {apt.patient?.email} | 📞 {apt.patient?.telephone}</p>
            <p>🗓️ {new Date(apt.date).toLocaleString('fr-FR')}</p>
            {apt.reason && <p>📝 {apt.reason}</p>}
            <select value={apt.status} onChange={(e) => updateStatus(apt._id, e.target.value)}>
              <option value="confirmed">Confirmé</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
};

const PastAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pastAppointments = res.data
        .filter(apt => 
          // Rendez-vous passés
          new Date(apt.date) < new Date() ||
          // Rendez-vous annulés
          apt.status === 'cancelled' ||
          // Rendez-vous terminés
          apt.status === 'completed'
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Plus récent en premier
      setAppointments(pastAppointments);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const getStatusText = (status, date) => {
    if (status === 'cancelled') return '❌ Annulé';
    if (status === 'completed') return '✅ Terminé';
    return '📅 Passé';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'cancelled':
        return 'cancelled';
      case 'completed':
        return 'completed';
      default:
        return 'past';
    }
  };

  return (
    <div className="dashboard-content">
      <h2>📚 Historique des rendez-vous</h2>
      {appointments.length === 0 ? (
        <p>Aucun rendez-vous passé</p>
      ) : (
        appointments.map(apt => (
          <div key={apt._id} className={`appointment-card ${getStatusClass(apt.status)}`}>
            <h4>{apt.patient?.prenom} {apt.patient?.nom}</h4>
            <p>📧 {apt.patient?.email} | 📞 {apt.patient?.telephone}</p>
            <p>🗓️ {new Date(apt.date).toLocaleString('fr-FR')}</p>
            {apt.reason && <p>📝 {apt.reason}</p>}
            <p className={`status ${apt.status}`}>{getStatusText(apt.status, apt.date)}</p>
          </div>
        ))
      )}
    </div>
  );
};

const PendingAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('');
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchMedicalDocuments(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pendingAppointments = res.data
        .filter(apt => apt.status === 'pending')
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setAppointments(pendingAppointments);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalDocuments = async (patientId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/patient/medical-documents/${patientId}`);
      setMedicalDocuments(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Erreur lors du chargement des documents médicaux');
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
        await axios.put(`http://localhost:5001/api/appointments/${appointmentId}/status`, { status: newStatus });
        fetchAppointments();
        setError('✅ Rendez-vous ' + (newStatus === 'cancelled' ? 'annulé' : 'mis à jour') + ' avec succès');
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handlePlanningSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5001/api/appointments/${selectedAppointment._id}/planning`, {
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
      fetchAppointments();
    } catch (error) {
      console.error('❌ Erreur:', error);
      setError("Erreur lors de la planification du rendez-vous.");
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

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 60px)',
      gap: '20px',
      padding: '20px'
    }}>
      <div style={{ 
        flex: '1',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h2 style={{ 
          marginBottom: '20px',
          color: '#2c3e50'
        }}>⏳ Demandes en attente</h2>
        
        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>{error}</div>
        )}

        {loading && appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Chargement des demandes...
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Aucune demande en attente
          </div>
        ) : (
          appointments.map(apt => (
            <div 
              key={apt._id} 
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border: selectedPatient === apt.patient._id ? '2px solid #1976d2' : '1px solid #e0e0e0'
              }}
              onClick={() => setSelectedPatient(apt.patient._id)}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                {apt.patient?.prenom} {apt.patient?.nom}
              </h4>
              <p style={{ margin: '5px 0', color: '#666' }}>
                📧 {apt.patient?.email}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                📞 {apt.patient?.telephone}
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                🗓️ {formatDate(apt.date)}
              </p>
              {apt.reason && (
                <p style={{ 
                  margin: '10px 0',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }}>
                  📝 Motif: {apt.reason}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(apt._id, 'confirmed');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Accepter
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(apt._id, 'cancelled');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Refuser
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ 
        flex: '1',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          marginBottom: '20px',
          color: '#2c3e50'
        }}>📄 Documents Médicaux</h2>

        {!selectedPatient ? (
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            color: '#666'
          }}>
            👈 Sélectionnez un patient pour voir ses documents médicaux
          </div>
        ) : loading ? (
          <div style={{ 
            textAlign: 'center',
            padding: '20px'
          }}>
            Chargement des documents...
          </div>
        ) : medicalDocuments.length === 0 ? (
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            color: '#666'
          }}>
            Aucun document médical disponible pour ce patient
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {medicalDocuments.map((doc, index) => (
              <div
                key={doc._id || index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <h4 style={{ 
                  margin: '0 0 10px 0',
                  color: '#2c3e50'
                }}>
                  📎 {doc.fileName}
                </h4>
                {doc.description && (
                  <p style={{ 
                    margin: '5px 0',
                    color: '#666'
                  }}>
                    {doc.description}
                  </p>
                )}
                <a
                  href={`http://localhost:5001/${doc.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  📥 Télécharger
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

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
            <p>Patient: {selectedAppointment.patient?.prenom} {selectedAppointment.patient?.nom}</p>
            
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
    </div>
  );
};

const CalendarView = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayAppointments, setDayAppointments] = useState([]);
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointmentsByDate(selectedDate);
  }, [selectedDate, appointments]);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des rendez-vous:', err);
    }
  };

  const filterAppointmentsByDate = (date) => {
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
    setDayAppointments(filtered);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'confirmed';
      case 'pending': return 'pending';
      case 'cancelled': return 'cancelled';
      case 'completed': return 'completed';
      default: return '';
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <h2 className="calendar-title">📅 Calendrier des rendez-vous</h2>
        
        <div className="calendar-layout">
          <div className="calendar-wrapper">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="fr-FR"
              className="custom-calendar"
              navigationLabel={({ date }) => {
                return `${date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`;
              }}
              formatMonthYear={(locale, date) => {
                return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
              }}
              formatDay={(locale, date) => date.getDate()}
              formatShortWeekday={(locale, date) => {
                const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
                return days[date.getDay()];
              }}
              prevLabel="← Mois précédent"
              nextLabel="Mois suivant →"
              prev2Label="« Année précédente"
              next2Label="Année suivante »"
              showFixedNumberOfWeeks={true}
              minDetail="month"
              tileClassName={({ date }) => {
                const hasAppointment = appointments.some(apt => 
                  new Date(apt.date).toDateString() === date.toDateString()
                );
                return hasAppointment ? 'has-appointment' : '';
              }}
            />
          </div>

          <div className="appointments-list">
            <h3 className="date-header">
              Rendez-vous du {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h3>

            {dayAppointments.length === 0 ? (
              <div className="no-appointments">
                <p>Aucun rendez-vous pour cette date</p>
              </div>
            ) : (
              <div className="appointments-grid">
                {dayAppointments
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(apt => (
                    <div key={apt._id} className={`appointment-card ${apt.status}`}>
                      <div className="appointment-time">
                        {new Date(apt.date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="patient-info">
                        <h4>{apt.patient?.prenom} {apt.patient?.nom}</h4>
                        <p className="contact-info">
                          <span>📞 {apt.patient?.telephone}</span>
                          <span>📧 {apt.patient?.email}</span>
                        </p>
                      </div>
                      {apt.reason && (
                        <p className="appointment-reason">📝 {apt.reason}</p>
                      )}
                      <div className="appointment-status">
                        {apt.status === 'confirmed' ? '✅ Confirmé' :
                         apt.status === 'pending' ? '⏳ En attente' :
                         apt.status === 'cancelled' ? '❌ Annulé' : '✔️ Terminé'}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ArticlesView = () => {
  const [articles, setArticles] = useState([]);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/articles/doctor/${doctorId}`);
      setArticles(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération articles:', error);
      setError('Impossible de charger les articles.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', newArticle.title);
      formData.append('content', newArticle.content);
      formData.append('category', newArticle.category);
      formData.append('tags', JSON.stringify(newArticle.tags.split(',').map(tag => tag.trim())));
      formData.append('authorId', doctorId);
      if (newArticle.image) {
        formData.append('image', newArticle.image);
      }

      await axios.post('http://localhost:5001/api/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewArticle({
        title: '',
        content: '',
        category: '',
        tags: '',
        image: null
      });
      fetchArticles();
    } catch (error) {
      console.error('❌ Erreur création article:', error);
      setError("Erreur lors de la création de l'article.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await axios.delete(`http://localhost:5001/api/articles/${articleId}`);
        fetchArticles();
      } catch (error) {
        console.error('❌ Erreur suppression article:', error);
        setError("Erreur lors de la suppression de l'article.");
      }
    }
  };

  return (
    <div className="articles-container">
      <h2>📚 Mes Articles</h2>
      
      <form onSubmit={handleSubmit} className="article-form">
        <h3>Nouvel Article</h3>
        <div className="form-group">
          <input
            type="text"
            placeholder="Titre de l'article"
            value={newArticle.title}
            onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <textarea
            placeholder="Contenu de l'article"
            value={newArticle.content}
            onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Catégorie"
            value={newArticle.category}
            onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Tags (séparés par des virgules)"
            value={newArticle.tags}
            onChange={(e) => setNewArticle({...newArticle, tags: e.target.value})}
          />
        </div>
        <div className="form-group">
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setNewArticle({...newArticle, image: e.target.files[0]})}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Publication...' : 'Publier'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="articles-list">
        {loading && articles.length === 0 ? (
          <div className="loading">Chargement des articles...</div>
        ) : articles.length === 0 ? (
          <div className="no-articles">Aucun article publié</div>
        ) : (
          articles.map(article => (
            <div key={article._id} className="article-card">
              <img 
                src={article.imageUrl}
                alt={article.title}
                className="article-image"
              />
              <div className="article-content">
                <h3>{article.title}</h3>
                <p className="article-category">📂 {article.category}</p>
                <p className="article-text">{article.content}</p>
                {article.tags && article.tags.length > 0 && (
                  <div className="article-tags">
                    {article.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
                <div className="article-footer">
                  <small>Publié le {new Date(article.createdAt).toLocaleDateString('fr-FR')}</small>
                  <button 
                    onClick={() => handleDelete(article._id)}
                    className="delete-btn"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MedicalReportsView = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [reports, setReports] = useState([]);
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchPatients();
    fetchReports();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientAppointments();
    } else {
      setAppointments([]);
      setSelectedAppointment(null);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/${doctorId}/patients`);
      setPatients(res.data);
    } catch (err) {
      setError("Erreur lors du chargement des patients");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const patientAppointments = res.data.filter(
        apt => apt.patient._id === selectedPatient._id && apt.status === 'confirmed'
      );
      setAppointments(patientAppointments);
    } catch (err) {
      setError("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/medical-reports/doctor/${doctorId}`);
      setReports(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement des rapports:", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/'))) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Veuillez sélectionner un fichier PDF ou une image");
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !file || !description) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctorId', doctorId);
    formData.append('patientId', selectedPatient._id);
    formData.append('appointmentId', selectedAppointment._id);
    formData.append('description', description);

    try {
      setLoading(true);
      await axios.post('http://localhost:5001/api/medical-reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Rapport médical envoyé avec succès');
      setFile(null);
      setDescription('');
      setSelectedAppointment(null);
      fetchReports(); // Rafraîchir la liste des rapports
    } catch (err) {
      setError("Erreur lors de l'envoi du rapport médical");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5001/api/medical-reports/${reportId}`);
      setSuccess('Rapport supprimé avec succès');
      fetchReports(); // Rafraîchir la liste des rapports
    } catch (err) {
      setError('Erreur lors de la suppression du rapport');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
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

  return (
    <div className="medical-reports-container">
      <h2>📋 Rapports Médicaux</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="medical-reports-layout">
        <div className="form-section">
          <form onSubmit={handleSubmit} className="medical-report-form">
            <div className="form-group">
              <label>Patient:</label>
              <select 
                value={selectedPatient ? selectedPatient._id : ''} 
                onChange={(e) => {
                  const patient = patients.find(p => p._id === e.target.value);
                  setSelectedPatient(patient);
                  setSelectedAppointment(null);
                }}
                required
              >
                <option value="">Sélectionnez un patient</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.prenom} {patient.nom}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="form-group">
                <label>Rendez-vous:</label>
                <select 
                  value={selectedAppointment ? selectedAppointment._id : ''} 
                  onChange={(e) => {
                    const apt = appointments.find(a => a._id === e.target.value);
                    setSelectedAppointment(apt);
                  }}
                  required
                >
                  <option value="">Sélectionnez un rendez-vous</option>
                  {appointments.map(apt => (
                    <option key={apt._id} value={apt._id}>
                      {formatDate(apt.date)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Fichier (PDF ou Image):</label>
              <input 
                type="file" 
                accept=".pdf,image/*" 
                onChange={handleFileChange}
                required 
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Ajoutez une description du rapport médical"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedAppointment || !file || !description}
              className="submit-button"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le rapport'}
            </button>
          </form>
        </div>

        <div className="reports-list">
          <h3>Rapports récents</h3>
          {reports.length === 0 ? (
            <div className="no-reports">Aucun rapport médical</div>
          ) : (
            reports.map(report => (
              <div key={report._id} className="report-card">
                <div className="report-header">
                  <h4>Patient: {report.patientId?.prenom} {report.patientId?.nom}</h4>
                  <span className="report-date">{formatDate(report.createdAt)}</span>
                </div>
                <p className="report-description">{report.description}</p>
                <div className="report-actions">
                  <a 
                    href={`http://localhost:5001/${report.fileUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-report-btn"
                  >
                    📄 Voir le rapport
                  </a>
                  <button 
                    onClick={() => handleDelete(report._id)}
                    className="delete-report-btn"
                    disabled={loading}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const [unreadMessages, setUnreadMessages] = useState(0);

  const checkUnreadMessages = async () => {
    try {
      const doctorId = localStorage.getItem('userId');
      if (!doctorId) {
        console.log("⚠️ Pas d'userId disponible pour vérifier les messages non lus");
        return;
      }
      console.log("🔍 Vérification des messages non lus pour doctorId:", doctorId);
      const response = await axios.get(`http://localhost:5001/api/messages/unread/${doctorId}`);
      console.log("✅ Messages non lus reçus:", response.data);
      setUnreadMessages(response.data.length);
    } catch (error) {
      console.error('❌ Erreur vérification messages non lus:', error);
    }
  };

  useEffect(() => {
    const doctorId = localStorage.getItem('userId');
    if (doctorId) {
      checkUnreadMessages();
      const interval = setInterval(checkUnreadMessages, 900000); // Vérification toutes les 15 minutes
      return () => clearInterval(interval);
    }
  }, []);

  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>👨‍⚕️ Espace Docteur</h2>
        <nav>
          <ul>
            <li><Link to="/doctor-dashboard">🏠 Accueil</Link></li>
            <li><Link to="calendar">📅 Calendrier</Link></li>
            <li className="nav-section">
              <span className="section-title">📅 Rendez-vous</span>
              <ul>
                <li><Link to="pending-appointments">⏳ En attente</Link></li>
                <li><Link to="upcoming-appointments">📆 À venir</Link></li>
                <li><Link to="past-appointments">📚 Historique</Link></li>
              </ul>
            </li>
            <li>
              <Link to="messages">
                💬 Messages Patients
                {unreadMessages > 0 && (
                  <span style={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    marginLeft: '8px'
                  }}>
                    {unreadMessages}
                  </span>
                )}
              </Link>
            </li>
            <li><Link to="lab-messages">🔬 Messages Laboratoires</Link></li>
            <li><Link to="articles">📝 Articles</Link></li>
            <li><Link to="medical-reports">Rapports Médicaux</Link></li>
          </ul>
        </nav>
      </aside>

      <div className="main-content">
        <Routes>
          <Route path="calendar" element={<CalendarView />} />
          <Route path="pending-appointments" element={<PendingAppointmentsView />} />
          <Route path="upcoming-appointments" element={<UpcomingAppointmentsView />} />
          <Route path="past-appointments" element={<PastAppointmentsView />} />
          <Route path="messages" element={<MessagesView />} />
          <Route path="lab-messages" element={<LabMessagesView />} />
          <Route path="articles" element={<ArticlesView />} />
          <Route path="medical-reports" element={<MedicalReportsView />} />
        </Routes>
      </div>
    </div>
  );
};

export default DoctorDashboard;
