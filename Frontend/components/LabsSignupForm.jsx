import React, { useState } from 'react';
import '../styles/LabsSignupForm.css';

const LabsSignupForm = () => {
  const [workCard, setWorkCard] = useState(null);
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem('email');

    if (!email || !workCard || !address.trim()) {
      setMessage("❌ Veuillez remplir tous les champs.");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("address", address);
    formData.append("workCard", workCard);

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5001/labs-info", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("profileCompleted", "true");
        setMessage("✅ Informations envoyées avec succès !");
        setTimeout(() => {
          window.location.href = "/labs-dashboard";
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
    <div className="labs-form-wrapper">
      <div className="labs-form-card">
        <h2>Inscription Laboratoire</h2>
        <p>Complétez votre profil en fournissant les informations requises</p>

        {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <label>
            Adresse du laboratoire :
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Ex: Rue Ibn Khaldoun, Tunis"
            />
          </label>

          <label>
            Carte de travail (PDF ou image) :
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setWorkCard(e.target.files[0])}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Valider"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LabsSignupForm;
