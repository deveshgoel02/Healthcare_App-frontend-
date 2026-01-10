import React from "react";
import "./App.css";

function Profile({ onBack }) {
  const auth = JSON.parse(localStorage.getItem("healthbot_auth")) || {};
  const userId = localStorage.getItem("healthbot_user");

  return (
    <div className="profile-page">
      <h2>👤 User Profile</h2>

      <div className="profile-card">
        <p><b>Email:</b> {auth.email || "N/A"}</p>
        <p><b>User ID:</b> {userId}</p>
        <p><b>Role:</b> User</p>
        <p><b>Status:</b> Active</p>
      </div>

      <button className="back-btn" onClick={onBack}>
        ⬅ Back to Chat
      </button>
    </div>
  );
}

export default Profile;
