import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AmbulanceReports.css';

const API_BASE_URL = 'http://localhost:5001';

const AmbulanceReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [formData, setFormData] = useState({
        patientInfo: {
            nom: '',
            prenom: '',
            age: '',
            telephone: ''
        },
        missionDetails: {
            pickupLocation: '',
            dropoffLocation: '',
            pickupTime: '',
            dropoffTime: '',
            distance: ''
        },
        medicalInfo: {
            condition: '',
            consciousness: 'Conscient',
            vitals: {
                bloodPressure: '',
                heartRate: '',
                temperature: '',
                oxygenSaturation: ''
            },
            interventions: []
        },
        urgencyLevel: 'Moyenne',
        hospitalId: '',
        notes: ''
    });

    useEffect(() => {
        const ambulancierId = localStorage.getItem('userId');
        if (ambulancierId) {
            fetchReports(ambulancierId);
            fetchHospitals();
        }
    }, []);

    const fetchReports = async (ambulancierId) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/ambulance-reports/ambulancier/${ambulancierId}`);
            setReports(response.data);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setMessage('Erreur lors de la récupération des rapports.');
        } finally {
            setLoading(false);
        }
    };

  const fetchHospitals = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/hospitals`);
    setHospitals(response.data); // la liste est bien stockée ici
  } catch (error) {
    console.error('❌ Erreur:', error);
    setMessage('Erreur lors de la récupération des hôpitaux.');
  }
};

    const handleInputChange = (section, field, value) => {
        if (section === 'root') {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    };

    const handleVitalsChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            medicalInfo: {
                ...prev.medicalInfo,
                vitals: {
                    ...prev.medicalInfo.vitals,
                    [field]: value
                }
            }
        }));
    };

    const handleViewReport = (report) => {
        setSelectedReport(report);
        setShowDetails(false);
        setFormData({
            patientInfo: {
                nom: report.patientInfo.nom,
                prenom: report.patientInfo.prenom,
                age: report.patientInfo.age,
                telephone: report.patientInfo.telephone
            },
            missionDetails: {
                pickupLocation: report.missionDetails.pickupLocation,
                dropoffLocation: report.missionDetails.dropoffLocation,
                pickupTime: new Date(report.missionDetails.pickupTime).toISOString().slice(0, 16),
                dropoffTime: new Date(report.missionDetails.dropoffTime).toISOString().slice(0, 16),
                distance: report.missionDetails.distance
            },
            medicalInfo: {
                condition: report.medicalInfo.condition,
                consciousness: report.medicalInfo.consciousness,
                vitals: {
                    bloodPressure: report.medicalInfo.vitals.bloodPressure,
                    heartRate: report.medicalInfo.vitals.heartRate,
                    temperature: report.medicalInfo.vitals.temperature,
                    oxygenSaturation: report.medicalInfo.vitals.oxygenSaturation
                },
                interventions: report.medicalInfo.interventions || []
            },
            urgencyLevel: report.urgencyLevel,
            hospitalId: report.hospitalId,
            notes: report.notes
        });
        setShowForm(true);
    };

    const handleEdit = async (reportId) => {
        try {
            const ambulancierId = localStorage.getItem('userId');
            const reportData = {
                ...formData,
                ambulancierId,
                status: 'submitted',
                lastModified: {
                    date: new Date(),
                    by: ambulancierId
                }
            };

            await axios.put(`${API_BASE_URL}/api/ambulance-reports/${reportId}`, reportData);
            setMessage('✅ Rapport mis à jour avec succès !');
            setShowForm(false);
            fetchReports(ambulancierId);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setMessage('Erreur lors de la mise à jour du rapport.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const ambulancierId = localStorage.getItem('userId');
            const userResponse = await axios.get(`${API_BASE_URL}/api/users/${ambulancierId}`);
            const ambulancierDetails = {
                nom: userResponse.data.nom,
                prenom: userResponse.data.prenom,
                telephone: userResponse.data.telephone,
                matricule: userResponse.data.cin
            };

            const reportData = {
                ...formData,
                ambulancierId,
                ambulancierDetails,
                status: 'submitted'
            };

            if (selectedReport) {
                await handleEdit(selectedReport._id);
            } else {
                const response = await axios.post(`${API_BASE_URL}/api/ambulance-reports`, reportData);
                setMessage('✅ Rapport enregistré avec succès !');
                setShowForm(false);
                fetchReports(ambulancierId);
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            setMessage('Erreur lors de l\'enregistrement du rapport.');
        }
    };

    const formatVitals = (vitals) => {
        return {
            'Tension artérielle': vitals.bloodPressure || 'Non renseigné',
            'Fréquence cardiaque': vitals.heartRate ? `${vitals.heartRate} bpm` : 'Non renseigné',
            'Température': vitals.temperature ? `${vitals.temperature} °C` : 'Non renseigné',
            'Saturation en oxygène': vitals.oxygenSaturation ? `${vitals.oxygenSaturation} %` : 'Non renseigné'
        };
    };

    return (
        <div className="ambulance-reports">
            {message && (
                <div className="alert" onClick={() => setMessage('')}>
                    {message}
                </div>
            )}

            <div className="reports-header">
                <h2>📋 Rapports d'intervention</h2>
                <button 
                    className="new-report-btn"
                    onClick={() => setShowForm(true)}
                >
                    Nouveau rapport
                </button>
            </div>

            {showForm && (
                <div className="report-form-overlay">
                    <div className="report-form-container">
                        <h3>Nouveau rapport d'intervention</h3>
                        <form onSubmit={handleSubmit} className="report-form">
                            <div className="form-section">
                                <h4>Informations patient</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nom</label>
                                        <input
                                            type="text"
                                            value={formData.patientInfo.nom}
                                            onChange={(e) => handleInputChange('patientInfo', 'nom', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Prénom</label>
                                        <input
                                            type="text"
                                            value={formData.patientInfo.prenom}
                                            onChange={(e) => handleInputChange('patientInfo', 'prenom', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Âge</label>
                                        <input
                                            type="number"
                                            value={formData.patientInfo.age}
                                            onChange={(e) => handleInputChange('patientInfo', 'age', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Téléphone</label>
                                        <input
                                            type="tel"
                                            value={formData.patientInfo.telephone}
                                            onChange={(e) => handleInputChange('patientInfo', 'telephone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Détails de la mission</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Lieu de prise en charge</label>
                                        <input
                                            type="text"
                                            value={formData.missionDetails.pickupLocation}
                                            onChange={(e) => handleInputChange('missionDetails', 'pickupLocation', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Destination</label>
                                        <input
                                            type="text"
                                            value={formData.missionDetails.dropoffLocation}
                                            onChange={(e) => handleInputChange('missionDetails', 'dropoffLocation', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
  <label>Hôpital de destination</label>
  <select
    value={formData.hospitalId}
    onChange={(e) => handleInputChange('root', 'hospitalId', e.target.value)}
    required
  >
    <option value="">Sélectionnez un hôpital</option>
    {hospitals.map(hospital => (
      <option key={hospital._id} value={hospital._id}>
        {hospital.nom} {hospital.prenom} – {hospital.adresse}
      </option>
    ))}
  </select>
</div>

                                    <div className="form-group">
                                        <label>Heure d'arrivée</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.missionDetails.dropoffTime}
                                            onChange={(e) => handleInputChange('missionDetails', 'dropoffTime', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Distance (km)</label>
                                        <input
                                            type="number"
                                            value={formData.missionDetails.distance}
                                            onChange={(e) => handleInputChange('missionDetails', 'distance', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Informations médicales</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>État du patient</label>
                                        <textarea
                                            value={formData.medicalInfo.condition}
                                            onChange={(e) => handleInputChange('medicalInfo', 'condition', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Niveau de conscience</label>
                                        <select
                                            value={formData.medicalInfo.consciousness}
                                            onChange={(e) => handleInputChange('medicalInfo', 'consciousness', e.target.value)}
                                        >
                                            <option value="Conscient">Conscient</option>
                                            <option value="Semi-conscient">Semi-conscient</option>
                                            <option value="Inconscient">Inconscient</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tension artérielle</label>
                                        <input
                                            type="text"
                                            value={formData.medicalInfo.vitals.bloodPressure}
                                            onChange={(e) => handleVitalsChange('bloodPressure', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fréquence cardiaque</label>
                                        <input
                                            type="number"
                                            value={formData.medicalInfo.vitals.heartRate}
                                            onChange={(e) => handleVitalsChange('heartRate', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Température (°C)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.medicalInfo.vitals.temperature}
                                            onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Saturation en oxygène (%)</label>
                                        <input
                                            type="number"
                                            value={formData.medicalInfo.vitals.oxygenSaturation}
                                            onChange={(e) => handleVitalsChange('oxygenSaturation', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Informations complémentaires</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Niveau d'urgence</label>
                                        <select
                                            value={formData.urgencyLevel}
                                            onChange={(e) => handleInputChange('root', 'urgencyLevel', e.target.value)}
                                            required
                                        >
                                            <option value="Faible">Faible</option>
                                            <option value="Moyenne">Moyenne</option>
                                            <option value="Élevée">Élevée</option>
                                            <option value="Critique">Critique</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Hôpital de destination</label>
                                        <select
                                            value={formData.hospitalId}
                                            onChange={(e) => handleInputChange('root', 'hospitalId', e.target.value)}
                                            required
                                        >
                                            <option value="">Sélectionnez un hôpital</option>
                                            {hospitals.map(hospital => (
                                                <option key={hospital._id} value={hospital._id}>
                                                    {hospital.nom} - {hospital.adresse}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Notes supplémentaires</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('root', 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="submit-btn">
                                    Enregistrer le rapport
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => setShowForm(false)}
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetails && selectedReport && (
                <div className="report-details-overlay">
                    <div className="report-details-container">
                        <div className="report-details-header">
                            <h3>Détails du rapport</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowDetails(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="report-details-content">
                            <div className="detail-section">
                                <h4>Informations patient</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Nom complet:</span>
                                        <span className="detail-value">
                                            {selectedReport.patientInfo.nom} {selectedReport.patientInfo.prenom}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Âge:</span>
                                        <span className="detail-value">
                                            {selectedReport.patientInfo.age} ans
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Téléphone:</span>
                                        <span className="detail-value">
                                            {selectedReport.patientInfo.telephone || 'Non renseigné'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Détails de la mission</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Lieu de prise en charge:</span>
                                        <span className="detail-value">
                                            {selectedReport.missionDetails.pickupLocation}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Destination:</span>
                                        <span className="detail-value">
                                            {selectedReport.missionDetails.dropoffLocation}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Heure de prise en charge:</span>
                                        <span className="detail-value">
                                            {new Date(selectedReport.missionDetails.pickupTime).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Heure d'arrivée:</span>
                                        <span className="detail-value">
                                            {new Date(selectedReport.missionDetails.dropoffTime).toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Distance:</span>
                                        <span className="detail-value">
                                            {selectedReport.missionDetails.distance ? `${selectedReport.missionDetails.distance} km` : 'Non renseigné'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Informations médicales</h4>
                                <div className="detail-grid">
                                    <div className="detail-item full-width">
                                        <span className="detail-label">État du patient:</span>
                                        <span className="detail-value">
                                            {selectedReport.medicalInfo.condition}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Niveau de conscience:</span>
                                        <span className="detail-value">
                                            {selectedReport.medicalInfo.consciousness}
                                        </span>
                                    </div>
                                    {Object.entries(formatVitals(selectedReport.medicalInfo.vitals)).map(([key, value]) => (
                                        <div key={key} className="detail-item">
                                            <span className="detail-label">{key}:</span>
                                            <span className="detail-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Informations complémentaires</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Niveau d'urgence:</span>
                                        <span className={`urgency-badge ${selectedReport.urgencyLevel.toLowerCase()}`}>
                                            {selectedReport.urgencyLevel}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Statut:</span>
                                        <span className={`status-badge ${selectedReport.status}`}>
                                            {selectedReport.status === 'draft' ? 'Brouillon' :
                                             selectedReport.status === 'submitted' ? 'Soumis' : 'Validé'}
                                        </span>
                                    </div>
                                    {selectedReport.notes && (
                                        <div className="detail-item full-width">
                                            <span className="detail-label">Notes:</span>
                                            <span className="detail-value">
                                                {selectedReport.notes}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Détails de l'ambulancier</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Nom:</span>
                                        <span className="detail-value">
                                            {selectedReport.ambulancierDetails?.nom || 'Non renseigné'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Prénom:</span>
                                        <span className="detail-value">
                                            {selectedReport.ambulancierDetails?.prenom || 'Non renseigné'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Téléphone:</span>
                                        <span className="detail-value">
                                            {selectedReport.ambulancierDetails?.telephone || 'Non renseigné'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Matricule:</span>
                                        <span className="detail-value">
                                            {selectedReport.ambulancierDetails?.matricule || 'Non renseigné'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="reports-list">
                {loading ? (
                    <div className="loading">Chargement des rapports...</div>
                ) : reports.length === 0 ? (
                    <div className="no-reports">Aucun rapport trouvé.</div>
                ) : (
                    <div className="reports-grid">
                        {reports.map((report) => (
                            <div 
                                key={report._id} 
                                className="report-card"
                            >
                                <div className="report-header">
                                    <h4>
                                        {report.patientInfo.nom} {report.patientInfo.prenom}
                                    </h4>
                                    <span className={`urgency-badge ${report.urgencyLevel.toLowerCase()}`}>
                                        {report.urgencyLevel}
                                    </span>
                                </div>
                                <div className="report-details">
                                    <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleString('fr-FR')}</p>
                                    <p><strong>Destination:</strong> {report.missionDetails.dropoffLocation}</p>
                                    <p><strong>État:</strong> {report.medicalInfo.condition}</p>
                                    <p><strong>Hôpital:</strong> {report.hospitalId?.nom || 'Non spécifié'}</p>
                                </div>
                                <div className="report-status">
                                    <span className={`status-badge ${report.status}`}>
                                        {report.status === 'draft' ? 'Brouillon' :
                                         report.status === 'submitted' ? 'Soumis' : 'Validé'}
                                    </span>
                                </div>
                                <div className="report-actions">
                                    <button 
                                        className="view-btn"
                                        onClick={() => {
                                            setSelectedReport(report);
                                            setShowDetails(true);
                                        }}
                                    >
                                        👁️ Voir détails
                                    </button>
                                    <button 
                                        className="edit-btn"
                                        onClick={() => handleViewReport(report)}
                                    >
                                        ✏️ Modifier
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AmbulanceReports; 