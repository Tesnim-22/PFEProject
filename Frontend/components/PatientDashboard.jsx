import React, { useState, useEffect, useRef } from 'react';
import AppointmentForm from './AppointmentForm';
import '../styles/PatientDashboard.css';
import axios from 'axios';
import { FaUser, FaCalendarAlt, FaFileMedical, FaFlask, FaComments, FaBell, FaSignOutAlt, FaUserCircle } from "react-icons/fa";

const API_BASE_URL = 'http://localhost:5001';

// Image par défaut en base64 (une petite image grise avec une icône de document)
const DEFAULT_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFHWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL25zLmFkb2JlLmNvbS9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDI0LTAzLTE5VDE1OjQ3OjE4KzAxOjAwIiB4bWxuczpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMTlUMTU6NDc6MTgrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAzLTE5VDE1OjQ3OjE4KzAxOjAwIiB4bWBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY2ZjI5ZjFiLTQ4ZDYtNDZhNi1hZTM0LTNkYjNhOTNmMWE2ZiIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+YjqoRwAABGxJREFUaIHtmU9oHFUcxz/vzczO7G42m91kN0mbNKlpqkWqVkGkKFiwelBEevDiqQcv3qQXEVE8ehL04EFE8KAH/4AHwYNVKyoWqW1Tg7U1pmmTbLLZ3c3uzO7szrwedrOZnZ3ZzP5Jk0I/EJZ5v/d77/t93/vN7828UZRSPMxQH3TnQwCDxkMPYNAY9BK6I1RVxXGcO0LTNFRF6Rp3L3BXAVi2hWmauK6L4zgAhEIhwuEwmqbdKyj3DoBpmhiGgeu6GIaBpmkIIQiFQoRCIRRFQdf1ewVi8ADa7Ta2bSOlxHVdXNdFVVU0TUPTNKSUWJaFbduEw2E0TRsokIECsG0by7JQVRXP8/A8D1VViUQiRCIRVFVFCEGr1cKyLCKRCJFIZGAgBgbAcRxM00QIged5CCGIRCJEo1HC4TCKouA4DkIIDMNACEE0Gh0IiIEAkFLS6XSQUuJ5HoqiEI1GiUajhEKhzn3gOA62bSOEwHVdPM8jGo2i6/p9AyGklNi2jed5nQtZVVVisRixWKxrXpumSbvdxvM8FEUhHA4TiUTQdf2+LKl7PoVc18UwDKSUGIaBpmkMDQ0Ri8W6wgPE43GGhoY6S0kIQbvdxjTNe76k7vkMmKaJbduYponrugghCIfDRKPR+wLingGQUmIYBp7n0W63URSFoaEhEokEuq4jhMA0TaSUtNtthBB4noeu68RiMcLh8IABtNttLMvCcRwsy0LXdRKJBMlkknA4jBACwzBwXRfLsnAcB8/z0DSNeDxOKBQaHADXdWm1WkgpabfbqKpKMpkkmUyi6zqe59FqtZBSYpomtm13Zmd4eJhwODw4AJZlYRgGnufRbDYJhUIkk0mSySSRSATXdWk0GriuS6vVwnEcpJREo1Hi8TihUGhwAEzTxLIsXNel0WigaRrDw8OkUimGhoZwHIdGo4HjODQaDaSUeJ5HPB4nkUigquqDXUKGYeC6LrZt02g00DSNVCpFOp0mFoth2zb1ep12u02z2cTzPFRVJZFIkEgkBgfAsixarRau61Kv11FVlXQ6TTqdJhaL0W63qdVqtNtter0eQghisRipVGpwABzHodls4nkejUYDRVFIp9NkMhni8TiWZVGr1bAsi3q9jpSSUChEMpkkkUgMDoDneRiGgZQSwzBQFIVMJsPIyAjJZBLTNKnVajQaDer1Op7noWka6XSaZDI5OABSSprNJlJKms0mnueRyWQYHR0llUphGAa1Wo1arUaz2cTzPMLhMJlMhlQqNTgAUkpqtRpSSur1Oq7rks1mGR0dJZ1OY5omlUqFarVKq9XC8zwikQiZTIZ0Oj04AEIIqtUqnufRaDSwbZtsNsvY2BiZTIZWq0WlUqFSqdBut/E8j2g0SjabJZPJDA6AoijUajWklNTrdRzHYWRkhLGxMbLZLM1mk3K5TLlcpt1u43ke0WiUbDbL6Ojo4AAoikKlUsG2ber1Oq7rMjo6yvj4ONlslnq9TqlUolQq0el0OgDGx8cHCwDgP0H/v9H/AIrWUWwj8nFjAAAAAElFTkSuQmCC';

const styles = {
  formGroup: {
    marginBottom: '1rem',
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'all 0.3s ease-in-out'
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginTop: '0.5rem',
    transition: 'all 0.3s ease-in-out'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease-in-out'
  },
  textarea: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minHeight: '100px',
    marginTop: '0.5rem',
    transition: 'all 0.3s ease-in-out'
  },
  newMessageBadge: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    marginLeft: '8px',
    fontWeight: 'bold'
  },
  unreadCount: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    marginLeft: '8px'
  },
  hasUnread: {
    borderLeft: '3px solid #ff4444'
  },
  formContainer: {
    opacity: 0,
    transform: 'translateY(20px)',
    animation: 'fadeInUp 0.5s ease forwards'
  },
  messagerie: {
    contacts: {
      width: '300px',
      borderRight: '1px solid #e0e0e0',
      backgroundColor: '#f8f9fa'
    },
    category: {
      marginBottom: '1.5rem'
    },
    categoryTitle: {
      padding: '0.75rem 1rem',
      fontWeight: 'bold',
      backgroundColor: '#f1f3f5',
      borderBottom: '1px solid #e0e0e0'
    },
    contactItem: {
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: '#f1f3f5'
      }
    },
    selected: {
      backgroundColor: '#e3f2fd'
    },
    hasUnread: {
      borderLeft: '3px solid #2196f3'
    },
    unreadBadge: {
      backgroundColor: '#2196f3',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize: '0.75rem'
    },
    chatHeader: {
      padding: '1rem',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#fff'
    },
    messageWrapper: {
      margin: '0.5rem 0',
      display: 'flex',
      flexDirection: 'column'
    },
    message: {
      maxWidth: '70%',
      padding: '0.75rem',
      borderRadius: '12px',
      marginBottom: '0.25rem'
    },
    sent: {
      alignSelf: 'flex-end',
      backgroundColor: '#2196f3',
      color: 'white'
    },
    received: {
      alignSelf: 'flex-start',
      backgroundColor: '#f1f3f5'
    },
    messageTime: {
      fontSize: '0.75rem',
      opacity: 0.7
    },
    chatInput: {
      padding: '1rem',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#fff',
      display: 'flex',
      gap: '0.5rem'
    }
  },
  profilePhotoContainer: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    flexShrink: 0,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  profileHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  },
  profileTitle: {
    flex: 1,
  },
  profileTitleText: {
    color: '#2c3e50',
    fontSize: '1.75rem',
    fontWeight: '600',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  completionNotice: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196f3',
    borderRadius: '8px',
    fontSize: '0.9rem'
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'opacity 0.3s ease',
    opacity: '0',
    '&:hover': {
      opacity: '1'
    }
  }
};

// Styles CSS pour un arrière-plan blanc et propre
const additionalStyles = `
  body, html {
    background-color: #ffffff !important;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  .dashboard-wrapper {
    display: flex;
    min-height: 100vh;
    background-color: #ffffff !important;
  }

  .dashboard {
    flex: 1;
    margin-left: 240px;
    padding: 2rem;
    background-color: #ffffff !important;
    min-height: 100vh;
  }

  @media (max-width: 768px) {
    .dashboard {
      margin-left: 0;
      padding: 1rem;
    }
  }
`;

const sidebarIconStyle = {
  fontSize: '18px',
  width: '18px',
  height: '18px'
};

