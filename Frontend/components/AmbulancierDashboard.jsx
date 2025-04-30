import React, { useState } from 'react';
import '../styles/AmbulancierDashboard.css';
import AmbulanceReports from './AmbulanceReports';
import VehicleInfo from './VehicleInfo';

const AmbulancierDashboard = () => {
  const [activeSection, setActiveSection] = useState('status');

  const renderContent = () => {
    switch (activeSection) {
      case 'reports':
        return <AmbulanceReports />;
      case 'vehicle':
        return <VehicleInfo />;
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
              <h3>📄 Rapports</h3>
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
    <div className="ambulance-dashboard">
      <div className="dashboard-header">
        <h2>🚑 Tableau de bord Ambulancier</h2>
        {activeSection !== 'status' && (
          <button 
            className="back-btn"
            onClick={() => setActiveSection('status')}
          >
            ← Retour
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default AmbulancierDashboard;
