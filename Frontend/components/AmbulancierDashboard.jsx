import React from 'react';
import '../styles/AmbulancierDashboard.css';
import { Link } from 'react-router-dom';

const AmbulancierDashboard = () => {
  return (
    <div className="ambulance-dashboard">
      <h2>🚑 Ambulancier Dashboard</h2>
      <div className="dashboard-card-grid">

        <Link to="/ambulancier/location" className="dashboard-card">
          <h3>📍 Current Location</h3>
          <p>View and share your live location with dispatchers.</p>
        </Link>

        <Link to="/ambulance/calls" className="dashboard-card">
          <h3>📋 Assigned Calls</h3>
          <p>See the list of emergency calls and patient pickups assigned to you.</p>
        </Link>

        <Link to="/ambulance/status" className="dashboard-card">
          <h3>✅ Status Updates</h3>
          <p>Update your status: Available, On the way, Arrived, Completed.</p>
        </Link>

        <Link to="/ambulance/reports" className="dashboard-card">
          <h3>📄 Reports</h3>
          <p>Fill out transport and patient reports after each trip.</p>
        </Link>

        <Link to="/ambulance/vehicle-info" className="dashboard-card">
          <h3>🛠️ Vehicle Info</h3>
          <p>Manage ambulance maintenance, fuel logs, and equipment checks.</p>
        </Link>

      </div>
    </div>
  );
};

export default AmbulancierDashboard;
