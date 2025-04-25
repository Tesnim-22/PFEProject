import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

export default function Home() {
  return (
    <div className="home-modern">
     
      
      {/* Hero section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Votre santé, <span>simplifiée</span></h1>
            <p className="hero-subtitle">
              Plateforme tout-en-un pour gérer vos rendez-vous, dossiers médicaux 
              et communications avec des professionnels certifiés.
            </p>
            <div className="hero-cta">
              <Link to="/signup" className="cta-primary">Commencer maintenant</Link>
            </div>
          </div>
          <div className="hero-visual">
            <img 
              src="/assets/docteure.jpeg" 
              alt="Docteure souriante sur l'interface PatientPath" 
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="key-stats">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value">98%</div>
            <div className="stat-label">Satisfaction patients</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">24h</div>
            <div className="stat-label">Réponse maximale</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">256-bit</div>
            <div className="stat-label">Chiffrement AES</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-header">
          <h2>Votre parcours santé optimisé</h2>
          <p className="section-subtitle">
            Une suite complète d'outils conçus pour les patients exigeants
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Gestion de rendez-vous</h3>
            <ul className="feature-list">
              <li>Prise de rendez-vous en ligne</li>
              <li>Rappels automatiques</li>
              <li>Annulation simplifiée</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📁</div>
            <h3>Dossier médical unifié</h3>
            <ul className="feature-list">
              <li>Centralisation des documents</li>
              <li>Accès multi-appareils</li>
              <li>Partage sécurisé</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Sécurité renforcée</h3>
            <ul className="feature-list">
              <li>Certification HIPAA</li>
              <li>Authentification à 2 facteurs</li>
              <li>Audits réguliers</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-footer" id="contact">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">PatientPath</div>
            <p>La technologie au service de votre santé.</p>
          </div>
          
          <div className="footer-contact">
            <h4>Contact</h4>
            <address>
              <p>Patientpath2@gmail.com</p>
              <p>(+216) 58292817</p>
            </address>
          </div>
        </div>
        
        <div className="footer-legal">
          <p>© 2025 PatientPath. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
