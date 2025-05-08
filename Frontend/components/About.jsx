import React from 'react';
import { motion } from 'framer-motion';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-container">
      <motion.header
        className="about-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1>À propos de <span className="highlight">PatientPath</span></h1>
        <p>
          Une plateforme intelligente dédiée à la transformation numérique du parcours de soins,
          au service des patients et des professionnels de santé.
        </p>
      </motion.header>

      <section className="about-content">
        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2>🎯 Notre Mission</h2>
          <p>
            Offrir à chaque individu un accès simplifié à un écosystème médical complet,
            grâce à une interface intuitive et sécurisée. Nous permettons la coordination fluide entre
            patients, médecins, laboratoires et établissements de santé.
          </p>
        </motion.div>

        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <h2>🚀 Notre Vision</h2>
          <p>
            Révolutionner l’accès aux soins en créant un lien direct entre technologie et humanité.
            PatientPath ambitionne d’être un acteur central de la santé connectée, où chaque
            interaction est pensée pour simplifier et améliorer la prise en charge médicale.
          </p>
        </motion.div>

        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <h2>💡 Ce qui nous distingue</h2>
          <ul>
            <li> Accès rapide à des rendez-vous médicaux et résultats d’analyse</li>
            <li> Interface ergonomique pensée pour tous les âges</li>
            <li> Suivi personnalisé du patient, centralisation des données</li>
            <li> Sécurité et conformité RGPD pour vos informations de santé</li>
            <li> Collaboration renforcée entre praticiens et structures de santé</li>
          </ul>
        </motion.div>

        <motion.div
          className="about-section"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.9 }}
        >
          <h2>🤝 Une plateforme, plusieurs rôles</h2>
          <p>
            PatientPath s’adresse à l’ensemble des acteurs de la santé : patients, médecins, laboratoires,
            cabinets, ambulanciers, et hôpitaux. Chaque rôle bénéficie d’un tableau de bord dédié,
            optimisé pour ses besoins.
          </p>
        </motion.div>
      </section>

      <motion.div
        className="about-cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <a href="/signup" className="about-cta-button">
          Commencez votre parcours avec PatientPath
        </a>
      </motion.div>
    </div>
  );
};

export default About;