const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDescription, setUploadDescription] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [labAppointmentReason, setLabAppointmentReason] = useState('');
  const [labAppointments, setLabAppointments] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [hospitalAppointments, setHospitalAppointments] = useState([]);
  const [medicalReports, setMedicalReports] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [unreadMessages, setUnreadMessages] = useState({});
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  
  // Fonction pour calculer le total des messages non lus
  const updateTotalUnreadMessages = (unreadByContact) => {
    const total = Object.values(unreadByContact).reduce((sum, count) => sum + (count || 0), 0);
    setTotalUnreadMessages(total);
  };

  // Fonction pour marquer les messages comme lus dans l'interface
  const markMessagesAsReadInUI = (contactId, isLab = false) => {
    // Ajouter une classe d'animation aux badges avant de les supprimer
    const badgeElements = document.querySelectorAll('.unread-badge');
    badgeElements.forEach(badge => {
      badge.classList.add('fade-out');
    });

    // Ajouter une classe d'animation aux indicateurs de messages
    const indicatorElements = document.querySelectorAll('.unread-indicator');
    indicatorElements.forEach(indicator => {
      indicator.classList.add('fade-out');
    });

    // Mettre à jour les messages affichés avec un délai pour l'animation
    setTimeout(() => {
      setChatMessages(prevMessages => 
        prevMessages.map(msg => ({
          ...msg,
          isRead: msg.receiverId === userId ? true : msg.isRead
        }))
      );
    }, 100);

    // Mettre à jour les compteurs avec un délai pour l'animation
    setTimeout(() => {
      setUnreadMessages(prev => {
        const updated = {
          ...prev,
          [contactId]: 0
        };
        updateTotalUnreadMessages(updated);
        return updated;
      });
    }, 300);
  };
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [appointmentType, setAppointmentType] = useState('medical');
  const [expandedContact, setExpandedContact] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({
    doctors: false,
    labs: false,
    hospitals: false
  });

  const [expandedSections, setExpandedSections] = useState({
    medical: false,
    laboratory: false,
    hospital: false
  });

  const [currentPages, setCurrentPages] = useState({
    medical: 1,
    laboratory: 1,
    hospital: 1,
    notifications: 1
  });

  const ITEMS_PER_PAGE = 2;
  const NOTIFICATIONS_PER_PAGE = 5;

  const [expandedContacts, setExpandedContacts] = useState({});
  const [expandedDoctors, setExpandedDoctors] = useState({});
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const profileImageInputRef = useRef(null);

  // Liste des régions de la Tunisie
  const regions = [
    'Tunis',
    'Ariana',
    'Ben Arous',
    'Manouba',
    'Nabeul',
    'Zaghouan',
    'Bizerte',
    'Béja',
    'Jendouba',
    'Le Kef',
    'Siliana',
    'Sousse',
    'Monastir',
    'Mahdia',
    'Sfax',
    'Kairouan',
    'Kasserine',
    'Sidi Bouzid',
    'Gabès',
    'Medenine',
    'Tataouine',
    'Gafsa',
    'Tozeur',
    'Kebili'
  ];

  // Liste des spécialités
  const specialties = [
    'Cardiologie',
    'Dermatologie',
    'Gastro-entérologie',
    'Neurologie',
    'Ophtalmologie',
    'Orthopédie',
    'Pédiatrie',
    'Psychiatrie',
    'Radiologie',
    'Urologie'
  ];

    useEffect(() => {
    const storedId = localStorage.getItem('userId');
    console.log('📱 Stored userId:', storedId);
    if (!storedId) {
      setMessage("ID utilisateur non trouvé.");
      setIsLoading(false);
      return;
    }

    setUserId(storedId);
    
    // Vérifier si l'utilisateur vient de compléter son profil
    const profileCompleted = localStorage.getItem('profileCompleted');
    if (profileCompleted === 'true') {
      console.log('🎉 Profil patient complété, rechargement des données...');
      // Supprimer le flag pour éviter les rechargements inutiles
      localStorage.removeItem('profileCompleted');
    }
    
    fetchProfile(storedId);
    fetchNotifications(storedId);
    fetchMedicalDocuments(storedId);
    
    // Charger les rendez-vous si on est dans la section messages ou rendez-vous
    if (activeSection === 'messages' || activeSection === 'all-appointments') {
      console.log('🔄 Chargement des rendez-vous...');
      fetchAllAppointments(storedId);
    }
    if (activeSection === 'lab-appointment') {
      fetchLabs();
      fetchLabAppointments(storedId);
    }
    if (activeSection === 'lab-results') {
      fetchLabResults(storedId);
    }
    if (activeSection === 'hospital-appointment') {
      fetchHospitals();
      fetchHospitalAppointments(storedId);
    }
    if (activeSection === 'all-appointments') {
      fetchHospitalAppointments(storedId);
    }
    if (activeSection === 'medical-reports') {
      fetchMedicalReports(storedId);
    }
    if (userId) {
      fetchDoctors();
    }
  }, [activeSection, userId]);

  // Ajout d'un useEffect spécifique pour les médecins
  useEffect(() => {
    if (activeSection === 'appointment') {
      console.log("🏥 Section rendez-vous médecin active, chargement des médecins...");
      fetchDoctors();
    }
  }, [activeSection]);

  // Ajout d'un useEffect pour filtrer les médecins quand la région ou la spécialité change
  useEffect(() => {
    if (selectedRegion || selectedSpecialty) {
      console.log("🔄 Filtrage des médecins avec:", { selectedRegion, selectedSpecialty });
      const filteredDoctors = doctors.filter(doctor => 
        (!selectedRegion || doctor.region === selectedRegion) &&
        (!selectedSpecialty || doctor.specialty === selectedSpecialty)
      );
      console.log("✅ Médecins filtrés:", filteredDoctors);
    }
  }, [selectedRegion, selectedSpecialty]);

  useEffect(() => {
    if (activeSection === 'new-appointment') {
      // Charger les médecins si le type de rendez-vous est médical
      if (appointmentType === 'medical') {
        console.log("🏥 Section rendez-vous médecin active, chargement des médecins...");
        fetchDoctors();
      }
      // Charger les laboratoires si le type de rendez-vous est laboratoire
      else if (appointmentType === 'laboratory') {
        console.log("🔬 Chargement des laboratoires...");
        fetchLabs();
      }
      // Charger les hôpitaux si le type de rendez-vous est hôpital
      else if (appointmentType === 'hospital') {
        console.log("🏥 Chargement des hôpitaux...");
        fetchHospitals();
      }
    }
  }, [activeSection, appointmentType]);

  // Ajoutez cet useEffect après les autres
  useEffect(() => {
    if (activeSection === 'new-appointment' && appointmentType === 'hospital') {
      console.log("🔄 Filtrage des hôpitaux avec région:", selectedRegion);
      console.log("Hôpitaux disponibles avant filtrage:", hospitals);
      
      const filteredHospitals = !selectedRegion 
        ? hospitals // Retourner tous les hôpitaux si aucune région n'est sélectionnée
        : hospitals.filter(hospital => {
            const hospitalRegion = hospital.region ? hospital.region.toLowerCase() : '';
            const selectedRegionLower = selectedRegion.toLowerCase();
            const matchesRegion = hospitalRegion === selectedRegionLower;
            console.log(`Filtrage - Hôpital ${hospital.nom}:`, {
              hospitalRegion,
              selectedRegion: selectedRegionLower,
              matchesRegion
            });
            return matchesRegion;
          });
      
      console.log("✅ Hôpitaux filtrés par région:", filteredHospitals);
    }
  }, [selectedRegion, hospitals, activeSection, appointmentType]);

      const fetchProfile = async (id) => {
    try {
      setIsLoading(true);
      
      // L'endpoint /api/users/{id} retourne déjà les données fusionnées utilisateur + patient
      const userRes = await axios.get(`${API_BASE_URL}/api/users/${id}`);
      const profileData = userRes.data;
      
      console.log("✅ Profil complet récupéré (données utilisateur + patient):", profileData);
      
      // Vérifier si les champs patient sont vides pour suggérer la complétion du profil
      if (profileData.roles && profileData.roles.includes('Patient')) {
        const hasEmptyPatientFields = !profileData.emergencyPhone || 
                                    !profileData.bloodType || 
                                    !profileData.chronicDiseases;
        
        if (hasEmptyPatientFields) {
          profileData.needsPatientProfileCompletion = true;
          console.log("💡 Certains champs patient sont vides - suggestion de complétion du profil");
        }
      }
      
      setProfile(profileData);
    } catch (error) {
      console.error("❌ Erreur récupération profil utilisateur:", error);
      setMessage("❌ Erreur récupération profil.");
    } finally {
      setIsLoading(false);
    }
  };

    const fetchNotifications = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications/${id}`);
      
      // Récupérer les notifications lues depuis localStorage
      const readNotifications = JSON.parse(localStorage.getItem(`readNotifications_${id}`) || '[]');
      
      // S'assurer que chaque notification a un ID unique et un statut isRead
      const formattedNotifications = res.data.map((notif, index) => {
        const notificationId = notif.id || notif._id || `notification-${index}`;
        return {
          ...notif,
          id: notificationId,
          isRead: readNotifications.includes(notificationId) || (notif.isRead !== undefined ? notif.isRead : false)
        };
      });
      setNotifications(formattedNotifications);
    } catch (error) {
      // Si l'erreur est 404, l'utilisateur n'a pas encore de notifications
      if (error.response && error.response.status === 404) {
        console.log("🔔 Aucune notification trouvée pour ce patient (normal pour un nouvel utilisateur)");
        
        // Récupérer les notifications lues depuis localStorage
        const readNotifications = JSON.parse(localStorage.getItem(`readNotifications_${id}`) || '[]');
        
        // Ajouter quelques notifications de démonstration
        const demoNotifications = [
          {
            id: 'demo-1',
            message: 'Votre rendez-vous avec Dr. Martin est confirmé pour demain à 14h30',
            type: 'appointment',
            isRead: readNotifications.includes('demo-1'),
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // Il y a 2 heures
          },
          {
            id: 'demo-2',
            message: 'Vos résultats de laboratoire sont disponibles',
            type: 'result',
            isRead: readNotifications.includes('demo-2'),
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Il y a 1 jour
          },
          {
            id: 'demo-3',
            message: 'Nouveau message de Dr. Dubois concernant votre traitement',
            type: 'message',
            isRead: readNotifications.includes('demo-3') || true, // Par défaut lu
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Il y a 3 jours
          },
          {
            id: 'demo-4',
            message: 'Rappel: Prenez vos médicaments selon la prescription',
            type: 'appointment',
            isRead: readNotifications.includes('demo-4') || true, // Par défaut lu
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Il y a 1 semaine
          }
        ];
        setNotifications(demoNotifications);
      } else {
        console.error("❌ Erreur notifications:", error);
      }
    }
  };

    const fetchMedicalDocuments = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patient/medical-documents/${id}`);
      setMedicalDocuments(res.data);
    } catch (error) {
      // Si l'erreur est 404, cela signifie que l'utilisateur n'a pas encore de documents
      // Ce n'est pas une vraie erreur, juste un état initial normal
      if (error.response && error.response.status === 404) {
        console.log("📝 Aucun document médical trouvé pour ce patient (normal pour un nouvel utilisateur)");
        setMedicalDocuments([]);
      } else {
        console.error("❌ Erreur récupération documents:", error);
        setMessage("Erreur lors de la récupération des documents médicaux.");
      }
    }
  };

  const fetchAllAppointments = async (patientId) => {
    try {
      console.log("🔄 Chargement des rendez-vous pour le patient:", patientId);
      const medicalRes = await axios.get(`${API_BASE_URL}/api/appointments?patientId=${patientId}`);
      console.log("✅ Rendez-vous médicaux reçus:", medicalRes.data);
      
      // S'assurer que tous les rendez-vous ont les informations nécessaires
      const formattedAppointments = medicalRes.data.map(apt => ({
        ...apt,
        doctorName: apt.doctorId?.nom ? `Dr. ${apt.doctorId.nom} ${apt.doctorId.prenom}` : apt.doctorEmail,
        doctorEmail: apt.doctorId?.email || '',
        doctorId: apt.doctorId?._id || apt.doctorId
      }));
      
      setAppointments(formattedAppointments);
      
      // Charger les rendez-vous de laboratoire
      const labRes = await axios.get(`${API_BASE_URL}/api/lab-appointments/patient/${patientId}`);
      setLabAppointments(labRes.data);

      // Charger les rendez-vous d'hôpital
      const hospitalRes = await axios.get(`${API_BASE_URL}/api/hospital-appointments/patient/${patientId}`);
      setHospitalAppointments(hospitalRes.data);
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      setMessage("Erreur lors de la récupération des rendez-vous.");
    }
  };

  const fetchChatMessages = async (appointmentId) => {
    setChatLoading(true);
    try {
      console.log("🔄 Chargement des messages pour le rendez-vous:", appointmentId);
      const appointment = appointments.find(apt => apt._id === appointmentId) || 
                        labAppointments.find(apt => apt._id === appointmentId);

      if (!appointment) {
        console.error("Rendez-vous non trouvé");
        return;
      }

      console.log("Appointment trouvé:", appointment);

      let messages = [];
      if (appointment.lab) {
        // Messages de laboratoire
        const labId = appointment.lab._id;
        console.log("Chargement des messages de laboratoire pour:", labId);
        try {
          const response = await axios.get(`${API_BASE_URL}/api/lab-patient-messages/${labId}/${userId}`);
          console.log("✅ Messages de laboratoire reçus:", response.data);
          messages = response.data;
          
          // Marquer les messages comme lus
          const unreadMessageIds = messages
            .filter(msg => msg.receiverId === userId && !msg.isRead)
            .map(msg => msg._id);
          
          if (unreadMessageIds.length > 0) {
            await axios.put(`${API_BASE_URL}/api/lab-patient-messages/read`, {
              messageIds: unreadMessageIds
            });
            
            // Mettre à jour le compteur local et forcer le re-render
            setUnreadMessages(prev => {
              const updated = {
                ...prev,
                [labId]: 0
              };
              updateTotalUnreadMessages(updated);
              return updated;
            });
            
            // Forcer la mise à jour des messages affichés
            setChatMessages(prevMessages => 
              prevMessages.map(msg => ({
                ...msg,
                isRead: msg.receiverId === userId ? true : msg.isRead
              }))
            );
          }
        } catch (error) {
          console.error("❌ Erreur lors du chargement des messages de laboratoire:", error);
          setError("Erreur lors du chargement des messages de laboratoire");
        }
      } else {
        // Messages de médecin - récupérer tous les messages avec ce médecin
        const doctorId = appointment.doctorId?._id || appointment.doctorId;
        if (!doctorId) {
          console.error("ID du médecin non trouvé dans le rendez-vous:", appointment);
          setError("Erreur: Impossible de charger les messages - ID du médecin manquant");
          return;
        }
        console.log("Chargement de tous les messages du médecin pour:", doctorId);
        try {
          // Récupérer tous les rendez-vous avec ce médecin (exclure les hôpitaux)
          const doctorAppointments = appointments.filter(apt => {
            const aptDoctorId = apt.doctorId?._id || apt.doctorId;
            return aptDoctorId === doctorId && 
                   apt.type !== 'hospital' &&
                   !apt.hospitalId &&
                   !apt.doctorName?.toLowerCase().includes('hôpital') &&
                   !apt.doctorName?.toLowerCase().includes('hopital');
          });
          
          console.log("Rendez-vous trouvés pour ce médecin:", doctorAppointments);
          
          // Récupérer les messages pour tous les rendez-vous avec ce médecin
          const messagesPromises = doctorAppointments.map(apt => 
            axios.get(`${API_BASE_URL}/api/messages/${apt._id}?userId=${userId}`)
          );
          
          const messagesResponses = await Promise.all(messagesPromises);
          
          // Fusionner tous les messages
          let allMessages = [];
          messagesResponses.forEach(response => {
            allMessages = [...allMessages, ...response.data];
          });
          
          // Trier les messages par date
          allMessages.sort((a, b) => new Date(a.createdAt || a.sentAt) - new Date(b.createdAt || b.sentAt));
          
          messages = allMessages;
          console.log("✅ Tous les messages du médecin reçus:", messages);
          
          // Marquer les messages comme lus
          const unreadMessageIds = messages
            .filter(msg => msg.receiverId === userId && !msg.isRead)
            .map(msg => msg._id);
          
          if (unreadMessageIds.length > 0) {
            await axios.put(`${API_BASE_URL}/api/messages/read`, {
              messageIds: unreadMessageIds
            });
            
            // Mettre à jour le compteur local et forcer le re-render
            const doctorId = appointment.doctorId?._id || appointment.doctorId;
            setUnreadMessages(prev => {
              const updated = {
                ...prev,
                [doctorId]: 0
              };
              updateTotalUnreadMessages(updated);
              return updated;
            });
            
            // Forcer la mise à jour des messages affichés
            setChatMessages(prevMessages => 
              prevMessages.map(msg => ({
                ...msg,
                isRead: msg.receiverId === userId ? true : msg.isRead
              }))
            );
          }
        } catch (error) {
          console.error("❌ Erreur lors du chargement des messages du médecin:", error);
          setError("Erreur lors du chargement des messages du médecin");
        }
      }

      // Marquer tous les messages comme lus dans l'état local immédiatement
      const updatedMessages = messages.map(msg => ({
        ...msg,
        isRead: msg.receiverId === userId ? true : msg.isRead
      }));
      
      setChatMessages(updatedMessages);
      
      // Rafraîchir les compteurs de messages non lus après un délai
      setTimeout(() => {
      checkUnreadMessages();
      }, 500);
    } catch (error) {
      console.error("❌ Erreur générale lors du chargement des messages:", error);
      setError("Une erreur est survenue lors du chargement des messages");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newChatMessage.trim() || !selectedAppointment) return;
    try {
      let endpoint;
      let messageData;

      if (selectedAppointment.lab) {
        // Message pour laboratoire
        endpoint = '/api/lab-patient-messages';
        messageData = {
          senderId: userId,
          receiverId: selectedAppointment.lab._id,
          content: newChatMessage,
          appointmentId: selectedAppointment._id,
          isLabMessage: true
        };
      } else {
        // Message pour médecin
        endpoint = '/api/messages';
        messageData = {
          senderId: userId,
          receiverId: selectedAppointment.doctorId?._id || selectedAppointment.doctorId,
          content: newChatMessage,
          appointmentId: selectedAppointment._id
        };
      }

      console.log('📤 Envoi du message:', {
        endpoint,
        messageData
      });

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, messageData);
      console.log('✅ Message envoyé avec succès:', response.data);
      
      setNewChatMessage('');
      fetchChatMessages(selectedAppointment._id);
      
      // Mettre à jour les compteurs de messages non lus après un délai
      setTimeout(() => {
        checkUnreadMessages();
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      setMessage("Erreur lors de l'envoi du message: " + (error.response?.data?.message || error.message));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
    setSelectedFile(null);
    setUploadDescription('');
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setUploadDescription('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadDescription) return;

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('description', uploadDescription);

    try {
      setIsLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/patient/medical-documents/${userId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setMessage("✅ Document téléchargé avec succès !");
      fetchMedicalDocuments(userId);
      handleCloseModal();
    } catch (error) {
      setMessage("❌ Erreur lors du téléchargement du document.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/patient/medical-documents/${userId}/${documentId}`);
      setMessage("✅ Document supprimé avec succès !");
      fetchMedicalDocuments(userId);
    } catch (error) {
      setMessage("❌ Erreur lors de la suppression du document.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const fetchLabs = async () => {
    try {
      console.log("🔍 Récupération des laboratoires...");
      const response = await axios.get(`${API_BASE_URL}/api/labs-valides`);
      console.log("✅ Réponse reçue:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setLabs(response.data);
        if (response.data.length === 0) {
          setMessage("Aucun laboratoire disponible pour le moment.");
        }
      } else {
        setMessage("Format de données incorrect pour les laboratoires.");
        console.error("Format incorrect:", response.data);
      }
    } catch (error) {
      console.error("❌ Erreur détaillée:", error.response || error);
      setMessage("❌ Erreur lors de la récupération des laboratoires.");
      setLabs([]);
    }
  };

    const fetchLabAppointments = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-appointments/patient/${id}`);
      setLabAppointments(response.data);
    } catch (error) {
      // Si l'erreur est 404, l'utilisateur n'a pas encore de rendez-vous laboratoire
      if (error.response && error.response.status === 404) {
        console.log("🔬 Aucun rendez-vous laboratoire trouvé pour ce patient (normal pour un nouvel utilisateur)");
        setLabAppointments([]);
      } else {
        setLabAppointments([]);
        console.error("❌ Erreur lors de la récupération des rendez-vous laboratoire:", error);
      }
    }
  };

  const handleLabAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/lab-appointments`, {
        labId: selectedLab,
        patientId: userId,
        reason: labAppointmentReason
      });
      setMessage("✅ Rendez-vous laboratoire enregistré avec succès !");
      setSelectedLab('');
      setLabAppointmentReason('');
      fetchLabAppointments(userId);
    } catch (error) {
      console.error("❌ Erreur détaillée:", error.response || error);
      setMessage("❌ Erreur lors de l'enregistrement du rendez-vous laboratoire.");
    }
  };

    const fetchLabResults = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lab-results/patient/${id}`);
      console.log('Résultats de laboratoire reçus:', response.data);
      setLabResults(response.data);
    } catch (error) {
      // Si l'erreur est 404, l'utilisateur n'a pas encore de résultats
      if (error.response && error.response.status === 404) {
        console.log("🧪 Aucun résultat de laboratoire trouvé pour ce patient (normal pour un nouvel utilisateur)");
        setLabResults([]);
      } else {
        console.error('Erreur lors de la récupération des résultats:', error);
        setError("Erreur lors de la récupération des résultats de laboratoire");
      }
    }
  };

  const fetchHospitals = async () => {
    try {
      console.log("🏥 Récupération des hôpitaux...");
      // Utiliser un endpoint spécifique pour les hôpitaux
      const response = await axios.get(`${API_BASE_URL}/api/hospitals`);
      console.log("✅ Données reçues brutes:", response.data);
      
      // Vérifier chaque hôpital reçu
      const validatedHospitals = response.data.filter(hospital => {
        console.log("Vérification de l'hôpital:", {
          nom: hospital.nom,
          roles: hospital.roles,
          region: hospital.region
        });
        return hospital.isValidated !== false; // Garder tous les hôpitaux validés
      });
      
      console.log("🏥 Hôpitaux validés:", validatedHospitals);

      // Normaliser les régions des hôpitaux
      const normalizedHospitals = validatedHospitals.map(hospital => ({
        ...hospital,
        region: hospital.region ? 
          hospital.region.charAt(0).toUpperCase() + hospital.region.slice(1).toLowerCase() : ''
      }));
      
      console.log("🏥 Hôpitaux normalisés:", normalizedHospitals);
      setHospitals(normalizedHospitals);
    } catch (error) {
      console.error("❌ Erreur récupération hôpitaux:", error);
      setMessage("Erreur lors de la récupération des hôpitaux.");
    }
  };

  const fetchHospitalAppointments = async (patientId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/hospital-appointments/patient/${patientId}`);
      setHospitalAppointments(response.data);
    } catch (error) {
      console.error("❌ Erreur récupération rendez-vous hôpital:", error);
      setMessage("Erreur lors de la récupération des rendez-vous d'hôpital.");
    }
  };

  const handleHospitalAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/hospital-appointments`, {
        hospitalId: selectedHospital,
        patientId: userId,
        specialty: selectedSpecialty
      });
      setMessage("✅ Demande de rendez-vous envoyée avec succès !");
      setSelectedHospital('');
      setSelectedSpecialty('');
      fetchHospitalAppointments(userId);
    } catch (error) {
      console.error("❌ Erreur création rendez-vous hôpital:", error);
      setMessage("Erreur lors de la création du rendez-vous.");
    }
  };

  const fetchMedicalReports = async (patientId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/medical-reports/patient/${patientId}`);
      setMedicalReports(response.data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rapports médicaux:', error);
      setMessage("Erreur lors de la récupération des rapports médicaux.");
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleCancelAppointment = async (appointmentId, type) => {
    try {
      let endpoint;
      switch(type) {
        case 'medical':
          endpoint = '/api/appointments';
          break;
        case 'laboratory':
          endpoint = '/api/lab-appointments';
          break;
        case 'hospital':
          endpoint = '/api/hospital-appointments';
          break;
        default:
          throw new Error('Type de rendez-vous invalide');
      }

      await axios.put(`${API_BASE_URL}${endpoint}/${appointmentId}/status`, {
        status: 'cancelled'
      });

      setMessage("✅ Rendez-vous annulé avec succès !");

      // Rafraîchir les listes de rendez-vous
      fetchAllAppointments(userId);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      setMessage("❌ Erreur lors de l'annulation du rendez-vous.");
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/appointments`, {
        doctorId: selectedDoctor,
        patientId: userId,
        reason: appointmentReason
      });
      setMessage("✅ Demande de rendez-vous envoyée avec succès !");
      setSelectedDoctor('');
      setAppointmentReason('');
      fetchAllAppointments(userId);
    } catch (error) {
      console.error("❌ Erreur création rendez-vous:", error);
      setMessage("Erreur lors de la création du rendez-vous.");
    }
  };

  const fetchDoctors = async () => {
    try {
      console.log("🔍 Récupération des médecins...");
      const response = await axios.get(`${API_BASE_URL}/api/medecins-valides`);
      console.log("✅ Médecins reçus:", response.data);
      // Modifier le filtre pour inclure tous les médecins validés
      setDoctors(response.data.filter(user => 
        (user.roles.includes('Doctor') || user.roles.includes('doctor')) && 
        user.isValidated !== false
      ));
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des médecins:", error);
      setMessage("Erreur lors de la récupération de la liste des médecins.");
    }
  };

  const checkUnreadMessages = async () => {
    if (!userId) {
      console.log("⚠️ Pas d'userId disponible pour vérifier les messages non lus");
      return;
    }

    let totalUnread = 0;
    const unreadByContact = {};

    try {
      // Récupérer les messages non lus des médecins
      console.log("🔍 Vérification des messages non lus des médecins");
      
      // Grouper les rendez-vous par médecin pour vérifier les messages
      const doctorGroups = appointments
        .filter(apt => {
          const doctorId = apt.doctorId?._id || apt.doctorId;
          const doctorName = apt.doctorName || apt.doctorId?.nom || 'Médecin';
          return doctorId && 
                 apt.type !== 'hospital' &&
                 !apt.hospitalId &&
                 !doctorName.toLowerCase().includes('hôpital') &&
                 !doctorName.toLowerCase().includes('hopital');
        })
        .reduce((groups, apt) => {
          const doctorId = apt.doctorId?._id || apt.doctorId;
          if (!groups[doctorId]) {
            groups[doctorId] = [];
          }
          groups[doctorId].push(apt);
          return groups;
        }, {});

      // Vérifier les messages non lus pour chaque médecin
      for (const [doctorId, doctorAppointments] of Object.entries(doctorGroups)) {
        try {
          let doctorUnreadCount = 0;
          
          // Récupérer les messages pour tous les rendez-vous avec ce médecin
          for (const apt of doctorAppointments) {
            try {
              const response = await axios.get(`${API_BASE_URL}/api/messages/${apt._id}?userId=${userId}`);
              const messages = response.data || [];
              const unreadCount = messages.filter(msg => msg.receiverId === userId && !msg.isRead).length;
              doctorUnreadCount += unreadCount;
            } catch (error) {
              console.error(`❌ Erreur pour le rendez-vous ${apt._id}:`, error);
            }
          }
          
          if (doctorUnreadCount > 0) {
            unreadByContact[doctorId] = doctorUnreadCount;
            totalUnread += doctorUnreadCount;
            console.log(`✅ Messages non lus du médecin ${doctorId}:`, doctorUnreadCount);
          }
        } catch (error) {
          console.error(`❌ Erreur pour le médecin ${doctorId}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des messages non lus des médecins:", error);
    }

    // Pour les laboratoires, nous devons vérifier chaque laboratoire avec lequel le patient a un rendez-vous
    try {
      console.log("🔍 Vérification des messages non lus des laboratoires");
      const labAppointmentsWithMessages = labAppointments.filter(apt => apt.lab && apt.lab._id);
      
      // Grouper par laboratoire
      const labGroups = labAppointmentsWithMessages.reduce((groups, apt) => {
        const labId = apt.lab._id;
        if (!groups[labId]) {
          groups[labId] = apt.lab;
        }
        return groups;
      }, {});
      
      for (const [labId, lab] of Object.entries(labGroups)) {
        try {
          const labMessagesResponse = await axios.get(`${API_BASE_URL}/api/lab-patient-messages/${labId}/${userId}`);
          if (labMessagesResponse.data && Array.isArray(labMessagesResponse.data)) {
            const unreadCount = labMessagesResponse.data.filter(msg => !msg.isRead && msg.receiverId === userId).length;
            if (unreadCount > 0) {
              unreadByContact[labId] = unreadCount;
            totalUnread += unreadCount;
              console.log(`✅ Messages non lus du laboratoire ${lab.nom}:`, unreadCount);
            }
          }
        } catch (labError) {
          console.error(`❌ Erreur pour le laboratoire ${labId}:`, labError);
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des messages non lus des laboratoires:", error);
    }

    console.log("📊 Total des messages non lus:", totalUnread);
    console.log("📊 Messages non lus par contact:", unreadByContact);
    setUnreadMessages(unreadByContact);
    updateTotalUnreadMessages(unreadByContact);
  };

  // Modifier l'useEffect pour vérifier les messages non lus uniquement quand userId est disponible
  useEffect(() => {
    if (userId && appointments.length > 0) {
      checkUnreadMessages();
      const interval = setInterval(checkUnreadMessages, 900000);
      return () => clearInterval(interval);
    }
  }, [userId, appointments, labAppointments]);

  // Mettre à jour le total quand les messages non lus changent
  useEffect(() => {
    updateTotalUnreadMessages(unreadMessages);
    
    // Réinitialiser les animations quand les compteurs changent
    setTimeout(() => {
      const badgeElements = document.querySelectorAll('.unread-badge.fade-out');
      const indicatorElements = document.querySelectorAll('.unread-indicator.fade-out');
      
      badgeElements.forEach(badge => {
        badge.classList.remove('fade-out');
      });
      
      indicatorElements.forEach(indicator => {
        indicator.classList.remove('fade-out');
      });
    }, 500);
  }, [unreadMessages]);

  const handleEditProfile = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

    const handleUpdateProfile = async () => {
    try {
      // Séparer les données utilisateur de base et les données patient
      const userFields = ['nom', 'prenom', 'email', 'telephone', 'adresse', 'cin', 'region'];
      const patientFields = ['emergencyPhone', 'bloodType', 'chronicDiseases'];
      
      const userUpdateData = {};
      const patientUpdateData = {};
      
      // Distribuer les données modifiées entre les deux collections
      Object.keys(editedProfile).forEach(key => {
        if (userFields.includes(key)) {
          userUpdateData[key] = editedProfile[key];
        } else if (patientFields.includes(key)) {
          patientUpdateData[key] = editedProfile[key];
        }
      });
      
      // Mettre à jour les données utilisateur si nécessaire
      if (Object.keys(userUpdateData).length > 0) {
        console.log("🔄 Mise à jour des données utilisateur:", userUpdateData);
        await axios.put(`${API_BASE_URL}/api/users/${userId}`, userUpdateData);
      }
      
      // Mettre à jour les données patient si nécessaire
      if (Object.keys(patientUpdateData).length > 0) {
        console.log("🔄 Mise à jour des données patient:", patientUpdateData);
                 await axios.put(`${API_BASE_URL}/patient/profile/${userId}`, patientUpdateData);
      }
      
            // Recharger le profil complet pour afficher les changements      await fetchProfile(userId);
      
      setIsEditing(false);
      setMessage("✅ Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      setMessage("❌ Erreur lors de la mise à jour du profil.");
    }
  };

  // Move the useEffect for styles here
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = additionalStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const toggleContact = (contactId) => {
    setExpandedContacts(prev => ({
        ...prev,
        [contactId]: !prev[contactId]
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleDoctor = (doctorId) => {
    setExpandedDoctors(prev => ({
      ...prev,
      [doctorId]: !prev[doctorId]
    }));
  };

  // Ajout du useEffect pour gérer la disparition des messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleProfileImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedProfileImage(file);
      handleProfileImageUpload(file);
    }
  };

  const handleProfileImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/users/${userId}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.photo) {
        setProfile(prev => ({
          ...prev,
          photo: response.data.photo
        }));
        setMessage("✅ Photo de profil mise à jour avec succès !");
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la photo:', error);
      setMessage("❌ Erreur lors de la mise à jour de la photo de profil.");
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPaginatedData = (data, section) => {
    const currentPage = currentPages[section];
    const itemsPerPage = section === 'notifications' ? NOTIFICATIONS_PER_PAGE : ITEMS_PER_PAGE;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data, section) => {
    const itemsPerPage = section === 'notifications' ? NOTIFICATIONS_PER_PAGE : ITEMS_PER_PAGE;
    return Math.ceil(data.length / itemsPerPage);
  };

  const handlePageChange = (section, page) => {
    setCurrentPages(prev => ({
      ...prev,
      [section]: page
    }));
  };

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = async (notificationId) => {
    try {
      // Ajouter une classe d'animation temporaire
      const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
      if (notificationElement) {
        notificationElement.classList.add('reading');
        setTimeout(() => {
          notificationElement.classList.remove('reading');
        }, 500);
      }

      // Mettre à jour localement en utilisant l'ID de la notification
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId || notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      // Sauvegarder dans localStorage pour persister l'état
      const readNotifications = JSON.parse(localStorage.getItem(`readNotifications_${userId}`) || '[]');
      if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId);
        localStorage.setItem(`readNotifications_${userId}`, JSON.stringify(readNotifications));
      }
      
      // Ici, vous pouvez ajouter un appel API pour marquer la notification comme lue côté serveur
      // await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`);
      
    } catch (error) {
      console.error("❌ Erreur lors du marquage de la notification comme lue:", error);
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.isRead);
      
      if (unreadNotifications.length === 0) {
        return;
      }

      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Sauvegarder dans localStorage
      const readNotifications = JSON.parse(localStorage.getItem(`readNotifications_${userId}`) || '[]');
      const newReadNotifications = [...readNotifications];
      
      unreadNotifications.forEach(notif => {
        const notificationId = notif.id || notif._id;
        if (!newReadNotifications.includes(notificationId)) {
          newReadNotifications.push(notificationId);
        }
      });
      
      localStorage.setItem(`readNotifications_${userId}`, JSON.stringify(newReadNotifications));
      
      // Animation pour toutes les cartes non lues
      unreadNotifications.forEach(notif => {
        const notificationId = notif.id || notif._id;
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
          element.classList.add('reading');
          setTimeout(() => {
            element.classList.remove('reading');
          }, 500);
        }
      });
      
    } catch (error) {
      console.error("❌ Erreur lors du marquage de toutes les notifications comme lues:", error);
    }
  };

  const renderPagination = (data, section) => {
    const totalPages = getTotalPages(data, section);
    if (totalPages <= 1) return null;

    const currentPage = currentPages[section];

  return (
      <div className="pagination-container">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(section, currentPage - 1)}
          disabled={currentPage === 1}
        >
          ←
        </button>
        <span className="pagination-info">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(section, currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          →
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <aside className="medical-sidebar">
        <div className="sidebar-header">
          <div className="medical-logo">
            <div className="logo-text">
              <h2>PatientPath</h2>
              <span>Espace Patient</span>
          </div>
        </div>
        </div>

        <nav className="sidebar-navigation">
          <div className="nav-section">
            <span className="nav-section-title">TABLEAU DE BORD</span>
            <button 
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <FaUser className="nav-icon" />
              <span className="nav-text">Mon Profil</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">RENDEZ-VOUS</span>
            <button 
              className={`nav-item ${activeSection === 'all-appointments' ? 'active' : ''}`}
              onClick={() => setActiveSection('all-appointments')}
            >
              <FaFileMedical className="nav-icon" />
              <span className="nav-text">Mes Rdv</span>
            </button>
            <button 
              className={`nav-item ${activeSection === 'new-appointment' ? 'active' : ''}`}
              onClick={() => setActiveSection('new-appointment')}
            >
              <FaCalendarAlt className="nav-icon" />
              <span className="nav-text">Nouveau Rdv</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">COMMUNICATION</span>
            <button 
              className={`nav-item ${activeSection === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveSection('messages')}
              style={{ position: 'relative' }}
            >
              <FaComments className="nav-icon" />
              <span className="nav-text">Messagerie</span>
              {totalUnreadMessages > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1',
                  animation: 'pulse 2s infinite'
                }}>
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </button>
            <button 
              className={`nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <FaBell className="nav-icon" />
              <span className="nav-text">Notifications</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">DOCUMENTS</span>
            <button 
              className={`nav-item ${activeSection === 'medical-reports' ? 'active' : ''}`}
              onClick={() => setActiveSection('medical-reports')}
            >
              <FaFileMedical className="nav-icon" />
              <span className="nav-text">Rapports Médicaux</span>
            </button>
            <button 
              className={`nav-item ${activeSection === 'lab-results' ? 'active' : ''}`}
              onClick={() => setActiveSection('lab-results')}
            >
              <FaFlask className="nav-icon" />
              <span className="nav-text">Résultats Laboratoire</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-text">Déconnexion</span>
          </button>
        </div>
      </aside>
      <main className="dashboard">
        {message && <div className="alert">{message}</div>}

        {isLoading ? (
          <div className="loading">Chargement...</div>
        ) : (
          <>
            {activeSection === 'profile' && (
              <>
              
                
                <div className="profile-card">
                  <div style={styles.profileHeaderContent}>
                    <div style={styles.profilePhotoContainer}>
                      <img 
                        src={profile.photo ? `${API_BASE_URL}${profile.photo}` : 'https://via.placeholder.com/80'} 
                        alt="Profil" 
                        style={styles.profilePhoto}
                      />
                      <input
                        type="file"
                        ref={profileImageInputRef}
                        onChange={handleProfileImageSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <button 
                        style={styles.changePhotoBtn}
                        onClick={() => profileImageInputRef.current?.click()}
                      >
                        📷 Changer la photo
                      </button>
                    </div>
                    <div style={styles.profileTitle}>
                      <h1 style={styles.profileTitleText}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{color: '#0f766e'}}>
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        Mon Profil
                      </h1>
                    </div>
                  </div>
                  <div className="profile-grid">
                    {isEditing ? (
                      <>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Nom :</label>
                          <input
                            type="text"
                            name="nom"
                            value={editedProfile.nom || ''}
                            onChange={handleInputChange}
                          />
                  </div>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Prénom :</label>
                          <input
                            type="text"
                            name="prenom"
                            value={editedProfile.prenom || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Email :</label>
                          <input
                            type="email"
                            name="email"
                            value={editedProfile.email || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Téléphone :</label>
                          <input
                            type="tel"
                            name="telephone"
                            value={editedProfile.telephone || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Adresse :</label>
                          <input
                            type="text"
                            name="adresse"
                            value={editedProfile.adresse || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Contact d'urgence :</label>
                          <input
                            type="tel"
                            name="emergencyPhone"
                            value={editedProfile.emergencyPhone || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Groupe sanguin :</label>
                          <select
                            name="bloodType"
                            value={editedProfile.bloodType || ''}
                            onChange={handleInputChange}
                          >
                            <option value="">Sélectionnez</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                        <div className="form-group" style={styles.formGroup}>
                          <label>Maladies chroniques :</label>
                          <textarea
                            name="chronicDiseases"
                            value={editedProfile.chronicDiseases || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="profile-actions">
                          <button onClick={handleUpdateProfile} className="save-btn">
                            Enregistrer
                          </button>
                          <button onClick={handleCancelEdit} className="cancel-btn">
                            Annuler
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p><strong>Nom :</strong> {profile.nom || '-'}</p>
                        <p><strong>Prénom :</strong> {profile.prenom || '-'}</p>
                        <p><strong>Email :</strong> {profile.email || '-'}</p>
                        <p><strong>Téléphone :</strong> {profile.telephone || '-'}</p>
                        <p><strong>Adresse :</strong> {profile.adresse || '-'}</p>
                        <p><strong>CIN :</strong> {profile.cin || '-'}</p>
                        <p><strong>Contact d'urgence :</strong> {profile.emergencyPhone || '-'}</p>
                        <p><strong>Groupe sanguin :</strong> {profile.bloodType || '-'}</p>
                        <p><strong>Maladies chroniques :</strong> {profile.chronicDiseases || '-'}</p>
                        <div className="profile-actions">                          <button onClick={handleEditProfile} className="edit-profile-btn">                            ✏️ Modifier le profil                          </button>                          {profile.needsPatientProfileCompletion && (                            <div className="completion-notice" style={styles.completionNotice}>                              <p>💡 <strong>Conseil :</strong> Complétez votre profil patient pour une meilleure expérience (téléphone d'urgence, groupe sanguin, etc.)</p>                            </div>                          )}                        </div>
              </>
            )}
                  </div>

                  <div className="profile-documents-section">
                    <div className="documents-header">
                      <h3>📄 Documents Médicaux</h3>
                      <button onClick={handleUploadClick} className="import-btn">
                        <span>📎</span> Importer un document
                      </button>
                    </div>

                    <div className="documents-grid">
                      {medicalDocuments.length === 0 ? (
                        <p className="no-documents">Aucun document médical téléchargé.</p>
                      ) : (
                        medicalDocuments.map((doc) => (
                          <div key={doc._id} className="document-card">
                            <div className="document-preview">
                              <div className="image-container">
                                <img 
                                  src={doc.filePath.startsWith('http') 
                                    ? doc.filePath 
                                    : `${API_BASE_URL}/${doc.filePath.replace(/\\/g, '/')}`}
                                  alt={doc.fileName}
                                  className="image-preview"
                                  onError={(e) => {
                                    if (!e.target.dataset.hasError) {
                                      e.target.dataset.hasError = true;
                                      e.target.src = DEFAULT_IMAGE_BASE64;
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="document-info">
                              <h4>{doc.fileName}</h4>
                              <p>{doc.description}</p>
                              <p className="upload-date">
                                Téléchargé le : {new Date(doc.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="document-actions">
                              <a
                                href={doc.filePath.startsWith('http') 
                                  ? doc.filePath 
                                  : `${API_BASE_URL}/${doc.filePath.replace(/\\/g, '/')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.fileName}
                                className="view-btn"
                              >
                                👁️ Voir
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(doc._id)}
                                className="delete-btn"
                              >
                                🗑️ Supprimer
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Modal d'upload */}
                    {isUploadModalOpen && (
                      <div className="upload-modal-overlay">
                        <div className="upload-modal">
                          <div className="modal-header">
                            <h3>Importer un document</h3>
                            <button onClick={handleCloseModal} className="close-btn">×</button>
                          </div>
                          <form onSubmit={handleUploadSubmit} className="upload-form">
                            <div className="form-group">
                              <label>Description du document :</label>
                              <input
                                type="text"
                                value={uploadDescription}
                                onChange={(e) => setUploadDescription(e.target.value)}
                                placeholder="Entrez une description"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Fichier :</label>
                              <div className="file-drop-zone" onClick={() => fileInputRef.current?.click()}>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileSelect}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  style={{ display: 'none' }}
                                />
                                {selectedFile ? (
                                  <div className="selected-file">
                                    <span>📎 {selectedFile.name}</span>
                                  </div>
                                ) : (
                                  <div className="drop-zone-text">
                                    <span>📎 Cliquez pour sélectionner un fichier</span>
                                    <small>PDF, JPEG, PNG (max 5MB)</small>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="modal-actions">
                              <button type="button" onClick={handleCloseModal} className="cancel-btn">
                                Annuler
                              </button>
                              <button type="submit" className="submit-btn" disabled={!selectedFile || !uploadDescription}>
                                Importer
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'new-appointment' && (
              <>
                <h2 className="form-container">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
                  </svg>
                  Nouveau Rendez-vous
                </h2>
                <div className="appointment-form">
                  <div className="form-group" style={{...styles.formGroup, '--animation-order': '0'}}>
                    <label style={styles.label}>Type de rendez-vous :</label>
                    <select 
                      value={appointmentType} 
                      onChange={(e) => {
                        setAppointmentType(e.target.value);
                        // Réinitialiser les champs
                        setSelectedRegion('');
                        setSelectedSpecialty('');
                        setSelectedDoctor('');
                        setSelectedLab('');
                        setSelectedHospital('');
                        setAppointmentReason('');
                        setLabAppointmentReason('');
                      }}
                      style={styles.select}
                      className="appointment-type-select"
                    >
                      <option value="medical">🩺 Consultation Médicale</option>
                      <option value="laboratory">🧪 Analyses de Laboratoire</option>
                      <option value="hospital">🏥 Consultation Hospitalière</option>
                    </select>
                  </div>

                  <div className="form-container">
                    {appointmentType === 'medical' && (
                  <form onSubmit={handleAppointmentSubmit} data-type="medical">
                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '1'}}>
                      <label style={styles.label}>Région :</label>
                      <select 
                        value={selectedRegion} 
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une région</option>
                        {regions.map(region => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '2'}}>
                      <label style={styles.label}>Spécialité :</label>
                      <select 
                        value={selectedSpecialty} 
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez une spécialité</option>
                        {specialties.map(specialty => (
                          <option key={specialty} value={specialty}>
                            {specialty}
                          </option>
                        ))}
                      </select>
                    </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '3'}}>
                      <label style={styles.label}>Médecin :</label>
                      <select 
                        value={selectedDoctor} 
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        required
                        style={styles.select}
                      >
                        <option value="">Sélectionnez un médecin</option>
                        {doctors
                          .filter(doctor => 
                            (!selectedRegion || doctor.region === selectedRegion) &&
                            (!selectedSpecialty || doctor.specialty === selectedSpecialty)
                          )
                          .map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                              Dr. {doctor.nom} {doctor.prenom} 
                              {doctor.specialty ? ` - ${doctor.specialty}` : ''}
                              {doctor.cabinet ? ` (Cabinet: ${doctor.cabinet.nom})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '4'}}>
                      <label style={styles.label}>Motif de la consultation :</label>
                      <textarea
                        value={appointmentReason}
                        onChange={(e) => setAppointmentReason(e.target.value)}
                        placeholder="Décrivez brièvement la raison de votre visite"
                        required
                        style={styles.textarea}
                      />
                    </div>

                    <button type="submit" className="submit-btn">
                      Demander un rendez-vous
                    </button>
                  </form>
            )}

                    {appointmentType === 'laboratory' && (
                      <form onSubmit={handleLabAppointmentSubmit} data-type="laboratory">
                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '1'}}>
                          <label style={styles.label}>Région :</label>
                          <select 
                            value={selectedRegion} 
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            required
                            style={styles.select}
                          >
                            <option value="">Sélectionnez une région</option>
                            {regions.map(region => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                    </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '2'}}>
                          <label style={styles.label}>Laboratoire :</label>
                          <select 
                            value={selectedLab} 
                            onChange={(e) => setSelectedLab(e.target.value)}
                            required
                            style={styles.select}
                          >
                            <option value="">Sélectionnez un laboratoire</option>
                            {labs
                              .filter(lab => !selectedRegion || lab.region === selectedRegion)
                              .map(lab => (
                                <option key={lab._id} value={lab._id}>
                                  {lab.nom} - {lab.adresse}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '3'}}>
                          <label style={styles.label}>Motif / Type d'analyse :</label>
                          <textarea
                            value={labAppointmentReason}
                            onChange={(e) => setLabAppointmentReason(e.target.value)}
                            placeholder="Décrivez le type d'analyse ou la raison de votre visite"
                            required
                            style={styles.textarea}
                          />
                        </div>

                        <button type="submit" className="submit-btn">
                          Prendre rendez-vous
                        </button>
                      </form>
                    )}

                    {appointmentType === 'hospital' && (
                      <form onSubmit={handleHospitalAppointmentSubmit} data-type="hospital">
                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '1'}}>
                          <label style={styles.label}>Région :</label>
                          <select 
                            value={selectedRegion} 
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            required
                            style={styles.select}
                          >
                            <option value="">Sélectionnez une région</option>
                            {regions.map(region => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '2'}}>
                          <label style={styles.label}>Spécialité :</label>
                          <select 
                            value={selectedSpecialty} 
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                            required
                            style={styles.select}
                          >
                            <option value="">Sélectionnez une spécialité</option>
                            {specialties.map(specialty => (
                              <option key={specialty} value={specialty}>
                                {specialty}
                              </option>
                            ))}
                          </select>
                            </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '3'}}>
                          <label style={styles.label}>Hôpital :</label>
                          <select 
                            value={selectedHospital} 
                            onChange={(e) => setSelectedHospital(e.target.value)}
                            required
                            style={styles.select}
                          >
                            <option value="">Sélectionnez un hôpital</option>
                            {hospitals.length > 0 ? (
                              hospitals
                                .filter(hospital => {
                                  if (!selectedRegion) {
                                    console.log("Aucune région sélectionnée, affichage de l'hôpital:", hospital.nom);
                                    return true;
                                  }                                  const hospitalRegion = hospital.region ? hospital.region.toLowerCase() : '';
                                  const selectedRegionLower = selectedRegion.toLowerCase();
                                  const matchesRegion = hospitalRegion === selectedRegionLower;
                                  console.log(`Filtrage - Hôpital ${hospital.nom}:`, {
                                    hospitalRegion,
                                    selectedRegion: selectedRegionLower,
                                    matchesRegion
                                  });
                                  return matchesRegion;
                                })
                                .map(hospital => (
                                  <option key={hospital._id} value={hospital._id}>
                                    {hospital.nom} - {hospital.adresse || hospital.region || ''}
                                    </option>
                                ))
                            ) : (
                              <option value="" disabled>Aucun hôpital disponible</option>
                            )}
                          </select>
                      </div>

                        <button type="submit" className="submit-btn">
                          Demander un rendez-vous
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'notifications' && (
              <div className="notifications-container">
                <div className="notifications-header">
                  <h1>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{color: '#0f766e'}}>
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                    Mes Notifications
                  </h1>
                  <div className="notifications-actions">
                    <div className="notifications-stats">
                      <div className="stat-item">
                        <span className="stat-number">{notifications.length}</span>
                        <span className="stat-label">Total</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{notifications.filter(n => !n.isRead).length}</span>
                        <span className="stat-label">Non lues</span>
                      </div>
                    </div>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <button 
                        className="mark-all-read-btn"
                        onClick={markAllNotificationsAsRead}
                        title="Marquer toutes les notifications comme lues"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <div className="empty-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                    </div>
                    <h3>Aucune notification</h3>
                    <p>Vous n'avez reçu aucune notification pour le moment.</p>
                    <small>Les notifications de vos rendez-vous et messages apparaîtront ici.</small>
                  </div>
                ) : (
                  <>
                    <div className="notifications-list">
                      {(() => {
                        const sortedNotifications = notifications
                      .sort((a, b) => {
                        const dateA = a.createdAt || a.date || new Date();
                        const dateB = b.createdAt || b.date || new Date();
                        return new Date(dateB) - new Date(dateA);
                          });
                        
                        return getPaginatedData(sortedNotifications, 'notifications').map((notif, idx) => {
                          const notificationId = notif.id || notif._id || `notification-${idx}`;
                          return (
                          <div 
                            key={notificationId} 
                            data-notification-id={notificationId}
                            className={`notification-card ${!notif.isRead ? 'unread' : ''}`}
                            onClick={() => !notif.isRead && markNotificationAsRead(notificationId)}
                            style={{ cursor: !notif.isRead ? 'pointer' : 'default' }}
                          >
                            <div className="notification-icon">
                              {notif.type === 'appointment' && (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                </svg>
                              )}
                              {notif.type === 'message' && (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z"/>
                                </svg>
                              )}
                              {notif.type === 'result' && (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                              )}
                              {!notif.type && (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                                </svg>
                              )}
                            </div>
                            <div className="notification-content">
                              <div className="notification-message">
                            {notif.message}
                          </div>
                              <div className="notification-meta">
                                <span className="notification-date">
                            {(notif.createdAt || notif.date) ? 
                                    new Date(notif.createdAt || notif.date).toLocaleString('fr-FR', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 
                              'Date non disponible'}
                                </span>
                                {notif.type && (
                                  <span className={`notification-type ${notif.type}`}>
                                    {notif.type === 'appointment' && 'Rendez-vous'}
                                    {notif.type === 'message' && 'Message'}
                                    {notif.type === 'result' && 'Résultat'}
                                  </span>
                                )}
                          </div>
                            </div>
                            {!notif.isRead && (
                              <div className="notification-status">
                                <span className="unread-indicator"></span>
                              </div>
                            )}
                          </div>
                          );
                        });
                      })()}
                    </div>
                    {renderPagination(notifications, 'notifications')}
                  </>
                )}
              </div>
            )}

            {activeSection === 'messages' && (
              <div className="messagerie-container">
                <div className="contacts-sidebar">
                  <div className="contacts-header">
                    <h2>💬 Messagerie</h2>
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder="Rechercher une conversation..."
                        className="search-input"
                      />
                    </div>
                  </div>

                <div className="contacts-list">
                    {/* Médecins groupés par docteur */}
                  <div className="contact-category">
                    <div 
                        className="category-header clickable"
                      onClick={() => toggleCategory('doctors')}
                    >
                      <div className="category-title">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{color: '#0f766e'}}>
                            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M12 7C14.76 7 17 9.24 17 12S14.76 17 12 17 7 14.76 7 12 9.24 7 12 7Z"/>
                          </svg>
                        <h3>Médecins</h3>
                      </div>
                        <div className="toggle-icon">
                          {expandedCategories.doctors ? '▼' : '▶'}
                        </div>
                    </div>
                    {expandedCategories.doctors && (
                      <div className="contacts-group">
                        {(() => {
                          // Fonction pour vérifier si c'est un vrai médecin
                          const isRealDoctor = (apt) => {
                            if (!apt.doctorId || !apt.doctorName) return false;
                            
                            const name = apt.doctorName.toLowerCase();
                            const excludedKeywords = [
                              'hôpital', 'hopital', 'clinique', 'centre', 'fatoum',
                              'laboratoire', 'labo', 'lab', 'analyse', 'biologie',
                              'imagerie', 'radio', 'scanner', 'irm', 'echo'
                            ];
                            
                            return !excludedKeywords.some(keyword => name.includes(keyword)) &&
                                   apt.type !== 'hospital' &&
                                   !apt.hospitalId &&
                                   !apt.labId &&
                                   !apt.lab;
                          };

                          // Grouper les rendez-vous par docteur (seulement les vrais médecins)
                          const doctorGroups = appointments
                            .filter(isRealDoctor)
                            .reduce((groups, apt) => {
                              const doctorId = apt.doctorId?._id || apt.doctorId;
                              if (!groups[doctorId]) {
                                groups[doctorId] = {
                                  doctorId,
                                  doctorName: apt.doctorName,
                                  appointments: [],
                                  lastAppointment: apt
                                };
                              }
                              groups[doctorId].appointments.push(apt);
                              // Garder le rendez-vous le plus récent
                              if (new Date(apt.date) > new Date(groups[doctorId].lastAppointment.date)) {
                                groups[doctorId].lastAppointment = apt;
                              }
                              return groups;
                            }, {});

                          if (Object.keys(doctorGroups).length === 0) {
                            return (
                              <div className="empty-category">
                                <div className="empty-icon">👨‍⚕️</div>
                                <p>Aucun médecin disponible</p>
                                <small>Les conversations apparaîtront après vos rendez-vous</small>
                              </div>
                            );
                          }

                          return Object.values(doctorGroups).map(group => (
                            <div key={group.doctorId} className="contact-item-wrapper">
                              <div 
                                className={`contact-item ${selectedAppointment?.doctorId === group.doctorId ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedAppointment(group.lastAppointment);
                                  fetchChatMessages(group.lastAppointment._id);
                                  
                                  // Marquer immédiatement comme lu dans l'interface
                                  if (unreadMessages[group.doctorId] > 0) {
                                    markMessagesAsReadInUI(group.doctorId, false);
                                  }
                                }}
                              >
                                <div className="contact-avatar doctor">
                                  👨‍⚕️
                                </div>
                                <div className="contact-info">
                                  <div className="contact-name">{group.doctorName}</div>
                                  <div className="contact-meta">
                                    <span className="appointment-count">{group.appointments.length} RDV</span>
                                    <span className="last-date">{new Date(group.lastAppointment.date).toLocaleDateString('fr-FR')}</span>
                                  </div>
                                </div>
                                <div className="contact-indicators">
                                  {unreadMessages[group.doctorId] && unreadMessages[group.doctorId] > 0 && (
                                    <span 
                                      className="unread-badge"
                                      key={`doctor-${group.doctorId}-${unreadMessages[group.doctorId]}`}
                                    >
                                      {unreadMessages[group.doctorId]}
                                    </span>
                                  )}
                                </div>
                              </div>
                                  </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                    {/* Laboratoires groupés */}
                  <div className="contact-category">
                    <div 
                        className="category-header clickable"
                      onClick={() => toggleCategory('labs')}
                    >
                      <div className="category-title">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{color: '#7c3aed'}}>
                            <path d="M5,2H7V4H5V6H3V4C3,2.89 3.89,2 5,2M19,2C20.11,2 21,2.89 21,4V6H19V4H17V2H19M5,18V20H7V22H5C3.89,22 3,21.11 3,20V18H5M19,18H21V20C21,21.11 20.11,22 19,22H17V20H19V18M12,6A4,4 0 0,1 16,10C16,12 14,16 12,16C10,16 8,12 8,10A4,4 0 0,1 12,6M12,8A2,2 0 0,0 10,10C10,10.67 10.83,12 12,12C13.17,12 14,10.67 14,10A2,2 0 0,0 12,8Z"/>
                          </svg>
                        <h3>Laboratoires</h3>
                      </div>
                        <div className="toggle-icon">
                          {expandedCategories.labs ? '▼' : '▶'}
                        </div>
                    </div>
                    {expandedCategories.labs && (
                      <div className="contacts-group">
                        {(() => {
                          // Fonction pour vérifier si c'est un vrai laboratoire
                          const isRealLab = (apt) => {
                            if (!apt.lab || !apt.lab._id || !apt.lab.nom) return false;
                            
                            const name = apt.lab.nom.toLowerCase();
                            const excludedKeywords = [
                              'hôpital', 'hopital', 'clinique', 'centre médical', 'fatoum'
                            ];
                            const labKeywords = [
                              'laboratoire', 'labo', 'lab', 'analyse', 'biologie'
                            ];
                            
                            return !excludedKeywords.some(keyword => name.includes(keyword)) &&
                                   labKeywords.some(keyword => name.includes(keyword));
                          };

                          // Grouper les rendez-vous par laboratoire (seulement les vrais laboratoires)
                          const labGroups = labAppointments
                            .filter(isRealLab)
                            .reduce((groups, apt) => {
                              const labId = apt.lab?._id || apt.labId;
                              const labName = apt.lab?.nom || 'Laboratoire';
                              if (!groups[labId]) {
                                groups[labId] = {
                                  labId,
                                  labName,
                                  appointments: [],
                                  lastAppointment: apt
                                };
                              }
                              groups[labId].appointments.push(apt);
                              // Garder le rendez-vous le plus récent
                              if (new Date(apt.date) > new Date(groups[labId].lastAppointment.date)) {
                                groups[labId].lastAppointment = apt;
                              }
                              return groups;
                            }, {});

                          if (Object.keys(labGroups).length === 0) {
                            return (
                              <div className="empty-category">
                                <div className="empty-icon">🔬</div>
                                <p>Aucun laboratoire disponible</p>
                                <small>Les conversations apparaîtront après vos analyses</small>
                              </div>
                            );
                          }

                          return Object.values(labGroups).map(group => (
                            <div key={group.labId} className="contact-item-wrapper">
                              <div 
                                className={`contact-item ${selectedAppointment?.labId === group.labId ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedAppointment(group.lastAppointment);
                                  fetchChatMessages(group.lastAppointment._id);
                                  
                                  // Marquer immédiatement comme lu dans l'interface
                                  if (unreadMessages[group.labId] > 0) {
                                    markMessagesAsReadInUI(group.labId, true);
                                  }
                                }}
                              >
                                <div className="contact-avatar lab">
                                  🔬
                                </div>
                              <div className="contact-info">
                                  <div className="contact-name">{group.labName}</div>
                                  <div className="contact-meta">
                                    <span className="appointment-count">{group.appointments.length} analyses</span>
                                    <span className="last-date">{new Date(group.lastAppointment.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                              <div className="contact-indicators">
                                  {unreadMessages[group.labId] && unreadMessages[group.labId] > 0 && (
                                    <span 
                                      className="unread-badge"
                                      key={`lab-${group.labId}-${unreadMessages[group.labId]}`}
                                    >
                                      {unreadMessages[group.labId]}
                                    </span>
                              )}
                            </div>
                            </div>
                                </div>
                          ));
                        })()}
                              </div>
                            )}
                          </div>
                  </div>
                  </div>
                  
                <div className="chat-container">
                    {selectedAppointment ? (
                      <>
                        <div className="chat-header">
                        <div className="contact-avatar">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <div className="contact-info">
                        <div className="contact-name">
                          {selectedAppointment.doctorName || selectedAppointment.lab?.nom}
                        </div>
                          <div className="contact-status">
                            <span className="status-indicator"></span>
                            Conversation unifiée • {selectedAppointment.doctorName ? 'Médecin' : 'Laboratoire'}
                          </div>
                        </div>
                        <div className="chat-actions">
                          <button className="action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                            </svg>
                          </button>
                          <button className="action-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                        <div className="chat-messages">
                        {chatLoading ? (
                          <div className="loading-messages">
                            <div className="loading-spinner"></div>
                            <p>Chargement des messages...</p>
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <div className="empty-messages">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z"/>
                            </svg>
                            <h3>Aucun message</h3>
                            <p>Commencez une conversation en envoyant un message</p>
                          </div>
                        ) : (
                          <div className="messages-list">
                              {chatMessages.map((msg) => (
                              <div 
                                key={msg._id} 
                            className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}
                              >
                                <div className={`message-bubble ${!msg.isRead && msg.senderId !== userId ? 'unread' : ''}`}>
                                <div className="message-content">{msg.content}</div>
                                  <div className="message-time">
                                    {new Date(msg.sentAt || msg.createdAt).toLocaleString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                </div>
                                </div>
                                {!msg.isRead && msg.senderId !== userId && (
                                  <div className="message-status">
                                    <span 
                                      className="unread-indicator"
                                      key={`indicator-${msg._id}`}
                                    ></span>
                                  </div>
                                )}
                              </div>
                              ))}
                          </div>
                        )}
                            </div>

                      <div className="chat-input-container">
                        <div className="chat-input">
                          <button className="attachment-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z"/>
                            </svg>
                          </button>
                          <input
                            type="text"
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                            className="message-input"
                          />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newChatMessage.trim()}
                          className="send-button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                            </svg>
                          </button>
                        </div>
                        </div>
                      </>
                    ) : (
                      <div className="no-chat-selected">
                        <div className="empty-state">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2M6,9H18V11H6V9M6,12H16V14H6V12M6,6H18V8H6V6Z"/>
                        </svg>
                        <h3>Sélectionnez une conversation</h3>
                        <p>Choisissez un médecin ou un laboratoire dans la liste pour commencer à échanger des messages</p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {activeSection === 'all-appointments' && (
              <div className="appointments-container">
                <div className="appointments-header">
                  <h1>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{color: '#0f766e'}}>
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    Mes Rendez-vous
                  </h1>
                </div>

                {/* Section Médecins */}
                <div className="appointment-category">
                  <div 
                    className="category-header clickable"
                      onClick={() => toggleSection('medical')}
                  >
                    <div className="category-title">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{color: '#0f766e'}}>
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M12 7C14.76 7 17 9.24 17 12S14.76 17 12 17 7 14.76 7 12 9.24 7 12 7Z"/>
                      </svg>
                      <h2>Médecins ({appointments.length})</h2>
                    </div>
                    <span className="toggle-icon">
                      {expandedSections.medical ? '▼' : '▶'}
                    </span>
                    </div>
                    {expandedSections.medical && (
                      appointments.length === 0 ? (
                      <div className="empty-category">
                        <p>Aucun rendez-vous médical</p>
                      </div>
                    ) : (
                      <>
                        <div className="appointments-grid">
                          {getPaginatedData(appointments, 'medical').map(apt => (
                            <div key={apt._id} className="appointment-card medical">
                              <div className="appointment-info">
                                <h3>{apt.doctorName}</h3>
                                <p className="appointment-date">
                                  {new Date(apt.date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <p className="appointment-reason">{apt.reason}</p>
                              </div>
                              <div className="appointment-status">
                                    <span className={`status-badge ${apt.status}`}>
                                      {apt.status === 'pending' && 'En attente'}
                                      {apt.status === 'confirmed' && 'Confirmé'}
                                      {apt.status === 'cancelled' && 'Annulé'}
                                    </span>
                              </div>
                                    {apt.status !== 'cancelled' && (
                                <div className="appointment-actions">
                                        <button
                                          onClick={() => handleCancelAppointment(apt._id, 'medical')}
                                    className="cancel-btn"
                                        >
                                    Annuler
                                        </button>
                                </div>
                                    )}
                                  </div>
                            ))}
                      </div>
                        {renderPagination(appointments, 'medical')}
                      </>
                    )
                  )}
                </div>

                {/* Section Laboratoires */}
                <div className="appointment-category">
                  <div 
                    className="category-header clickable"
                    onClick={() => toggleSection('laboratory')}
                  >
                    <div className="category-title">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{color: '#7c3aed'}}>
                        <path d="M5,2H7V4H5V6H3V4C3,2.89 3.89,2 5,2M19,2C20.11,2 21,2.89 21,4V6H19V4H17V2H19M5,18V20H7V22H5C3.89,22 3,21.11 3,20V18H5M19,18H21V20C21,21.11 20.11,22 19,22H17V20H19V18M12,6A4,4 0 0,1 16,10C16,12 14,16 12,16C10,16 8,12 8,10A4,4 0 0,1 12,6M12,8A2,2 0 0,0 10,10C10,10.67 10.83,12 12,12C13.17,12 14,10.67 14,10A2,2 0 0,0 12,8Z"/>
                      </svg>
                      <h2>Laboratoires ({labAppointments.length})</h2>
                    </div>
                    <span className="toggle-icon">
                      {expandedSections.laboratory ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedSections.laboratory && (
                    labAppointments.length === 0 ? (
                      <div className="empty-category">
                        <p>Aucun rendez-vous laboratoire</p>
                      </div>
                    ) : (
                      <>
                        <div className="appointments-grid">
                          {getPaginatedData(labAppointments, 'laboratory').map(apt => (
                            <div key={apt._id} className="appointment-card laboratory">
                              <div className="appointment-info">
                                <h3>{apt.lab?.nom || 'Laboratoire'}</h3>
                                <p className="appointment-date">
                                  {new Date(apt.date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <p className="appointment-reason">{apt.reason}</p>
                              </div>
                              <div className="appointment-status">
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                              </div>
                                  {apt.status !== 'cancelled' && (
                                <div className="appointment-actions">
                                    <button
                                      onClick={() => handleCancelAppointment(apt._id, 'laboratory')}
                                    className="cancel-btn"
                                    >
                                    Annuler
                                    </button>
                                </div>
                                  )}
                            </div>
                            ))}
                      </div>
                        {renderPagination(labAppointments, 'laboratory')}
                      </>
                    )
                  )}
                </div>

                {/* Section Hôpitaux */}
                <div className="appointment-category">
                  <div 
                    className="category-header clickable"
                    onClick={() => toggleSection('hospital')}
                  >
                    <div className="category-title">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{color: '#dc2626'}}>
                        <path d="M12,3L2,12H5V20H19V12H22L12,3M12,8.75A1.25,1.25 0 0,1 13.25,10A1.25,1.25 0 0,1 12,11.25A1.25,1.25 0 0,1 10.75,10A1.25,1.25 0 0,1 12,8.75M12,6.5A3.5,3.5 0 0,0 8.5,10A3.5,3.5 0 0,0 12,13.5A3.5,3.5 0 0,0 15.5,10A3.5,3.5 0 0,0 12,6.5Z"/>
                      </svg>
                      <h2>Hôpitaux ({hospitalAppointments.length})</h2>
                    </div>
                    <span className="toggle-icon">
                      {expandedSections.hospital ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedSections.hospital && (
                    hospitalAppointments.length === 0 ? (
                      <div className="empty-category">
                        <p>Aucun rendez-vous hospitalier</p>
                      </div>
                    ) : (
                      <>
                        <div className="appointments-grid">
                          {getPaginatedData(hospitalAppointments, 'hospital').map(apt => (
                            <div key={apt._id} className="appointment-card hospital">
                              <div className="appointment-info">
                                <h3>{apt.hospitalId?.nom || 'Hôpital'}</h3>
                                <p className="appointment-date">
                                  {apt.appointmentDate ? 
                                    new Date(apt.appointmentDate).toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'Date à confirmer'
                                  }
                                </p>
                                <p className="appointment-reason">{apt.specialty}</p>
                              </div>
                              <div className="appointment-status">
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                              </div>
                                  {apt.status !== 'cancelled' && (
                                <div className="appointment-actions">
                                    <button
                                      onClick={() => handleCancelAppointment(apt._id, 'hospital')}
                                    className="cancel-btn"
                                    >
                                    Annuler
                                    </button>
                                </div>
                                  )}
                            </div>
                            ))}
                      </div>
                        {renderPagination(hospitalAppointments, 'hospital')}
                      </>
                    )
                  )}
                </div>

                {/* Message si aucun rendez-vous */}
                {appointments.length === 0 && labAppointments.length === 0 && hospitalAppointments.length === 0 && (
                  <div className="no-appointments">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" style={{color: '#9ca3af', marginBottom: '1rem'}}>
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    <h3>Aucun rendez-vous</h3>
                    <p>Vous n'avez aucun rendez-vous programmé pour le moment.</p>
                    <button 
                      onClick={() => setActiveSection('new-appointment')}
                      className="new-appointment-btn"
                    >
                      Prendre un rendez-vous
                    </button>
              </div>
                )}
              </div>
          )}

          {activeSection === 'lab-results' && (
            <div className="lab-results-container">
              <div className="lab-results-header">
                <h1>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{color: '#0f766e'}}>
                    <path d="M5,3H7V5H5V10A2,2 0 0,1 3,8V5C3,3.89 3.9,3 5,3M19,3A2,2 0 0,1 21,5V8A2,2 0 0,1 19,10V5H17V3H19M16.4,20C17,18.9 17,17.1 16.4,16C15.8,14.9 15.8,13.1 16.4,12C17,10.9 17,9.1 16.4,8H7.6C7,9.1 7,10.9 7.6,12C8.2,13.1 8.2,14.9 7.6,16C7,17.1 7,18.9 7.6,20H16.4Z"/>
                  </svg>
                  Mes Résultats d'Analyses
                </h1>
                <div className="lab-stats">
                  <div className="stat-item">
                    <span className="stat-number">{labResults.length}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">
                      {Object.keys(labResults.reduce((acc, result) => {
                        const labId = result.labId?._id;
                        if (labId) acc[labId] = true;
                        return acc;
                      }, {})).length}
                    </span>
                    <span className="stat-label">Laboratoires</span>
                  </div>
                </div>
              </div>

                {labResults.length === 0 ? (
                <div className="empty-lab-results">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5,3H7V5H5V10A2,2 0 0,1 3,8V5C3,3.89 3.9,3 5,3M19,3A2,2 0 0,1 21,5V8A2,2 0 0,1 19,10V5H17V3H19M16.4,20C17,18.9 17,17.1 16.4,16C15.8,14.9 15.8,13.1 16.4,12C17,10.9 17,9.1 16.4,8H7.6C7,9.1 7,10.9 7.6,12C8.2,13.1 8.2,14.9 7.6,16C7,17.1 7,18.9 7.6,20H16.4Z"/>
                    </svg>
                  </div>
                  <h3>Aucun résultat d'analyse</h3>
                  <p>Vous n'avez reçu aucun résultat d'analyse pour le moment.</p>
                  <small>Les résultats de vos analyses apparaîtront ici.</small>
                </div>
              ) : (
                <div className="results-by-lab">
                  {Object.entries(
                    labResults.reduce((acc, result) => {
                      const labId = result.labId?._id;
                      const labName = result.labId?.nom || 'Laboratoire non spécifié';
                      if (!acc[labId]) {
                        acc[labId] = {
                          labName,
                          results: []
                        };
                      }
                      acc[labId].results.push(result);
                      return acc;
                    }, {})
                  ).map(([labId, { labName, results }]) => (
                    <div key={labId} className="lab-results-section">
                      <div 
                        className="lab-header clickable"
                        onClick={() => toggleDoctor(labId)}
                      >
                        <div className="lab-info">
                          <div className="lab-avatar">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M5,3H7V5H5V10A2,2 0 0,1 3,8V5C3,3.89 3.9,3 5,3M19,3A2,2 0 0,1 21,5V8A2,2 0 0,1 19,10V5H17V3H19M16.4,20C17,18.9 17,17.1 16.4,16C15.8,14.9 15.8,13.1 16.4,12C17,10.9 17,9.1 16.4,8H7.6C7,9.1 7,10.9 7.6,12C8.2,13.1 8.2,14.9 7.6,16C7,17.1 7,18.9 7.6,20H16.4Z"/>
                            </svg>
                      </div>
                          <div className="lab-details">
                            <h3 className="lab-name">{labName}</h3>
                            <span className="results-count">{results.length} résultat{results.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                        <div className="lab-actions">
                          <div className="lab-badge">
                            <span className="badge-text">Laboratoire</span>
                      </div>
                          <div className="toggle-icon">
                            {expandedDoctors[labId] ? '▼' : '▶'}
                      </div>
                        </div>
                      </div>
                      
                      {expandedDoctors[labId] && (
                        <div className="lab-results-list">
                          {results
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((result, index) => (
                            <div key={result._id} className="result-item">
                              <div className="result-number">
                                {index + 1}
                              </div>
                              <div className="result-content">
                                <div className="result-header">
                                  <span className="result-date">
                                    {new Date(result.appointmentId?.date || result.createdAt).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                  <span className="result-time">
                                    {new Date(result.appointmentId?.date || result.createdAt).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="result-test-type">
                                  <strong>Type d'analyse:</strong> {result.testType}
                                </div>
                                <div className="result-description">
                                  <strong>Résultats:</strong> {result.results}
                                </div>
                              </div>
                              <div className="result-actions">
                        {result.fileUrl && (
                            <a
                              href={`${API_BASE_URL}/${result.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                                    className="view-result-btn"
                                    title="Voir le fichier"
                              onClick={(e) => {
                                e.preventDefault();
                                const url = `${API_BASE_URL}/${result.fileUrl}`;
                                console.log("🔗 Tentative d'accès au fichier:", url);
                                window.open(url, '_blank');
                              }}
                            >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                                    </svg>
                            </a>
                        )}
                      </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
          )}

          {activeSection === 'medical-reports' && (
            <div className="medical-reports-container">
              <div className="medical-reports-header">
                <h1>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{color: '#0f766e'}}>
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Mes Rapports Médicaux
                </h1>
                <div className="reports-stats">
                  <div className="stat-item">
                    <span className="stat-number">{medicalReports.length}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">
                      {Object.keys(medicalReports.reduce((acc, report) => {
                        const doctorId = report.doctorId?._id;
                        if (doctorId) acc[doctorId] = true;
                        return acc;
                      }, {})).length}
                    </span>
                    <span className="stat-label">Médecins</span>
                  </div>
                </div>
              </div>

                {medicalReports.length === 0 ? (
                <div className="empty-reports">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <h3>Aucun rapport médical</h3>
                  <p>Vous n'avez reçu aucun rapport médical pour le moment.</p>
                  <small>Les rapports de vos consultations apparaîtront ici.</small>
                </div>
                ) : (
                  <div className="reports-by-doctor">
                    {Object.entries(
                      medicalReports.reduce((acc, report) => {
                        const doctorId = report.doctorId?._id;
                        const doctorName = `Dr. ${report.doctorId?.nom} ${report.doctorId?.prenom}`;
                        if (!acc[doctorId]) {
                          acc[doctorId] = {
                            doctorName,
                            reports: []
                          };
                        }
                        acc[doctorId].reports.push(report);
                        return acc;
                      }, {})
                    ).map(([doctorId, { doctorName, reports }]) => (
                      <div key={doctorId} className="doctor-reports-section">
                      <div 
                        className="doctor-header clickable"
                        onClick={() => toggleDoctor(doctorId)}
                      >
                        <div className="doctor-info">
                          <div className="doctor-avatar">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M12 7C14.76 7 17 9.24 17 12S14.76 17 12 17 7 14.76 7 12 9.24 7 12 7Z"/>
                            </svg>
                          </div>
                          <div className="doctor-details">
                        <h3 className="doctor-name">{doctorName}</h3>
                            <span className="reports-count">{reports.length} rapport{reports.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="doctor-actions">
                          <div className="doctor-badge">
                            <span className="badge-text">Médecin</span>
                          </div>
                          <div className="toggle-icon">
                            {expandedDoctors[doctorId] ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>
                      
                      {expandedDoctors[doctorId] && (
                        <>
                          {reports.length === 1 ? (
                        // Affichage carte pour un seul rapport
                        <div className="single-report-card">
                          {reports.map((report) => (
                            <div key={report._id} className="report-card-content">
                              <div className="report-main-info">
                                <div className="report-icon">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                  </svg>
                              </div>
                                <div className="report-details">
                                  <div className="report-title">Rapport de consultation</div>
                                  <div className="report-date">
                                    {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="report-description">{report.description}</div>
                                </div>
                              </div>
                              <div className="report-actions">
                                <a
                                  href={`${API_BASE_URL}/${report.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="view-report-btn"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                                  </svg>
                                  Voir le rapport
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Affichage liste pour plusieurs rapports
                        <div className="reports-list">
                          <div className="list-header">
                            <span className="list-title">Historique des rapports</span>
                            <span className="list-count">{reports.length} rapports</span>
                      </div>
                          <div className="reports-list-items">
                            {reports
                              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                              .map((report, index) => (
                              <div key={report._id} className="report-list-item">
                                <div className="report-list-number">
                                  {index + 1}
                                </div>
                                <div className="report-list-content">
                                  <div className="report-list-header">
                                    <span className="report-list-date">
                                      {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}
                                    </span>
                                    <span className="report-list-time">
                                      {new Date(report.createdAt).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <div className="report-list-description">
                                    {report.description}
                                  </div>
                                  {report.appointmentId?.date && (
                                    <div className="report-list-appointment">
                                      Consultation du {new Date(report.appointmentId.date).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
                                <div className="report-list-actions">
                                  <a
                                    href={`${API_BASE_URL}/${report.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-list-btn"
                                    title="Voir le rapport"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  </div>
);
};

export default PatientDashboard;
