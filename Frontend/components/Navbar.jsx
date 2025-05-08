import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaInfoCircle,
  FaEnvelope,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaNewspaper
} from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(window.scrollY);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('loggedIn');
    window.location.href = '/';
  };

  const isDashboard = location.pathname.includes('dashboard');

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`navbar ${visible ? 'show' : 'hide'}`}>
      <ul className="nav-links centered-nav-links">
        <li><Link to="/"><FaHome /> Home</Link></li>
        <li><Link to="/articles"><FaNewspaper /> Articles</Link></li>
        <li><Link to="/about"><FaInfoCircle /> About</Link></li>
        <li><Link to="/contact"><FaEnvelope /> Contact</Link></li>
        <li><Link to="/login"><FaSignInAlt /> Login</Link></li>
        <li><Link to="/signin"><FaUserPlus /> Signup</Link></li>
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
