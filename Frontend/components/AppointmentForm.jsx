import React, { useState, useEffect } from 'react';
import '../styles/AppointmentForm.css';

const AppointmentForm = () => {
  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 🧑 Charger la liste des médecins
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('http://localhost:5001/admin/users');
        const data = await res.json();
        const doctors = data.filter(user => user.role === 'Doctor');
        setDoctorList(doctors);
      } catch (err) {
        console.error('Erreur chargement médecins:', err);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const patientEmail = localStorage.getItem('email');

    if (!patientEmail || !selectedDoctor || !date || !time) {
      setMessage("❌ Tous les champs sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail,
          doctorId: selectedDoctor,
          date,
          time,
          reason
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Rendez-vous pris avec succès !");
        setDate('');
        setTime('');
        setReason('');
        setSelectedDoctor('');
      } else {
        setMessage(data.message || "❌ Échec de la demande.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-form-wrapper">
      <div className="appointment-form-card">
        <h2>Prendre un rendez-vous</h2>

        {message && <div className={`message ${message.includes("✅") ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Choisir un médecin :
            <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required>
              <option value="">-- Sélectionner --</option>
              {doctorList.map((doc) => (
                <option key={doc._id} value={doc._id}>{doc.email}</option>
              ))}
            </select>
          </label>

          <label>
            Date :
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          <label>
            Heure :
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>

          <label>
            Motif du rendez-vous :
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Facultatif"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Envoi..." : "Valider le rendez-vous"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
