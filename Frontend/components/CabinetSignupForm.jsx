import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/CabinetSignupForm.css';

const CabinetSignupForm = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [search, setSearch] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [cabinetAddress, setCabinetAddress] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [noDoctorsAvailable, setNoDoctorsAvailable] = useState(false);

  const tunisianRegions = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
    'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Medenine',
    'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/medecins-valides');
        setDoctors(response.data);
        if (response.data.length === 0) {
          setNoDoctorsAvailable(true);
          setMessage('❌ Aucun médecin disponible. Tous les médecins sont déjà associés à un cabinet.');
        } else {
          setNoDoctorsAvailable(false);
          const uniqueSpecialties = [...new Set(response.data
            .map(doc => doc.specialty?.trim())
            .filter(Boolean))].sort();
          setSpecialties(uniqueSpecialties);
          setFilteredDoctors(response.data);
        }
      } catch (err) {
        console.error('❌ Erreur récupération médecins:', err);
        setMessage('❌ Erreur lors de la récupération des médecins');
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter((doc) => {
      const matchesSpecialty = !selectedSpecialty || doc.specialty?.trim() === selectedSpecialty;
      const matchesRegion = !selectedRegion || doc.region === selectedRegion;
      const matchesSearch = !search || 
        doc.nom?.toLowerCase().includes(search.toLowerCase()) ||
        doc.prenom?.toLowerCase().includes(search.toLowerCase());
      return matchesSpecialty && matchesRegion && matchesSearch;
    });
    setFilteredDoctors(filtered);
  }, [search, selectedSpecialty, selectedRegion, doctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem('email');

    if (!email || !selectedDoctor || !selectedSpecialty || !cabinetAddress) {
      setMessage('❌ Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5001/cabinet-info', {
        email,
        linkedDoctorId: selectedDoctor,
        specialty: selectedSpecialty,
        adresse: cabinetAddress
      });

      setMessage('✅ Cabinet lié au médecin avec succès !');
      setTimeout(() => {
        window.location.href = '/cabinet-dashboard';
      }, 1200);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setMessage(err.response?.data?.message || '❌ Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cabinet-signup-form">
      <div className="cabinet-form-wrapper">
        <div className="cabinet-form-card">
          <h2>Inscription Cabinet</h2>
          <p>Associez votre cabinet à un médecin existant</p>
          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          {noDoctorsAvailable ? (
            <div className="no-doctors-message">
              <p>Il n'y a actuellement aucun médecin disponible pour être associé à un cabinet.</p>
              <p>Veuillez réessayer ultérieurement ou contacter l'administrateur.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="specialty"><span>Spécialité :</span></label>
                <select id="specialty" value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} required>
                  <option value="">-- Sélectionner une spécialité --</option>
                  {specialties.map((spec, idx) => (
                    <option key={idx} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="region"><span>Région :</span></label>
                <select id="region" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
                  <option value="">-- Toutes les régions --</option>
                  {tunisianRegions.map((region, idx) => (
                    <option key={idx} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="doctor"><span>Médecin à associer :</span></label>
                <select
                  id="doctor"
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  required
                  className="doctor-select"
                >
                  <option value="">-- Sélectionner un médecin --</option>
                  {filteredDoctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.prenom} {doc.nom} - {doc.specialty} ({doc.region || 'Région non spécifiée'})
                    </option>
                  ))}
                </select>
                {filteredDoctors.length === 0 && (
                  <p className="no-results">Aucun médecin ne correspond aux critères sélectionnés</p>
                )}
              </div>

              <div className="form-row">
                <label htmlFor="adresse"><span>Adresse du cabinet :</span></label>
                <input
                  id="adresse"
                  type="text"
                  value={cabinetAddress}
                  onChange={(e) => setCabinetAddress(e.target.value)}
                  placeholder="Adresse complète du cabinet"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Traitement...' : 'Valider l\'inscription'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabinetSignupForm;
