import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

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
            <li><Link to="/communication">💬 Communication</Link></li>
          </ul>
        </nav>
      </aside>

      <div className="main-content">
        <Routes>
        <Route path="appointments" element={<AppointmentsView />} />

          {/* Ajoute d’autres routes si nécessaire */}
        </Routes>
      </div>
    </div>
  );
};

export default DoctorDashboard;
