import React, { useState, useEffect } from 'react';
import '../styles/AppointmentForm.css';

const API_BASE_URL = 'http://localhost:5001';

const AppointmentForm = () => {
  const [type, setType] = useState('');
  const [doctorList, setDoctorList] = useState([]);
 

  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔁 Récupération des médecins validés uniquement
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/medecins-valides`);
        const data = await res.json();
        setDoctorList(data);
      } catch (err) {
        console.error('❌ Erreur chargement médecins:', err);
      }
    };

    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const patientId = localStorage.getItem('userId');
    if (!patientId || !selectedDoctor || !date || !time) {
      setMessage("❌ Tous les champs sont obligatoires.");
      return;
    }
  
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          patientId: patientId,
          date: `${date}T${time}`, // ➡️ Important : assembler date + heure
          reason
        })
      });
  
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Rendez-vous pris avec succès !");
        setType('');
        setSelectedDoctor('');
        setDate('');
        setTime('');
        setReason('');
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
  
  // 🔍 Filtrer les médecins selon le type (Cabinet ou Hôpital)
  const filteredDoctors = doctorList.filter(doc => {
    const role = doc.roles?.[0]?.toLowerCase();

if (type === 'Cabinet') return role === 'cabinet' || role === 'doctor';
if (type === 'Hopital') return role === 'hopital' || role === 'hospital';


    return false;
  });

  return (
    <div className="appointment-form-wrapper">
      <div className="appointment-form-card">
        <h2>Prendre un rendez-vous</h2>

        {message && (
          <div className={`message ${message.includes("✅") ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Choisir entre Cabinet ou Hôpital :
            <select value={type} onChange={(e) => setType(e.target.value)} required>
              <option value="">-- Sélectionner --</option>
              <option value="Cabinet">Cabinet</option>
              <option value="Hopital">Hôpital</option>
            </select>
          </label>

          {type && (
            <>
              <label>
                Choisir un médecin ({type}) :
                <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required>
                  <option value="">-- Sélectionner --</option>
                  {filteredDoctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.nom} {doc.prenom} - {doc.specialty}
                    </option>
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
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
