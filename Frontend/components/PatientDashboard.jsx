import React, { useState, useEffect, useRef } from 'react';
import AppointmentForm from './AppointmentForm';
import '../styles/PatientDashboard.css';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

// Image par défaut en base64 (une petite image grise avec une icône de document)
const DEFAULT_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFHWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDMtMTlUMTU6NDc6MTgrMDE6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMTlUMTU6NDc6MTgrMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAzLTE5VDE1OjQ3OjE4KzAxOjAwIiB4bWBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY2ZjI5ZjFiLTQ4ZDYtNDZhNi1hZTM0LTNkYjNhOTNmMWE2ZiIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY2ZjI5ZjFiLTQ4ZDYtNDZhNi1hZTM0LTNkYjNhOTNmMWE2ZiIgc3RFdnQ6d2hlbj0iMjAyNC0wMy0xOVQxNTo0NzoxOCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+YjqoRwAABGxJREFUaIHtmU9oHFUcxz/vzczO7G42m91kN0mbNKlpqkWqVkGkKFiwelBEevDiqQcv3qQXEVE8ehL04EFE8KAH/4AHwYNVKyoWqW1Tg7U1pmmTbLLZ3c3uzO7szrwedrOZnZ3ZzP5Jk0I/EJZ5v/d77/t93/vN7828UZRSPMxQH3TnQwCDxkMPYNAY9BK6I1RVxXGcO0LTNFRF6Rp3L3BXAVi2hWmauK6L4zgAhEIhwuEwmqbdKyj3DoBpmhiGgeu6GIaBpmkIIQiFQoRCIRRFQdf1ewVi8ADa7Ta2bSOlxHVdXNdFVVU0TUPTNKSUWJaFbduEw2E0TRsokIECsG0by7JQVRXP8/A8D1VViUQiRCIRVFVFCEGr1cKyLCKRCJFIZGAgBgbAcRxM00QIged5CCGIRCJEo1HC4TCKouA4DkIIDMNACEE0Gh0IiIEAkFLS6XSQUuJ5HoqiEI1GiUajhEKhzn3gOA62bSOEwHVdPM8jGo2i6/p9AyGklNi2jed5nQtZVVVisRixWKxrXpumSbvdxvM8FEUhHA4TiUTQdf2+LKl7PoVc18UwDKSUGIaBpmkMDQ0Ri8W6wgPE43GGhoY6S0kIQbvdxjTNe76k7vkMmKaJbduYpomiKMTjceLxOLquI4RA13U0TcNxHGzbxnVdPM8jFAoRiUTQNO2egbinAKSUtFotXNfFtm10XScejxOPxwmHw52LVwiBbduYponrugghCIfDRKPR+wLingGQUmIYBp7n0W63URSFoaEhEokEuq4jhMA0TaSUtNtthBB4noeu68RiMcLh8IABtNttLMvCcRwsy0LXdRKJBMlkknA4jBACwzBwXRfLsnAcB8/z0DSNeDxOKBQaHADXdWm1WkgpabfbqKpKMpkkmUyi6zqe59FqtZBSYpomtm13Zmd4eJhwODw4AJZlYRgGnufRbDYJhUIkk0mSySSRSATXdWk0GriuS6vVwnEcpJREo1Hi8TihUGhwAEzTxLIsXNel0WigaRrDw8OkUimGhoZwHIdGo4HjODQaDaSUeJ5HPB4nkUigquqDXUKGYeC6LrZt02g00DSNVCpFOp0mFoth2zb1ep12u02z2cTzPFRVJZFIkEgkBgfAsixarRau61Kv11FVlXQ6TTqdJhaL0W63qdVqtNtter0eQghisRipVGpwABzHodls4nkejUYDRVFIp9NkMhni8TiWZVGr1bAsi3q9jpSSUChEMpkkkUgMDoDneRiGgZQSwzBQFIVMJsPIyAjJZBLTNKnVajQaDer1Op7noWka6XSaZDI5OABSSprNJlJKms0mnueRyWQYHR0llUphGAa1Wo1arUaz2cTzPMLhMJlMhlQqNTgAUkpqtRpSSur1Oq7rks1mGR0dJZ1OY5omlUqFarVKq9XC8zwikQiZTIZ0Oj04AEIIqtUqnufRaDSwbZtsNsvY2BiZTIZWq0WlUqFSqdBut/E8j2g0SjabJZPJDA6AoijUajWklNTrdRzHYWRkhLGxMbLZLM1mk3K5TLlcpt1u43ke0WiUbDbL6Ojo4AAoikKlUsG2ber1Oq7rMjo6yvj4ONlslnq9TqlUolQq0el0OgDGx8cHCwDgP0H/v9H/AIrWUWwj8nFjAAAAAElFTkSuQmCC';

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
  }
};

