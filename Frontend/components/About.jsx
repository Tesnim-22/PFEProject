import React from 'react';
import { motion } from 'framer-motion';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-container">
      <motion.div
        className="about-header"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1>À propos de PatientPath</h1>
        <p>Transformer votre expérience santé grâce à l'innovation et à l'humain.</p>
      </motion.div>

      <section className="about-content">
        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Notre mission</h2>
          <p>
            Offrir à chaque patient une expérience de santé connectée, rapide et sécurisée, 
            en facilitant l’accès aux médecins, laboratoires et établissements partenaires.
            Notre engagement : rendre les soins accessibles et personnalisés.
          </p>
        </motion.div>

        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2>Notre vision</h2>
          <p>
            Réinventer la santé de demain : une santé plus humaine, plus rapide et plus fiable.
            Grâce à la technologie, nous voulons rapprocher les patients de la meilleure expertise médicale, partout et à tout moment.
          </p>
        </motion.div>

        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2>Pourquoi choisir PatientPath ?</h2>
          <ul>
            <li>✔️ Plateforme santé tout-en-un</li>
            <li>✔️ Sécurité et confidentialité des données</li>
            <li>✔️ Prise de rendez-vous simplifiée</li>
            <li>✔️ Communication directe avec vos professionnels de santé</li>
            <li>✔️ Engagement qualité et écoute patient</li>
          </ul>
        </motion.div>
      </section>

      {/* CTA Section */}
      <div className="about-cta">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <a href="/signup" className="about-cta-button">
            Rejoignez PatientPath
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
