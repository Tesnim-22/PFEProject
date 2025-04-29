import React, { useState, useEffect } from 'react';
import AppointmentForm from './AppointmentForm';
import '../styles/PatientDashboard.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      setMessage("ID utilisateur non trouvé.");
      setIsLoading(false);
      return;
    }

    setUserId(storedId);
    fetchProfile(storedId);
    fetchNotifications(storedId);
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">🧑‍⚕️ Patient</div>
        <div className="sidebar-menu">
          <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>👤 Profil</button>
          <button className={activeSection === 'appointment' ? 'active' : ''} onClick={() => setActiveSection('appointment')}>📅 Rendez-vous</button>
          <button className={activeSection === 'notifications' ? 'active' : ''} onClick={() => setActiveSection('notifications')}>🔔 Notifications</button>
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
                  {profile.photo && <img src={`${API_BASE_URL}${profile.photo}`} alt="Profil" className="profile-photo" />}
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

            {activeSection === 'notifications' && (
              <>
                <h2>🔔 Mes notifications</h2>
                {notifications.length === 0 ? (
                  <p>Aucune notification pour l'instant.</p>
                ) : (
                  <ul className="notif-list">
                    {notifications.map((notif, idx) => (
                      <li key={idx} className="notif-item">{notif.message}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
