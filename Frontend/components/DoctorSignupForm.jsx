import React, { useState } from 'react';
import '../styles/DoctorSignupForm.css';

const DoctorSignupForm= () => {
  const [specialty, setSpecialty] = useState('');
  const [diploma, setDiploma] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('email'); // ✅ récupère l'email du localStorage

    if (!email || !specialty || !diploma || !photo) {
      setMessage("Tous les champs sont requis.");
      return;
    }

    const formData = new FormData();
    formData.append('email', email); // ✅ envoie l'email au backend
    formData.append('specialty', specialty);
    formData.append('diploma', diploma);
    formData.append('photo', photo);

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5001/doctor-info", {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        // ✅ mise à jour localStorage
        localStorage.setItem("profileCompleted", "true");
        setMessage("✅ Inscription réussie !");
        setTimeout(() => {
          window.location.href = '/doctor-dashboard';
        }, 1500);
      } else {
        setMessage(data.message || "❌ Erreur serveur.");
      }
    } catch (err) {
      setMessage("❌ Erreur lors de l’envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-form-container">
      <h2>Inscription Médecin</h2>
      {message && <p className={`message ${message.includes("✅") ? 'success' : 'error'}`}>{message}</p>}
      <form onSubmit={handleSubmit} className="doctor-form" encType="multipart/form-data">
        <label>
          Spécialité :
          <input
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Ex: Cardiologue"
            required
          />
        </label>

        <label className="file-upload">
          Diplôme :
          <input
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={(e) => setDiploma(e.target.files[0])}
            required
          />
        </label>

        <label className="file-upload">
          Photo de profil :
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Envoi en cours..." : "Valider"}
        </button>
      </form>
    </div>
  );
};

export default DoctorSignupForm;
