import React, { useEffect, useState, useRef } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const MessagesView = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
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
      setError(null);
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      console.log('Rendez-vous reçus:', res.data);
      setAppointments(res.data);
    } catch (err) {
      console.error('Erreur lors du chargement des rendez-vous:', err);
      setError('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (appointmentId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Chargement des messages pour le rendez-vous:', appointmentId);
      
      const res = await axios.get(`http://localhost:5001/api/messages/${appointmentId}`);
      console.log('Messages reçus:', res.data);
      
      let messagesToDisplay = [];
      if (res.data && Array.isArray(res.data.messages)) {
        messagesToDisplay = res.data.messages;
      } else if (res.data && Array.isArray(res.data)) {
        messagesToDisplay = res.data;
      }

      messagesToDisplay.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateA - dateB;
      });

      console.log('Messages à afficher:', messagesToDisplay);
      setMessages(messagesToDisplay);
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
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
    <div className="messages-container">
      <div className="appointments-list">
        <h3>Mes Rendez-vous</h3>
        {error && <div className="error-message" key="error">{error}</div>}
        {loading && appointments.length === 0 ? (
          <div className="loading" key="loading">Chargement des rendez-vous...</div>
        ) : appointments.length === 0 ? (
          <div className="no-appointments" key="no-appointments">Aucun rendez-vous trouvé</div>
        ) : (
          appointments.map(apt => (
            <div 
              key={`appointment-${apt._id}`}
              className={`appointment-item ${selectedAppointment?._id === apt._id ? 'selected' : ''}`}
              onClick={() => setSelectedAppointment(apt)}
            >
              <h4>{apt.patient?.prenom} {apt.patient?.nom}</h4>
              <p>🗓️ {formatDate(apt.date)}</p>
              <p className={`status ${apt.status}`}>
                {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : 'Annulé'}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="chat-section">
        {selectedAppointment ? (
          <>
            <div className="chat-header">
              <h3>Discussion avec {selectedAppointment.patient?.prenom} {selectedAppointment.patient?.nom}</h3>
              <p>📅 {formatDate(selectedAppointment.date)}</p>
            </div>

            <div className="messages-list">
              {error && <div className="error-message" key="chat-error">{error}</div>}
              {loading ? (
                <div className="loading" key="chat-loading">Chargement des messages...</div>
              ) : messages.length === 0 ? (
                <div className="no-messages" key="no-messages">Aucun message dans cette discussion</div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div 
                      key={msg._id || `msg-${index}-${Date.now()}`}
                      className={`message ${isMessageFromDoctor(msg) ? 'sent' : 'received'}`}
                    >
                      <p>{msg.content}</p>
                      <small>{formatDate(msg.createdAt)}</small>
                    </div>
                  ))}
                  <div ref={messagesEndRef} key="messages-end" />
                </>
              )}
            </div>

            <form onSubmit={sendMessage} className="message-form">
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
          <div className="no-chat-selected" key="no-chat">
            <p>Sélectionnez un rendez-vous pour voir la discussion</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ totalAppointments: 0, todayAppointments: 0, pendingRequests: 0 });
  const doctorId = localStorage.getItem('userId');

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const sorted = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setAppointments(sorted);
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = sorted.filter(apt => apt.date.split('T')[0] === today);
      setStats({
        totalAppointments: sorted.length,
        todayAppointments: todayAppts.length,
        pendingRequests: sorted.filter(apt => apt.status === 'pending').length
      });
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  useEffect(() => { if (doctorId) fetchAppointments(); }, [doctorId]);

  const updateStatus = async (id, newStatus) => {
    await axios.put(`http://localhost:5001/api/appointments/${id}/status`, { status: newStatus });
    fetchAppointments();
  };

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR');

  return (
    <div className="dashboard-content">
      <h2>📅 Rendez-vous</h2>
      <div className="stats-grid">
        <div className="stat-card"><h3>Total</h3><p>{stats.totalAppointments}</p></div>
        <div className="stat-card"><h3>Aujourd'hui</h3><p>{stats.todayAppointments}</p></div>
        <div className="stat-card"><h3>En attente</h3><p>{stats.pendingRequests}</p></div>
      </div>

      {appointments.map(apt => (
        <div key={apt._id} className="appointment-card">
          <h4>{apt.patient?.prenom} {apt.patient?.nom}</h4>
          <p>📧 {apt.patient?.email} | 📞 {apt.patient?.telephone}</p>
          <p>🗓️ {new Date(apt.date).toLocaleString('fr-FR')}</p>


          {apt.reason && <p>📝 {apt.reason}</p>}
          <select value={apt.status} onChange={(e) => updateStatus(apt._id, e.target.value)}>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      ))}
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

const DoctorDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>👨‍⚕️ Espace Docteur</h2>
        <nav>
          <ul>
            <li><Link to="/doctor-dashboard">🏠 Accueil</Link></li>
            <li><Link to="appointments">📅 Rendez-vous</Link></li>
            <li><Link to="messages">💬 Messages Patients</Link></li>
            <li><Link to="lab-messages">🔬 Messages Laboratoires</Link></li>
          </ul>
        </nav>
      </aside>

      <div className="main-content">
        <Routes>
          <Route path="appointments" element={<AppointmentsView />} />
          <Route path="messages" element={<MessagesView />} />
          <Route path="lab-messages" element={<LabMessagesView />} />
        </Routes>
      </div>
    </div>
  );
};

export default DoctorDashboard;
