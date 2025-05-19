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

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("loggedIn");
    if (role?.toLowerCase() !== "admin" || isLoggedIn !== "true") {
      window.location.href = "/login";
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5001/users");
      const data = await res.json();
      setAllUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Erreur récupération utilisateurs:", error);
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
      // Trier les notifications par date (les plus récentes en premier)
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
    } catch (error) {
      console.error("Erreur update role:", error);
    }
  };

  const deleteUser = async (id) => {
    try {
      await fetch(`http://localhost:5001/admin/users/${id}`, {
        method: "DELETE",
      });
      fetchUsers();
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
    }
  };

  const validateUser = async (id) => {
    try {
      await fetch(`http://localhost:5001/admin/validate-user/${id}`, {
        method: "PUT",
      });
      fetchUsers();
    } catch (error) {
      console.error("Erreur validation utilisateur:", error);
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
      
      // Ajouter la nouvelle notification à l'historique local
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
      
      // Reset form
      setMessage("");
      setNotificationTitle("");
      setSelectedUsers([]);
      setSelectedRecipients("doctors");
      setNotificationType("info");
      setNotificationPriority("normal");

      // Rafraîchir l'historique des notifications
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

  const filterUsers = (type) => {
    switch (type) {
      case "all":
        setFilteredUsers(allUsers);
        break;
      case "validated":
        setFilteredUsers(allUsers.filter((u) => u.profileCompleted && !u.roles.includes('Patient')));
        break;
      case "pending":
        setFilteredUsers(allUsers.filter((u) => !u.profileCompleted && !u.roles.includes('Patient')));
        break;
      default:
        break;
    }
    setActiveSection("users");
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="admin-dashboard">
      {notificationStatus && (
        <div className={`notification-status ${notificationStatus.type}`}>
          {notificationStatus.message}
        </div>
      )}
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => setActiveSection("dashboard")}>🏠 Dashboard</button>
          <button onClick={() => setActiveSection("users")}>👥 Utilisateurs</button>
          <button onClick={() => setActiveSection("alerts")}>📢 Alertes</button>
          <button onClick={handleLogout} className="logout-btn">🚪 Déconnexion</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="main-header">
          <h1>Interface Administrateur</h1>
        </header>

        {/* Dynamic Sections */}
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
                    <h3>{overview.docsToValidate}</h3>
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
              <h2>Gestion des Utilisateurs</h2>
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Document</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.email}</td>
                      <td>
                        {user.email === 'admin2@healthapp.com' ? (
                          <span>Admin</span>
                        ) : (
                          <select
                            value={user.roles[0]}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                          >
                            <option value="Patient">Patient</option>
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
                        {user.email === 'admin2@healthapp.com' ? (
                          "-"
                        ) : (
                          user.roles[0].toLowerCase() !== 'patient' && (user.diploma || user.photo) ? (
                            <a
                              href={`http://localhost:5001${user.diploma || user.photo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Voir document
                            </a>
                          ) : (
                            "Aucun document"
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
