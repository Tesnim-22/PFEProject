import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import '../styles/DoctorDashboard.css';
import { FaUserMd, FaCalendarAlt, FaHistory, FaComments, FaFileMedical, FaBook, FaSignOutAlt, FaUserCircle, FaBell } from 'react-icons/fa';

const UnifiedMessagesView = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('patients'); // 'all', 'patients', 'labs'
  const [searchTerm, setSearchTerm] = useState(''); // Ajout pour la recherche
  const [unreadCounts, setUnreadCounts] = useState({}); // Compteur de messages non lus
  const messagesEndRef = useRef(null);
  const doctorId = localStorage.getItem('userId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchAllConversations();
    fetchUnreadCounts();
    
    // Actualiser les compteurs de messages non lus toutes les 10 secondes
    const interval = setInterval(() => {
      fetchUnreadCounts();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      // Récupérer le nombre de messages non lus pour chaque conversation
      const response = await axios.get(`http://localhost:5001/api/messages/unread-counts/${doctorId}`);
      setUnreadCounts(response.data);
    } catch (error) {
      console.error('Erreur récupération compteurs non lus:', error);
    }
  };

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

      // Marquer les messages comme lus
      const unreadMessages = allMessages
        .filter(msg => msg.receiverId === doctorId && !msg.isRead)
        .map(msg => msg._id);
      
      if (unreadMessages.length > 0) {
        await axios.put('http://localhost:5001/api/messages/read', {
          messageIds: unreadMessages
        });
        
        // Mettre à jour le compteur de messages non lus
        setUnreadCounts(prev => ({
          ...prev,
          [patientId]: 0
        }));
      }
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

      // Marquer les messages comme lus pour les laboratoires
      await axios.put(`http://localhost:5001/api/lab-doctor-messages/read`, {
        receiverId: doctorId,
        senderId: labId
      });

      // Mettre à jour le compteur de messages non lus
      setUnreadCounts(prev => ({
        ...prev,
        [labId]: 0
      }));
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

      // Mettre à jour le compteur si c'est un message reçu
      if (newMessageData.senderId !== doctorId) {
        setUnreadCounts(prev => ({
          ...prev,
          [selectedConversation.id]: (prev[selectedConversation.id] || 0) + 1
        }));
      }
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
    if (activeTab === 'patients') return conv.type === 'Patient';
    if (activeTab === 'labs') return conv.type === 'Labs';
    return true;
  }).filter(conv => {
    // Filtrage par recherche
    const name = `${conv.contact?.prenom || ''} ${conv.contact?.nom || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="messagerie-container" style={{
      height: 'calc(100vh - 40px)',
      display: 'flex',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: '20px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      <div className="contacts-list" style={{
        width: '320px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1e293b',
            letterSpacing: '-0.025em'
          }}>
            Messagerie
          </h3>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher une conversation..."
            style={{
              width: '100%',
              marginBottom: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.95rem',
              outline: 'none',
              background: '#f8fafc',
              color: '#374151',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0f766e';
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.backgroundColor = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px'
          }}>
            <button
              onClick={() => setActiveTab('patients')}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'patients' ? '#0f766e' : 'transparent',
                color: activeTab === 'patients' ? 'white' : '#64748b',
                fontWeight: activeTab === 'patients' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Patients
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'labs' ? '#0f766e' : 'transparent',
                color: activeTab === 'labs' ? 'white' : '#64748b',
                fontWeight: activeTab === 'labs' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Laboratoires
            </button>
          </div>
        </div>
        <div className="contacts-group" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {loading && filteredConversations.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.95rem'
            }}>
              Chargement des conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.95rem'
            }}>
              Aucune conversation trouvée
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={`${conv.type}-${conv.id}`}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  padding: '16px',
                  margin: '4px 0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: selectedConversation?.id === conv.id ? '#f0f4ff' : 'transparent',
                  border: selectedConversation?.id === conv.id ? '1px solid #c7d2fe' : '1px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation?.id !== conv.id) {
                    e.target.style.backgroundColor = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?.id !== conv.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: conv.type === 'Patient' ? '#dcfce7' : '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: conv.type === 'Patient' ? '#059669' : '#059669'
                  }}>
                    {conv.type === 'Patient' ? 'P' : 'L'}
                  </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      color: '#1e293b',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {`${conv.contact?.prenom || ''} ${conv.contact?.nom || ''}`}
                      {unreadCounts[conv.id] > 0 && (
                        <span style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          minWidth: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1'
                        }}>
                          {unreadCounts[conv.id]}
                        </span>
                      )}
                  </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: conv.type === 'Patient' ? '#10b981' : '#10b981'
                      }}></span>
                      {conv.type === 'Patient' ? 'Patient' : 'Laboratoire'}
                      {unreadCounts[conv.id] > 0 && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          marginLeft: 'auto',
                          animation: 'pulse 2s infinite'
                        }}></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="chat-container" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff'
      }}>
        {selectedConversation ? (
          <>
            <div className="chat-header" style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: selectedConversation.type === 'Patient' ? '#dcfce7' : '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: '600',
                  color: selectedConversation.type === 'Patient' ? '#059669' : '#059669'
                }}>
                  {selectedConversation.type === 'Patient' ? 'P' : 'L'}
                </div>
                <div>
                  <h3 style={{ 
                    margin: '0',
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    letterSpacing: '-0.025em'
                  }}>
                    {`${selectedConversation.contact?.prenom || ''} ${selectedConversation.contact?.nom || ''}`}
                  </h3>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    color: '#64748b',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981'
                    }}></span>
                    {selectedConversation.type === 'Patient'
                      ? selectedConversation.contact?.telephone
                      : selectedConversation.contact?.adresse}
                  </p>
                </div>
              </div>
            </div>
            <div className="chat-messages" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {loading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                  color: '#64748b',
                  fontSize: '0.95rem'
                }}>
                  Chargement des messages...
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                  color: '#64748b',
                  fontSize: '0.95rem',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginBottom: '8px'
                  }}>
                    💬
                  </div>
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
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        backgroundColor: msg.senderId === doctorId ? '#0f766e' : '#ffffff',
                        color: msg.senderId === doctorId ? '#ffffff' : '#1e293b',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        <div style={{
                          fontSize: '0.95rem',
                          lineHeight: '1.5',
                          marginBottom: '4px'
                        }}>
                          {msg.content}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          opacity: 0.7,
                          textAlign: msg.senderId === doctorId ? 'right' : 'left'
                        }}>
                          {formatDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage} style={{
              padding: '20px 24px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tapez votre message..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.95rem',
                  backgroundColor: '#f8fafc',
                  color: '#374151',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0f766e';
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: loading || !newMessage.trim() ? '#e2e8f0' : '#0f766e',
                  color: loading || !newMessage.trim() ? '#9ca3af' : '#ffffff',
                  cursor: loading || !newMessage.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!loading && newMessage.trim()) {
                    e.target.style.backgroundColor = '#0d5c5c';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && newMessage.trim()) {
                    e.target.style.backgroundColor = '#0f766e';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Envoi...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Envoyer
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#64748b',
            fontSize: '1rem',
            gap: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '8px'
            }}>
              💬
            </div>
            <div style={{
              textAlign: 'center',
              maxWidth: '300px'
            }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Sélectionnez une conversation
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.95rem'
              }}>
                Choisissez un patient ou un laboratoire dans la liste pour commencer à échanger des messages
              </p>
            </div>
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
                        backgroundColor: isMessageFromDoctor(msg) ? '#0f766e' : '#fff',
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
                  backgroundColor: '#0f766e',
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
        <h3>🔬 Labo</h3>
        {loading && laboratories.length === 0 ? (
          <div className="loading">Chargement des labo...</div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const appointmentsPerPage = 10;
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      const sortedAppointments = [...appointments].sort((a, b) => 
        sortOrder === 'desc' 
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date)
      );
      setAppointments(sortedAppointments);
    }
  }, [sortOrder]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pastAppointments = res.data
        .filter(apt => 
          new Date(apt.date) < new Date() ||
          apt.status === 'cancelled' ||
          apt.status === 'completed'
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
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      default: return 'Passé';
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

  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * appointmentsPerPage,
    currentPage * appointmentsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header simple */}
      <div style={{
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '28px',
          color: '#333',
          margin: '0 0 10px 0',
          fontWeight: '600'
        }}>
          Historique des rendez-vous
        </h1>
        <p style={{
          color: '#666',
          margin: 0,
          fontSize: '16px'
        }}>
          {filteredAppointments.length} rendez-vous
        </p>
      </div>

      {/* Barre de recherche et filtres simples */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">Tous</option>
            <option value="completed">Terminés</option>
            <option value="cancelled">Annulés</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="desc">Plus récent</option>
            <option value="asc">Plus ancien</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          backgroundColor: 'white',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            color: '#666'
          }}>
            Chargement...
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          backgroundColor: 'white',
          borderRadius: '8px',
          color: '#666'
        }}>
          {searchTerm ? 'Aucun résultat trouvé' : 'Aucun rendez-vous passé'}
        </div>
      ) : (
        <>
          {/* Liste simple des rendez-vous */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {paginatedAppointments.map((apt, index) => (
              <div
                key={apt._id}
                onClick={() => setSelectedAppointment(selectedAppointment?._id === apt._id ? null : apt)}
                style={{
                  padding: '20px',
                  borderBottom: index < paginatedAppointments.length - 1 ? '1px solid #eee' : 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedAppointment?._id === apt._id ? '#f0f8ff' : 'white',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedAppointment?._id !== apt._id) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAppointment?._id !== apt._id) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: selectedAppointment?._id === apt._id ? '15px' : '0'
                }}>
                  <div>
                    <h3 style={{
                      margin: '0 0 5px 0',
                      fontSize: '18px',
                      color: '#333',
                      fontWeight: '500'
                    }}>
                      {apt.patient?.prenom} {apt.patient?.nom}
                    </h3>
                    <p style={{
                      margin: 0,
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      {formatDate(apt.date)}
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: apt.status === 'completed' ? '#d4edda' :
                                     apt.status === 'cancelled' ? '#f8d7da' : '#e2e3e5',
                      color: apt.status === 'completed' ? '#155724' :
                             apt.status === 'cancelled' ? '#721c24' : '#6c757d'
                    }}>
                      {getStatusText(apt.status)}
                    </span>
                    
                    {selectedAppointment?._id !== apt._id && (
                      <span style={{
                        fontSize: '12px',
                        color: '#007bff',
                        fontWeight: '500'
                      }}>
                        Voir détails
                      </span>
                    )}
                  </div>
                </div>

                {/* Détails expandables */}
                {selectedAppointment?._id === apt._id && (
                  <div style={{
                    paddingTop: '15px',
                    borderTop: '1px solid #eee'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px',
                      marginBottom: '15px'
                    }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#333' }}>Email:</strong>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                          {apt.patient?.email}
                        </p>
                      </div>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#333' }}>Téléphone:</strong>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                          {apt.patient?.telephone}
                        </p>
                      </div>
                    </div>
                    
                    {apt.reason && (
                      <div>
                        <strong style={{ fontSize: '14px', color: '#333' }}>Motif:</strong>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                          {apt.reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination simple */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              marginTop: '30px'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage === 1 ? '#f8f9fa' : 'white',
                  color: currentPage === 1 ? '#6c757d' : '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Précédent
              </button>
              
              <span style={{
                padding: '8px 16px',
                fontSize: '14px',
                color: '#666'
              }}>
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: currentPage === totalPages ? '#f8f9fa' : 'white',
                  color: currentPage === totalPages ? '#6c757d' : '#333',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
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
                border: selectedPatient === apt.patient._id ? '2px solid #0f766e' : '1px solid #e0e0e0'
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
                  backgroundColor: '#0f766e',
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
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 2;
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
    setCurrentPage(1); // Reset pagination when date changes
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

  // Pagination logic
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = dayAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(dayAppointments.length / appointmentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
            <>
            <div className="appointment-list">
                {currentAppointments.map(apt => (
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
                
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    padding: '1rem'
                  }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                        color: currentPage === 1 ? '#999' : '#333',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      ← Précédent
                    </button>
                    
                    <span style={{
                      padding: '0.5rem 1rem',
                      color: '#666',
                      fontSize: '0.9rem'
                    }}>
                      Page {currentPage} sur {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        background: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                        color: currentPage === totalPages ? '#999' : '#333',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Suivant →
                    </button>
              </div>
                )}
              </>
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

    </div>
  );
};

const ArticlesView = () => {
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedArticles, setExpandedArticles] = useState(new Set());
  const articlesPerPage = 6;
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    image: null
  });
  const [availableCategories, setAvailableCategories] = useState([
    'Cardiologie',
    'Dermatologie', 
    'Neurologie',
    'Pédiatrie',
    'Gynécologie',
    'Orthopédie',
    'Psychiatrie',
    'Ophtalmologie',
    'ORL',
    'Médecine générale',
    'Endocrinologie',
    'Gastroentérologie',
    'Pneumologie',
    'Urologie',
    'Rhumatologie',
    'Oncologie',
    'Anesthésie',
    'Radiologie',
    'Médecine d\'urgence',
    'Nutrition'
  ]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
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

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomCategory(true);
      setNewArticle(prev => ({ ...prev, category: '' }));
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
      setNewArticle(prev => ({ ...prev, category: value }));
    }
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
    setNewArticle(prev => ({ ...prev, category: value }));
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !availableCategories.includes(customCategory.trim())) {
      setAvailableCategories(prev => [...prev, customCategory.trim()]);
      setShowCustomCategory(false);
      setCustomCategory('');
    }
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
      setShowCustomCategory(false);
      setCustomCategory('');
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
    if (showArticleForm) {
      // Réinitialiser les états quand on ferme le formulaire
      setShowCustomCategory(false);
      setCustomCategory('');
      setNewArticle({
        title: '',
        content: '',
        category: '',
        tags: '',
        image: null
      });
    }
  };

  const toggleArticleExpansion = (articleId) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Pagination logic
  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = articles.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="articles-container" style={{ 
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      color: '#000000'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.8rem',
          color: '#00796b'
        }}>
          Articles
        </h2>
        <button 
          onClick={toggleArticleForm}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#00796b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
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
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      {showArticleForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '1.5rem',
            color: '#00796b'
          }}>
            Nouvel Article
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Titre
              </label>
          <input
            type="text"
                name="title"
            value={newArticle.title}
                onChange={handleInputChange}
                placeholder="Titre de l'article"
            required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem'
                }}
          />
        </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Catégorie
              </label>
              <select
                value={showCustomCategory ? 'custom' : newArticle.category}
                onChange={handleCategoryChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">Sélectionnez une catégorie</option>
                {availableCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
                <option value="custom">➕ Ajouter une nouvelle catégorie</option>
              </select>
              
              {showCustomCategory && (
                <div style={{ 
                  marginTop: '0.75rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
              <input
                type="text"
                    value={customCategory}
                    onChange={handleCustomCategoryChange}
                    placeholder="Nouvelle catégorie"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      fontSize: '1rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    disabled={!customCategory.trim()}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#00796b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      opacity: !customCategory.trim() ? '0.5' : '1',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory('');
                      setNewArticle(prev => ({ ...prev, category: '' }));
                    }}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ✕
                  </button>
            </div>
              )}
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Contenu
              </label>
          <textarea
                name="content"
            value={newArticle.content}
                onChange={handleInputChange}
                placeholder="Contenu de l'article"
                rows="6"
            required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
          />
        </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Image
              </label>
          <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem'
                }}
          />
        </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Tags (séparés par des virgules)
              </label>
          <input
            type="text"
                name="tags"
            value={newArticle.tags}
                onChange={handleInputChange}
                placeholder="santé, médecine, conseils..."
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem'
                }}
          />
        </div>
            <button 
              type="submit" 
              disabled={loading}
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
                opacity: loading ? '0.7' : '1',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Publication...' : 'Publier l\'article'}
        </button>
      </form>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        {loading && articles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666'
          }}>
            <p>Chargement des articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666'
          }}>
            <p>Aucun article publié pour le moment</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {currentArticles.map((article) => (
                <div 
                  key={article._id} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    border: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  {article.imageUrl && (
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(0, 121, 107, 0.9)',
                        color: 'white',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backdropFilter: 'blur(4px)'
                      }}>
                        {article.category}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ padding: '1.5rem' }}>
                    {!article.imageUrl && (
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: '#e8f5e8',
                        color: '#00796b',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                      }}>
                        {article.category}
                      </div>
                    )}
                    
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#2c3e50',
                      marginBottom: '0.8rem',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {article.title}
                    </h3>
                    
                    <p style={{
                      color: '#64748b',
                      lineHeight: '1.6',
                      marginBottom: '1rem',
                      fontSize: '0.95rem'
                    }}>
                      {expandedArticles.has(article._id) 
                        ? article.content 
                        : truncateContent(article.content, 120)
                      }
                    </p>

                    {article.tags && article.tags.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                      }}>
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index} 
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span style={{
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            padding: '0.3rem 0'
                          }}>
                            +{article.tags.length - 3} autres
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#10b981',
                          borderRadius: '50%'
                        }}></div>
                        <small style={{ 
                          color: '#64748b', 
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {new Date(article.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </small>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {article.content.length > 120 && (
                          <button
                            onClick={() => toggleArticleExpansion(article._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#00796b',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0fdfa'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {expandedArticles.has(article._id) ? '↑ Réduire' : '↓ Lire plus'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteArticle(article._id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#fee2e2';
                            e.target.style.borderColor = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#fef2f2';
                            e.target.style.borderColor = '#fecaca';
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {articles.length > articlesPerPage && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '2rem',
                padding: '1.5rem'
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: currentPage === 1 ? '#f8fafc' : '#00796b',
                    color: currentPage === 1 ? '#94a3b8' : 'white',
                    border: currentPage === 1 ? '1px solid #e2e8f0' : 'none',
                    borderRadius: '8px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  ← Précédent
                </button>

                <div style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: '1px solid #e2e8f0'
                }}>
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: currentPage === totalPages ? '#f8fafc' : '#00796b',
                    color: currentPage === totalPages ? '#94a3b8' : 'white',
                    border: currentPage === totalPages ? '1px solid #e2e8f0' : 'none',
                    borderRadius: '8px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
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
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 2;
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

  // Pagination logic
  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
          color: '#00796b'
        }}>
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
          {error}
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
          {success}
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
            color: '#00796b'
          }}>
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
              {loading ? 'Envoi en cours...' : 'Envoyer le rapport'}
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
            color: '#00796b'
          }}>
            Rapports récents
          </h3>

          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666'
            }}>
              <p>Chargement des rapports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666'
            }}>
              <p>Aucun rapport médical</p>
            </div>
          ) : (
            <>
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
                {currentReports.map(report => {
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
                          fontSize: '0.9rem'
                        }}
                      >
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
                          fontSize: '0.9rem'
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Pagination */}
              {reports.length > reportsPerPage && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1.5rem',
                  padding: '1rem'
                }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: currentPage === 1 ? '#f5f5f5' : '#00796b',
                      color: currentPage === 1 ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Précédent
                  </button>

                  <span style={{
                    padding: '0.5rem 1rem',
                    color: '#666',
                    fontSize: '0.9rem'
                  }}>
                    Page {currentPage} sur {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#00796b',
                      color: currentPage === totalPages ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Suivant
                  </button>
            </div>
              )}
            </>
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
      const previewUrl = URL.createObjectURL(file);
      setEditedInfo(prev => ({
        ...prev,
        tempPhotoUrl: previewUrl
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
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
          
          editedInfo.photo = uploadResponse.data.photo;
        } catch (uploadError) {
          console.error('Erreur upload avatar:', uploadError);
          setError('Erreur lors de l\'upload de l\'avatar');
          setLoading(false);
          return;
        }
      }

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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '1rem',
        color: '#64748b'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #0f766e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '1rem',
        color: '#ef4444'
      }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <p>{error}</p>
        <button 
          onClick={fetchDoctorInfo}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#0f766e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#ffffff',
      minHeight: '100vh'
    }}>
      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#dcfce7',
          color: '#166534',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #bbf7d0'
        }}>
          ✅ {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #fecaca'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Header avec avatar et titre */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <div style={{ position: 'relative' }}>
          <img 
            src={
              isEditing && editedInfo?.tempPhotoUrl 
                ? editedInfo.tempPhotoUrl 
                : doctorInfo?.photo 
                  ? `http://localhost:5001${doctorInfo.photo}` 
                  : '../assets/images/default-avatar.png'
            }
            alt="Avatar"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid #e2e8f0'
            }}
            onError={(e) => { 
              e.target.src = '../assets/images/default-avatar.png'; 
            }}
          />
          {isEditing && (
            <label style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              backgroundColor: '#0f766e',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              ✏️
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0'
          }}>
            Mon Profil
          </h1>
        </div>
      </div>

      {isEditing ? (
        /* Mode édition */
        <form onSubmit={handleSubmit}>
          {/* Informations personnelles */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1.5rem',
              margin: '0 0 1.5rem 0'
            }}>
              Informations personnelles
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  value={editedInfo?.nom || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Prénom
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={editedInfo?.prenom || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editedInfo?.email || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={editedInfo?.telephone || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1.5rem',
              margin: '0 0 1.5rem 0'
            }}>
              Informations professionnelles
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Spécialité
                </label>
                <input
                  type="text"
                  name="specialty"
                  value={editedInfo?.specialty || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Région
                </label>
                <select
                  name="region"
                  value={editedInfo?.region || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
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
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Adresse du cabinet
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={editedInfo?.adresse || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button 
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditedInfo(doctorInfo);
              }}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: loading ? '#9ca3af' : '#0f766e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        /* Mode affichage */
        <div>
          {/* Informations personnelles */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1.5rem',
              margin: '0 0 1.5rem 0'
            }}>
              Informations personnelles
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  Nom
                </label>
                <p style={{
                  margin: '0',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {doctorInfo?.nom}
                </p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  Prénom
                </label>
                <p style={{
                  margin: '0',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {doctorInfo?.prenom}
                </p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  Email
                </label>
                <p style={{
                  margin: '0',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {doctorInfo?.email}
                </p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  Téléphone
                </label>
                <p style={{
                  margin: '0',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {doctorInfo?.telephone}
                </p>
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '1.5rem',
              margin: '0 0 1.5rem 0'
            }}>
              Informations professionnelles
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  Spécialité
                </label>
                <p style={{
                  margin: '0',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {doctorInfo?.specialty}
                </p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  Région
                </label>
                <p style={{
                  margin: '0',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {doctorInfo?.region}
                </p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  Adresse du cabinet
                </label>
                <p style={{
                  margin: '0',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {doctorInfo?.adresse}
                </p>
              </div>
            </div>
          </div>

          {/* Bouton modifier */}
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button 
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#0f766e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Modifier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5001/api/notifications/${doctorId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId, isAdminNotification = false) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${notificationId}/read`, {
        userId: doctorId,
        isAdminNotification: isAdminNotification
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Erreur marquage notification comme lue:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Aujourd'hui";
    } else if (diffDays === 2) {
      return "Hier";
    } else if (diffDays <= 7) {
      return `Il y a ${diffDays - 1} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'notification-priority-high';
      case 'medium':
        return 'notification-priority-medium';
      case 'low':
        return 'notification-priority-low';
      default:
        return 'notification-priority-normal';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info':
        return '📢';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  };

  // Pagination
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>
          <FaBell className="notifications-icon" />
          Notifications
        </h2>
        <div className="notifications-stats">
          <span className="total-notifications">
            {notifications.length} notification{notifications.length > 1 ? 's' : ''}
          </span>
          <span className="unread-notifications">
            {notifications.filter(n => !n.read).length} non lue{notifications.filter(n => !n.read).length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchNotifications} className="retry-btn">
            Réessayer
          </button>
        </div>
      )}

      {notifications.length === 0 && !loading && !error ? (
        <div className="no-notifications">
          <FaBell className="no-notifications-icon" />
          <h3>Aucune notification</h3>
          <p>Vous n'avez reçu aucune notification pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="notifications-list">
            {currentNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.read ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                onClick={() => !notification.read && markAsRead(notification._id, notification.isAdminNotification)}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <div className="notification-type">
                      <span className="type-icon">{getTypeIcon(notification.type)}</span>
                      <span className="notification-title">{notification.title}</span>
                    </div>
                    <div className="notification-meta">
                      <span className="notification-date">{formatDate(notification.createdAt || notification.date)}</span>
                      {!notification.read && <span className="unread-indicator">•</span>}
                    </div>
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  {notification.priority && notification.priority !== 'normal' && (
                    <div className="notification-priority">
                      Priorité: {notification.priority === 'high' ? 'Haute' : notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '1rem'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: currentPage === 1 ? '#f5f5f5' : '#ffffff',
                  color: currentPage === 1 ? '#999' : '#333',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ← Précédent
              </button>
              
              <span style={{
                padding: '0.5rem 1rem',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  background: currentPage === totalPages ? '#f5f5f5' : '#ffffff',
                  color: currentPage === totalPages ? '#999' : '#333',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [activeRoute, setActiveRoute] = useState('');
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const doctorId = localStorage.getItem('userId');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleNavigation = (route) => {
    setActiveRoute(route);
    navigate(route);
  };

  // Fonction pour récupérer le total des messages non lus
  const fetchTotalUnreadMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/messages/total-unread/${doctorId}`);
      setTotalUnreadMessages(response.data.total || 0);
    } catch (error) {
      console.error('Erreur récupération total messages non lus:', error);
    }
  };

  // Récupérer le total des messages non lus au chargement
  React.useEffect(() => {
    if (doctorId) {
      fetchTotalUnreadMessages();
      // Actualiser toutes les 10 secondes pour détecter rapidement les nouveaux messages
      const interval = setInterval(fetchTotalUnreadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [doctorId]);

  return (
    <div className="dashboard-container">
      <aside className="medical-sidebar">
        <div className="sidebar-header">
          <div className="medical-logo">
            <div className="logo-text">
              <h2>PatientPath</h2>
              <span>Espace Médecin</span>
          </div>
          </div>
        </div>

        <nav className="sidebar-navigation">
          <div className="nav-section">
            <span className="nav-section-title">TABLEAU DE BORD</span>
            <button 
              className={`nav-item ${activeRoute === '' ? 'active' : ''}`}
              onClick={() => handleNavigation('')}
            >
              <FaUserMd className="nav-icon" />
              <span className="nav-text">Mon Profil</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">RENDEZ-VOUS</span>
            <button 
              className={`nav-item ${activeRoute === 'calendar' ? 'active' : ''}`}
              onClick={() => handleNavigation('calendar')}
            >
              <FaCalendarAlt className="nav-icon" />
              <span className="nav-text">Calendrier</span>
            </button>
            <button 
              className={`nav-item ${activeRoute === 'past-appointments' ? 'active' : ''}`}
              onClick={() => handleNavigation('past-appointments')}
            >
              <FaHistory className="nav-icon" />
              <span className="nav-text">Historique</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">COMMUNICATION</span>
            <button 
              className={`nav-item ${activeRoute === 'messages' ? 'active' : ''}`}
              onClick={() => handleNavigation('messages')}
              style={{ position: 'relative' }}
            >
              <FaComments className="nav-icon" />
              <span className="nav-text">Messagerie</span>
              {totalUnreadMessages > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1',
                  animation: 'pulse 2s infinite'
                }}>
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </button>
            <button 
              className={`nav-item ${activeRoute === 'notifications' ? 'active' : ''}`}
              onClick={() => handleNavigation('notifications')}
            >
              <FaBell className="nav-icon" />
              <span className="nav-text">Notifications</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">DOCUMENTS</span>
            <button 
              className={`nav-item ${activeRoute === 'medical-reports' ? 'active' : ''}`}
              onClick={() => handleNavigation('medical-reports')}
            >
              <FaFileMedical className="nav-icon" />
              <span className="nav-text">Rapports Médicaux</span>
            </button>
            <button 
              className={`nav-item ${activeRoute === 'articles' ? 'active' : ''}`}
              onClick={() => handleNavigation('articles')}
            >
              <FaBook className="nav-icon" />
              <span className="nav-text">Articles</span>
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
      
      <main className="main-content" style={{ height: '100vh', overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<ProfileView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="pending-appointments" element={<PendingAppointmentsView />} />
          <Route path="upcoming-appointments" element={<UpcomingAppointmentsView />} />
          <Route path="past-appointments" element={<PastAppointmentsView />} />
          <Route path="messages" element={<UnifiedMessagesView />} />
          <Route path="notifications" element={<NotificationsView />} />
          <Route path="medical-reports" element={<MedicalReportsView />} />
          <Route path="articles" element={<ArticlesView />} />
        </Routes>
      </main>
    </div>
  );
};

export default DoctorDashboard;
