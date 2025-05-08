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
              src="/assets/doc.jpg"
              alt="Docteure souriante sur l'interface PatientPath"
              className="hero-image"
            />
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
            <h3><i className="fa-solid fa-calendar-check feature-icon"></i> Gestion de rendez-vous</h3>
            <ul className="feature-list">
              <li>Prise de rendez-vous en ligne</li>
              <li>Rappels automatiques</li>
              <li>Annulation simplifiée</li>
            </ul>
          </div>
          <div className="feature-card">
            <h3><i className="fa-solid fa-folder-open feature-icon"></i> Dossier médical unifié</h3>
            <ul className="feature-list">
              <li>Centralisation des documents</li>
              <li>Accès multi-appareils</li>
              <li>Partage sécurisé</li>
            </ul>
          </div>
          <div className="feature-card">
            <h3><i className="fa-solid fa-lock feature-icon"></i> Sécurité renforcée</h3>
            <ul className="feature-list">
              <li>Certification HIPAA</li>
              <li>Authentification à 2 facteurs</li>
              <li>Audits réguliers</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>Comment ça marche ?</h2>
          <p className="section-subtitle">3 étapes simples pour prendre soin de vous</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">1</span>
            <h4>Inscrivez-vous</h4>
            <p>Créez votre compte rapidement et gratuitement.</p>
          </div>
          <div className="step-card">
            <span className="step-number">2</span>
            <h4>Réservez un rendez-vous</h4>
            <p>Choisissez un professionnel selon vos disponibilités.</p>
          </div>
          <div className="step-card">
            <span className="step-number">3</span>
            <h4>Consultez vos données</h4>
            <p>Accédez à vos résultats et ordonnances en toute sécurité.</p>
          </div>
        </div>
      </section>

      {/* Pourquoi PatientPath */}
      <section className="why-patientpath">
        <div className="section-header">
          <h2>Pourquoi choisir PatientPath ?</h2>
        </div>
        <ul className="why-list">
          <li><i className="fa-solid fa-check-circle"></i> Interface intuitive</li>
          <li><i className="fa-solid fa-check-circle"></i> Support 24h/7</li>
          <li><i className="fa-solid fa-check-circle"></i> Données hébergées en Europe</li>
          <li><i className="fa-solid fa-check-circle"></i> Compatible mobile & web</li>
        </ul>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="stat-item"><h3>+10 000</h3><p>Utilisateurs satisfaits</p></div>
        <div className="stat-item"><h3>500+</h3><p>Médecins certifiés</p></div>
        <div className="stat-item"><h3>25 000</h3><p>Rendez-vous gérés</p></div>
      </section>


      {/* FAQ */}
      <section className="faq">
        <div className="section-header">
          <h2>Questions fréquentes</h2>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <h4>Est-ce que l'inscription est gratuite ?</h4>
            <p>Oui, l'inscription et l'utilisation de base sont totalement gratuites.</p>
          </div>
          <div className="faq-item">
            <h4>Mes données sont-elles sécurisées ?</h4>
            <p>Absolument. Nous respectons les normes RGPD et HIPAA.</p>
          </div>
        </div>
      </section>

      {/* App download */}
      <section className="app-download">
        <h2>Disponible aussi sur mobile</h2>
        <p>Emportez PatientPath partout avec vous</p>
        <div className="app-buttons">
          <a href="#" className="app-store-button">App Store</a>
          <a href="#" className="google-play-button">Google Play</a>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="new-footer" id="contact">
        <div className="footer-container">
          <div className="footer-section brand">
            <h2>PatientPath</h2>
            <p>Votre compagnon santé intelligent et sécurisé.</p>
          </div>
          <div className="footer-section links">
            <h4>Navigation</h4>
            <ul>
              <li><a href="/about">À propos</a></li>
              <li><a href="/services">Nos Services</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/signup">Créer un compte</a></li>
            </ul>
          </div>
          <div className="footer-section contact">
            <h4>Contactez-nous</h4>
            <p>Email : support@patientpath.tn</p>
            <p>Téléphone : (+216) 58 29 28 17</p>
          </div>
          <div className="footer-section newsletter">
            <h4>Restez informé</h4>
            <p>Inscrivez-vous à notre newsletter pour recevoir nos dernières actualités.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 PatientPath — Conçu avec ❤️ pour le bien-être.</p>
        </div>
      </footer>
    </div>
  );
}
