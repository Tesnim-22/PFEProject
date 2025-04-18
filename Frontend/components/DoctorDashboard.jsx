import React from 'react';
import '../styles/Dashboard.css';

const DoctorDashboard = () => {
  return (
    <div className="dashboard-container doctor-dashboard">
      <div className="dashboard-card">
        <h1>👨‍⚕️ Welcome, Doctor!</h1>
        <p>This is your professional dashboard. View patients’ health data, manage appointments, and provide healthcare support.</p>
      </div>
    </div>
  );
};

export default DoctorDashboard;
