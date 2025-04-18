import React, { useState } from 'react';
import '../styles/AdminSignupForm.css';

const AdminSignupForm = () => {
  const [proof, setProof] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('email');

    if (!email || !proof || !accessCode) {
      setMessage("❌ Veuillez fournir toutes les informations requises.");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("proof", proof);
    formData.append("accessCode", accessCode);

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/admin-info', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("profileCompleted", "true");
        setMessage("✅ Inscription administrateur réussie !");
        setTimeout(() => {
          window.location.href = "/admin-dashboard";
        }, 1000);
      } else {
        setMessage(data.message || "❌ Erreur lors de la validation.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-wrapper">
      <div className="admin-form-card">
        <h2>Inscription Administrateur</h2>
        <p>Veuillez prouver votre autorisation via un justificatif et un code d’accès</p>

        {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <label>
            Justificatif (PDF ou image) :
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setProof(e.target.files[0])}
              required
            />
          </label>

          <label>
            Code d'accès :
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Valider" }
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSignupForm;
