import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/SignupRedirect.css'; // ajoute un fichier css dédié

const SignupRedirect = () => {
  return (
    <div className="signup-redirect-container">
      <h2>⛔️ Profil incomplet</h2>
      <p>Veuillez compléter votre formulaire d'inscription avant d'accéder à votre espace.</p>
      <Link to="/signin" className="signup-redirect-link">
        Revenir à l'inscription
      </Link>
    </div>
  );
};

export default SignupRedirect;
