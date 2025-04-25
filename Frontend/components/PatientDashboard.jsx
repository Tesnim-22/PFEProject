import React, { useState, useEffect } from 'react';
import '../styles/PatientDashboard.css';

const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [appointmentMessage, setAppointmentMessage] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (storedId) {
      setUserId(storedId);
      if (activeSection === 'profile') {
        fetch(`http://localhost:5001/users/${storedId}`)
          .then(res => res.json())
          .then(data => setProfile(data))
          .catch(() => setMessage("❌ Erreur de récupération du profil."));
      }
    } else {
      setMessage("ID utilisateur non trouvé.");
    }
  }, [activeSection]);

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setAppointmentMessage('');
    setLoading(true);
    const patientEmail = localStorage.getItem('userEmail');
    if (!patientEmail) {
      setAppointmentMessage("❌ Email utilisateur introuvable.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail, doctorId, date, time, reason }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setAppointmentMessage("✅ Rendez-vous créé !");
        setDoctorId(''); setDate(''); setTime(''); setReason('');
      } else {
        setAppointmentMessage(data.message || "❌ Erreur lors de la demande.");
      }
    } catch {
      setLoading(false);
      setAppointmentMessage("❌ Erreur serveur.");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">🧑‍⚕️ Patient</div>
        <div className="sidebar-menu">
          <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>👤 Profil</button>
          <button className={activeSection === 'appointment' ? 'active' : ''} onClick={() => setActiveSection('appointment')}>📅 Rendez-vous</button>
          <button className={activeSection === 'help' ? 'active' : ''} onClick={() => setActiveSection('help')}>❓ Aide</button>
          <button className={activeSection === 'settings' ? 'active' : ''} onClick={() => setActiveSection('settings')}>⚙️ Paramètres</button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>🚪 Déconnexion</button>
        </div>
      </aside>

      <main className="dashboard">
        {activeSection === 'profile' && (
          <>
            <h2>👤 Mon profil</h2>
            {message && <p className="msg">{message}</p>}
            <div className="profile-card">
              {profile.photo && <img src={`http://localhost:5001${profile.photo}`} alt="Profil" />}
              <div className="profile-grid">
                <p><strong>Nom :</strong> {profile.nom}</p>
                <p><strong>Prénom :</strong> {profile.prenom}</p>
                <p><strong>Email :</strong> {profile.email}</p>
                <p><strong>Téléphone :</strong> {profile.telephone}</p>
                <p><strong>Adresse :</strong> {profile.adresse}</p>
                <p><strong>CIN :</strong> {profile.cin}</p>
                <p><strong>Téléphone urgence :</strong> {profile.emergencyPhone || 'Non renseigné'}</p>
                <p><strong>Groupe sanguin :</strong> {profile.bloodType || 'Non renseigné'}</p>
                <p><strong>Maladies chroniques :</strong> {profile.chronicDiseases || 'Non renseigné'}</p>
              </div>
            </div>
          </>
        )}

        {activeSection === 'appointment' && (
          <>
            <h2>📅 Nouveau rendez-vous</h2>
            {appointmentMessage && <p className="msg">{appointmentMessage}</p>}
            <form onSubmit={handleAppointmentSubmit} className="form">
              <input type="text" placeholder="ID du médecin" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              <input type="text" placeholder="Raison" value={reason} onChange={(e) => setReason(e.target.value)} />
              <button type="submit" disabled={loading}>{loading ? '⏳ Envoi...' : 'Envoyer'}</button>
            </form>
          </>
        )}

        {activeSection === 'help' && <><h2>❓ Aide</h2><p className="msg">Infos à venir.</p></>}
        {activeSection === 'settings' && <><h2>⚙️ Paramètres</h2><p className="msg">Fonctionnalités à venir.</p></>}
      </main>
    </div>
  );
};

export default PatientDashboard;
