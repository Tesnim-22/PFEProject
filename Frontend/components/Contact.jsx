import React, { useState } from 'react';
import '../styles/Contact.css';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const confirmSubmit = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setShowModal(false);
    setStatus('');

    try {
      const res = await fetch('http://localhost:5001/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Message envoyé avec succès !');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus(`❌ ${data.message || 'Une erreur est survenue.'}`);
      }
    } catch (err) {
      setStatus('❌ Impossible d’envoyer le message. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-box">
        <h2>Contactez-nous</h2>
        <form onSubmit={confirmSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Votre nom"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Votre email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder="Votre message"
            rows="6"
            value={form.message}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>
          {status && <p className="status-message">{status}</p>}
        </form>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmer l’envoi</h3>
            <p><strong>Nom:</strong> {form.name}</p>
            <p><strong>Email:</strong> {form.email}</p>
            <p><strong>Message:</strong><br />{form.message}</p>
            <div className="modal-buttons">
              <button onClick={handleFinalSubmit} className="confirm-btn">Confirmer</button>
              <button onClick={() => setShowModal(false)} className="cancel-btn">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
