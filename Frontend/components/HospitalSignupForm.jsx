import React, { useState } from 'react';
import '../styles/HospitalSignupForm.css';

const HospitalSignupForm = () => {
  const [adresse, setAdresse] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    const email = localStorage.getItem('email');

    if (!email || !adresse.trim()) {
      setMessage("❌ Veuillez renseigner l'adresse.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/hospital-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, adresse })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      localStorage.setItem('profileCompleted', 'true');
      setMessage("✅ Inscription validée.");
      setTimeout(() => {
        window.location.href = '/hospital-dashboard';
      }, 1000);
    } catch (error) {
      console.error('Erreur validation hôpital:', error);
      setMessage("❌ Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-signup-form">
      <div className="hospital-form-card">
        <h2>Bienvenue, Hôpital</h2>
        <p>Veuillez renseigner l'adresse de l'établissement.</p>

        <input
          type="text"
          placeholder="Adresse de l'hôpital"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
        />

        {message && <p className="message">{message}</p>}

        <button onClick={handleValidate} disabled={loading}>
          {loading ? "Chargement..." : "Valider"}
        </button>
      </div>
    </div>
  );
};

export default HospitalSignupForm;
