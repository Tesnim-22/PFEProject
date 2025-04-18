import React from 'react';
import { Link } from 'react-router-dom';

const SignupRedirect = () => {
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <h2>⛔️ Profil incomplet</h2>
      <p>Veuillez compléter votre formulaire d'inscription avant d'accéder à votre espace.</p>
      <Link to="/signin" style={{ color: "#0e746b", fontWeight: "bold" }}>
        Revenir à l'inscription
      </Link>
    </div>
  );
};

export default SignupRedirect;