// Ajouter les styles CSS pour les animations
const additionalStyles = `
  :root {
    --primary-color: #4CAF50;
    --primary-dark: #388E3C;
    --primary-light: #C8E6C9;
    --text-primary: #212121;
    --text-secondary: #757575;
    --bg-primary: #E8F5E9 !important;
    --bg-secondary: #F1F8E9 !important;
    --bg-hover: #DCEDC8;
    --border-color: #A5D6A7;
    --sidebar-bg: #2E7D32;
    --sidebar-hover: #388E3C;
    --sidebar-active: #43A047;
    --sidebar-text: #ffffff;
    --sidebar-text-hover: #E8F5E9;
  }

  body, html {
    background-color: var(--bg-primary) !important;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }

  .dashboard-wrapper {
    display: flex;
    min-height: 100vh;
    background-color: var(--bg-primary) !important;
  }

  .dashboard {
    flex: 1;
    margin-left: 280px;
    padding: 2rem;
    background-color: var(--bg-primary) !important;
    min-height: 100vh;
  }

  .sidebar {
    width: 280px;
    background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--primary-dark) 100%);
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    color: var(--sidebar-text);
    z-index: 1000;
  }

  .profile-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
  }

  @media (max-width: 768px) {
    .dashboard {
      margin-left: 0;
      padding: 1rem;
    }

    .sidebar {
      position: relative;
      width: 100%;
      height: auto;
    }
  }
`;

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
  const [unreadMessages, setUnreadMessages] = useState(0);
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
    doctors: true,
    labs: true,
    hospitals: true
  });

  const [expandedContacts, setExpandedContacts] = useState({});

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

  const fetchProfile = async (id) => {
    try {
      setIsLoading(true);
      // Récupérer les informations de l'utilisateur
      const userRes = await axios.get(`${API_BASE_URL}/api/users/${id}`);
      
      // Récupérer les informations du patient
      const patientRes = await axios.get(`${API_BASE_URL}/api/patients/user/${id}`);
      
      // Combiner les informations
      const combinedProfile = {
        ...userRes.data,
        bloodType: patientRes.data.bloodType || '',
        chronicDiseases: patientRes.data.chronicDiseases || '',
        emergencyPhone: patientRes.data.emergencyContact?.phone || '',
        emergencyContactName: patientRes.data.emergencyContact?.name || '',
        emergencyContactRelation: patientRes.data.emergencyContact?.relationship || ''
      };
      
      setProfile(combinedProfile);
    } catch (error) {
      console.error('❌ Erreur récupération profil:', error);
      if (error.response?.status === 404) {
        setMessage("Profil non trouvé. Veuillez compléter votre profil.");
      } else {
        setMessage("❌ Erreur lors de la récupération du profil.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications/${id}`);
      setNotifications(res.data);
    } catch (error) {
      console.error("❌ Erreur notifications:", error);
    }
  };

  const fetchMedicalDocuments = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patient/medical-documents/${id}`);
      setMedicalDocuments(res.data || []);
    } catch (error) {
      console.error("❌ Erreur récupération documents:", error);
      if (error.response?.status === 404) {
        setMedicalDocuments([]); // Set empty array for new patients
      } else {
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
          const unreadMessages = messages
            .filter(msg => msg.receiverId === userId && !msg.isRead)
            .map(msg => msg._id);
          
          if (unreadMessages.length > 0) {
            await axios.put(`${API_BASE_URL}/api/lab-patient-messages/read`, {
              messageIds: unreadMessages
            });
          }
        } catch (error) {
          console.error("❌ Erreur lors du chargement des messages de laboratoire:", error);
          setError("Erreur lors du chargement des messages de laboratoire");
        }
      } else {
        // Messages de médecin
        const doctorId = appointment.doctorId?._id || appointment.doctorId;
        if (!doctorId) {
          console.error("ID du médecin non trouvé dans le rendez-vous:", appointment);
          setError("Erreur: Impossible de charger les messages - ID du médecin manquant");
          return;
        }
        console.log("Chargement des messages du médecin pour:", doctorId);
        try {
          const response = await axios.get(`${API_BASE_URL}/api/messages/${appointmentId}?userId=${userId}`);
          console.log("✅ Messages du médecin reçus:", response.data);
          messages = response.data;
          
          // Marquer les messages comme lus
          const unreadMessages = messages
            .filter(msg => msg.receiverId === userId && !msg.isRead)
            .map(msg => msg._id);
          
          if (unreadMessages.length > 0) {
            await axios.put(`${API_BASE_URL}/api/messages/read`, {
              messageIds: unreadMessages
            });
          }
        } catch (error) {
          console.error("❌ Erreur lors du chargement des messages du médecin:", error);
          setError("Erreur lors du chargement des messages du médecin");
        }
      }

      setChatMessages(messages);
      checkUnreadMessages();
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
      setLabAppointments([]);
      console.error("❌ Erreur lors de la récupération des rendez-vous laboratoire:", error);
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
      console.error('Erreur lors de la récupération des résultats:', error);
      setError("Erreur lors de la récupération des résultats de laboratoire");
    }
  };

  const fetchHospitals = async () => {
    try {
      console.log("🏥 Récupération des hôpitaux...");
      const response = await axios.get(`${API_BASE_URL}/api/medecins-valides`);
      console.log("✅ Données reçues:", response.data);
      // Filtrer uniquement les hôpitaux
      const validatedHospitals = response.data.filter(user => 
        user.roles.includes('Hospital') || user.roles.includes('hopital')
      );
      console.log("🏥 Hôpitaux filtrés:", validatedHospitals);
      setHospitals(validatedHospitals);
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
      setDoctors(response.data.filter(user => 
        user.roles.includes('Doctor') || 
        user.roles.includes('doctor')
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

    try {
      // Récupérer les messages non lus des médecins
      console.log("🔍 Vérification des messages non lus des médecins");
      const doctorMessagesResponse = await axios.get(`${API_BASE_URL}/api/messages/unread/${userId}`);
      if (doctorMessagesResponse.data && Array.isArray(doctorMessagesResponse.data)) {
        totalUnread += doctorMessagesResponse.data.length;
        console.log("✅ Messages non lus des médecins:", doctorMessagesResponse.data.length);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des messages non lus des médecins:", error);
    }

    // Pour les laboratoires, nous devons vérifier chaque laboratoire avec lequel le patient a un rendez-vous
    try {
      console.log("🔍 Vérification des messages non lus des laboratoires");
      const labAppointmentsWithMessages = labAppointments.filter(apt => apt.lab && apt.lab._id);
      
      for (const apt of labAppointmentsWithMessages) {
        try {
          const labMessagesResponse = await axios.get(`${API_BASE_URL}/api/lab-patient-messages/${apt.lab._id}/${userId}`);
          if (labMessagesResponse.data && Array.isArray(labMessagesResponse.data)) {
            const unreadCount = labMessagesResponse.data.filter(msg => !msg.isRead && msg.receiverId === userId).length;
            totalUnread += unreadCount;
            console.log(`✅ Messages non lus du laboratoire ${apt.lab.nom}:`, unreadCount);
          }
        } catch (labError) {
          console.error(`❌ Erreur pour le laboratoire ${apt.lab._id}:`, labError);
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des messages non lus des laboratoires:", error);
    }

    console.log("📊 Total des messages non lus:", totalUnread);
    setUnreadMessages(totalUnread);
  };

  // Modifier l'useEffect pour vérifier les messages non lus uniquement quand userId est disponible
  useEffect(() => {
    if (userId) {
      checkUnreadMessages();
      const interval = setInterval(checkUnreadMessages, 900000);
      return () => clearInterval(interval);
    }
  }, [userId]);

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
      // Séparer les données entre User et Patient
      const userUpdateData = {
        nom: editedProfile.nom,
        prenom: editedProfile.prenom,
        email: editedProfile.email,
        telephone: editedProfile.telephone,
        adresse: editedProfile.adresse,
      };

      const patientUpdateData = {
        bloodType: editedProfile.bloodType,
        chronicDiseases: editedProfile.chronicDiseases,
        emergencyContact: {
          phone: editedProfile.emergencyPhone,
          name: editedProfile.emergencyContactName || '',
          relationship: editedProfile.emergencyContactRelation || ''
        }
      };

      // Mettre à jour les informations de l'utilisateur
      const userResponse = await axios.put(`${API_BASE_URL}/api/users/${userId}`, userUpdateData);
      
      // Mettre à jour les informations du patient
      const patientResponse = await axios.put(`${API_BASE_URL}/api/patients/${userId}`, patientUpdateData);

      // Mettre à jour l'état local avec les données combinées
      setProfile({
        ...userResponse.data,
        ...patientResponse.data
      });
      
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

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-role">Patient</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-group">
            <div className="menu-group-title">Profil</div>
            <button 
              className={activeSection === 'profile' ? 'active' : ''} 
              onClick={() => setActiveSection('profile')}
            >
              <span className="icon">👤</span>
              Mon Profil
            </button>
            {/* <button 
              className={activeSection === 'documents' ? 'active' : ''} 
              onClick={() => setActiveSection('documents')}
            >
              <span className="icon">📄</span>
              Documents Médicaux
            </button> */}
          </div>

          <div className="menu-group">
            <div className="menu-group-title">Rendez-vous</div>
            <button 
              className={activeSection === 'all-appointments' ? 'active' : ''} 
              onClick={() => setActiveSection('all-appointments')}
            >
              <span className="icon">📋</span>
              Tous mes rendez-vous
            </button>
            <button 
              className={activeSection === 'new-appointment' ? 'active' : ''} 
              onClick={() => setActiveSection('new-appointment')}
            >
              <span className="icon">📅</span>
              Nouveau Rendez-vous
            </button>
          </div>

          <div className="menu-group">
            <div className="menu-group-title">Résultats & Communication</div>
            <button 
              className={activeSection === 'medical-reports' ? 'active' : ''} 
              onClick={() => setActiveSection('medical-reports')}
            >
              <span className="icon">📋</span>
              Rapports Médicaux
            </button>
            <button 
              className={activeSection === 'lab-results' ? 'active' : ''} 
              onClick={() => setActiveSection('lab-results')}
            >
              <span className="icon">🔬</span>
              Résultats Laboratoire
            </button>
            <button 
              className={`nav-button ${activeSection === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveSection('messages')}
            >
              <span>💬 Messagerie</span>
              {unreadMessages > 0 && (
                <span className="unread-badge">
                  {unreadMessages}
                </span>
              )}
            </button>
            <button 
              className={activeSection === 'notifications' ? 'active' : ''} 
              onClick={() => setActiveSection('notifications')}
            >
              <span className="icon">🔔</span>
              Notifications
            </button>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <span className="icon">🚪</span>
            Déconnexion
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
                <h2>👤 Mon profil</h2>
                <div className="profile-card">
                  <div className="profile-header">
                  {profile.photo && (
                    <img 
                      src={`${API_BASE_URL}${profile.photo}`} 
                      alt="Profil" 
                      className="profile-photo" 
                    />
                  )}
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
                        <div className="profile-actions">
                          <button onClick={handleEditProfile} className="edit-btn">
                            ✏️ Modifier le profil
                          </button>
                </div>
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
                <h2 className="form-container">📅 Nouveau Rendez-vous</h2>
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
                      <option value="medical">👨‍⚕️ Rendez-vous Médecin</option>
                      <option value="laboratory">🔬 Rendez-vous Laboratoire</option>
                      <option value="hospital">🏥 Rendez-vous Hôpital</option>
                    </select>
                  </div>

                  <div className="form-container">
                    {appointmentType === 'medical' && (
                  <form onSubmit={handleAppointmentSubmit}>
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
                              Dr. {doctor.nom} {doctor.prenom} {doctor.specialty ? `- ${doctor.specialty}` : ''}
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
                      <form onSubmit={handleLabAppointmentSubmit}>
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
                          <label style={styles.label}>Spécialité d'analyse :</label>
                          <select 
                            value={selectedSpecialty} 
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                            required
                            style={styles.select}
                          >
                            <option value="">Sélectionnez une spécialité</option>
                            <option value="Analyses sanguines">Analyses sanguines</option>
                            <option value="Analyses d'urine">Analyses d'urine</option>
                            <option value="Microbiologie">Microbiologie</option>
                            <option value="Immunologie">Immunologie</option>
                            <option value="Hormonologie">Hormonologie</option>
                          </select>
                  </div>

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '3'}}>
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

                        <div className="form-group" style={{...styles.formGroup, '--animation-order': '4'}}>
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
                      <form onSubmit={handleHospitalAppointmentSubmit}>
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
                            {hospitals
                              .filter(hospital => 
                                (!selectedRegion || hospital.region === selectedRegion)
                              )
                              .map(hospital => (
                                <option key={hospital._id} value={hospital._id}>
                                  {hospital.nom} - {hospital.adresse}
                                </option>
                              ))}
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
              <>
                <h2>🔔 Mes notifications</h2>
                {notifications.length === 0 ? (
                  <p>Aucune notification pour l'instant.</p>
                ) : (
                  <ul className="notif-list">
                    {notifications
                      .sort((a, b) => {
                        const dateA = a.createdAt || a.date || new Date();
                        const dateB = b.createdAt || b.date || new Date();
                        return new Date(dateB) - new Date(dateA);
                      })
                      .map((notif, idx) => (
                        <li key={idx} className="notif-item">
                          <div className="notif-content">
                            {notif.message}
                          </div>
                          <div className="notif-date">
                            {(notif.createdAt || notif.date) ? 
                              new Date(notif.createdAt || notif.date).toLocaleString('fr-FR') : 
                              'Date non disponible'}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </>
            )}

            {activeSection === 'messages' && (
              <div className="messagerie-container">
                <div className="contacts-list">
                  <div className="contact-category">
                    <div 
                      className="category-header" 
                      onClick={() => toggleCategory('doctors')}
                    >
                      <div className="category-title">
                        <span>👨‍⚕️</span>
                        <h3>Médecins</h3>
                      </div>
                      <span className="toggle-icon">{expandedCategories.doctors ? '▼' : '▶'}</span>
                    </div>
                    {expandedCategories.doctors && (
                      <div className="contacts-group">
                        {appointments
                          .filter(apt => apt.doctorId && apt.doctorName)
                          .map(apt => (
                            <div key={apt._id} className="contact-wrapper">
                              <div 
                                className={`contact-item ${selectedAppointment?._id === apt._id ? 'active' : ''}`}
                                onClick={() => toggleContact(apt._id)}
                              >
                                <div className="contact-info">
                                  <div className="contact-name">{apt.doctorName}</div>
                                  <div className="contact-details">
                                    Dernier RDV: {new Date(apt.date).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                                <div className="contact-indicators">
                                  {unreadMessages[apt.doctorId] && (
                                    <span className="unread-badge">{unreadMessages[apt.doctorId]}</span>
                                  )}
                                  <span className="expand-icon">
                                    {expandedContacts[apt._id] ? '▼' : '▶'}
                                  </span>
                                </div>
                              </div>
                              {expandedContacts[apt._id] && (
                                <div className="contact-messages">
                                  <div 
                                    className="view-conversation-btn"
                            onClick={() => {
                                      setSelectedAppointment(apt);
                                      fetchChatMessages(apt._id);
                                    }}
                                  >
                                    Voir la conversation complète →
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="contact-category">
                    <div 
                      className="category-header" 
                      onClick={() => toggleCategory('labs')}
                    >
                      <div className="category-title">
                        <span>🔬</span>
                        <h3>Laboratoires</h3>
                      </div>
                      <span className="toggle-icon">{expandedCategories.labs ? '▼' : '▶'}</span>
                    </div>
                    {expandedCategories.labs && (
                      <div className="contacts-group">
                        {labAppointments.map(apt => (
                          <div key={apt._id} className="contact-wrapper">
                            <div 
                              className={`contact-item ${selectedAppointment?._id === apt._id ? 'active' : ''}`}
                              onClick={() => toggleContact(apt._id)}
                          >
                              <div className="contact-info">
                                <div className="contact-name">{apt.lab?.nom || 'Laboratoire'}</div>
                                <div className="contact-details">
                                  {new Date(apt.date).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                              <div className="contact-indicators">
                                {unreadMessages[apt.labId] && (
                                  <span className="unread-badge">{unreadMessages[apt.labId]}</span>
                              )}
                                <span className="expand-icon">
                                  {expandedContacts[apt._id] ? '▼' : '▶'}
                              </span>
                            </div>
                            </div>
                            {expandedContacts[apt._id] && (
                              <div className="contact-messages">
                                <div 
                                  className="view-conversation-btn"
                                  onClick={() => {
                                    setSelectedAppointment(apt);
                                    fetchChatMessages(apt._id);
                                  }}
                                >
                                  Voir la conversation complète →
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                  
                <div className="chat-container">
                    {selectedAppointment ? (
                      <>
                        <div className="chat-header">
                        <div className="contact-name">
                          {selectedAppointment.doctorName || selectedAppointment.lab?.nom}
                        </div>
                        <div className="contact-details">
                          RDV du {new Date(selectedAppointment.date).toLocaleString('fr-FR')}
                        </div>
                      </div>

                        <div className="chat-messages">
                              {chatMessages.map((msg) => (
                              <div 
                                key={msg._id} 
                            className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}
                              >
                                <div className="message-content">{msg.content}</div>
                                  <div className="message-time">
                                  {new Date(msg.sentAt || msg.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                              ))}
                            </div>

                        <div className="chat-input">
                          <input
                            type="text"
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                        <button
                          onClick={handleSendMessage}
                          disabled={!newChatMessage.trim()}
                          className="send-button"
                        >
                          Envoyer
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="no-chat-selected">
                        <div className="empty-state">
                        <span>💬</span>
                        <h3>Sélectionnez une conversation</h3>
                        <p>Choisissez un contact dans la liste pour voir vos messages</p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {activeSection === 'all-appointments' && (
              <>
                <h2>📋 Tous mes rendez-vous</h2>
                <div className="all-appointments-section">
                  <div className="appointments-category">
                    <h3>🏥 Rendez-vous Médecins</h3>
                    {appointments.length === 0 ? (
                      <p className="no-appointments-message">Aucun rendez-vous médical trouvé.</p>
                    ) : (
                      <div className="appointments-list">
                        <table>
                          <thead>
                            <tr>
                              <th>Médecin</th>
                              <th>Date</th>
                              <th>Motif</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map(apt => (
                              <tr key={apt._id} className={`appointment-row ${apt.status}`}>
                                <td>{apt.doctorName}</td>
                                <td>{new Date(apt.date).toLocaleString('fr-FR')}</td>
                                <td>{apt.reason}</td>
                                <td>
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                                </td>
                                <td>
                                  <div className="appointment-actions">
                                  {apt.status !== 'cancelled' && (
                                      <>
                                    <button
                                      onClick={() => {
                                        setSelectedAppointment(apt);
                                        fetchChatMessages(apt._id);
                                        setActiveSection('messages');
                                      }}
                                      className="chat-button"
                                    >
                                      💬 Chat
                                    </button>
                                        <button
                                          onClick={() => handleCancelAppointment(apt._id, 'medical')}
                                          className="cancel-button"
                                        >
                                          ❌ Annuler
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="appointments-category">
                    <h3>🔬 Rendez-vous Laboratoire</h3>
                    {labAppointments.length === 0 ? (
                      <p className="no-appointments-message">Aucun rendez-vous laboratoire trouvé.</p>
                    ) : (
                      <div className="appointments-list">
                        <table>
                          <thead>
                            <tr>
                              <th>Laboratoire</th>
                              <th>Date</th>
                              <th>Motif</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {labAppointments.map(apt => (
                              <tr key={apt._id} className={`appointment-row ${apt.status}`}>
                                <td>{apt.lab?.nom || 'Laboratoire'}</td>
                                <td>{new Date(apt.date).toLocaleString('fr-FR')}</td>
                                <td>{apt.reason}</td>
                                <td>
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                                </td>
                                <td>
                                  {apt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelAppointment(apt._id, 'laboratory')}
                                      className="cancel-button"
                                    >
                                      ❌ Annuler
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="appointments-category">
                    <h3>🏥 Rendez-vous Hôpital</h3>
                    {hospitalAppointments.length === 0 ? (
                      <p className="no-appointments-message">Aucun rendez-vous hospitalier trouvé.</p>
                    ) : (
                      <div className="appointments-list">
                        <table>
                          <thead>
                            <tr>
                              <th>Hôpital</th>
                              <th>Date</th>
                              <th>Service</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hospitalAppointments.map(apt => (
                              <tr key={apt._id} className={`appointment-row ${apt.status}`}>
                                <td>{apt.hospitalId?.nom || 'Hôpital'}</td>
                                <td>{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleString('fr-FR') : 'Non planifié'}</td>
                                <td>{apt.specialty}</td>
                                <td>
                                  <span className={`status-badge ${apt.status}`}>
                                    {apt.status === 'pending' && 'En attente'}
                                    {apt.status === 'confirmed' && 'Confirmé'}
                                    {apt.status === 'cancelled' && 'Annulé'}
                                  </span>
                                </td>
                                <td>
                                  {apt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelAppointment(apt._id, 'hospital')}
                                      className="cancel-button"
                                    >
                                      ❌ Annuler
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'lab-results' && (
              <div className="lab-results-container">
                <h2>📋 Mes résultats d'analyses</h2>
                  {labResults.length === 0 ? (
                    <p>Aucun résultat d'analyse disponible.</p>
                  ) : (
                  labResults.map((result) => (
                    <div key={result._id} className="lab-result-item">
                      <div className="lab-header">
                        <div className="lab-name">
                          Laboratoire: {result.labId?.nom || 'Non spécifié'}
                        </div>
                        <div className="lab-date">
                          {new Date(result.appointmentId?.date || result.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="test-details">
                        <div className="test-type">
                          <div className="test-label">Type de test</div>
                          <div>{result.testType}</div>
                        </div>
                        <div className="test-result">
                          <div className="test-label">Résultats</div>
                          <div>{result.results}</div>
                        </div>
                          </div>
                          {result.fileUrl && (
                              <a
                                href={`${API_BASE_URL}/${result.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                          className="view-file-btn"
                              >
                          📄 Voir le fichier
                              </a>
                          )}
                        </div>
                  ))
                  )}
                </div>
            )}

            {activeSection === 'medical-reports' && (
              <>
                <h2>📋 Rapports Médicaux</h2>
                <div className="medical-reports-section">
                  {medicalReports.length === 0 ? (
                    <p>Aucun rapport médical disponible.</p>
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
                          <h3 className="doctor-name">{doctorName}</h3>
                          <div className="reports-grid">
                            {reports.map((report) => (
                              <div key={report._id} className="report-card">
                                <div className="report-header">
                                  <span className="report-date">
                                    {new Date(report.createdAt).toLocaleString('fr-FR')}
                                  </span>
                                </div>
                                <div className="report-content">
                                  <p><strong>Rendez-vous du:</strong> {new Date(report.appointmentId?.date).toLocaleString('fr-FR')}</p>
                                  <p><strong>Description:</strong> {report.description}</p>
                                </div>
                                <div className="report-actions">
                                  <a
                                    href={`${API_BASE_URL}/${report.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-btn"
                                  >
                                    📄 Voir le rapport
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
