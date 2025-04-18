import React, { useState, useEffect } from 'react';
import '../styles/AmbulancierSignupForm.css';

const AmbulancierSignupForm = () => {
  const [diploma, setDiploma] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await fetch('http://localhost:5001/hospitals');
        const data = await res.json();
        setHospitals(data);
      } catch (err) {
        console.error('Erreur récupération hôpitaux:', err);
      }
    };

    fetchHospitals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('email');

    if (!email || !diploma || !selectedHospital) {
      setMessage("❌ Veuillez remplir tous les champs.");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("diploma", diploma);
    formData.append("hospitalId", selectedHospital);

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/ambulancier-info', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("profileCompleted", "true");
        setMessage("✅ Inscription validée !");
        setTimeout(() => {
          window.location.href = "/ambulancier-dashboard";
        }, 1000);
      } else {
        setMessage(data.message || "❌ Erreur serveur.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l’envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambulancier-form-wrapper">
      <div className="ambulancier-form-card">
        <h2>Inscription Ambulancier</h2>
        <p>Associez-vous à un hôpital et fournissez votre diplôme</p>

        {message && <div className={`message ${message.includes("✅") ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <label>
            Diplôme :
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDiploma(e.target.files[0])}
              required
            />
          </label>

          <label>
            Hôpital affilié :
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              required
            >
              <option value="">-- Choisir un hôpital --</option>
              {hospitals.map(h => (
                <option key={h._id} value={h._id}>
                  {h.nom || ''} {h.prenom || ''} - {h.email}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Valider"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AmbulancierSignupForm;
