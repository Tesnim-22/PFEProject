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
  const doctorId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pendingAppointments = res.data
        .filter(apt => apt.status === 'pending')
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setAppointments(pendingAppointments);
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
      <h2>⏳ Demandes en attente</h2>
      {appointments.length === 0 ? (
        <p>Aucune demande en attente</p>
      ) : (
        appointments.map(apt => (
          <div key={apt._id} className="appointment-card pending">
            <h4>{apt.patient?.prenom} {apt.patient?.nom}</h4>
            <p>📧 {apt.patient?.email} | 📞 {apt.patient?.telephone}</p>
            <p>🗓️ {new Date(apt.date).toLocaleString('fr-FR')}</p>
            {apt.reason && <p>📝 {apt.reason}</p>}
            <div className="action-buttons">
              <button onClick={() => updateStatus(apt._id, 'confirmed')} className="confirm-btn">
                ✅ Accepter
              </button>
              <button onClick={() => updateStatus(apt._id, 'cancelled')} className="cancel-btn">
                ❌ Refuser
              </button>
            </div>
          </div>
        ))
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

const DoctorDashboard = () => {
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
            <li><Link to="messages">💬 Messages Patients</Link></li>
            <li><Link to="lab-messages">🔬 Messages Laboratoires</Link></li>
            <li><Link to="articles">📝 Articles</Link></li>
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
        </Routes>
      </div>
    </div>
  );
};

export default DoctorDashboard;
