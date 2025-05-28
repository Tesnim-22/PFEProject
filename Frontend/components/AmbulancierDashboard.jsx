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
      <aside className="medical-sidebar">
        <div className="sidebar-header">
          <div className="medical-logo">
            <div className="logo-text">
              <h2>PatientPath</h2>
              <span>Service Ambulancier</span>
            </div>
          </div>
        </div>
        
        <div className="sidebar-navigation">
          <div className="nav-section">
            <span className="nav-section-title">Navigation</span>
            <button 
              onClick={() => setActiveSection('profile')}
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            >
              <span className="nav-icon"><FaUserNurse /></span>
              <span className="nav-text">Profil</span>
            </button>
            <button 
              onClick={() => setActiveSection('status')}
              className={`nav-item ${activeSection === 'status' ? 'active' : ''}`}
            >
              <span className="nav-icon"><FaCheck /></span>
              <span className="nav-text">Statut</span>
            </button>
            <button 
              onClick={() => setActiveSection('location')}
              className={`nav-item ${activeSection === 'location' ? 'active' : ''}`}
            >
              <span className="nav-icon"><FaMapMarkerAlt /></span>
              <span className="nav-text">Position</span>
            </button>
            <button 
              onClick={() => setActiveSection('calls')}
              className={`nav-item ${activeSection === 'calls' ? 'active' : ''}`}
            >
              <span className="nav-icon"><FaPhone /></span>
              <span className="nav-text">Appels</span>
            </button>
            <button 
              onClick={() => setActiveSection('reports')}
              className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            >
              <span className="nav-icon"><FaFileAlt /></span>
              <span className="nav-text">Rapports</span>
            </button>
            <button 
              onClick={() => setActiveSection('vehicle')}
              className={`nav-item ${activeSection === 'vehicle' ? 'active' : ''}`}
            >
              <span className="nav-icon"><FaCar /></span>
              <span className="nav-text">Véhicule</span>
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="ambulance-dashboard">
        
        {renderContent()}
      </main>
    </div>
  );
};

export default AmbulancierDashboard;
