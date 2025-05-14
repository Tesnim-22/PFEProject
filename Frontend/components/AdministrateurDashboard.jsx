import React, { useEffect, useState } from "react";
import "../styles/AdministrateurDashboard.css";

const AdminDashboard = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [overview, setOverview] = useState(null);

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

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
    fetchOverview();
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
    if (!message.trim()) return;
    try {
      await fetch("http://localhost:5001/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setMessage("");
      fetchNotifications();
    } catch (error) {
      console.error("Erreur envoi notification:", error);
    }
  };

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

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => setActiveSection("dashboard")}>🏠 Dashboard</button>
          <button onClick={() => setActiveSection("users")}>👥 Utilisateurs</button>
          <button onClick={() => setActiveSection("alerts")}>📢 Alertes</button>
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
                      </td>
                      <td>
                        {user.roles[0].toLowerCase() !== 'patient' && (user.diploma || user.photo) ? (
                          <a
                            href={`http://localhost:5001${user.diploma || user.photo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Voir document
                          </a>
                        ) : (
                          "Aucun document"
                        )}
                      </td>
                      <td>
  <div className="user-actions">
    {!user.isValidated && (
      <button className="validate" onClick={() => validateUser(user._id)}>Valider</button>
    )}
    <button className="delete" onClick={() => deleteUser(user._id)}>Supprimer</button>
  </div>
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
                <input
                  type="text"
                  placeholder="Message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendNotification}>Envoyer</button>
              </div>
              <div className="notification-history">
                <h3>Historique</h3>
                <ul>
                  {notifications.map((notif, idx) => (
                    <li key={idx}>{notif.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
