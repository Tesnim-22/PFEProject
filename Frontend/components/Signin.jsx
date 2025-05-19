import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/Signin.css';

const Signin = () => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState(null);
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [cin, setCin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [region, setRegion] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const regions = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
    'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia',
    'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Medenine',
    'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
  ];

  const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (!isStrongPassword(password)) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.");
      setLoading(false);
      return;
    }

    if (!role) {
      setMessage("Veuillez choisir un rôle.");
      setLoading(false);
      return;
    }

    if (!region) {
      setMessage("Veuillez choisir une région.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom, prenom, dateNaissance, email: email.toLowerCase(),
          telephone, adresse, cin, password, role, region
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Inscription réussie ! Redirection...');
        localStorage.setItem("email", email.toLowerCase());
        setTimeout(() => {
          switch (role) {
            case 'Patient': navigate('/signup/patient'); break;
            case 'Doctor': navigate('/signup/doctor'); break;
            case 'Labs': navigate('/signup/labs'); break;
            case 'Hospital': navigate('/signup/hospital'); break;
            case 'Cabinet': navigate('/signup/cabinet'); break;
            case 'Ambulancier': navigate('/signup/ambulancier'); break;
            default: navigate('/');
          }
        }, 1000);
      } else {
        setMessage(data.message || 'Erreur lors de l\'inscription.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setMessage("Erreur serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page-wrapper">
      <div className="signin-page">
        <div className="signin-container">
          <div className="signin-left">
            <img src="/assets/logovert.jpg" alt="Patient Care Logo" />
          </div>

          <motion.div
            className="signin-box"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="signin-header">
              <h2>Créer un compte</h2>
            </div>

            {message && <div className="message">{message}</div>}

            <form className="signin-form signup-form" onSubmit={handleSubmit}>
              <div className="name-fields">
                <input type="text" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
                <input type="text" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
              </div>

              <div className="full-width">
                <DatePicker
                  selected={dateNaissance}
                  onChange={(date) => setDateNaissance(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Date de naissance"
                  className="react-datepicker-custom"
                  maxDate={new Date()}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  required
                />
              </div>

              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="tel" placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
              <input type="text" placeholder="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} required />
              <input type="text" placeholder="CIN" value={cin} onChange={(e) => setCin(e.target.value)} required />

              <div className="password-fields">
                <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <input type="password" placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              <small className="password-hint">8 caractères min. avec majuscule, minuscule, chiffre, symbole.</small>

              <div className="select-fields">
                <select value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="">-- Sélectionnez un rôle --</option>
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Labs">Labs</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Cabinet">Cabinet</option>
                  <option value="Ambulancier">Ambulancier</option>
                </select>

                <select value={region} onChange={(e) => setRegion(e.target.value)} required>
                  <option value="">-- Sélectionnez une région --</option>
                  {regions.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="submit-btn">
                {loading ? 'Création...' : 'Créer un compte'}
              </button>
            </form>

            <div className="signin-footer">
              <p>Déjà inscrit ? <Link to="/login" className="signin-link">Se connecter</Link></p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
