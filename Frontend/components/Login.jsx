import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email || !password) {
      setMessage('Veuillez remplir tous les champs.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password
        })
      });

      const data = await response.json();
      console.log("✅ Données reçues au login :", data);


      if (response.ok) {
        // ✅ Enregistrement complet des données utilisateur
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', data.email); // ✅ ESSENTIEL
        localStorage.setItem('loggedIn', 'true');

        const role = (data.role || "").trim().toLowerCase();
        const normalizedRole = role.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (!data.profileCompleted) {
          switch (normalizedRole) {
            case 'patient': navigate('/signup/patient'); break;
            case 'doctor': navigate('/signup/doctor'); break;
            case 'labs':
            case 'laboratoire': navigate('/signup/labs'); break;
            case 'hospital':
            case 'hopital': navigate('/signup/hospital'); break;
            case 'cabinet': navigate('/signup/cabinet'); break;
            case 'ambulancier': navigate('/signup/ambulancier'); break;
            case 'admin': navigate('/signup/admin'); break;
            default: setMessage("Rôle non reconnu pour la redirection.");
          }
        } else {
          switch (normalizedRole) {
            case 'patient': navigate('/patient-dashboard'); break;
            case 'doctor': navigate('/doctor-dashboard'); break;
            case 'laboratoire':
            case 'labs': navigate('/labs-dashboard'); break;
            case 'cabinet': navigate('/cabinet-dashboard'); break;
            case 'ambulancier': navigate('/ambulancier-dashboard'); break;
            case 'hospital':
            case 'hopital': navigate('/hospital-dashboard'); break;
            case 'admin': navigate('/dashboard-admin'); break;
            default: setMessage("Rôle non reconnu pour la redirection.");
          }
        }
      } else {
        setMessage(data.message || 'Échec de la connexion.');
      }
    } catch (error) {
      console.error('❌ Erreur de connexion :', error);
      setMessage('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-box"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2>Connexion utilisateur</h2>
        {message && <div className="message">{message}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <div className="signin-link">
          Pas encore de compte ? <Link to="/signin">Créer un compte</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
