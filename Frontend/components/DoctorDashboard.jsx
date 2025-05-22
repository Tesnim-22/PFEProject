import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import '../styles/DoctorDashboard.css';

const UnifiedMessagesView = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'patients', 'labs'
  const messagesEndRef = useRef(null);
  const doctorId = localStorage.getItem('userId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchAllConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      if (selectedConversation.type === 'Patient') {
        fetchPatientMessages(selectedConversation.id);
      } else if (selectedConversation.type === 'Labs') {
        fetchLabMessages(selectedConversation.id);
      }
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchAllConversations = async () => {
    try {
      setLoading(true);
      
      // Récupérer les rendez-vous pour les conversations patients
      const appointmentsRes = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      
      // Grouper les rendez-vous par patient
      const patientGroups = appointmentsRes.data.reduce((acc, apt) => {
        // Vérifier si l'objet patient existe et a un _id
        if (!apt.patient || !apt.patient._id) {
          console.warn('Rendez-vous sans données patient valides:', apt);
          return acc;
        }

        const patientId = apt.patient._id;
        if (!acc[patientId]) {
          acc[patientId] = {
            id: patientId,
            type: 'Patient',
            contact: {
              ...apt.patient,
              roles: ['Patient']
            },
            appointments: [],
            lastMessage: null,
            date: null
          };
        }
        acc[patientId].appointments.push(apt);
        // Garder la date la plus récente
        if (!acc[patientId].date || new Date(apt.date) > new Date(acc[patientId].date)) {
          acc[patientId].date = apt.date;
        }
        return acc;
      }, {});

      const patientConversations = Object.values(patientGroups);

      // Récupérer les laboratoires pour les conversations labo
      const labsRes = await axios.get('http://localhost:5001/api/labs-valides');
      const labConversations = labsRes.data
        .filter(lab => lab && lab._id && lab.roles && lab.roles.includes('Labs'))
        .map(lab => ({
          id: lab._id,
          type: 'Labs',
          contact: {
            _id: lab._id,
            nom: lab.nom || '',
            prenom: lab.prenom || '',
            email: lab.email || '',
            telephone: lab.telephone || '',
            adresse: lab.adresse || '',
            roles: ['Labs']
          }
        }));

      // Combiner et trier les conversations
      const allConversations = [...patientConversations, ...labConversations]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      setConversations(allConversations);
    } catch (err) {
      console.error('Erreur lors du chargement des conversations:', err);
      setError('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientMessages = async (patientId) => {
    try {
      setLoading(true);
      const selectedConv = conversations.find(c => c.id === patientId);
      if (!selectedConv || !selectedConv.appointments) {
        throw new Error('Conversation non trouvée');
      }

      // Récupérer les messages pour tous les rendez-vous du patient
      const messagesPromises = selectedConv.appointments.map(apt => 
        axios.get(`http://localhost:5001/api/messages/${apt._id}?userId=${doctorId}`)
      );
      
      const messagesResponses = await Promise.all(messagesPromises);
      
      // Fusionner tous les messages
      let allMessages = [];
      messagesResponses.forEach(response => {
        allMessages = [...allMessages, ...response.data];
      });

      // Trier les messages par date
      allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setMessages(allMessages);
    } catch (error) {
      console.error('Erreur récupération messages patient:', error);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabMessages = async (labId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/lab-doctor-messages/${labId}/${doctorId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Erreur récupération messages laboratoire:', error);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setLoading(true);
      let response;

      if (selectedConversation.type === 'Patient') {
        // Pour les patients, utiliser le rendez-vous le plus récent
        const latestAppointment = selectedConversation.appointments
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (!latestAppointment) {
          setError('Aucun rendez-vous trouvé pour ce patient');
          setLoading(false);
          return;
        }

        console.log('Latest appointment:', latestAppointment);
        console.log('Sending message with appointmentId:', latestAppointment._id);

        const messageData = {
          senderId: doctorId,
          receiverId: selectedConversation.id,
          appointmentId: latestAppointment._id,
          content: newMessage
        };

        console.log('Sending message data:', messageData);
        response = await axios.post('http://localhost:5001/api/messages', messageData);
      } else if (selectedConversation.type === 'Labs') {
        response = await axios.post('http://localhost:5001/api/lab-doctor-messages', {
          senderId: doctorId,
          receiverId: selectedConversation.id,
          content: newMessage
        });
      }

      const newMessageData = response.data.data || response.data;
      setMessages(prev => [...prev, newMessageData]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError('Impossible d\'envoyer le message');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'all') return true;
    if (activeTab === 'patients') return conv.type === 'Patient';
    if (activeTab === 'labs') return conv.type === 'Labs';
    return true;
  });

  return (
    <div className="messages-container" style={{ 
      height: '100vh', 
      display: 'flex',
      backgroundColor: '#f8f9fa',
      color: '#000000'
    }}>
      <div className="conversations-list" style={{
        flex: '0 0 300px',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        color: '#000000'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: 'white'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Messages</h3>
          <div style={{
            display: 'flex',
            gap: '10px',
            backgroundColor: '#f1f3f4',
            padding: '4px',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: activeTab === 'all' ? 'white' : 'transparent',
                cursor: 'pointer',
                boxShadow: activeTab === 'all' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                color: '#000000'
              }}
            >
              Tous
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: activeTab === 'patients' ? 'white' : 'transparent',
                cursor: 'pointer',
                boxShadow: activeTab === 'patients' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                color: '#000000'
              }}
            >
              Patients
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: activeTab === 'labs' ? 'white' : 'transparent',
                cursor: 'pointer',
                boxShadow: activeTab === 'labs' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                color: '#000000'
              }}
            >
              Labos
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px'
        }}>
          {loading && filteredConversations.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Chargement des conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Aucune conversation
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={`${conv.type}-${conv.id}`}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: selectedConversation?.id === conv.id ? '#e3f2fd' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  color: '#000000'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#000000'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: conv.type === 'Patient' ? '#bbdefb' : '#c8e6c9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    color: '#000000'
                  }}>
                    {conv.type === 'Patient' ? '👤' : '🔬'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0', fontSize: '1rem' }}>
                      {`${conv.contact?.prenom || ''} ${conv.contact?.nom || ''}`}
                    </h4>
                    <small style={{ color: '#666' }}>
                      {conv.type === 'Patient' ? '👤 Patient' : '🔬 Laboratoire'}
                    </small>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-section" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {selectedConversation ? (
          <>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: 'white'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: selectedConversation.type === 'Patient' ? '#bbdefb' : '#c8e6c9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  {selectedConversation.type === 'Patient' ? '👤' : '🔬'}
                </div>
                <div>
                  <h3 style={{ margin: '0' }}>
                    {`${selectedConversation.contact?.prenom || ''} ${selectedConversation.contact?.nom || ''}`}
                  </h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    {selectedConversation.type === 'Patient'
                      ? `📞 ${selectedConversation.contact?.telephone}`
                      : `📍 ${selectedConversation.contact?.adresse}`}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#f8f9fa'
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  Chargement des messages...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#666'
                }}>
                  Aucun message dans cette conversation
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      style={{
                        display: 'flex',
                        justifyContent: msg.senderId === doctorId ? 'flex-end' : 'flex-start',
                        marginBottom: '16px',
                        color: '#000000'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '14px 18px',
                        borderRadius: '16px',
                        backgroundColor: msg.senderId === doctorId ? '#1976d2' : 'white',
                        color: msg.senderId === doctorId ? 'white' : '#2c3e50',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '15px',
                        lineHeight: '1.5',
                        letterSpacing: '0.3px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                      }}>
                        <p style={{ 
                          margin: '0 0 6px 0',
                          fontWeight: '400'
                        }}>
                          {msg.content}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: msg.senderId === doctorId ? 'flex-end' : 'flex-start',
                          gap: '6px',
                          marginTop: '4px',
                          color: '#000000'
                        }}>
                          <small style={{
                            opacity: 0.85,
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {formatDate(msg.createdAt)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '20px',
                borderTop: '1px solid #e0e0e0',
                backgroundColor: 'white',
                display: 'flex',
                gap: '12px'
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '24px',
                  border: '1px solid #e0e0e0',
                  outline: 'none',
                  fontSize: '15px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  transition: 'border-color 0.2s ease',
                  color: '#000000'
                }}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                style={{
                  padding: '14px 28px',
                  borderRadius: '24px',
                  border: 'none',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  cursor: 'pointer',
                  opacity: loading || !newMessage.trim() ? 0.7 : 1,
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666'
          }}>
            <p>👈 Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

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
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Date invalide:', dateString);
        return 'Date invalide';
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
      return 'Date invalide';
    }
  };

  const isMessageFromDoctor = (message) => {
    return message.senderId === doctorId;
  };

  return (
    <div className="messages-container" style={{ height: '100vh', display: 'flex', color: '#000000' }}>
      <div className="appointments-list" style={{
        flex: '0 0 300px',
        overflowY: 'auto',
        borderRight: '1px solid #e0e0e0',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        color: '#000000'
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
              backgroundColor: '#fff',
              color: '#000000'  // Ajout de la couleur noire pour le texte
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
              gap: '10px',
              color: '#000000'  // Ajout de la couleur noire pour le texte
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                style={{
                  flex: '1',
                  padding: '12px',
                  borderRadius: '24px',
                  border: '1px solid #e0e0e0',
                  outline: 'none',
                  fontSize: '1rem',
                  color: '#000000'  // Ajout de la couleur noire pour le texte de l'input
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
    <div className="messages-container" style={{ color: '#000000' }}>
      <div className="laboratories-list">
        <h3>🔬 Laboratoires</h3>
        {loading && laboratories.length === 0 ? (
          <div className="loading">Chargement des laboratoires...</div>
        ) : laboratories.length === 0 ? (
          <div className="no-labs" style={{ color: '#000000' }}>Aucun laboratoire disponible</div>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pastAppointments = res.data
        .filter(apt => 
          new Date(apt.date) < new Date() ||
          apt.status === 'cancelled' ||
          apt.status === 'completed'
        )
        .sort((a, b) => sortOrder === 'desc' 
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date)
        );
      setAppointments(pastAppointments);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger l\'historique des rendez-vous');
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

  const getStatusText = (status) => {
    switch (status) {
      case 'cancelled': return '❌ Annulé';
      case 'completed': return '✅ Terminé';
      default: return '📅 Passé';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'cancelled': return 'cancelled';
      case 'completed': return 'completed';
      default: return 'past';
    }
  };

  const filteredAppointments = appointments
    .filter(apt => {
      const matchesSearch = 
        apt.patient?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && apt.status === filterStatus;
    });

  return (
    <div className="dashboard-content" style={{ padding: '20px', color: '#000000' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        color: '#000000'  // Ajout de la couleur noire pour le texte
      }}>
        <h2 style={{ margin: 0 }}>📚 Historique des rendez-vous</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="desc">Plus récent</option>
            <option value="asc">Plus ancien</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">Terminés</option>
            <option value="cancelled">Annulés</option>
          </select>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <input
          type="text"
          placeholder="Rechercher un patient ou un motif..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '1rem'
          }}
        />
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '40px',
          color: '#000000'  // Ajout de la couleur noire pour le texte
        }}>
          <div className="loading-spinner">Chargement de l'historique...</div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          color: '#000000'  // Changement de la couleur grise en noir
        }}>
          {searchTerm ? 'Aucun rendez-vous ne correspond à votre recherche' : 'Aucun rendez-vous passé'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '15px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
        }}>
          {filteredAppointments.map(apt => (
            <div
              key={apt._id}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #eee',
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  color: '#000000'  // Ajout de la couleur noire pour le texte
                }}>
                  👤
          </div>
                <div>
                  <h4 style={{ margin: '0', color: '#2c3e50' }}>
                    {apt.patient?.prenom} {apt.patient?.nom}
                  </h4>
                  <small style={{ color: '#666' }}>
                    ID: {apt.patient?._id}
                  </small>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  📧 {apt.patient?.email}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  📞 {apt.patient?.telephone}
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <p style={{ margin: '0', color: '#2c3e50' }}>
                  🗓️ {formatDate(apt.date)}
                </p>
                {apt.reason && (
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                    📝 {apt.reason}
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #eee',
                color: '#000000'  // Ajout de la couleur noire pour le texte
              }}>
                <span className={`status ${getStatusClass(apt.status)}`}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    backgroundColor: apt.status === 'completed' ? '#e8f5e9' :
                                   apt.status === 'cancelled' ? '#ffebee' :
                                   '#f5f5f5',
                    color: apt.status === 'completed' ? '#2e7d32' :
                           apt.status === 'cancelled' ? '#c62828' :
                           '#616161'
                  }}>
                  {getStatusText(apt.status)}
                </span>
                <button
                  onClick={() => {/* Ajouter la logique pour voir les détails */}}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
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
      padding: '20px',
      color: '#000000'
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
          zIndex: 1000,
          color: '#000000'  // Ajout de la couleur noire pour le texte
        }}>
          <div className="planning-form-container" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            color: '#000000'  // Ajout de la couleur noire pour le texte
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
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const doctorId = localStorage.getItem('userId');

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Date invalide:', dateString);
        return 'Date invalide';
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
      return 'Date invalide';
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointmentsByDate(selectedDate);
  }, [selectedDate, appointments]);

  useEffect(() => {
    if (selectedAppointment && selectedAppointment.patient?._id) {
      fetchMedicalRecords(selectedAppointment.patient._id);
    }
  }, [selectedAppointment]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des rendez-vous:', err);
      setError('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async (patientId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/patient/medical-documents/${patientId}`);
      setMedicalRecords(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du dossier médical:', error);
      setError('Erreur lors du chargement du dossier médical');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointmentsByDate = (date) => {
    if (!date || !appointments.length) return;
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
    setDayAppointments(filtered.sort((a, b) => new Date(a.date) - new Date(b.date)));
  };

  const handleAppointmentClick = (appointment) => {
    if (!appointment) return;
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setShowModal(false);
    setMedicalRecords([]);
    setError(null);
  };

  const formatTime = (date) => {
    if (!date) return '';
    try {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    } catch (error) {
      console.error('Erreur lors du formatage de l\'heure:', error);
      return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return '✅ Confirmé';
      case 'pending': return '⏳ En attente';
      case 'cancelled': return '❌ Annulé';
      case 'completed': return '✔️ Terminé';
      default: return status;
    }
  };

  const PatientDetailsModal = ({ appointment, onClose, formatDate, loading, error, medicalRecords }) => {
    if (!appointment) return null;

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Détails du Rendez-vous</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="error-message" style={{
                margin: '1rem',
                padding: '0.75rem',
                borderRadius: '4px',
                backgroundColor: '#fee',
                color: '#c00'
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div className="loading-spinner" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                color: '#000000'  // Ajout de la couleur noire pour le texte
              }}>
                <span className="spinner-icon">🔄</span>
                Chargement des informations...
              </div>
            ) : (
              <>
                <div className="modal-section">
                  <div className="section-header">
                    <div className="section-icon">👤</div>
                    <h3 className="section-title">Informations du Patient</h3>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Nom complet</div>
                      <div className="info-value">{appointment.patient?.prenom} {appointment.patient?.nom}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Téléphone</div>
                      <div className="info-value">{appointment.patient?.telephone}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{appointment.patient?.email}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Date de naissance</div>
                      <div className="info-value">
                        {appointment.patient?.dateNaissance ? 
                          formatDate(appointment.patient.dateNaissance) : 
                          'Non spécifiée'}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Adresse</div>
                      <div className="info-value">{appointment.patient?.adresse || 'Non spécifiée'}</div>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <div className="section-header">
                    <div className="section-icon">🏥</div>
                    <h3 className="section-title">Données Médicales</h3>
                  </div>
                  <div className="medical-data-grid">
                    <div className="medical-item">
                      <div className="medical-label">Âge</div>
                      <div className="medical-value">
                        <span>👤</span> {appointment.patient?.age || '27'} ans
                      </div>
                    </div>
                    <div className="medical-item">
                      <div className="medical-label">Poids</div>
                      <div className="medical-value">
                        <span>⚖️</span> {appointment.patient?.poids || '70'} kg
                      </div>
                    </div>
                    <div className="medical-item">
                      <div className="medical-label">Taille</div>
                      <div className="medical-value">
                        <span>📏</span> {appointment.patient?.taille || '199'} cm
                      </div>
                    </div>
                    <div className="medical-item">
                      <div className="medical-label">Groupe Sanguin</div>
                      <div className="medical-value">
                        <span>🩸</span> {appointment.patient?.bloodType || 'A+'}
                      </div>
                    </div>
                    <div className="medical-item">
                      <div className="medical-label">Allergies</div>
                      <div className="allergies-list">
                        {appointment.patient?.allergies?.map((allergie, index) => (
                          <span key={index} className="allergy-tag">
                            <span>⚠️</span> {allergie}
                          </span>
                        )) || (
                          <span className="allergy-tag">
                            <span>⚠️</span> pollen
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <div className="section-header">
                    <div className="section-icon">📅</div>
                    <h3 className="section-title">Détails du Rendez-vous</h3>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Date et heure</div>
                      <div className="info-value">
                        {formatDate(appointment.date)}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Statut</div>
                      <div className="info-value">
                        <span className={getStatusClass(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Motif</div>
                      <div className="info-value">
                        {appointment.reason || 'Non spécifié'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <div className="section-header">
                    <div className="section-icon">📋</div>
                    <h3 className="section-title">Dossier Médical</h3>
                  </div>
                  {loading ? (
                    <div className="loading-spinner">
                      <span className="spinner-icon">🔄</span>
                      Chargement du dossier médical...
                    </div>
                  ) : medicalRecords.length === 0 ? (
                    <div className="no-records">
                      <span className="empty-icon">📂</span>
                      <p>Aucun document médical disponible</p>
                    </div>
                  ) : (
                    <div className="medical-records-grid">
                      {medicalRecords.map((record, index) => (
                        <div key={record._id || index} className="medical-record-item">
                          <div className="record-header">
                            <span className="file-icon">📄</span>
                            <h4 className="file-name">{record.fileName}</h4>
                          </div>
                          <div className="record-content">
                            <p className="record-description">{record.description}</p>
                            <div className="record-meta">
                              <span className="record-date">
                                📅 Ajouté le {formatDate(record.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="record-actions">
                            <a
                              href={`http://localhost:5001/${record.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-document-btn"
                            >
                              <span>👁️</span>
                              Voir le document
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-view" style={{ color: '#000000' }}>
      <div className="calendar-container">
          <div className="calendar-wrapper">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="fr-FR"
              className="custom-calendar"
              navigationLabel={({ date }) => {
                return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
              }}
              formatShortWeekday={(locale, date) => {
                const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
                return days[date.getDay()];
              }}
              tileClassName={({ date }) => {
                const hasAppointment = appointments.some(apt => 
                  new Date(apt.date).toDateString() === date.toDateString()
                );
                return hasAppointment ? 'has-appointment' : '';
              }}
            />
          </div>

        <div className="day-appointments">
          <h3>
            {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h3>

            {dayAppointments.length === 0 ? (
              <div className="no-appointments">
              <p>Aucun rendez-vous prévu pour cette date</p>
              </div>
            ) : (
            <div className="appointment-list">
              {dayAppointments.map(apt => (
                <div 
                  key={apt._id} 
                  className="appointment-item"
                  onClick={() => handleAppointmentClick(apt)}
                >
                      <div className="appointment-time">
                    {formatTime(apt.date)}
                      </div>
                  <div className="appointment-patient">
                    <strong>{apt.patient?.prenom} {apt.patient?.nom}</strong>
                    <div>📞 {apt.patient?.telephone}</div>
                    <div>📧 {apt.patient?.email}</div>
                      </div>
                      {apt.reason && (
                    <div className="appointment-reason">
                      📝 {apt.reason}
                    </div>
                  )}
                  <span className={`appointment-status ${getStatusClass(apt.status)}`}>
                    {getStatusText(apt.status)}
                  </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

      {showModal && (
        <PatientDetailsModal
          appointment={selectedAppointment}
          onClose={closeModal}
          formatDate={formatDate}
          loading={loading}
          error={error}
          medicalRecords={medicalRecords}
        />
      )}
      <div className="no-appointments" key="no-chat" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#000000',  // Changement de la couleur grise en noir
        fontSize: '1.1rem'
      }}>
        <p>👈 Sélectionnez une date pour voir les rendez-vous</p>
      </div>
    </div>
  );
};

const ArticlesView = () => {
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    image: null
  });
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchArticles();
  }, []);

  // Effet pour effacer les messages de succès après 3 secondes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewArticle(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setNewArticle(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', newArticle.title);
      formData.append('content', newArticle.content);
      formData.append('category', newArticle.category);
      formData.append('authorId', doctorId);
      
      // Vérifier si les tags existent et ne sont pas vides
      if (newArticle.tags && newArticle.tags.trim() !== '') {
        const tagsArray = newArticle.tags.split(',').map(tag => tag.trim());
        formData.append('tags', JSON.stringify(tagsArray));
      }

      // Vérifier si une image a été sélectionnée
      if (newArticle.image) {
        formData.append('image', newArticle.image);
      }

      console.log('Sending article data:', {
        title: newArticle.title,
        content: newArticle.content,
        category: newArticle.category,
        authorId: doctorId,
        tags: newArticle.tags,
        hasImage: !!newArticle.image
      });

      const response = await axios.post('http://localhost:5001/api/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Article created successfully:', response.data);

      setNewArticle({
        title: '',
        content: '',
        category: '',
        tags: '',
        image: null
      });
      setShowArticleForm(false);
      fetchArticles();
      setSuccess('✅ Article publié avec succès !');
    } catch (error) {
      console.error('❌ Erreur création article:', error);
      setError(error.response?.data?.message || "Erreur lors de la création de l'article");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
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

  const toggleArticleForm = () => {
    setShowArticleForm(!showArticleForm);
  };

  return (
    <div className="articles-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>
          <span role="img" aria-label="articles">📚</span>
          Articles
        </h2>
        <button className="add-article-btn" onClick={toggleArticleForm}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un article
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span role="img" aria-label="success">✅</span>
          {success}
        </div>
      )}

      {showArticleForm && (
        <div className="article-form">
        <h3>Nouvel Article</h3>
          <form onSubmit={handleSubmit}>
        <div className="form-group">
              <label htmlFor="title">Titre</label>
          <input
            type="text"
                id="title"
                name="title"
            value={newArticle.title}
                onChange={handleInputChange}
                placeholder="Titre de l'article"
            required
          />
        </div>
        <div className="form-group">
              <label htmlFor="category">Catégorie</label>
              <input
                type="text"
                id="category"
                name="category"
                value={newArticle.category}
                onChange={handleInputChange}
                placeholder="Catégorie de l'article"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Contenu</label>
          <textarea
                id="content"
                name="content"
            value={newArticle.content}
                onChange={handleInputChange}
                placeholder="Contenu de l'article"
                rows="6"
            required
          />
        </div>
        <div className="form-group">
              <label htmlFor="image">Image</label>
          <input
                type="file"
                id="image"
                onChange={handleFileChange}
                accept="image/*"
          />
        </div>
        <div className="form-group">
              <label htmlFor="tags">Tags (séparés par des virgules)</label>
          <input
            type="text"
                id="tags"
                name="tags"
            value={newArticle.tags}
                onChange={handleInputChange}
                placeholder="santé, médecine, conseils..."
                required
          />
        </div>
            <button type="submit" className="publish-btn" disabled={loading}>
              {loading ? 'Publication...' : 'Publier l\'article'}
        </button>
      </form>
        </div>
      )}

      <div className="articles-list">
        {loading && articles.length === 0 ? (
          <div className="loading-articles">
            <span role="img" aria-label="loading">🔄</span>
            Chargement des articles...
          </div>
        ) : articles.length === 0 ? (
          <div className="no-articles">
            <span role="img" aria-label="empty" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>
              📝
            </span>
            <p>Aucun article publié pour le moment</p>
          </div>
        ) : (
          articles.map((article) => (
            <div key={article._id} className="article-card">
              {article.imageUrl && (
                <img src={article.imageUrl} alt={article.title} className="article-image" />
              )}
              <div className="article-content">
                <div className="article-category">
                  <span role="img" aria-label="category">📌</span>
                  {article.category}
                </div>
                <h3>{article.title}</h3>
                <p className="article-text">{article.content}</p>
                  <div className="article-tags">
                    {article.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                <div className="article-footer">
                  <small>{new Date(article.createdAt).toLocaleDateString()}</small>
                  <button className="delete-btn" onClick={() => handleDeleteArticle(article._id)}>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [reports, setReports] = useState([]);
  const doctorId = localStorage.getItem('userId');

  // Utiliser useCallback pour mémoriser les fonctions
  const fetchReports = useCallback(async () => {
    console.log('🔄 Début fetchReports, doctorId:', doctorId);
    
    if (!doctorId) {
      console.error("❌ ID du docteur non disponible");
      setError("ID du docteur non disponible");
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      console.log('📡 Envoi requête GET pour les rapports...');
      
      const res = await axios.get(`http://localhost:5001/api/medical-reports/doctor/${doctorId}`);
      console.log('📥 Données reçues du serveur:', res.data);
      
      if (Array.isArray(res.data)) {
        // Filtrer les rapports invalides avant de les stocker
        const validReports = res.data.filter(report => {
          const isValid = report && report._id && report.patientId && report.appointmentId;
          if (!isValid) {
            console.log('⚠️ Rapport invalide détecté:', report);
          }
          return isValid;
        });
        
        console.log('✅ Rapports valides à stocker:', validReports);
        setReports(validReports);
      } else {
        console.error("❌ Les données reçues ne sont pas un tableau:", res.data);
        setReports([]);
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement des rapports:", err);
      setError("Erreur lors du chargement des rapports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchPatients = useCallback(async () => {
    if (!doctorId) {
      console.error("ID du docteur non disponible");
      setError("ID du docteur non disponible");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5001/api/doctor/${doctorId}/patients`);
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur lors du chargement des patients:", err);
      setError("Erreur lors du chargement des patients");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Utiliser useEffect avec les dépendances appropriées
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (!doctorId) {
        console.error("ID du docteur non disponible");
        if (mounted) {
          setError("ID du docteur non disponible");
          setLoading(false);
        }
        return;
      }

      try {
        if (mounted) {
          setLoading(true);
          setError(null);
        }
        await Promise.all([fetchPatients(), fetchReports()]);
      } catch (err) {
        console.error("Erreur lors du chargement initial:", err);
        if (mounted) {
          setError("Erreur lors du chargement initial des données");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [fetchPatients, fetchReports, doctorId]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientAppointments();
    } else {
      setAppointments([]);
      setSelectedAppointment(null);
    }
  }, [selectedPatient]);

  const fetchPatientAppointments = async () => {
    if (!selectedPatient?._id) return;

    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const patientAppointments = res.data.filter(
        apt => apt.patient?._id === selectedPatient._id && apt.status === 'confirmed'
      );
      setAppointments(patientAppointments);
    } catch (err) {
      console.error("Erreur lors du chargement des rendez-vous:", err);
      setError("Erreur lors du chargement des rendez-vous");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !file || !description || !selectedPatient?._id) {
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
      // Recharger les rapports après l'ajout
      await fetchReports();
    } catch (err) {
      console.error("Erreur lors de l'envoi du rapport:", err);
      setError("Erreur lors de l'envoi du rapport médical");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!reportId || !window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5001/api/medical-reports/${reportId}`);
      setSuccess('Rapport supprimé avec succès');
      // Recharger les rapports après la suppression
      await fetchReports();
    } catch (err) {
      console.error('Erreur lors de la suppression du rapport:', err);
      setError('Erreur lors de la suppression du rapport');
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
    <div className="medical-reports-container" style={{ 
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      color: '#000000'
    }}>
      {console.log('🎯 État actuel - patients:', patients, 'selectedPatient:', selectedPatient)}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.8rem',
          color: '#00796b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span role="img" aria-label="reports">📋</span>
          Rapports Médicaux
        </h2>
      </div>

     
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <span role="img" aria-label="error">⚠️</span> {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <span role="img" aria-label="success">✅</span> {success}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Formulaire d'ajout de rapport */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '1.5rem',
            color: '#00796b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span role="img" aria-label="new-report">📝</span>
            Nouveau Rapport
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Patient
              </label>
              <select
            value={selectedPatient ? selectedPatient._id : ''}
            onChange={(e) => {
              const patient = patients.find(p => p._id === e.target.value);
              setSelectedPatient(patient || null);
              setSelectedAppointment(null);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="">Sélectionnez un patient</option>
            {patients.map(patient => (
              <option key={patient._id} value={patient._id}>
                {patient.nom} {patient.prenom}
              </option>
            ))}
          </select>
        </div>

            {selectedPatient && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Rendez-vous
                </label>
                <select 
                  value={selectedAppointment ? selectedAppointment._id : ''} 
                  onChange={(e) => {
                    const apt = appointments.find(a => a._id === e.target.value);
                    setSelectedAppointment(apt);
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    fontSize: '1rem'
                  }}
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

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Fichier (PDF ou Image)
              </label>
              <div style={{
                border: '2px dashed #e0e0e0',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer'
              }}>
              <input 
                type="file" 
                accept=".pdf,image/*" 
                onChange={(e) => setFile(e.target.files[0])}
                required 
                  style={{
                    display: 'none'
                  }}
                  id="file-input"
              />
                <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                  <span role="img" aria-label="upload">📎</span>
                  {file ? file.name : 'Cliquez ou glissez un fichier ici'}
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Ajoutez une description du rapport médical"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontSize: '1rem'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedAppointment || !file || !description}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#00796b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                opacity: (loading || !selectedAppointment || !file || !description) ? '0.7' : '1',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span role="img" aria-label="loading">🔄</span>
                  Envoi en cours...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span role="img" aria-label="send">📤</span>
                  Envoyer le rapport
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Liste des rapports */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '1.5rem',
            color: '#00796b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span role="img" aria-label="list">📋</span>
            Rapports récents
          </h3>

          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666'
            }}>
              <span role="img" aria-label="loading" style={{ fontSize: '2rem' }}>🔄</span>
              <p>Chargement des rapports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666'
            }}>
              <span role="img" aria-label="empty" style={{ fontSize: '2rem' }}>📂</span>
              <p>Aucun rapport médical</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {reports.map(report => {
                if (!report || !report._id) return null; // Skip invalid reports

                // Vérifier si patientId existe et a les propriétés nécessaires
                const patientName = report.patientId 
                  ? `${report.patientId.prenom || ''} ${report.patientId.nom || ''}`
                  : 'Patient inconnu';
                
                return (
                  <div 
                    key={report._id} 
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '1rem',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{ margin: 0, color: '#00796b' }}>
                        Patient: {patientName}
                      </h4>
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <p style={{
                      margin: '0.5rem 0',
                      color: '#333'
                    }}>
                      {report.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '1rem'
                    }}>
                      <a 
                        href={`http://localhost:5001/${report.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#00796b',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span role="img" aria-label="view">👁️</span>
                        Voir le rapport
                      </a>
                      <button 
                        onClick={() => handleDelete(report._id)}
                        disabled={loading}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ffebee',
                          color: '#c62828',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span role="img" aria-label="delete">🗑️</span>
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileView = () => {
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    if (doctorId) {
      fetchDoctorInfo();
    }
  }, []);

  const fetchDoctorInfo = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${doctorId}`);
      setDoctorInfo(response.data);
      setEditedInfo(response.data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info médecin:', error);
      setError('Impossible de charger les informations du médecin');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      // Créer une URL temporaire pour l'aperçu
      const previewUrl = URL.createObjectURL(file);
      setEditedInfo(prev => ({
        ...prev,
        tempPhotoUrl: previewUrl // Utiliser une URL temporaire pour l'aperçu
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Si un nouvel avatar a été sélectionné, l'uploader d'abord
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        
        try {
          const uploadResponse = await axios.post(
            `http://localhost:5001/api/users/${doctorId}/avatar`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          
          // Mettre à jour le champ photo avec le chemin retourné par le serveur
          editedInfo.photo = uploadResponse.data.photo;
        } catch (uploadError) {
          console.error('Erreur upload avatar:', uploadError);
          setError('Erreur lors de l\'upload de l\'avatar');
          setLoading(false);
          return;
        }
      }

      // Supprimer l'URL temporaire avant d'envoyer les données
      const dataToSend = { ...editedInfo };
      delete dataToSend.tempPhotoUrl;

      const response = await axios.put(`http://localhost:5001/api/users/${doctorId}`, dataToSend);
      setDoctorInfo(response.data);
      setIsEditing(false);
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchDoctorInfo} className="retry-btn">
          🔄 Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="doctor-profile" style={{ color: '#000000' }}>
      {success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {success}
          </div>
      )}

      <div className="profile-header">
        <div className="profile-title">
          <h1>
            <span className="profile-icon">👨‍⚕️</span>
            Mon Profil
          </h1>
          {!isEditing && (
            <button 
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Modifier le profil
            </button>
          )}
        </div>
        <div className="profile-avatar">
          {isEditing ? (
            <div className="avatar-upload">
              <img 
                src={editedInfo.tempPhotoUrl || (editedInfo.photo ? `http://localhost:5001${editedInfo.photo}` : '../assets/images/default-avatar.png')}
                alt="Avatar"
                className="avatar-preview"
                onError={(e) => { e.target.src = '../assets/images/default-avatar.png'; console.error('Failed to load avatar:', e.target.src); }}
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              <label className="avatar-upload-btn">
                📸 Changer la photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          ) : (
            <img 
              src={doctorInfo.photo ? `http://localhost:5001${doctorInfo.photo}` : '../assets/images/default-avatar.png'}
              alt="Avatar"
              className="avatar-image"
              onError={(e) => { e.target.src = '../assets/images/default-avatar.png'; console.error('Failed to load avatar:', e.target.src); }}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="profile-info" style={{ color: '#000000' }}>
          <div className="info-card">
            <div className="info-section personal-info" style={{ color: '#000000' }}>
              <div className="section-header">
                <span className="section-icon">👤</span>
                <h2>Informations personnelles</h2>
              </div>
              <div className="info-content">
                <div className="info-row">
                  <div className="info-label">Nom</div>
                  <div className="info-value">{doctorInfo.nom}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Prénom</div>
                  <div className="info-value">{doctorInfo.prenom}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Email</div>
                  <div className="info-value">{doctorInfo.email}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Téléphone</div>
                  <div className="info-value">{doctorInfo.telephone}</div>
                </div>
              </div>
            </div>

            <div className="info-section professional-info">
              <div className="section-header">
                <span className="section-icon">🏥</span>
                <h2>Informations professionnelles</h2>
              </div>
              <div className="info-content">
                <div className="info-row">
                  <div className="info-label">Spécialité</div>
                  <div className="info-value">{doctorInfo.specialty}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Région</div>
                  <div className="info-value">{doctorInfo.region}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Adresse du cabinet</div>
                  <div className="info-value">{doctorInfo.adresse}</div>
                </div>
              </div>
            </div>
          </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-card">
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">👤</span>
                <h2>Informations personnelles</h2>
                </div>
              <div className="form-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom</label>
                    <input
                      type="text"
                      name="nom"
                      value={editedInfo.nom || ''}
                      onChange={handleInputChange}
                      required
                    />
                </div>
                  <div className="form-group">
                    <label>Prénom</label>
                    <input
                      type="text"
                      name="prenom"
                      value={editedInfo.prenom || ''}
                      onChange={handleInputChange}
                      required
                    />
                </div>
              </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editedInfo.email || ''}
                      onChange={handleInputChange}
                      required
                    />
          </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={editedInfo.telephone || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">🏥</span>
                <h2>Informations professionnelles</h2>
              </div>
              <div className="form-content">
                <div className="form-row">
                  <div className="form-group">
                    <label>Spécialité</label>
                    <input
                      type="text"
                      name="specialty"
                      value={editedInfo.specialty || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Région</label>
                    <select
                      name="region"
                      value={editedInfo.region || ''}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionnez une région</option>
                      <option value="Tunis">Tunis</option>
                      <option value="Ariana">Ariana</option>
                      <option value="Ben Arous">Ben Arous</option>
                      <option value="Manouba">Manouba</option>
                      <option value="Nabeul">Nabeul</option>
                      <option value="Zaghouan">Zaghouan</option>
                      <option value="Bizerte">Bizerte</option>
                      <option value="Béja">Béja</option>
                      <option value="Jendouba">Jendouba</option>
                      <option value="Le Kef">Le Kef</option>
                      <option value="Siliana">Siliana</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Monastir">Monastir</option>
                      <option value="Mahdia">Mahdia</option>
                      <option value="Sfax">Sfax</option>
                      <option value="Kairouan">Kairouan</option>
                      <option value="Kasserine">Kasserine</option>
                      <option value="Sidi Bouzid">Sidi Bouzid</option>
                      <option value="Gabès">Gabès</option>
                      <option value="Médenine">Médenine</option>
                      <option value="Tataouine">Tataouine</option>
                      <option value="Gafsa">Gafsa</option>
                      <option value="Tozeur">Tozeur</option>
                      <option value="Kébili">Kébili</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Adresse du cabinet</label>
                    <input
                      type="text"
                      name="adresse"
                      value={editedInfo.adresse || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Enregistrement...
                  </>
                ) : (
                  <>💾 Enregistrer</>
                )}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  setEditedInfo(doctorInfo);
                }}
              >
                ❌ Annuler
              </button>
      </div>
          </div>
        </form>
      )}
    </div>
  );
};

const DoctorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Espace Docteur</h2>
        <nav>
          <ul>
            <li>
              <Link to="">👤 Mon Profil</Link>
            </li>
            <li>
              <Link to="calendar">📅 Calendrier</Link>
            </li>
            <li>
              <Link to="upcoming-appointments">📅 Rendez-vous à venir</Link>
            </li>
            {/* <li>
              <Link to="pending-appointments">⏳ Demandes en attente</Link>
            </li> */}
            <li>
              <Link to="past-appointments">📚 Historique</Link>
            </li>
            <li>
              <Link to="messages">💬 Messagerie</Link>
            </li>
            <li>
              <Link to="medical-reports">📋 Rapports Médicaux</Link>
            </li>
            <li>
              <Link to="articles">📚 Articles</Link>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fff0f0',
                  color: '#1a1a1a',
                  border: '1px solid #ffcdd2',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: 'auto'
                }}
              >
                <span>🚪</span>
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProfileView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="pending-appointments" element={<PendingAppointmentsView />} />
          <Route path="upcoming-appointments" element={<UpcomingAppointmentsView />} />
          <Route path="past-appointments" element={<PastAppointmentsView />} />
          <Route path="messages" element={<UnifiedMessagesView />} />
          <Route path="medical-reports" element={<MedicalReportsView />} />
          <Route path="articles" element={<ArticlesView />} />
        </Routes>
      </main>
    </div>
  );
};

export default DoctorDashboard;
