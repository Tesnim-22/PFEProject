import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/VehicleInfo.css';

const API_BASE_URL = 'http://localhost:5001';

const VehicleInfo = () => {
    const [vehicles, setVehicles] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [formData, setFormData] = useState({
        matricule: '',
        modele: '',
        annee: new Date().getFullYear(),
        type: 'Type A',
        statut: 'Disponible',
        carburant: 100,
        kilometrage: 0,
        notes: ''
    });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/vehicles`);
            setVehicles(response.data);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setMessage('Erreur lors de la récupération des véhicules.');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedVehicle) {
                await axios.put(`${API_BASE_URL}/api/vehicles/${selectedVehicle._id}`, formData);
                setMessage('✅ Véhicule mis à jour avec succès !');
            } else {
                await axios.post(`${API_BASE_URL}/api/vehicles`, formData);
                setMessage('✅ Véhicule ajouté avec succès !');
            }
            setShowForm(false);
            setSelectedVehicle(null);
            fetchVehicles();
            resetForm();
        } catch (error) {
            console.error('❌ Erreur:', error);
            setMessage('Erreur lors de l\'enregistrement du véhicule.');
        }
    };

    const handleEdit = (vehicle) => {
        setSelectedVehicle(vehicle);
        setFormData({
            matricule: vehicle.matricule,
            modele: vehicle.modele,
            annee: vehicle.annee,
            type: vehicle.type,
            statut: vehicle.statut,
            carburant: vehicle.carburant,
            kilometrage: vehicle.kilometrage,
            notes: vehicle.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/vehicles/${id}`);
                setMessage('✅ Véhicule supprimé avec succès !');
                fetchVehicles();
            } catch (error) {
                console.error('❌ Erreur:', error);
                setMessage('Erreur lors de la suppression du véhicule.');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            matricule: '',
            modele: '',
            annee: new Date().getFullYear(),
            type: 'Type A',
            statut: 'Disponible',
            carburant: 100,
            kilometrage: 0,
            notes: ''
        });
    };

    return (
        <div className="vehicle-info">
            {message && (
                <div className="alert" onClick={() => setMessage('')}>
                    {message}
                </div>
            )}

            <div className="vehicle-header">
                <h2>🚑 Gestion des Véhicules</h2>
                <button 
                    className="add-vehicle-btn"
                    onClick={() => {
                        setSelectedVehicle(null);
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    Ajouter un véhicule
                </button>
            </div>

            {showForm && (
                <div className="vehicle-form-overlay">
                    <div className="vehicle-form-container">
                        <h3>{selectedVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h3>
                        <form onSubmit={handleSubmit} className="vehicle-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Matricule</label>
                                    <input
                                        type="text"
                                        value={formData.matricule}
                                        onChange={(e) => handleInputChange('matricule', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Modèle</label>
                                    <input
                                        type="text"
                                        value={formData.modele}
                                        onChange={(e) => handleInputChange('modele', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Année</label>
                                    <input
                                        type="number"
                                        value={formData.annee}
                                        onChange={(e) => handleInputChange('annee', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleInputChange('type', e.target.value)}
                                        required
                                    >
                                        <option value="Type A">Type A</option>
                                        <option value="Type B">Type B</option>
                                        <option value="Type C">Type C</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select
                                        value={formData.statut}
                                        onChange={(e) => handleInputChange('statut', e.target.value)}
                                        required
                                    >
                                        <option value="Disponible">Disponible</option>
                                        <option value="En service">En service</option>
                                        <option value="En maintenance">En maintenance</option>
                                        <option value="Hors service">Hors service</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Niveau de carburant (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.carburant}
                                        onChange={(e) => handleInputChange('carburant', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kilométrage</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.kilometrage}
                                        onChange={(e) => handleInputChange('kilometrage', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="submit-btn">
                                    {selectedVehicle ? 'Mettre à jour' : 'Enregistrer'}
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

            <div className="vehicles-list">
                {vehicles.length === 0 ? (
                    <div className="no-vehicles">Aucun véhicule enregistré.</div>
                ) : (
                    <div className="vehicles-grid">
                        {vehicles.map((vehicle) => (
                            <div key={vehicle._id} className="vehicle-card">
                                <div className="vehicle-card-header">
                                    <h4>{vehicle.modele}</h4>
                                    <span className={`status-badge ${vehicle.statut.toLowerCase().replace(' ', '-')}`}>
                                        {vehicle.statut}
                                    </span>
                                </div>
                                <div className="vehicle-card-content">
                                    <p><strong>Matricule:</strong> {vehicle.matricule}</p>
                                    <p><strong>Type:</strong> {vehicle.type}</p>
                                    <p><strong>Année:</strong> {vehicle.annee}</p>
                                    <p><strong>Kilométrage:</strong> {vehicle.kilometrage} km</p>
                                    <div className="fuel-gauge">
                                        <span>Carburant:</span>
                                        <div className="fuel-bar">
                                            <div 
                                                className="fuel-level"
                                                style={{ width: `${vehicle.carburant}%` }}
                                            />
                                        </div>
                                        <span>{vehicle.carburant}%</span>
                                    </div>
                                </div>
                                <div className="vehicle-card-actions">
                                    <button 
                                        className="edit-btn"
                                        onClick={() => handleEdit(vehicle)}
                                    >
                                        ✏️ Modifier
                                    </button>
                                    <button 
                                        className="delete-btn"
                                        onClick={() => handleDelete(vehicle._id)}
                                    >
                                        🗑️ Supprimer
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

export default VehicleInfo; 