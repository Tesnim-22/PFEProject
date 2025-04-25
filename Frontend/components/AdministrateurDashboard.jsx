import React, { useEffect, useState } from "react";
import "../styles/AdministrateurDashboard.css";

const AdminDashboard = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [overview, setOverview] = useState(null);

  // ✅ Protection de la page : vérifie si l'utilisateur est admin
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
  }, []);

  const updateUser = async (id, newRole) => {
    await fetch(`http://localhost:5001/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const deleteUser = async (id) => {
    await fetch(`http://localhost:5001/admin/users/${id}`, {
      method: "DELETE",
    });
    fetchUsers();
  };

  const sendNotification = async () => {
    if (!message.trim()) return;
    await fetch("http://localhost:5001/admin/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setMessage("");
    fetchNotifications();
  };

  const filterUsers = (type) => {
    switch (type) {
      case "all":
        setFilteredUsers(allUsers);
        break;
      case "validated":
        setFilteredUsers(allUsers.filter((u) => u.profileCompleted));
        break;
      case "pending":
        setFilteredUsers(allUsers.filter((u) => !u.profileCompleted));
        break;
      default:
        break;
    }
    setActiveSection("users");
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === "dashboard" && !overview) {
      fetchOverview();
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>🧑‍💼 Admin</h2>
        <nav>
          <ul>
            <li>
              <button onClick={() => handleSectionChange("dashboard")}>
                Tableau de bord
              </button>
            </li>
            <li>
              <button onClick={() => handleSectionChange("users")}>
                Utilisateurs
              </button>
            </li>
            <li>
              <button onClick={() => handleSectionChange("alerts")}>
                Alertes
              </button>
            </li>
          </ul>
        </nav>

        {/* Bouton retour */}
        <div className="back-home">
          <button onClick={() => handleSectionChange("dashboard")}>
            ⬅️ Retour au tableau de bord
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-dashboard-main">
        <div className="header">
          <h2>Administrateur</h2>
        </div>

        {activeSection === "dashboard" && overview && (
          <div className="dashboard-content">
            <div className="stat-card-container">
              <div className="stat-card stat-blue" onClick={() => filterUsers("all")} style={{ cursor: "pointer" }}>
                <div className="icon">👥</div>
                <div>
                  <h3>{overview.totalUsers}</h3>
                  <p>Utilisateurs inscrits</p>
                </div>
              </div>
              <div className="stat-card stat-green" onClick={() => filterUsers("validated")} style={{ cursor: "pointer" }}>
                <div className="icon">✅</div>
                <div>
                  <h3>{overview.validatedUsers}</h3>
                  <p>Comptes validés</p>
                </div>
              </div>
              <div className="stat-card stat-red" onClick={() => filterUsers("pending")} style={{ cursor: "pointer" }}>
                <div className="icon">📄</div>
                <div>
                  <h3>{overview.docsToValidate}</h3>
                  <p>Profils à valider</p>
                </div>
              </div>
            </div>

            <div className="admin-section" style={{ marginTop: "30px" }}>
              <h3>Derniers utilisateurs inscrits</h3>
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
          </div>
        )}

        {activeSection === "users" && (
          <div className="admin-section" id="users">
            <h3>Utilisateurs</h3>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Modification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.roles[0]}
                        onChange={(e) => updateUser(user._id, e.target.value)}
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
                      <button className="delete-btn" onClick={() => deleteUser(user._id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSection === "alerts" && (
          <div className="notifications-container" id="alerts">
            <h3>📢 Envoyer une alerte</h3>
            <div className="notifications-form">
              <input
                type="text"
                placeholder="Écrire une alerte à envoyer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={sendNotification}>Envoyer</button>
            </div>

            <div className="notification-history">
              <h4>📜 Historique des notifications</h4>
              <ul>
                {notifications.map((n, index) => (
                  <li key={index}>{n.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

{!activeSection && (
  <div className="admin-welcome-box">
    <div className="welcome-icon">📊</div>
    <div className="welcome-content">
      <h3>Bienvenue sur votre interface d'administration</h3>
      <p>Vous pouvez ici :</p>
      <ul>
        <li>✔️ Gérer les comptes utilisateurs (validation, suppression, rôles...)</li>
        <li>✔️ Envoyer des notifications ou des alertes ciblées</li>
        <li>✔️ Suivre les statistiques globales d'inscription</li>
        <li>✔️ Visualiser les derniers inscrits et leurs rôles</li>
      </ul>
      <p style={{ marginTop: '10px' }}>
        Utilisez le menu à gauche pour accéder aux différentes fonctionnalités 👈
      </p>
    </div>
  </div>
)}

      </main>
    </div>
  );
};

export default AdminDashboard;
