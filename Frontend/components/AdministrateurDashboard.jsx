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

  // États pour la pagination des notifications
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage, setNotificationsPerPage] = useState(10);
  const [historyFilter, setHistoryFilter] = useState("all");

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

  // Fonctions de pagination
  const getFilteredNotifications = () => {
    if (!notificationHistory) return [];
    
    if (historyFilter === "all") {
      return notificationHistory;
    }
    
    return notificationHistory.filter(notif => notif.type === historyFilter);
  };

  const getPaginatedNotifications = () => {
    const filtered = getFilteredNotifications();
    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredNotifications();
    return Math.ceil(filtered.length / notificationsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleNotificationsPerPageChange = (newSize) => {
    setNotificationsPerPage(newSize);
    setCurrentPage(1); // Reset to first page
  };

  const handleHistoryFilterChange = (filter) => {
    setHistoryFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
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
         
        </header>

        <section className="content">
          {activeSection === "dashboard" && overview && (
            <div className="dashboard-container">
              {/* Dashboard Header */}
              <div className="dashboard-header">
                <div className="welcome-section">
                  <h2>👋 Bienvenue dans votre tableau de bord</h2>
                  <p>Gérez efficacement les utilisateurs et surveillez l'activité de la plateforme PatientPath</p>
                </div>
                <div className="last-update">
                  <span>Dernière mise à jour : {new Date().toLocaleString('fr-FR')}</span>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card blue enhanced" onClick={() => filterUsers("all")}>
                  <div className="stat-content">
                    <div className="stat-icon">
                      <span>👥</span>
                    </div>
                  <div className="stat-info">
                    <h3>{overview.totalUsers}</h3>
                    <p>Utilisateurs inscrits</p>
                      <div className="stat-trend positive">
                        <span>+12% ce mois</span>
                  </div>
                </div>
                  </div>
                  <div className="stat-action">
                    <span>Voir tous →</span>
                  </div>
                </div>

                <div className="stat-card green enhanced" onClick={() => filterUsers("validated")}>
                  <div className="stat-content">
                    <div className="stat-icon">
                      <span>✓</span>
                    </div>
                  <div className="stat-info">
                    <h3>{overview.validatedUsers}</h3>
                    <p>Comptes professionnels validés</p>
                      <div className="stat-trend positive">
                        <span>+5% cette semaine</span>
                  </div>
                </div>
                  </div>
                  <div className="stat-action">
                    <span>Gérer →</span>
                  </div>
                </div>

                <div className="stat-card red enhanced" onClick={() => filterUsers("pending")}>
                  <div className="stat-content">
                    <div className="stat-icon">
                      <span>⏰</span>
                    </div>
                  <div className="stat-info">
                    <h3>{getCalculatedOverview()?.docsToValidate || 0}</h3>
                      <p>Profils à valider</p>
                      {getCalculatedOverview()?.docsToValidate > 0 && (
                        <div className="stat-trend urgent">
                          <span>Action requise</span>
                  </div>
                      )}
                    </div>
                  </div>
                  <div className="stat-action">
                    <span>Valider →</span>
                </div>
              </div>

                <div className="stat-card purple enhanced">
                  <div className="stat-content">
                    <div className="stat-icon">
                      <span>📬</span>
                    </div>
                    <div className="stat-info">
                      <h3>{notificationHistory.length}</h3>
                      <p>Notifications envoyées</p>
                      <div className="stat-trend neutral">
                        <span>Ce mois</span>
                      </div>
                    </div>
                  </div>
                  <div className="stat-action">
                    <span>Historique →</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3>Actions rapides</h3>
                <div className="action-cards">
                  <div className="action-card" onClick={() => setActiveSection("users")}>
                    <div className="action-icon">👥</div>
                    <div className="action-content">
                      <h4>Gérer les utilisateurs</h4>
                      <p>Valider, modifier ou supprimer des comptes</p>
                    </div>
                  </div>
                  <div className="action-card" onClick={() => setActiveSection("alerts")}>
                    <div className="action-icon">📬</div>
                    <div className="action-content">
                      <h4>Envoyer une alerte</h4>
                      <p>Notifier les utilisateurs importantes</p>
                    </div>
                  </div>
                  <div className="action-card">
                    <div className="action-icon">📊</div>
                    <div className="action-content">
                      <h4>Voir les statistiques</h4>
                      <p>Analyser l'activité de la plateforme</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Recent Users */}
              <div className="recent-users enhanced">
                <div className="section-header">
                  <h3>Derniers utilisateurs inscrits</h3>
                  <button className="view-all-btn" onClick={() => setActiveSection("users")}>
                    Voir tous les utilisateurs
                  </button>
                </div>
                <div className="recent-users-grid">
                  {overview.recentUsers.slice(0, 6).map((user, idx) => (
                    <div key={idx} className="user-card">
                      <div className="user-avatar">
                        <span>{user.nom?.charAt(0) || user.email.charAt(0)}</span>
                      </div>
                      <div className="user-details">
                        <h4>{user.nom} {user.prenom}</h4>
                        <p className="user-email">{user.email}</p>
                        <div className="user-role-badge">
                          {user.roles.join(", ")}
                        </div>
                      </div>
                      <div className={`user-status ${user.isValidated ? 'validated' : 'pending'}`}>
                        {user.isValidated ? '✓' : '○'}
                      </div>
                    </div>
                  ))}
              </div>
              </div>
            </div>
          )}

          {activeSection === "users" && (
            <div className="users-section">
              <div className="users-header">
                <h2>Gestion des Utilisateurs Professionnels</h2>
                <div className="users-info">
                  <button onClick={resetFilters} className="reset-filters-btn">
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>

              <div className="advanced-filters">
                <div className="filters-row">
                  <div className="filter-group">
                    <label>Rechercher</label>
                    <input
                      type="text"
                      placeholder="Nom, email, rôle..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>Rôle</label>
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
                    <label>Statut</label>
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
                    <label>Trier par</label>
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
                      <th>Document de validation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAndSortedUsers().map((user) => (
                      <tr key={user._id} className={user.isValidated ? 'validated' : 'pending'}>
                        <td>
                          <div className="user-name">
                            {(() => {
                              if (user.nom && user.prenom) {
                                return `${user.nom} ${user.prenom}`;
                              } else if (user.nom) {
                                return user.nom;
                              } else if (user.prenom) {
                                return user.prenom;
                              } else if (user.name) {
                                return user.name;
                              } else if (user.username) {
                                return user.username;
                              } else {
                                return user.email.split('@')[0];
                              }
                            })()}
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
                            {user.isValidated ? 'Validé' : 'En attente'}
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
                                Voir document
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
                                  Valider
                                </button>
                              )}
                              <button className="delete" onClick={() => deleteUser(user._id)}>
                                Supprimer
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
            <div className="alerts-section enhanced">
              <div className="alerts-header">
                <div className="header-content">
                  <h2>Notifications : Envoyez des alertes aux utilisateurs</h2>
                  
                </div>
                <div className="alerts-stats">
                  <div className="alert-stat">
                    <span className="stat-number">{notificationHistory.length}</span>
                    <span className="stat-label">Envoyées</span>
                  </div>
                  <div className="alert-stat">
                    <span className="stat-number">{notificationHistory.filter(n => new Date(n.timestamp) > new Date(Date.now() - 24*60*60*1000)).length}</span>
                    <span className="stat-label">Aujourd'hui</span>
                  </div>
                </div>
              </div>

              <div className="notification-composer">
                <div className="composer-header">
                  <h3>Nouvelle notification</h3>
                </div>

                <div className="notification-form compact">
                  <div className="form-row compact">
                    <div className="form-group compact">
                      <label>Titre</label>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                        placeholder="Titre"
                      className="compact-input"
                        maxLength={100}
                    />
                  </div>
                  </div>

                  <div className="form-row inline">
                    <div className="form-group compact">
                      <label>Type</label>
                      <div className="type-selector compact">
                        {['info', 'warning', 'urgent'].map(type => (
                          <button
                            key={type}
                            type="button"
                            className={`type-btn compact ${notificationType === type ? 'active' : ''} ${type}`}
                            onClick={() => setNotificationType(type)}
                          >
                              {type === 'info' ? 'Info' : type === 'warning' ? 'Alerte' : 'Urgent'}
                          </button>
                        ))}
                    </div>
                    </div>

                    <div className="form-group compact">
                      <label>Priorité</label>
                      <div className="priority-selector compact">
                        {['low', 'normal', 'high'].map(priority => (
                          <button
                            key={priority}
                            type="button"
                            className={`priority-btn compact ${notificationPriority === priority ? 'active' : ''} ${priority}`}
                            onClick={() => setNotificationPriority(priority)}
                          >
                              {priority === 'low' ? 'Basse' : priority === 'normal' ? 'Normale' : 'Haute'}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                  <div className="form-row compact">
                    <div className="form-group compact">
                      <label>Destinataires</label>
                      <div className="recipients-selector compact">
                        {[
                          { value: 'doctors', label: 'Médecins' },
                          { value: 'patients', label: 'Patients' },
                          { value: 'labs', label: 'Laboratoires' },
                          { value: 'specific', label: 'Spécifiques' }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            className={`recipient-btn compact ${selectedRecipients === option.value ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedRecipients(option.value);
                      setSelectedUsers([]);
                    }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                </div>

                {selectedRecipients === "specific" && (
                    <div className="specific-users compact">
                      <input
                        type="text"
                          placeholder="Rechercher et sélectionner des utilisateurs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="compact-input"
                      />
                      {searchTerm && (
                        <div className="search-results compact">
                          {filteredUsersForNotification.slice(0, 5).map(user => (
                            <div 
                              key={user._id} 
                              className={`user-result compact ${selectedUsers.includes(user._id) ? 'selected' : ''}`}
                              onClick={() => {
                                if (selectedUsers.includes(user._id)) {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                } else {
                                  setSelectedUsers([...selectedUsers, user._id]);
                                }
                              }}
                            >
                              <span className="user-name compact">
                                {user.nom && user.prenom 
                                  ? `${user.nom} ${user.prenom}`
                                  : user.email}
                              </span>
                              {selectedUsers.includes(user._id) && <span className="selected-mark">✓</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedUsers.length > 0 && (
                        <div className="selected-count compact">
                          {selectedUsers.length} utilisateur(s) sélectionné(s)
                        </div>
                      )}
                  </div>
                )}

                  <div className="form-row compact">
                    <div className="form-group compact">
                      <label>Message</label>
                  <textarea
                        placeholder="Message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                        rows="3"
                        className="compact-textarea"
                        maxLength={500}
                  />
                    </div>
                </div>

                  <div className="form-actions compact">
                    <button 
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setNotificationTitle("");
                        setSelectedUsers([]);
                        setSelectedRecipients("doctors");
                        setNotificationType("info");
                        setNotificationPriority("normal");
                      }}
                      className="reset-btn compact"
                    >
                      Réinitialiser
                    </button>
                <button 
                  onClick={sendNotification}
                  disabled={isSending || !message.trim() || !notificationTitle.trim() || 
                    (selectedRecipients === "specific" && selectedUsers.length === 0)}
                      className={`send-button compact ${isSending ? 'loading' : ''}`}
                    >
                      {isSending ? 'Envoi...' : 'Envoyer'}
                </button>
                  </div>
                </div>
              </div>

              <div className="notification-history enhanced">
                <div className="history-header">
                  <h3>Historique</h3>
                  <div className="history-filters">
                    <select 
                      className="filter-select small"
                      value={historyFilter}
                      onChange={(e) => handleHistoryFilterChange(e.target.value)}
                    >
                      <option value="all">Toutes</option>
                      <option value="info">Informations</option>
                      <option value="warning">Avertissements</option>
                      <option value="urgent">Urgentes</option>
                    </select>
                  </div>
                </div>
                <div className="history-list enhanced">
                  {getPaginatedNotifications().length > 0 ? (
                    getPaginatedNotifications().map((notif) => (
                      <div key={notif._id || notif.id} className={`notification-item enhanced ${notif.type} ${notif.priority}`}>
                        <div className="notification-content">
                        <div className="notification-item-header">
                          <h4>{notif.title}</h4>
                            <div className="notification-badges">
                              <span className={`type-badge ${notif.type}`}>
                                {notif.type === 'info' ? 'Info' : 
                                 notif.type === 'warning' ? 'Alerte' : 'Urgent'}
                              </span>
                              <span className={`priority-badge ${notif.priority}`}>
                                {notif.priority === 'low' ? 'Basse' :
                                 notif.priority === 'normal' ? 'Normale' : 'Haute'}
                              </span>
                            </div>
                          </div>
                          <p className="notification-message">{notif.message}</p>
                          <div className="notification-meta">
                            <span className="timestamp">
                              {new Date(notif.timestamp).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                            <span className="status-indicator">
                              Envoyée
                          </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    getFilteredNotifications().length === 0 ? (
                      <div className="no-notifications enhanced">
                        <h4>Aucune notification</h4>
                        <p>
                          {historyFilter === "all" 
                            ? "Aucune notification envoyée pour le moment."
                            : `Aucune notification de type "${historyFilter}".`
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="pagination-loading">
                        Chargement...
                      </div>
                    )
                  )}
                </div>

                {/* Pagination Controls */}
                {getFilteredNotifications().length > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      Page {currentPage} sur {getTotalPages()} ({getFilteredNotifications().length} notifications)
                    </div>
                    
                    <div className="pagination-controls">
                      {/* Previous Button */}
                      <button
                        className="pagination-btn pagination-prev"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        ← Précédent
                      </button>

                      {/* Next Button */}
                      <button
                        className="pagination-btn pagination-next"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                      >
                        Suivant →
                      </button>
                    </div>

                    <div className="page-size-container">
                      <span className="page-size-label">Par page:</span>
                      <select
                        className="page-size-select"
                        value={notificationsPerPage}
                        onChange={(e) => handleNotificationsPerPageChange(parseInt(e.target.value))}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
