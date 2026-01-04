import React, { useEffect, useState } from "react";
import "./OutbreakDashboard.css";

const API_BASE = "https://healthcare-app-5.onrender.com";

function OutbreakDashboard() {
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/outbreaks`)
      .then((res) => res.json())
      .then((data) => {
        setCity(data.city);
        setAlert(data.alert);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="outbreak-card">
      <h2>🚨 Outbreak Dashboard</h2>

      {loading && <p className="loading">Checking local outbreaks...</p>}

      {!loading && !alert && (
        <p className="safe">
          ✅ No major outbreaks reported in your area.
        </p>
      )}

      {!loading && alert && (
        <div
          className="alert-box"
          dangerouslySetInnerHTML={{ __html: alert.replace(/\n/g, "<br/>") }}
        />
      )}

      {city && (
        <p className="location">
          📍 Location detected: <strong>{city}</strong>
        </p>
      )}
    </div>
  );
}

export default OutbreakDashboard;
