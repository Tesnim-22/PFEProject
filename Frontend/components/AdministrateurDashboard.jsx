import React, { useEffect, useState } from "react";
import "../styles/AdministrateurDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch all users (no filters)
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5001/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Erreur récupération utilisateurs:", error);
    }
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5001/admin/notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error("Erreur récupération notifications:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  // Update user role
  const updateUser = async (id, newRole) => {
    await fetch(`http://localhost:5001/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole })
    });
    fetchUsers();
  };

  // Delete user
  const deleteUser = async (id) => {
    await fetch(`http://localhost:5001/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  // Create notification
  const sendNotification = async () => {
    if (!message.trim()) return;
    await fetch("http://localhost:5001/admin/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    setMessage("");
    fetchNotifications();
  };

  return (
    <div className="admin-dashboard">
      <h2>👨‍💼 Admin Dashboard</h2>

      <div className="admin-section">
        <h3>👥 Tous les utilisateurs</h3>
        <table>
          <thead>
            <tr><th>Email</th><th>Rôle</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.email}</td>
                <td>
                  <select value={user.roles[0]} onChange={(e) => updateUser(user._id, e.target.value)}>
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
                  <button onClick={() => deleteUser(user._id)}>🗑️ Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-section">
        <h3>📢 Envoyer une notification</h3>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ecrire un message..." />
        <button onClick={sendNotification}>Envoyer</button>

        <h4>📜 Historique des notifications</h4>
        <ul>
          {notifications.map((n, index) => (
            <li key={index}>{n.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
