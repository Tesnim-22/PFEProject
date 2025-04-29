import React, { useEffect, useState } from 'react';
import '../styles/CabinetSignupForm.css';

const CabinetSignupForm = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [search, setSearch] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [cabinetAddress, setCabinetAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/valid-doctors');

        const data = await res.json();
        setDoctors(data);
        const uniqueSpecialties = [...new Set(data.map(doc => doc.specialty?.trim()).filter(Boolean))];
        setSpecialties(uniqueSpecialties);
      } catch (err) {
        console.error('Erreur récupération médecins:', err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter(
      (doc) =>
        doc.specialty?.trim() === selectedSpecialty.trim() &&
        (doc.nom?.toLowerCase().includes(search.toLowerCase()) ||
         doc.prenom?.toLowerCase().includes(search.toLowerCase()) ||
         doc.email?.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredDoctors(filtered);
  }, [search, doctors, selectedSpecialty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem('email');

    if (!email || !selectedDoctor || !selectedSpecialty || !cabinetAddress) {
      setMessage('❌ Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/cabinet-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          linkedDoctorId: selectedDoctor,
          specialty: selectedSpecialty,
          adresse: cabinetAddress
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage('✅ Cabinet lié au médecin avec succès !');
      setTimeout(() => {
        window.location.href = '/cabinet-dashboard';
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage(err.message || '❌ Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cabinet-form-wrapper">
      <div className="cabinet-form-card">
        <h2>Inscription Cabinet</h2>
        <p>Associez votre cabinet à un médecin existant</p>
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label>Spécialité :
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              required
            >
              <option value="">-- Sélectionner une spécialité --</option>
              {specialties.map((spec, idx) => (
                <option key={idx} value={spec}>{spec}</option>
              ))}
            </select>
          </label>

          <label>Rechercher un médecin :
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, prénom ou email"
            />
          </label>

          <label>Médecin à associer :
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              required
            >
              <option value="">-- Sélectionner un médecin --</option>
              {filteredDoctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.prenom} {doc.nom} - {doc.email}
                </option>
              ))}
            </select>
          </label>

          <label>Adresse du cabinet :
            <input
              type="text"
              value={cabinetAddress}
              onChange={(e) => setCabinetAddress(e.target.value)}
              placeholder="Adresse du cabinet"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Traitement...' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CabinetSignupForm;
