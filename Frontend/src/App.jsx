import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useLocation} from 'react-router-dom';

import Navbar from '../components/Navbar';
import Home from '../components/Home';
import Login from '../components/Login';
import Signin from '../components/Signin';
import About from '../components/About';
import Contact from '../components/Contact';
import PatientDashboard from '../components/PatientDashboard';
import DoctorDashboard from '../components/DoctorDashboard';
import LabsDashboard from '../components/LabsDashboard';
import HospitalDashboard from '../components/HospitalDashboard';
import CabinetDashboard from '../components/CabinetDashboard';
import AmbulancierDashboard from '../components/AmbulancierDashboard';
import AmbulancierLocation from '../components/AmbulancierLocation';
import DashboardAdmin from '../components/AdministrateurDashboard';
import ChatBotButton from '../components/ChatBotButton';

import PatientSignupForm from '../components/PatientSignupForm';
import DoctorSignupForm from '../components/DoctorSignupForm';
import CabinetSignupForm from '../components/CabinetSignupForm';
import LabsSignupForm from '../components/LabsSignupForm';
import HospitalSignupForm from '../components/HospitalSignupForm';
import AmbulancierSignupForm from '../components/AmbulancierSignupForm';
import SignupRedirect from '../components/SignupRedirect';

import ForgotPassword from "../components/ForgotPassword";
import ResetPassword from "../components/ResetPassword";
import ArticlesPage from '../components/ArticlesPage';

// 🔒 Route protégée
const ProtectedRoute = ({ children }) => {
  const loggedIn = localStorage.getItem('loggedIn');
  return loggedIn ? children : <Navigate to="/login" />;
};

// 💡 Wrapper avec gestion Navbar
const AppWrapper = () => {
  const location = useLocation();

  // Liste des routes où la Navbar doit apparaître
  const showNavbarRoutes = [
    '/',
    '/about',
    '/articles',
    '/contact',
    '/login',
    '/signin'
  ];

  // Vérifier si la route actuelle doit afficher la Navbar
  const shouldShowNavbar = showNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <ChatBotButton />
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/articles" element={<ArticlesPage />} />

        {/* Redirection après rôle */}
        <Route path="/signup-redirect" element={<SignupRedirect />} />

        {/* Inscriptions */}
        <Route path="/signup/patient" element={<PatientSignupForm />} />
        <Route path="/signup/doctor" element={<DoctorSignupForm />} />
        <Route path="/signup/labs" element={<LabsSignupForm />} />
        <Route path="/signup/hospital" element={<HospitalSignupForm />} />
        <Route path="/signup/cabinet" element={<CabinetSignupForm />} />
        <Route path="/signup/ambulancier" element={<AmbulancierSignupForm />} />

        {/* Dashboards sécurisés */}
        <Route path="/patient-dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
        <Route path="/doctor-dashboard/*" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/labs-dashboard" element={<ProtectedRoute><LabsDashboard /></ProtectedRoute>} />
        <Route path="/hospital-dashboard" element={<ProtectedRoute><HospitalDashboard /></ProtectedRoute>} />
        <Route path="/cabinet-dashboard/*" element={<ProtectedRoute><CabinetDashboard /></ProtectedRoute>} />
        <Route path="/ambulancier-dashboard" element={<ProtectedRoute><AmbulancierDashboard /></ProtectedRoute>} />
        <Route path="/ambulancier/location" element={<ProtectedRoute><AmbulancierLocation /></ProtectedRoute>} />
        <Route path="/dashboard-admin" element={<ProtectedRoute><DashboardAdmin /></ProtectedRoute>} />

        {/* Pages additionnelles pour Ambulancier */}
        <Route path="/ambulance/calls" element={<ProtectedRoute><div>📋 Liste des appels</div></ProtectedRoute>} />
        <Route path="/ambulance/status" element={<ProtectedRoute><div>✅ Mise à jour du statut</div></ProtectedRoute>} />
        <Route path="/ambulance/reports" element={<ProtectedRoute><div>📄 Rapports</div></ProtectedRoute>} />
        <Route path="/ambulance/vehicle-info" element={<ProtectedRoute><div>🛠️ Infos véhicule</div></ProtectedRoute>} />
        
        {/* Pages de réinitialisation de mot de passe */}
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/reset-password/:token" element={<ResetPassword/>} />
      </Routes>
    </>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;
