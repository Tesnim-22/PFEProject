import React, { useState, useEffect } from 'react';

const PatientDashboard = () => {
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [appointmentMessage, setAppointmentMessage] = useState('');

  // Champs pour le formulaire de rendez-vous
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (storedId) {
      setUserId(storedId);
    } else {
      setMessage("ID utilisateur non trouvé. Veuillez vous reconnecter.");
      console.error("❌ Aucun ID trouvé dans localStorage !");
    }
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!userId) {
      setMessage("Impossible de mettre à jour le profil sans identifiant.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/patient/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyPhone, bloodType, chronicDiseases, photo }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Profil mis à jour avec succès');
      } else {
        setMessage(data.message || '❌ Erreur lors de la mise à jour.');
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('❌ Erreur de connexion au serveur.');
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setAppointmentMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: localStorage.getItem('userEmail'), // Assure-toi que cet email est stocké
          doctorId,
          date,
          time,
          reason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppointmentMessage('✅ Rendez-vous créé avec succès');
      } else {
        setAppointmentMessage(data.message || '❌ Échec de la création du rendez-vous.');
      }
    } catch (error) {
      console.error('Appointment error:', error);
      setAppointmentMessage('❌ Erreur de connexion au serveur.');
    }
  };

  return (
    <div className="dashboard">
      <h2>🧬 Mettre à jour le profil patient</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleProfileSubmit}>
        <input
          type="text"
          placeholder="Téléphone d'urgence"
          value={emergencyPhone}
          onChange={(e) => setEmergencyPhone(e.target.value)}
          required
        />
        <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
          <option value="">Groupe sanguin (optionnel)</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
        <input
          type="text"
          placeholder="Maladies chroniques (optionnel)"
          value={chronicDiseases}
          onChange={(e) => setChronicDiseases(e.target.value)}
        />
        <input
          type="text"
          placeholder="Lien de la photo (optionnel)"
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
        />
        <button type="submit">💾 Enregistrer</button>
      </form>

      <hr style={{ margin: '30px 0' }} />

      <h2>📅 Prendre un rendez-vous</h2>
      {appointmentMessage && <p>{appointmentMessage}</p>}
      <form onSubmit={handleAppointmentSubmit}>
        <input
          type="text"
          placeholder="ID du médecin"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Raison du rendez-vous"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button type="submit">📨 Envoyer la demande</button>
      </form>
    </div>
  );
};

export default PatientDashboard;
