import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AmbulancierDashboard.css';
import AmbulanceReports from './AmbulanceReports';
import VehicleInfo from './VehicleInfo';
import { FaUserNurse, FaCheck, FaMapMarkerAlt, FaPhone, FaFileAlt, FaCar } from "react-icons/fa";

const AmbulancierDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    nom: 'Ben Salah',
    prenom: 'Ali',
    email: 'ali.bensalah@example.com',
    telephone: '+216 12 345 678',
    vehiculeId: 'AMB-1024'
  });

  const [editedInfo, setEditedInfo] = useState({ ...userInfo });

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo({ ...userInfo });
  };

  const handleSave = () => {
    setUserInfo({ ...editedInfo });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedInfo({ ...userInfo });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
            
            
            <div className="profile-card">
              <div className="profile-info">
                <div className="profile-avatar">
                  <span className="avatar-text">
                    {(isEditing ? editedInfo : userInfo).prenom.charAt(0)}{(isEditing ? editedInfo : userInfo).nom.charAt(0)}
                  </span>
                </div>
                <div className="profile-details">
                  <h3>{(isEditing ? editedInfo : userInfo).prenom} {(isEditing ? editedInfo : userInfo).nom}</h3>
                  <p className="profile-role">Ambulancier Professionnel</p>
                  <div className="status-badge">
                    <span className="status-dot"></span>
                    En service
                  </div>
                </div>
              </div>
              
              <div className="profile-data">
                {!isEditing ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Nom :</span>
                      <span className="info-value">{userInfo.nom}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Prénom :</span>
                      <span className="info-value">{userInfo.prenom}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email :</span>
                      <span className="info-value">{userInfo.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Téléphone :</span>
                      <span className="info-value">{userInfo.telephone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Véhicule :</span>
                      <span className="info-value">{userInfo.vehiculeId}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Service :</span>
                      <span className="info-value">Urgences médicales</span>
                    </div>
                  </div>
                ) : (
                  <div className="edit-form">
                    <div className="form-group">
                      <label className="form-label">Nom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editedInfo.nom}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prénom</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editedInfo.prenom}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={editedInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Téléphone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={editedInfo.telephone}
                        onChange={(e) => handleInputChange('telephone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Véhicule</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editedInfo.vehiculeId}
                        onChange={(e) => handleInputChange('vehiculeId', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Service</label>
                      <input
                        type="text"
                        className="form-input"
                        value="Urgences médicales"
                        disabled
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="profile-actions">
                {!isEditing ? (
                  <button className="btn btn-primary" onClick={handleEdit}>
                    Modifier le profil
                  </button>
                ) : (
                  <div className="action-buttons">
                    <button className="btn btn-success" onClick={handleSave}>
                      Enregistrer
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancel}>
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="dashboard-card-grid">
            
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
