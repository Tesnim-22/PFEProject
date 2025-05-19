import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import { BrowserRouter } from 'react-router-dom';

// Hero Section Component
const Hero = memo(() => (
  <section className="hero">
    <div className="hero-content">
      <div className="hero-text">
        <h1>Votre santé, <span>simplifiée</span></h1>
        <p className="hero-subtitle">
          Plateforme tout-en-un pour gérer vos rendez-vous, dossiers médicaux
          et communications avec des professionnels certifiés.
        </p>
        <div className="hero-cta">
          <Link to="/signin" className="cta-primary">Commencer maintenant</Link>
        </div>
      </div>
      <div className="hero-visual">
        <img
          src="/assets/doc.jpg"
          alt="Docteure souriante sur l'interface PatientPath"
          className="hero-image"
          loading="lazy"
        />
      </div>
    </div>
  </section>
));

// Feature Card Component
const FeatureCard = memo(({ icon, title, items }) => (
  <div className="feature-card" data-aos="fade-up">
    <div className="feature-icon-wrapper">
      <i className={`fa-solid ${icon} feature-icon`}></i>
    </div>
    <h3>{title}</h3>
    <ul className="feature-list">
      {items.map((item, idx) => (
        <li key={idx} data-aos="fade-right" data-aos-delay={idx * 100}>
          {item}
        </li>
      ))}
    </ul>
  </div>
));

// Features Data
const featuresData = [
  {
    icon: "fa-calendar-check",
    title: "Gestion intelligente des rendez-vous",
    items: [
      "Prise de rendez-vous en ligne 24/7",
      "Rappels automatiques personnalisés",
      "Annulation et reprogrammation facile",
      "Historique des consultations"
    ]
  },
  {
    icon: "fa-folder-open",
    title: "Dossier médical numérique",
    items: [
      "Centralisation sécurisée des documents",
      "Accès multi-appareils instantané",
      "Partage sécurisé avec les praticiens",
      "Suivi des ordonnances"
    ]
  },
  {
    icon: "fa-lock",
    title: "Sécurité et confidentialité",
    items: [
      "Certification HIPAA garantie",
      "Authentification à double facteur",
      "Audits de sécurité réguliers",
      "Chiffrement de bout en bout"
    ]
  }
];

// Features Section Component
const Features = memo(() => (
  <section className="features" id="features">
    <div className="section-header" data-aos="fade-down">
      <h2>Votre parcours santé optimisé</h2>
      <div className="section-decoration">
        <span className="line"></span>
        <i className="fa-solid fa-heart-pulse"></i>
        <span className="line"></span>
      </div>
    </div>
    
    <div className="features-grid">
      {featuresData.map((feature, index) => (
        <FeatureCard 
          key={index}
          {...feature}
          data-aos-delay={index * 200}
        />
      ))}
    </div>
    
    <div className="features-cta" data-aos="fade-up">
      <p>Découvrez comment PatientPath peut transformer votre expérience de santé</p>
      <Link to="/about" className="cta-secondary">
        En savoir plus <i className="fa-solid fa-arrow-right"></i>
      </Link>
    </div>
  </section>
));

// Steps Section Component
const Steps = memo(() => (
  <section className="how-it-works">
    <div className="section-header" data-aos="fade-down">
      <h2>Comment ça marche ?</h2>
      <p className="section-subtitle">3 étapes simples pour prendre soin de vous</p>
    </div>
    <div className="steps-container">
      <div className="steps-grid">
        <div className="step-card" data-aos="fade-up">
          <div className="step-number">1</div>
          <h3>Inscrivez-vous</h3>
          <p>Créez votre compte rapidement et gratuitement.</p>
        </div>

        <div className="step-card" data-aos="fade-up" data-aos-delay="100">
          <div className="step-number">2</div>
          <h3>Réservez un rendez-vous</h3>
          <p>Choisissez un professionnel selon vos disponibilités.</p>
        </div>

        <div className="step-card" data-aos="fade-up" data-aos-delay="200">
          <div className="step-number">3</div>
          <h3>Consultez vos données</h3>
          <p>Accédez à vos résultats et ordonnances en toute sécurité.</p>
        </div>
      </div>
    </div>
  </section>
));

