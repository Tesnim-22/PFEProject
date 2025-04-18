import React, { useEffect, useState } from "react";
import "../styles/AdministrateurDashboard.css";


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch all users
  const fetchUsers = async () => {
    const res = await fetch("http://localhost:5001/admin/users");
    const data = await res.json();
    setUsers(data);
  };

  // Fetch all notifications
  const fetchNotifications = async () => {
    const res = await fetch("http://localhost:5001/admin/notifications");
    const data = await res.json();
    setNotifications(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  // Update user
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
        <h3>👥 Manage Users</h3>
        <table>
          <thead>
            <tr><th>Email</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.email}</td>
                <td>
                  <select value={user.role} onChange={(e) => updateUser(user._id, e.target.value)}>
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
                  <button onClick={() => deleteUser(user._id)}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-section">
        <h3>📢 Send Notification</h3>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
        <button onClick={sendNotification}>Send</button>

        <h4>📜 Notification History</h4>
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
