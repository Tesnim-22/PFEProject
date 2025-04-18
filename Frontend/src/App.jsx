import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import ChatBotButton from '../components/ChatBotButton';
import AmbulancierDashboard from '../components/AmbulancierDashboard';
import AmbulancierLocation from '../components/AmbulancierLocation';
import AdministrateurDashboard from '../components/AdministrateurDashboard';
import PatientSignupForm from '../components/PatientSignupForm'; // ✅ GARDER cette ligne
import DoctorSignupForm from '../components/DoctorSignupForm';
import CabinetSignupForm from '../components/CabinetSignupForm' ;
import LabsSignupForm from '../components/LabsSignupForm'
import HospitalSignupForm from '../components/HospitalSignupForm'
import AmbulancierSignupForm from '../components/AmbulancierSignupForm'
// 👉 Temp components pour les autres rôles (à remplacer plus tard)
const AdminSignupForm = () => <h2>Administrateur Signup Form</h2>;

const ProtectedRoute = ({ children }) => {
  const loggedIn = localStorage.getItem('loggedIn');
  return loggedIn ? children : <Navigate to="/login" />;
};

const AppWrapper = () => {
  const location = useLocation();

  const dashboardRoutes = [
    '/patient-dashboard',
    '/doctor-dashboard',
    '/labs-dashboard',
    '/hospital-dashboard',
    '/cabinet-dashboard',
    '/ambulancier-dashboard',
    '/ambulancier/location',
    '/admin-dashboard',
  ];

  const hideNavbar = dashboardRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <ChatBotButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Signin />} />

        {/* Routes vers les formulaires spécifiques selon le rôle */}
        <Route path="/signup/patient" element={<PatientSignupForm />} />
        <Route path="/signup/doctor" element={<DoctorSignupForm />} />
        <Route path="/signup/labs" element={<LabsSignupForm />} />
        <Route path="/signup/hospital" element={<HospitalSignupForm />} />
        <Route path="/signup/cabinet" element={<CabinetSignupForm />} />
        <Route path="/signup/ambulancier" element={<AmbulancierSignupForm />} />
        <Route path="/signup/admin" element={<AdminSignupForm />} />

        {/* Dashboards */}
        <Route path="/patient-dashboard" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
        <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/labs-dashboard" element={<ProtectedRoute><LabsDashboard /></ProtectedRoute>} />
        <Route path="/hospital-dashboard" element={<ProtectedRoute><HospitalDashboard /></ProtectedRoute>} />
        <Route path="/cabinet-dashboard" element={<ProtectedRoute><CabinetDashboard /></ProtectedRoute>} />
        <Route path="/ambulancier-dashboard" element={<ProtectedRoute><AmbulancierDashboard /></ProtectedRoute>} />
        <Route path="/ambulancier/location" element={<ProtectedRoute><AmbulancierLocation /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute><AdministrateurDashboard /></ProtectedRoute>} />

        {/* Ambulance placeholders */}
        <Route path="/ambulance/calls" element={<div>📋 Assigned Calls List (Coming Soon)</div>} />
        <Route path="/ambulance/status" element={<div>📡 Status Update Page (Coming Soon)</div>} />
        <Route path="/ambulance/reports" element={<div>📝 Reports Form (Coming Soon)</div>} />
        <Route path="/ambulance/vehicle-info" element={<div>🚐 Vehicle Info Management (Coming Soon)</div>} />
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
