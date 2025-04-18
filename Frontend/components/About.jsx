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
        transition={{ duration: 1 }}
      >
        <h1>About Our HealthCare Platform</h1>
        <p>Committed to improving healthcare experiences through innovation and care.</p>
      </motion.div>

      <section className="about-content">
        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <h2>Our Mission</h2>
          <p>
            Our mission is to deliver exceptional healthcare services by connecting patients, doctors, labs, and hospitals seamlessly.
            We prioritize patient-centric care, quality diagnostics, and efficient medical management.
          </p>
        </motion.div>

        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <h2>Our Vision</h2>
          <p>
            To revolutionize healthcare delivery, making it accessible, efficient, and patient-focused through advanced technology and compassionate care.
          </p>
        </motion.div>

        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
        >
          <h2>Why Choose Us?</h2>
          <ul>
            <li>✔️ Comprehensive healthcare solutions</li>
            <li>✔️ Collaborative approach with healthcare providers</li>
            <li>✔️ Patient-first philosophy</li>
            <li>✔️ Cutting-edge technology</li>
            <li>✔️ Transparent and effective communication</li>
          </ul>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
