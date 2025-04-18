import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

      if (response.ok) {
        setMessage('Connexion réussie !');
        console.log("✅ Données reçues :", data);

        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('loggedIn', 'true');

        // Nettoyage du rôle pour éviter les bugs
        const role = (data.role || "").trim().toLowerCase();

        switch (role) {
          case 'patient':
            window.location.href = '/dashboard_patient';
            break;
          case 'doctor':
            window.location.href = '/dashboard_doctor';
            break;
          case 'labs':
            window.location.href = '/dashboard_labs';
            break;
          case 'hospital':
            window.location.href = '/dashboard_hospital';
            break;
          case 'cabinet':
            window.location.href = '/dashboard_cabinet';
            break;
          case 'ambulancier':
            window.location.href = '/dashboard_ambulancier';
            break;
            case 'administrateur':
              window.location.href = '/admin-dashboard';
              break;            
          default:
            console.warn("❓ Rôle inconnu :", role);
            window.location.href = '/';
        }

      } else {
        setMessage(data.message || 'Échec de la connexion.');
      }
    } catch (error) {
      console.error('Erreur de connexion :', error);
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
