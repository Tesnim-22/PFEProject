import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Réutilise ton style

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`http://localhost:5001/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Erreur reset mot de passe :', error);
      setMessage('Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Réinitialiser mot de passe</h2>
        {message && <div className="message">{message}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Réinitialisation...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
