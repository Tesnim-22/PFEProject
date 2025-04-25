import React, { useEffect, useState } from "react";

const DashboardStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5001/admin/overview")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur chargement des stats :", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement des statistiques...</p>;
  if (!data) return <p>Aucune donnée disponible.</p>;

  return (
    <>
      {/* Cartes de stats */}
      <div className="stat-card-container">
        <div className="stat-card stat-blue">
          <div className="icon">👥</div>
          <div>
            <h3>{data.totalUsers}</h3>
            <p>Utilisateurs inscrits</p>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="icon">✅</div>
          <div>
            <h3>{data.validatedUsers}</h3>
            <p>Comptes validés</p>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="icon">📄</div>
          <div>
            <h3>{data.docsToValidate}</h3>
            <p>Profils à valider</p>
          </div>
        </div>
      </div>

      {/* Derniers utilisateurs */}
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
            {data.recentUsers.map((user, idx) => (
              <tr key={idx}>
                <td>{user.nom} {user.prenom}</td>
                <td>{user.email}</td>
                <td>{user.roles.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DashboardStats;
