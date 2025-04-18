import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import HeroImg from '../assets/healthcare-hero.jpg';

const Home = () => {
  return (
    <div className="home-container">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>Welcome to Our Health Care Platform</h1>
          <p>
            Your health is our priority. Access personalized dashboards tailored to your role and stay informed with health insights and consultations.
          </p>
          <Link to="/signin" className="hero-btn">Get Started</Link>
        </div>
        <img src={HeroImg} alt="Healthcare hero" className="hero-image" />
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        <span>🏥 100+ Hospitals | 👨‍⚕️ 500+ Verified Doctors | 😊 10k+ Happy Patients</span>
      </div>

      {/* DASHBOARD SECTION */}
      <section className="dashboard-section">
        <h2>Choisissez votre interface</h2>
        <div className="dashboard-cards">
          <Link to="/patient-dashboard" className="dashboard-card">
            <h4>🩺 Patient</h4>
            <p>Consultez vos dossiers médicaux, astuces de santé et rendez-vous.</p>
          </Link>
          <Link to="/doctor-dashboard" className="dashboard-card">
            <h4>👨‍⚕️ Doctor</h4>
            <p>Gérez vos consultations, rapports et horaires.</p>
          </Link>
          <Link to="/labs-dashboard" className="dashboard-card">
            <h4>🔬 Labs</h4>
            <p>Supervisez vos résultats de tests et diagnostics médicaux avec efficacité.</p>
          </Link>
          <Link to="/hospital-dashboard" className="dashboard-card">
            <h4>🏥 Hospital</h4>
            <p>Organisez les soins et administrez les moyens hospitaliers.</p>
          </Link>
          <Link to="/cabinet-dashboard" className="dashboard-card">
            <h4>📁 Cabinet</h4>
            <p>Optimisez les activités du cabinet privé et la circulation des patients.</p>
          </Link>
          <Link to="/ambulancier-dashboard" className="dashboard-card">
            <h4>🚑 Ambulancier</h4>
            <p>Gérez les demandes d'ambulance, les itinéraires d'urgence et les transferts de patients.</p>
          </Link>

          {/* ✅ New Administrator Dashboard */}
          <Link to="/admin-dashboard" className="dashboard-card">
            <h4>🧑‍💼 Administrateur</h4>
            <p>Gérez les utilisateurs, les accès et les notifications en temps réel.</p>
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <h3>Why Choose Our Platform?</h3>
        <div className="features-list">
          <div className="feature-item">
            🔐 <strong>Secure Data</strong><br />
            Your health data is safe and encrypted.
          </div>
          <div className="feature-item">
            🌐 <strong>24/7 Access</strong><br />
            Access from anywhere, any time.
          </div>
          <div className="feature-item">
            📊 <strong>Health Insights</strong><br />
            View progress, results, and suggestions.
          </div>
          <div className="feature-item">
            🤖 <strong>AI Chat Support</strong><br />
            Instant help from our smart assistant.
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-section">
        <p>© 2025 Health Care Platform. All rights reserved.</p>
        <div>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Login</Link>
          <Link to="/signin">Signup</Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;
