import React, { useState, useEffect } from 'react';
import axiosInstance from '../src/api/axiosConfig';
import '../styles/LabResultModal.css';

const LabResultModal = ({ isOpen, onClose, appointment, labId }) => {
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [testType, setTestType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Vérifier l'authentification au chargement
        const checkAuth = () => {
            const userId = localStorage.getItem('userId');
            const userRole = localStorage.getItem('userRole');
            const loggedIn = localStorage.getItem('loggedIn');
            
            if (userId && userRole === 'Labs' && loggedIn === 'true') {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setDescription('');
            setTestType('');
            setMessage('');
        }
    }, [isOpen]);

    if (!isOpen || !appointment) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            if (!isAuthenticated) {
                setMessage('❌ Veuillez vous connecter pour envoyer des résultats');
                return;
            }

            const userId = localStorage.getItem('userId');
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('appointmentId', appointment._id);
            formData.append('labId', userId);
            formData.append('patientId', appointment.patient._id);
            formData.append('results', description);
            formData.append('testType', testType);
            formData.append('status', 'pending');

            const response = await axiosInstance.post('/api/lab-results', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('✅ Résultats envoyés avec succès !');
            setTimeout(() => {
                onClose();
                setFile(null);
                setDescription('');
                setTestType('');
            }, 2000);
        } catch (error) {
            console.error('Erreur détaillée:', error);
            if (error.response) {
                console.log('Réponse du serveur:', error.response.data);
                setMessage(`❌ ${error.response.data.message || 'Erreur lors de l\'envoi des résultats'}`);
            } else if (error.request) {
                setMessage('❌ Erreur de connexion au serveur');
            } else {
                setMessage(`❌ ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Vérifier que nous avons toutes les données nécessaires
    if (!appointment.patient) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>Erreur</h2>
                    <p>Impossible de charger les informations du patient.</p>
                    <div className="modal-actions">
                        <button onClick={onClose} className="cancel-btn">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Envoyer les résultats d'analyse</h2>
                <p>
                    Patient: {appointment.patient.nom} {appointment.patient.prenom}<br />
                    Date du rendez-vous: {new Date(appointment.date).toLocaleString('fr-FR')}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Type d'analyse</label>
                        <input
                            type="text"
                            value={testType}
                            onChange={(e) => setTestType(e.target.value)}
                            placeholder="Ex: Analyse sanguine, Radiographie, etc."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Fichier des résultats (PDF, JPEG, PNG)</label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setFile(e.target.files[0])}
                            required
                        />
                        <small className="file-info">Taille maximale : 5MB</small>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ajoutez une description ou des commentaires..."
                            required
                        />
                    </div>

                    {message && (
                        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="cancel-btn"
                            disabled={isLoading}
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={isLoading || !file || !testType || !isAuthenticated}
                        >
                            {isLoading ? 'Envoi en cours...' : 'Envoyer les résultats'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabResultModal; 