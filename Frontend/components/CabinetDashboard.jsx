import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CabinetDashboard.css';
import Calendar from 'react-calendar';
import { FaUserMd, FaCalendarAlt, FaClock, FaBook, FaSignOutAlt } from 'react-icons/fa';

const CabinetDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <FaUserMd size={32} style={{ marginRight: 8, color: "#038A91" }} />
            <span className="user-role" style={{ fontSize: "1rem", fontWeight: 500, color: "#038A91" }}>Interface Cabinet</span>
          </div>
        </div>
        <nav className="sidebar-menu">
          <button className="sidebar-btn" onClick={() => navigate("")}> <FaUserMd className="icon" /> <span>Mon Profil</span> </button>
          <button className="sidebar-btn" onClick={() => navigate("calendar")}> <FaCalendarAlt className="icon" /> <span>Calendrier</span> </button>
          <button className="sidebar-btn" onClick={() => navigate("upcoming-appointments")}> <FaClock className="icon" /> <span>Rendez-vous à venir</span> </button>
          <button className="sidebar-btn" onClick={() => navigate("pending-appointments")}> <FaClock className="icon" /> <span>Demandes en attente</span> </button>
          <button className="sidebar-btn" onClick={() => navigate("past-appointments")}> <FaBook className="icon" /> <span>Historique</span> </button>
        </nav>
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          <span>Se déconnecter</span>
        </button>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CabinetMainView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="upcoming-appointments" element={<UpcomingAppointmentsView />} />
          <Route path="pending-appointments" element={<PendingAppointmentsView />} />
          <Route path="past-appointments" element={<PastAppointmentsView />} />
        </Routes>
      </main>
    </div>
  );
};

