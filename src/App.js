import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import OutbreakDashboard from "./OutbreakDashboard";

const API_BASE = "https://healthcare-app-5.onrender.com";

// 🔐 Simple persistent user identity
const USER_ID = localStorage.getItem("healthbot_user") || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem("healthbot_user", id);
  return id;
})();

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 **Hi! I’m HealthBot.**\n\nDescribe your symptoms and I’ll guide you safely.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("english");
  const [city, setCity] = useState(null);
  const [locationAnnounced, setLocationAnnounced] = useState(false);
  const [riskLevel, setRiskLevel] = useState(null);
  const [image, setImage] = useState(null);

  /* =======================
     🔹 NEW STATES (ADDED)
  ======================= */
  const [showAppointment, setShowAppointment] = useState(false);
  const [appointment, setAppointment] = useState({
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

  const chatEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🌍 Location Detection
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        const data = await res.json();

        const detectedCity =
          data.address.city ||
          data.address.town ||
          data.address.village;

        if (detectedCity && !locationAnnounced) {
          setCity(detectedCity);
          setLocationAnnounced(true);

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `📍 **Location detected:** ${detectedCity}\n\nI’ll include local outbreak alerts automatically.`,
              },
            ]);
          }, 600);
        }
      },
      () => console.warn("Location access denied")
    );
  }, [locationAnnounced]);

  const preprocessText = (text) => {
    if (!text) return "";
    return text
      .replace(/([^\n])\s+(\d+\.)\s+/g, "$1\n\n$2 ")
      .replace(/([^\n])\s+([*•-])\s+/g, "$1\n\n$2 ")
      .replace(/(\*\*.+?\*\*)\s*([^\n])/g, "$1\n$2");
  };

  // 📤 Image upload
  const uploadImage = async () => {
    if (!image) return;

    const form = new FormData();
    form.append("file", image);

    await fetch(`${API_BASE}/upload_image`, {
      method: "POST",
      body: form,
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "📷 Image received. A clinician may review this if needed.",
      },
    ]);

    setImage(null);
  };

  // 💬 Send message with MEMORY + TRIAGE
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    setRiskLevel(null);

    try {
      const res = await fetch(`${API_BASE}/predict_with_memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          text: userMessage,
          language,
          city,
        }),
      });

      const data = await res.json();

      if (data.risk) {
        setRiskLevel(data.risk);
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.answer || "⚠️ Please try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "**Server Error:** Unable to connect.",
        },
      ]);
    }

    setLoading(false);
  };

  /* =======================
     🗓️ APPOINTMENT SUBMIT
  ======================= */
  const submitAppointment = async () => {
    await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...appointment, user_id: USER_ID }),
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "✅ **Appointment booked successfully!** You’ll receive reminders.",
      },
    ]);

    setShowAppointment(false);
    setAppointment({ doctor: "", date: "", time: "", reason: "" });
  };

  /* =======================
     📊 ADMIN DASHBOARD
  ======================= */
  const loadAdminStats = async () => {
    const res = await fetch(`${API_BASE}/admin/stats`);
    const data = await res.json();
    setAdminStats(data);
  };

  useEffect(() => {
    if (isAdmin) loadAdminStats();
  }, [isAdmin]);

  return (
    <div className="app h-screen">
      <div className="chat-card">

        {/* HEADER */}
        <div className="chat-header">
          🩺 SWASTH BOT — AI Public Health Assistant
          <button
            style={{ float: "right" }}
            onClick={() => setIsAdmin(!isAdmin)}
          >
            {isAdmin ? "User View" : "Admin"}
          </button>
        </div>

        {!isAdmin && (
          <>
            {/* LANGUAGE */}
            <div className="language-selector">
              <label>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="marathi">Marathi</option>
                <option value="tamil">Tamil</option>
                <option value="telugu">Telugu</option>
              </select>
            </div>

            <OutbreakDashboard city={city} />

            {/* 🔥 RISK BANNER (ADDED UI) */}
            {riskLevel && (
              <div className={`risk-banner ${riskLevel.toLowerCase()}`}>
                ⚠️ Risk Level: <strong>{riskLevel}</strong>
              </div>
            )}

            {/* CHAT */}
            <div className="chat-body">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.sender}`}>
                  <div className={`message ${msg.sender}`}>
                    <ReactMarkdown>
                      {preprocessText(msg.text)}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* 📷 IMAGE UPLOAD UI (ADDED) */}
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
              <button onClick={uploadImage} disabled={!image}>
                Upload Image
              </button>
            </div>

            {/* APPOINTMENT UI */}
            {showAppointment && (
              <div className="appointment-box">
                <h3>📅 Book Appointment</h3>
                <input placeholder="Doctor" onChange={(e) => setAppointment({ ...appointment, doctor: e.target.value })} />
                <input type="date" onChange={(e) => setAppointment({ ...appointment, date: e.target.value })} />
                <input type="time" onChange={(e) => setAppointment({ ...appointment, time: e.target.value })} />
                <textarea placeholder="Reason" onChange={(e) => setAppointment({ ...appointment, reason: e.target.value })} />
                <button onClick={submitAppointment}>Confirm</button>
              </div>
            )}

            {/* FOOTER */}
            <div className="chat-footer">
              <button onClick={() => setShowAppointment(true)}>📅 Appointment</button>
              <input
                type="text"
                placeholder="Describe your symptoms..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}

        {/* ADMIN DASHBOARD */}
        {isAdmin && adminStats && (
          <div className="admin-dashboard">
            <h2>📊 Admin Dashboard</h2>
            <p>Total Users: {adminStats.users}</p>
            <p>Total Chats: {adminStats.chats}</p>
            <p>High Risk Cases: {adminStats.high_risk}</p>
            <p>Appointments: {adminStats.appointments}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
