import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PatientSignupForm.css';

const PatientSignupForm = () => {
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emergencyPhone) {
      setMessage("Le téléphone d'urgence est obligatoire.");
      return;
    }
    
    const userId = localStorage.getItem('userId');
    console.log('🔍 UserId récupéré depuis localStorage:', userId);
    
    if (!userId) {
      setMessage("❌ Erreur: ID utilisateur non trouvé. Veuillez vous reconnecter.");
      return;
    }
    
    // Debug : Afficher les données envoyées
    console.log('📋 Données à envoyer:', {
      emergencyPhone,
      bloodType,
      chronicDiseases,
      photoSelected: !!photo
    });
    
    try {
      console.log('🚀 Envoi des données vers:', `http://localhost:5001/patient/profile/${userId}`);
      
      if (photo) {
        // Si une photo est sélectionnée, utiliser FormData
        const formData = new FormData();
        formData.append('emergencyPhone', emergencyPhone || '');
        formData.append('bloodType', bloodType || '');
        formData.append('chronicDiseases', chronicDiseases || '');
        formData.append('photo', photo);
        
        const response = await fetch(`http://localhost:5001/patient/profile/${userId}`, {
          method: 'PUT',
          body: formData,
        });
        
        const result = await response.json();
        console.log('📥 Réponse reçue (avec photo):', result);
        
        if (response.ok) {
          setMessage('✅ Profil patient complété avec succès !');
          localStorage.setItem('profileCompleted', 'true');
          setTimeout(() => {
            navigate('/patient-dashboard');
          }, 1000);
        } else {
          setMessage(result.message || '❌ Une erreur est survenue.');
        }
      } else {
        // Si pas de photo, utiliser JSON comme dans PatientDashboard
        const response = await fetch(`http://localhost:5001/patient/profile/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emergencyPhone: emergencyPhone || '',
            bloodType: bloodType || '',
            chronicDiseases: chronicDiseases || ''
          }),
        });
        
        const result = await response.json();
        console.log('📥 Réponse reçue (sans photo):', result);
        
        if (response.ok) {
          setMessage('✅ Profil patient complété avec succès !');
          localStorage.setItem('profileCompleted', 'true');
          setTimeout(() => {
            navigate('/patient-dashboard');
          }, 1000);
        } else {
          setMessage(result.message || '❌ Une erreur est survenue.');
        }
      }
    } catch (error) {
      console.error('Erreur formulaire patient :', error);
      setMessage('❌ Erreur serveur.');
    }
  };

  return (
    <div className="patient-signup-form">
      <div className="patient-form-wrapper">
        <div className="patient-form-card">
          <h2>Complétez votre inscription - Patient</h2>
          {message && (
            <p className={message.startsWith('✅') ? 'success-message' : 'error-message'}>
              {message}
            </p>
          )}
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <label>
              Numéro de téléphone d'urgence :
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                required
              />
            </label>

            <label>
              Groupe sanguin (optionnel) :
              <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                <option value="">-- Sélectionnez --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label>
              Maladies chroniques (optionnel) :
              <textarea
                value={chronicDiseases}
                onChange={(e) => setChronicDiseases(e.target.value)}
                placeholder="Diabète, hypertension, etc."
              />
            </label>

            <label>
              Photo de profil :
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>

            {preview && (
              <div className="preview-container">
                <img src={preview} alt="Aperçu" />
              </div>
            )}

            <button type="submit" className="submit-btn">Valider</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientSignupForm;