const CabinetMainView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    averageRating: 0
  });

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
      fetchCabinetStats(cabinetId);
    }
  }, []);

  const fetchCabinetStats = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/cabinet/stats/${cabinetId}`);
      setStats(response.data);
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      // Ne pas afficher d'erreur à l'utilisateur, juste utiliser les valeurs par défaut
    }
  };

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      // Si le cabinet a un médecin associé, récupérer ses informations
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
      }
      
      setCabinetInfo(cabinetData);
      setEditedInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cabinetId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5001/api/users/${cabinetId}`, {
        nom: editedInfo.nom,
        telephone: editedInfo.telephone,
        email: editedInfo.email,
        adresse: editedInfo.adresse
      });
      
      setCabinetInfo(editedInfo);
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      setError('Erreur lors de la mise à jour du profil');
    }
  };

  if (loading) {
    return <div className="cabinet-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>;
  }

  return (
    <div className="section-container">
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-avatar">
            {cabinetInfo?.nom?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h3>{cabinetInfo?.nom}</h3>
            <p>Cabinet Médical</p>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="edit-button"
            >
              {isEditing ? '❌ Annuler' : '✏️ Modifier le profil'}
            </button>
          </div>
        </div>

        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="profile-card">
                <h4>🏥 Informations du Cabinet</h4>
                <div className="form-group">
                  <label>Nom du cabinet:</label>
                  <input
                    type="text"
                    name="nom"
                    value={editedInfo.nom}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Adresse:</label>
                  <input
                    type="text"
                    name="adresse"
                    value={editedInfo.adresse}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={editedInfo.telephone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={editedInfo.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <button type="submit" className="save-button">
                  💾 Enregistrer les modifications
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-card">
                <h4>🏥 Informations du Cabinet</h4>
                <p>📍 Adresse: {cabinetInfo?.adresse}</p>
                <p>📞 Téléphone: {cabinetInfo?.telephone}</p>
                <p>📧 Email: {cabinetInfo?.email}</p>
              </div>

              <div className="profile-card">
                <h4>👨‍⚕️ Médecin Associé</h4>
                <p>Dr. {cabinetInfo?.linkedDoctor?.nom} {cabinetInfo?.linkedDoctor?.prenom}</p>
                <p>Spécialité: {cabinetInfo?.linkedDoctor?.specialty}</p>
              </div>

              <div className="profile-card">
                <h4>⏰ Horaires d'ouverture</h4>
                <p>Lundi - Vendredi: 9h00 - 18h00</p>
                <p>Samedi: 9h00 - 12h00</p>
                <p>Dimanche: Fermé</p>
              </div>

              <div className="profile-card stats-card">
                <h4>📊 Statistiques</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{stats.totalAppointments || 0}</div>
                    <div className="stat-label">Total Rendez-vous</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.pendingAppointments || 0}</div>
                    <div className="stat-label">En attente</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.completedAppointments || 0}</div>
                    <div className="stat-label">Terminés</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.cancelledAppointments || 0}</div>
                    <div className="stat-label">Annulés</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PendingAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('');
  const [cabinetInfo, setCabinetInfo] = useState(null);

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      // Si le cabinet a un médecin associé, récupérer ses informations
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
        // Récupérer les rendez-vous du médecin
        await fetchDoctorAppointments(cabinetData.linkedDoctorId);
      }
      
      setCabinetInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const pendingAppointments = response.data.filter(apt => apt.status === 'pending');
      setAppointments(pendingAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.put(`http://localhost:5001/api/appointments/${appointmentId}/status`, {
        status: newStatus
      });
      if (cabinetInfo?.linkedDoctorId) {
        fetchDoctorAppointments(cabinetInfo.linkedDoctorId);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handlePlanningSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !appointmentDate) return;

    try {
      await axios.put(`http://localhost:5001/api/appointments/${selectedAppointment._id}/planning`, {
        appointmentDate,
        requiredDocuments,
        status: 'confirmed'
      });

      setShowPlanningForm(false);
      setSelectedAppointment(null);
      setAppointmentDate('');
      setRequiredDocuments('');

      if (cabinetInfo?.linkedDoctorId) {
        fetchDoctorAppointments(cabinetInfo.linkedDoctorId);
      }
    } catch (error) {
      console.error('❌ Erreur planification rendez-vous:', error);
      setError('Erreur lors de la planification du rendez-vous');
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

  if (loading) {
    return <div className="cabinet-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>;
  }

  return (
    <div className="section-container">
      <div className="pending-appointments-view">
        <div className="section-header">
          <h2>⏳ Demandes en attente</h2>
      </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>Aucune demande en attente</p>
          </div>
        ) : (
          <div className="pending-appointments-grid">
            {appointments.map(appointment => (
              <div key={appointment._id} className="appointment-card pending">
                <div className="appointment-header">
                  <h3>👤 {appointment.patient?.prenom} {appointment.patient?.nom}</h3>
                  <span className="appointment-date">
                    🗓️ Demande reçue le: {formatDate(appointment.date)}
                  </span>
                </div>
                <div className="appointment-details">
                  <p>📧 {appointment.patient?.email}</p>
                  <p>📞 {appointment.patient?.telephone}</p>
                  {appointment.reason && <p>📝 {appointment.reason}</p>}
                </div>
                <div className="appointment-actions">
                  <button
                    className="action-button accept-button"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowPlanningForm(true);
                    }}
                  >
                    ✅ Planifier
                  </button>
                  <button
                    className="action-button reject-button"
                    onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                  >
                    ❌ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {showPlanningForm && selectedAppointment && (
        <div className="planning-modal">
          <div className="planning-modal-content">
              <div className="modal-header">
            <h3>📅 Planifier le rendez-vous</h3>
              </div>
            <form onSubmit={handlePlanningSubmit}>
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
                  placeholder="Liste des documents à apporter..."
                />
              </div>
                <div className="modal-actions">
                  <button type="submit" className="submit-button">
                  Confirmer
                </button>
                <button
                  type="button"
                    className="cancel-button"
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
    </div>
  );
};

const CalendarView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkedDoctorId, setLinkedDoctorId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayAppointments, setDayAppointments] = useState([]);

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      // 1. Charger les infos du cabinet pour obtenir linkedDoctorId
      axios.get(`http://localhost:5001/api/users/${cabinetId}`)
        .then(res => {
          if (res.data.linkedDoctorId) {
            setLinkedDoctorId(res.data.linkedDoctorId);
          } else {
            setError("Aucun médecin lié à ce cabinet.");
            setLoading(false);
          }
        })
        .catch(() => {
          setError("Impossible de charger les infos du cabinet.");
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (linkedDoctorId) {
      // 2. Charger les rendez-vous du docteur lié
      axios.get(`http://localhost:5001/api/doctor/appointments/${linkedDoctorId}`)
        .then(res => {
          setAppointments(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError("Impossible de charger les rendez-vous du médecin lié.");
          setLoading(false);
        });
    }
  }, [linkedDoctorId]);

  useEffect(() => {
    if (appointments.length > 0) {
      filterAppointmentsByDate(selectedDate);
    }
  }, [selectedDate, appointments]);

  const filterAppointmentsByDate = (date) => {
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
    setDayAppointments(filtered.sort((a, b) => new Date(a.date) - new Date(b.date)));
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

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="calendar-view">
      <h2>📅 Calendrier des rendez-vous</h2>
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
                <div key={apt._id} className="appointment-item">
                  <div className="appointment-time">
                    {formatDate(apt.date)}
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
                  <span className={`appointment-status ${apt.status}`}>
                    {apt.status === 'confirmed' ? '✅ Confirmé' : 
                     apt.status === 'pending' ? '⏳ En attente' : '❌ Annulé'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UpcomingAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      // Si le cabinet a un médecin associé, récupérer ses informations
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
        // Récupérer les rendez-vous du médecin
        await fetchDoctorAppointments(cabinetData.linkedDoctorId);
      }
      
      setCabinetInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      const confirmedAppointments = response.data.filter(apt => 
        apt.status === 'confirmed' && new Date(apt.date) > new Date()
      );
      setAppointments(confirmedAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
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

  if (loading) {
    return <div className="cabinet-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>;
  }

  return (
    <div className="section-container">
      <div className="upcoming-appointments-view">
        <div className="section-header">
          <h2>📅 Rendez-vous à venir</h2>
        </div>

        {appointments.length === 0 ? (
          <div className="no-appointments">
            <p>Aucun rendez-vous confirmé pour le moment</p>
          </div>
        ) : (
          <div className="upcoming-appointments-grid">
            {appointments.map(appointment => (
              <div key={appointment._id} className="appointment-card upcoming">
                <div className="appointment-header">
                  <h3>👤 {appointment.patient?.prenom} {appointment.patient?.nom}</h3>
                  <span className="appointment-date">
                    🗓️ {formatDate(appointment.date)}
                  </span>
                </div>
                <div className="appointment-details">
                  <p>📧 {appointment.patient?.email}</p>
                  <p>📞 {appointment.patient?.telephone}</p>
                  {appointment.reason && <p>📝 {appointment.reason}</p>}
                  {appointment.requiredDocuments && (
                    <p>📄 Documents requis: {appointment.requiredDocuments}</p>
                  )}
                </div>
                <div className="appointment-status status-confirmed">
                  ✅ Rendez-vous confirmé
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PastAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cabinetInfo, setCabinetInfo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'cancelled'
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    const cabinetId = localStorage.getItem('userId');
    if (cabinetId) {
      fetchCabinetInfo(cabinetId);
    }
  }, []);

  const fetchCabinetInfo = async (cabinetId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/users/${cabinetId}`);
      const cabinetData = response.data;
      
      // Si le cabinet a un médecin associé, récupérer ses informations
      if (cabinetData.linkedDoctorId) {
        const doctorResponse = await axios.get(`http://localhost:5001/api/users/${cabinetData.linkedDoctorId}`);
        cabinetData.linkedDoctor = doctorResponse.data;
        // Récupérer les rendez-vous du médecin
        await fetchDoctorAppointments(cabinetData.linkedDoctorId);
      }
      
      setCabinetInfo(cabinetData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération info cabinet:', error);
      setError('Impossible de charger les informations du cabinet');
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/doctor/appointments/${doctorId}`);
      // Filtrer les rendez-vous passés
      const pastAppointments = response.data.filter(apt => {
        const appointmentDate = new Date(apt.date);
        return appointmentDate < new Date();
      });
      setAppointments(pastAppointments);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur récupération rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge completed">✅ Terminé</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">❌ Annulé</span>;
      case 'no-show':
        return <span className="status-badge no-show">⏰ Non présenté</span>;
      default:
        return <span className="status-badge unknown">❓ Inconnu</span>;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      apt.patient?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const appointmentDate = new Date(apt.date);
    const matchesDateRange = (!dateRange.start || appointmentDate >= new Date(dateRange.start)) &&
                            (!dateRange.end || appointmentDate <= new Date(dateRange.end));

    return matchesStatus && matchesSearch && matchesDateRange;
  });

  if (loading) {
    return <div className="cabinet-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cabinet-error">{error}</div>;
  }

  return (
    <div className="past-appointments-view">
      <div className="history-header">
        <h2>📚 Historique des rendez-vous</h2>
        
        <div className="filters-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Terminés</option>
              <option value="cancelled">Annulés</option>
              <option value="no-show">Non présentés</option>
            </select>

            <div className="date-range">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="date-input"
              />
              <span>à</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="date-input"
              />
            </div>
          </div>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="no-appointments">
          <p>Aucun rendez-vous trouvé dans l'historique</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {filteredAppointments.map(appointment => (
            <div key={appointment._id} className="appointment-card past">
              <div className="appointment-header">
                <h3>👤 Patient: {appointment.patient?.prenom} {appointment.patient?.nom}</h3>
                <span className="appointment-date">
                  🗓️ {formatDate(appointment.date)}
                </span>
              </div>
              <div className="appointment-details">
                <p>📧 Email: {appointment.patient?.email}</p>
                <p>📞 Téléphone: {appointment.patient?.telephone}</p>
                {appointment.reason && <p>📝 Motif: {appointment.reason}</p>}
                {appointment.notes && <p>📋 Notes: {appointment.notes}</p>}
              </div>
              <div className="appointment-footer">
                {getStatusBadge(appointment.status)}
                {appointment.requiredDocuments && (
                  <div className="documents-list">
                    <p>📄 Documents requis:</p>
                    <p>{appointment.requiredDocuments}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CabinetDashboard;
