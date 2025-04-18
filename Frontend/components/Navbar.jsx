import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaInfoCircle, FaEnvelope, FaSignInAlt, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); 

  const handleLogout = () => {
    localStorage.removeItem('userRole'); 
    localStorage.removeItem('loggedIn'); 
    window.location.href = '/'; 
  };

  const isDashboard = location.pathname.includes('dashboard');

  return (
    <nav className="navbar">
      <ul className="nav-links centered-nav-links"> {/* Added class for centering */}
        <li><Link to="/"><FaHome /> Home</Link></li>
        <li><Link to="/about"><FaInfoCircle /> About</Link></li>
        <li><Link to="/contact"><FaEnvelope /> Contact</Link></li>
        <li><Link to="/login"><FaSignInAlt /> Login</Link></li>
        <li><Link to="/signin"><FaUserPlus /> Signin</Link></li>
        {isDashboard && (
          <li>
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt /> Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