// Stats Data
const statsData = [
  {
    number: "+10 000",
    label: "Utilisateurs satisfaits",
    icon: "fa-users"
  },
  {
    number: "500+",
    label: "Médecins certifiés",
    icon: "fa-user-md"
  },
  {
    number: "25 000",
    label: "Rendez-vous gérés",
    icon: "fa-calendar-check"
  }
];

// Stats Section Component
const Stats = memo(() => (
  <section className="stats-section">
    <div className="stats-grid">
      {statsData.map((stat, index) => (
        <div 
          key={index} 
          className="stat-card"
          data-aos="fade-up"
          data-aos-delay={index * 100}
        >
          <i className={`fas ${stat.icon}`}></i>
          <div className="stat-content">
            <h3>{stat.number}</h3>
            <p>{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
));

// Footer Component
const Footer = memo(() => (
  <footer className="new-footer">
    <div className="footer-container">
      <div className="footer-section brand">
        <h2>PatientPath</h2>
        <div className="social-links">
          <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
          <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
          <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
        </div>
      </div>

      <div className="footer-section links">
        <a href="/about">À propos</a>
        <a href="/services">Services</a>
        <a href="/contact">Contact</a>
      </div>

      <div className="footer-section contact">
        <p>Patientpath@gmail.com</p>
        <p>(+216) 58 29 28 17</p>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} PatientPath</p>
    </div>
  </footer>
));

// WhyChooseUs Section Component
const WhyChooseUs = memo(() => {
  const benefits = [
    {
      id: 1,
      icon: "fa-lightbulb",
      text: "Interface intuitive",
      description: "Navigation simple et efficace"
    },
    {
      id: 2,
      icon: "fa-headset",
      text: "Support 24h/7",
      description: "Assistance disponible à tout moment"
    },
    {
      id: 3,
      icon: "fa-server",
      text: "Données hébergées en Europe",
      description: "Sécurité et conformité RGPD"
    },
    {
      id: 4,
      icon: "fa-mobile-screen",
      text: "Compatible mobile & web",
      description: "Accès depuis tous vos appareils"
    }
  ];

  return (
    <section className="why-patientpath">
      <div className="section-header" data-aos="fade-down">
        <h2>Pourquoi choisir PatientPath ?</h2>
      </div>
      
      <div className="benefits-container">
        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div 
              key={benefit.id} 
              className="benefit-item"
              data-aos="fade-up"
              data-aos-delay={benefit.id * 100}
            >
              <div className="benefit-circle">
                <i className={`fas ${benefit.icon}`}></i>
              </div>
              <div className="benefit-content">
                <h3>{benefit.text}</h3>
                <p>{benefit.description}</p>
              </div>
              <div className="benefit-check">
                <i className="fas fa-check"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// Main Home Component
const Home = memo(() => {
  return (
    <div className="home-modern">
      <Hero />
      <Features />
      <Steps />
      
      <WhyChooseUs />

      <Stats />

      <section className="faq">
        <div className="section-header">
          <h2>Questions fréquentes</h2>
        </div>
        <div className="faq-list">
          {[
            { question: "Est-ce que l'inscription est gratuite ?", answer: "Oui, l'inscription et l'utilisation de base sont totalement gratuites." },
            { question: "Mes données sont-elles sécurisées ?", answer: "Absolument. Nous respectons les normes RGPD et HIPAA." }
          ].map((faq, index) => (
            <div className="faq-item" key={index}>
              <h4>{faq.question}</h4>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-download">
        <h2>Disponible aussi sur mobile</h2>
        <p>Emportez PatientPath partout avec vous</p>
        <div className="app-buttons">
          <a href="#" className="app-store-button">App Store</a>
          <a href="#" className="google-play-button">Google Play</a>
        </div>
      </section>

      <Footer />
    </div>
  );
});

export default Home;
