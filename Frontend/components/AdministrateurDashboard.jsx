import React, { useEffect, useState } from "react";
import "../styles/AdministrateurDashboard.css";

const AdminDashboard = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [overview, setOverview] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationType, setNotificationType] = useState('info');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationPriority, setNotificationPriority] = useState('normal');
  const [isSending, setIsSending] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  
  // États pour le filtrage avancé des utilisateurs
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [validationStatus, setValidationStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("loggedIn");
    if (role?.toLowerCase() !== "admin" || isLoggedIn !== "true") {
      window.location.href = "/login";
    }
  }, []);

  const showToast = (type, message) => {
    setNotificationStatus({ type, message });
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5001/users");
      const data = await res.json();
      setAllUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Erreur récupération utilisateurs:", error);
      showToast('error', 'Erreur lors de la récupération des utilisateurs');
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5001/admin/notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error("Erreur récupération notifications:", error);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch("http://localhost:5001/admin/overview");
      const data = await res.json();
      setOverview(data);
    } catch (error) {
      console.error("Erreur chargement des stats :", error);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const response = await fetch("http://localhost:5001/admin/notifications", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'historique');
      }
      
      const data = await response.json();
      const sortedData = data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setNotificationHistory(sortedData);
    } catch (error) {
      console.error("Erreur récupération historique:", error);
      setNotificationStatus({
        type: 'error',
        message: 'Erreur lors du chargement de l\'historique des notifications'
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
    fetchOverview();
    fetchNotificationHistory();
  }, []);

  const updateUserRole = async (id, newRole) => {
    try {
      await fetch(`http://localhost:5001/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
      showToast('success', 'Rôle de l\'utilisateur modifié avec succès');
    } catch (error) {
      console.error("Erreur update role:", error);
      showToast('error', 'Erreur lors de la modification du rôle');
    }
  };

  const deleteUser = async (id) => {
    const userToDelete = allUsers.find(user => user._id === id);
    const userName = userToDelete ? 
      (userToDelete.nom && userToDelete.prenom ? 
        `${userToDelete.nom} ${userToDelete.prenom}` : 
        userToDelete.email) : 
      'l\'utilisateur';

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${userName} ?`)) {
      try {
        await fetch(`http://localhost:5001/admin/users/${id}`, {
          method: "DELETE",
        });
        fetchUsers();
        fetchOverview();
        showToast('success', `${userName} a été supprimé avec succès`);
      } catch (error) {
        console.error("Erreur suppression utilisateur:", error);
        showToast('error', 'Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const validateUser = async (id) => {
    const userToValidate = allUsers.find(user => user._id === id);
    const userName = userToValidate ? 
      (userToValidate.nom && userToValidate.prenom ? 
        `${userToValidate.nom} ${userToValidate.prenom}` : 
        userToValidate.email) : 
      'l\'utilisateur';

    try {
      await fetch(`http://localhost:5001/admin/validate-user/${id}`, {
        method: "PUT",
      });
      fetchUsers();
      fetchOverview();
      showToast('success', `${userName} a été validé avec succès`);
    } catch (error) {
      console.error("Erreur validation utilisateur:", error);
      showToast('error', 'Erreur lors de la validation de l\'utilisateur');
    }
  };

  const sendNotification = async () => {
    if (!message.trim() || !notificationTitle.trim()) {
      setNotificationStatus({ 
        type: 'error', 
        message: 'Le titre et le message sont requis' 
      });
      return;
    }

    if (selectedRecipients === "specific" && selectedUsers.length === 0) {
      setNotificationStatus({ 
        type: 'error', 
        message: 'Veuillez sélectionner au moins un destinataire' 
      });
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        title: notificationTitle,
        message,
        type: notificationType,
        priority: notificationPriority,
        recipientType: selectedRecipients,
        recipients: selectedRecipients === "specific" ? selectedUsers : []
      };

      const response = await fetch("http://localhost:5001/admin/notify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'envoi de la notification');
      }

      const responseData = await response.json();
      
      const newNotification = {
        _id: responseData._id || Date.now(),
        title: notificationTitle,
        message,
        type: notificationType,
        priority: notificationPriority,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      setNotificationHistory(prev => [newNotification, ...prev]);
      setNotificationStatus({ type: 'success', message: 'Notification envoyée avec succès!' });
      
      setMessage("");
      setNotificationTitle("");
      setSelectedUsers([]);
      setSelectedRecipients("doctors");
      setNotificationType("info");
      setNotificationPriority("normal");

      await fetchNotificationHistory();

    } catch (error) {
      console.error("Erreur détaillée:", error);
      setNotificationStatus({ 
        type: 'error', 
        message: error.message || "Une erreur est survenue lors de l'envoi de la notification"
      });
    } finally {
      setIsSending(false);
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  };

  const filteredUsersForNotification = allUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.nom && user.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.prenom && user.prenom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFilteredAndSortedUsers = () => {
    let filtered = allUsers.filter(user => {
      const isNotPatient = !user.roles || !user.roles.some(role => role.toLowerCase() === 'patient');
      
      const searchMatch = userSearchTerm === "" || 
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.nom && user.nom.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
        (user.prenom && user.prenom.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
        (user.roles && user.roles.some(role => role.toLowerCase().includes(userSearchTerm.toLowerCase())));

      const roleMatch = selectedRole === "all" || 
        (user.roles && user.roles.some(role => role.toLowerCase() === selectedRole.toLowerCase()));

      let validationMatch = true;
      if (validationStatus === "validated") {
        validationMatch = user.profileCompleted && user.isValidated;
      } else if (validationStatus === "pending") {
        validationMatch = !user.profileCompleted || !user.isValidated;
      } else if (validationStatus === "rejected") {
        validationMatch = user.isRejected || false;
      }

      return isNotPatient && searchMatch && roleMatch && validationMatch;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "name":
          aValue = `${a.nom || ""} ${a.prenom || ""}`.trim();
          bValue = `${b.nom || ""} ${b.prenom || ""}`.trim();
          break;
        case "role":
          aValue = a.roles ? a.roles[0] || "" : "";
          bValue = b.roles ? b.roles[0] || "" : "";
          break;
        case "createdAt":
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          aValue = a.email || "";
          bValue = b.email || "";
      }

      if (sortBy === "createdAt") {
        if (sortOrder === "desc") {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      } else {
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });

    return filtered;
  };

  const getCalculatedOverview = () => {
    if (!overview || !allUsers.length) return overview;

    const professionalUsers = allUsers.filter(user => 
      user.roles && !user.roles.some(role => role.toLowerCase() === 'patient') &&
      user.email !== 'admin2@healthapp.com'
    );

    const docsToValidate = professionalUsers.filter(user => 
      !user.isValidated || !user.profileCompleted
    ).length;

    return {
      ...overview,
      docsToValidate
    };
  };

  const filterUsers = (type) => {
    switch (type) {
      case "all":
        setValidationStatus("all");
        break;
      case "validated":
        setValidationStatus("validated");
        break;
      case "pending":
        setValidationStatus("pending");
        break;
      default:
        break;
    }
    setActiveSection("users");
  };

  const resetFilters = () => {
    setUserSearchTerm("");
    setSelectedRole("all");
    setValidationStatus("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="admin-dashboard">
      {notificationStatus && (
        <div className={`notification-status ${notificationStatus.type}`}>
          <div className="notification-content">
            <span>{notificationStatus.message}</span>
            <button 
              className="close-notification"
              onClick={() => setNotificationStatus(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <aside className="medical-sidebar">
        <div className="sidebar-header">
          <div className="medical-logo">
            <div className="logo-text">
              <h2>PatientPath</h2>
              <span>Interface Administrateur</span>
            </div>
          </div>
        </div>
        
        <div className="sidebar-navigation">
          <div className="nav-section">
            <span className="nav-section-title">Navigation</span>
            <button 
              onClick={() => setActiveSection("dashboard")}
              className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveSection("users")}
              className={`nav-item ${activeSection === "users" ? "active" : ""}`}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-text">Utilisateurs Professionnels</span>
            </button>
            <button 
              onClick={() => setActiveSection("alerts")}
              className={`nav-item ${activeSection === "alerts" ? "active" : ""}`}
            >
              <span className="nav-icon">📢</span>
              <span className="nav-text">Alertes</span>
            </button>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h1>Interface Administrateur</h1>
        </header>

        <section className="content">
          {activeSection === "dashboard" && overview && (
            <>
              <div className="stats-grid">
                <div className="stat-card blue" onClick={() => filterUsers("all")}>
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{overview.totalUsers}</h3>
                    <p>Utilisateurs inscrits</p>
                  </div>
                </div>
                <div className="stat-card green" onClick={() => filterUsers("validated")}>
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{overview.validatedUsers}</h3>
                    <p>Comptes professionnels validés</p>
                  </div>
                </div>
                <div className="stat-card red" onClick={() => filterUsers("pending")}>
                  <div className="stat-icon">📄</div>
                  <div className="stat-info">
                    <h3>{getCalculatedOverview()?.docsToValidate || 0}</h3>
                    <p>Profils professionnels à valider</p>
                  </div>
                </div>
              </div>

              <div className="recent-users">
                <h2>Derniers Inscrits</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Rôle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentUsers.map((user, idx) => (
                      <tr key={idx}>
                        <td>{user.nom} {user.prenom}</td>
                        <td>{user.email}</td>
                        <td>{user.roles.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSection === "users" && (
            <div className="users-section">
              <div className="users-header">
                <h2>Gestion des Utilisateurs Professionnels</h2>
                <div className="users-info">
                 
                  <button onClick={resetFilters} className="reset-filters-btn">
                    🔄 Réinitialiser les filtres
                  </button>
                </div>
              </div>

              <div className="advanced-filters">
                <div className="filters-row">
                  <div className="filter-group">
                    <label>🔍 Rechercher</label>
                    <input
                      type="text"
                      placeholder="Nom, email, rôle..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>👤 Rôle</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Tous les rôles professionnels</option>
                      <option value="Doctor">Médecin</option>
                      <option value="Labs">Laboratoire</option>
                      <option value="Hospital">Hôpital</option>
                      <option value="Cabinet">Cabinet</option>
                      <option value="Ambulancier">Ambulancier</option>
                      <option value="Admin">Administrateur</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>✅ Statut</label>
                    <select
                      value={validationStatus}
                      onChange={(e) => setValidationStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="validated">Validés</option>
                      <option value="pending">En attente</option>
                      <option value="rejected">Rejetés</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>📊 Trier par</label>
                    <div className="sort-controls">
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          if (e.target.value === "createdAt") {
                            setSortOrder("desc");
                          }
                        }}
                        className="filter-select"
                      >
                        <option value="createdAt">Date d'inscription (plus récents)</option>
                        <option value="email">Email</option>
                        <option value="name">Nom</option>
                        <option value="role">Rôle</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="sort-order-btn"
                        title={sortOrder === "asc" ? "Croissant" : "Décroissant"}
                      >
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="results-info">
                  <span className="results-count">
                    {getFilteredAndSortedUsers().length} utilisateur(s) professionnel(s) trouvé(s)
                  </span>
                  {sortBy === "createdAt" && (
                    <span className="sort-info">
                      - Triés par date d'inscription ({sortOrder === "desc" ? "plus récents en premier" : "plus anciens en premier"})
                    </span>
                  )}
                </div>
              </div>

              <div className="users-table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nom complet</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Date d'inscription</th>
                      <th>Document</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAndSortedUsers().map((user) => (
                      <tr key={user._id} className={user.isValidated ? 'validated' : 'pending'}>
                        <td>
                          <div className="user-name">
                            {user.nom && user.prenom 
                              ? `${user.nom} ${user.prenom}`
                              : "Non renseigné"
                            }
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          {user.email === 'admin2@healthapp.com' ? (
                            <span className="role-badge admin">Admin</span>
                          ) : (
                            <select
                              value={user.roles[0]}
                              onChange={(e) => updateUserRole(user._id, e.target.value)}
                              className="role-select"
                            >
                              <option value="Doctor">Doctor</option>
                              <option value="Labs">Labs</option>
                              <option value="Hospital">Hospital</option>
                              <option value="Cabinet">Cabinet</option>
                              <option value="Ambulancier">Ambulancier</option>
                              <option value="Admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${user.isValidated ? 'validated' : 'pending'}`}>
                            {user.isValidated ? '✅ Validé' : '⏳ En attente'}
                          </span>
                        </td>
                        <td>
                          <span className="registration-date">
                            {user.createdAt ? 
                              new Date(user.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }) : 
                              'Non disponible'
                            }
                          </span>
                        </td>
                        <td>
                          {user.email === 'admin2@healthapp.com' ? (
                            <span className="no-document">-</span>
                          ) : (
                            (user.diploma || user.photo) ? (
                              <a
                                href={`http://localhost:5001${user.diploma || user.photo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="document-link"
                              >
                                📄 Voir document
                              </a>
                            ) : (
                              <span className="no-document">Aucun document</span>
                            )
                          )}
                        </td>
                        <td>
                          {user.email !== 'admin2@healthapp.com' && (
                            <div className="user-actions">
                              {!user.isValidated && (
                                <button className="validate" onClick={() => validateUser(user._id)}>
                                  ✅ Valider
                                </button>
                              )}
                              <button className="delete" onClick={() => deleteUser(user._id)}>
                                🗑️ Supprimer
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {getFilteredAndSortedUsers().length === 0 && (
                  <div className="no-results">
                    <p>Aucun utilisateur professionnel ne correspond aux critères de recherche.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "alerts" && (
            <div className="alerts-section">
              <h2>Envoyer une Notification</h2>
              <div className="notification-form">
                <div className="notification-header">
                  <div className="form-group">
                    <label>Titre de la notification</label>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="Titre de la notification"
                      className="notification-title-input"
                    />
                  </div>
                  <div className="notification-settings">
                    <div className="form-group">
                      <label>Type</label>
                      <select 
                        value={notificationType}
                        onChange={(e) => setNotificationType(e.target.value)}
                        className="notification-type-select"
                      >
                        <option value="info">Information</option>
                        <option value="warning">Avertissement</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priorité</label>
                      <select 
                        value={notificationPriority}
                        onChange={(e) => setNotificationPriority(e.target.value)}
                        className="notification-priority-select"
                      >
                        <option value="low">Basse</option>
                        <option value="normal">Normale</option>
                        <option value="high">Haute</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="recipient-selection">
                  <label>Destinataires :</label>
                  <select 
                    value={selectedRecipients} 
                    onChange={(e) => {
                      setSelectedRecipients(e.target.value);
                      setSelectedUsers([]);
                    }}
                    className="recipient-select"
                  >
                    <option value="doctors">Tous les médecins</option>
                    <option value="patients">Tous les patients</option>
                    <option value="labs">Tous les laboratoires</option>
                    <option value="specific">Utilisateurs spécifiques</option>
                  </select>
                </div>

                {selectedRecipients === "specific" && (
                  <div className="specific-users">
                    <div className="search-users">
                      <input
                        type="text"
                        placeholder="Rechercher des utilisateurs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <div className="users-list">
                      {filteredUsersForNotification.map(user => (
                        <div key={user._id} className="user-checkbox">
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, user._id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                }
                              }}
                            />
                            <span className="user-info">
                              {user.nom && user.prenom 
                                ? `${user.nom} ${user.prenom}`
                                : user.email}
                              <span className="user-email">({user.email})</span>
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="message-input">
                  <textarea
                    placeholder="Votre message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="4"
                  />
                </div>

                <button 
                  onClick={sendNotification}
                  disabled={isSending || !message.trim() || !notificationTitle.trim() || 
                    (selectedRecipients === "specific" && selectedUsers.length === 0)}
                  className={`send-button ${isSending ? 'loading' : ''}`}
                >
                  {isSending ? 'Envoi en cours...' : 'Envoyer la notification'}
                </button>
              </div>

              <div className="notification-history">
                <h3>Historique des notifications</h3>
                <div className="history-list">
                  {notificationHistory && notificationHistory.length > 0 ? (
                    notificationHistory.map((notif) => (
                      <div key={notif._id || notif.id} className={`notification-item ${notif.type} ${notif.priority}`}>
                        <div className="notification-item-header">
                          <h4>{notif.title}</h4>
                          <span className="notification-meta">
                            {new Date(notif.timestamp).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p>{notif.message}</p>
                        <div className="notification-tags">
                          <span className={`type-tag ${notif.type}`}>
                            {notif.type === 'info' ? 'Information' : 
                             notif.type === 'warning' ? 'Avertissement' : 'Urgent'}
                          </span>
                          <span className={`priority-tag ${notif.priority}`}>
                            {notif.priority === 'low' ? 'Basse' :
                             notif.priority === 'normal' ? 'Normale' : 'Haute'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <p>Aucune notification envoyée</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
