import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css'; // Ton style existant

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false); // ➡️ nouveau petit état

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(false);

    try {
      const response = await fetch('http://localhost:5001/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setError(false);
      } else {
        setMessage(data.message || 'Erreur lors de la demande.');
        setError(true);
      }
    } catch (error) {
      console.error('Erreur demande mot de passe :', error);
      setMessage('Erreur lors de la demande.');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Mot de passe oublié</h2>
        {message && (
          <div
            className="message"
            style={{ color: error ? 'red' : 'green', marginBottom: '10px' }}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
        <div className="signin-link">
          <Link to="/login">← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
