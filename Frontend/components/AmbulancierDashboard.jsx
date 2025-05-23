import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AmbulancierDashboard.css';
import AmbulanceReports from './AmbulanceReports';
import VehicleInfo from './VehicleInfo';
import { FaUserNurse, FaCheck, FaMapMarkerAlt, FaPhone, FaFileAlt, FaCar } from "react-icons/fa";

const AmbulancierDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    nom: 'Ben Salah',
    prenom: 'Ali',
    email: 'ali.bensalah@example.com',
    telephone: '+216 12 345 678',
    vehiculeId: 'AMB-1024'
  });

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'reports':
        return <AmbulanceReports />;
      case 'vehicle':
        return <VehicleInfo />;
      case 'profile':
        return (
          <div className="profile-section">
            <h3>👤 Profil Ambulancier</h3>
            <ul>
              <li><strong>Nom :</strong> {userInfo.nom}</li>
              <li><strong>Prénom :</strong> {userInfo.prenom}</li>
              <li><strong>Email :</strong> {userInfo.email}</li>
              <li><strong>Téléphone :</strong> {userInfo.telephone}</li>
              <li><strong>Véhicule ID :</strong> {userInfo.vehiculeId}</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="dashboard-card-grid">
            <div className="dashboard-card" onClick={() => setActiveSection('location')}>
              <h3>📍 Position actuelle</h3>
              <p>Voir et partager votre position en temps réel.</p>
            </div>
            <div className="dashboard-card" onClick={() => setActiveSection('calls')}>
              <h3>📋 Appels assignés</h3>
              <p>Liste des appels d'urgence et prises en charge.</p>
            </div>
            <div className="dashboard-card" onClick={() => setActiveSection('status')}>
              <h3>✅ Mise à jour statut</h3>
              <p>Mettre à jour votre statut : Disponible, En route, Arrivé, Terminé.</p>
            </div>
            <div className="dashboard-card" onClick={() => setActiveSection('reports')}>
              <h3>📝 Rapports</h3>
              <p>Remplir les rapports de transport et d'intervention.</p>
            </div>
            <div className="dashboard-card" onClick={() => setActiveSection('vehicle')}>
              <h3>🚑 Info véhicule</h3>
              <p>Gérer la maintenance, le carburant et l'équipement.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="user-info" style={{ justifyContent: "center", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <FaUserNurse size={38} style={{ color: "#038A91", marginBottom: 4 }} />
          <span className="user-role" style={{ fontSize: "1rem", fontWeight: 700, color: "#038A91" }}>Ambulancier</span>
        </div>
        <div className="sidebar-menu">
          <button className={`sidebar-btn${activeSection === 'profile' ? ' active' : ''}`} onClick={() => setActiveSection('profile')}>
            <FaUserNurse className="icon" /><span>Profil</span>
          </button>
          <button className={`sidebar-btn${activeSection === 'status' ? ' active' : ''}`} onClick={() => setActiveSection('status')}>
            <FaCheck className="icon" /><span>Statut</span>
          </button>
          <button className={`sidebar-btn${activeSection === 'location' ? ' active' : ''}`} onClick={() => setActiveSection('location')}>
            <FaMapMarkerAlt className="icon" /><span>Position</span>
          </button>
          <button className={`sidebar-btn${activeSection === 'calls' ? ' active' : ''}`} onClick={() => setActiveSection('calls')}>
            <FaPhone className="icon" /><span>Appels</span>
          </button>
          <button className={`sidebar-btn${activeSection === 'reports' ? ' active' : ''}`} onClick={() => setActiveSection('reports')}>
            <FaFileAlt className="icon" /><span>Rapports</span>
          </button>
          <button className={`sidebar-btn${activeSection === 'vehicle' ? ' active' : ''}`} onClick={() => setActiveSection('vehicle')}>
            <FaCar className="icon" /><span>Véhicule</span>
          </button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Déconnexion
        </button>
      </aside>

      <main className="ambulance-dashboard">
        
        {renderContent()}
      </main>
    </div>
  );
};

export default AmbulancierDashboard;
