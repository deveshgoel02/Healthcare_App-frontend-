import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import OutbreakDashboard from "./OutbreakDashboard";

const API_BASE = "https://healthcare-app-5.onrender.com";

/* =======================
   🔐 AUTH (DEMO)
======================= */
const AUTH_KEY = "healthbot_auth";

if (!localStorage.getItem(AUTH_KEY)) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ email: "demo@healthbot.ai" })
  );
}

/* 🔐 Persistent user ID */
const USER_ID =
  localStorage.getItem("healthbot_user") ||
  (() => {
    const id = crypto.randomUUID();
    localStorage.setItem("healthbot_user", id);
    return id;
  })();

function App() {
  /* =======================
     AUTH / VIEW
  ======================= */
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem(AUTH_KEY)
  );
  const [view, setView] = useState("chat"); // chat | profile

  /* =======================
     CHAT STATE
  ======================= */
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 **Hi! I’m HealthBot.**\n\nDescribe your symptoms and I’ll guide you safely.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /* =======================
     USER CONTEXT
  ======================= */
  const [language, setLanguage] = useState("english");
  const [city, setCity] = useState(null);
  const [locationAnnounced, setLocationAnnounced] = useState(false);
  const [riskLevel, setRiskLevel] = useState(null);

  /* =======================
     IMAGE
  ======================= */
  const [image, setImage] = useState(null);

  /* =======================
     APPOINTMENTS
  ======================= */
  const [showAppointment, setShowAppointment] = useState(false);
  const [appointment, setAppointment] = useState({
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });

  /* =======================
     ADMIN
  ======================= */
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

  const chatEndRef = useRef(null);

  /* =======================
     LOGOUT
  ======================= */
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setView("chat");
  };

  /* =======================
     AUTO SCROLL
  ======================= */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* =======================
     LOCATION DETECTION
  ======================= */
  useEffect(() => {
    if (!navigator.geolocation || locationAnnounced) return;

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

        if (detectedCity) {
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
      () => console.warn("Location denied")
    );
  }, [locationAnnounced]);

  /* =======================
     ADMIN STATS
  ======================= */
  useEffect(() => {
    if (!isAdmin) return;

    fetch(`${API_BASE}/admin/stats`)
      .then((res) => res.json())
      .then(setAdminStats)
      .catch(() => {});
  }, [isAdmin]);

  /* =======================
     HELPERS
  ======================= */
  const preprocessText = (text) => {
    if (!text) return "";
    return text
      .replace(/([^\n])\s+(\d+\.)\s+/g, "$1\n\n$2 ")
      .replace(/([^\n])\s+([*•-])\s+/g, "$1\n\n$2 ")
      .replace(/(\*\*.+?\*\*)\s*([^\n])/g, "$1\n$2");
  };

  /* =======================
     IMAGE UPLOAD
  ======================= */
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
      { sender: "bot", text: "📷 Image received for review." },
    ]);

    setImage(null);
  };

  /* =======================
     SEND MESSAGE
  ======================= */
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

      if (data.risk) setRiskLevel(data.risk);

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Server unavailable." },
      ]);
    }

    setLoading(false);
  };

  /* =======================
     APPOINTMENT
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
        text: "✅ **Appointment booked.** You’ll get reminders.",
      },
    ]);

    setShowAppointment(false);
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="app h-screen">
      <div className="chat-card">
        <div className="chat-header">
          🩺 SWASTH BOT
          <button onClick={() => setView("profile")} style={{ float: "right" }}>
            👤 Profile
          </button>
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            style={{ float: "right", marginRight: "10px" }}
          >
            {isAdmin ? "User View" : "Admin"}
          </button>
        </div>

        {view === "profile" ? (
          <div className="profile-card">
            <p><strong>Email:</strong> demo@healthbot.ai</p>
            <p><strong>User ID:</strong> {USER_ID}</p>
            <p><strong>Status:</strong> Active</p>
            <button onClick={() => setView("chat")}>⬅ Back</button>
            <button onClick={logout}>🚪 Logout</button>
          </div>
        ) : isAdmin ? (
          adminStats && (
            <div className="admin-dashboard">
              <h2>📊 Admin Dashboard</h2>
              <p>Users: {adminStats.users}</p>
              <p>Messages: {adminStats.messages}</p>
              <p>Appointments: {adminStats.appointments}</p>
              <p>Flagged: {adminStats.flagged}</p>
            </div>
          )
        ) : (
          <>
            <OutbreakDashboard city={city} />

            {riskLevel && (
              <div className={`risk-banner ${riskLevel.toLowerCase()}`}>
                ⚠️ Risk Level: <strong>{riskLevel}</strong>
              </div>
            )}

            <div className="chat-body">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.sender}`}>
                  <ReactMarkdown>
                    {preprocessText(msg.text)}
                  </ReactMarkdown>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

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

            {showAppointment && (
              <div className="appointment-box">
                <input placeholder="Doctor" onChange={(e) => setAppointment({ ...appointment, doctor: e.target.value })} />
                <input type="date" onChange={(e) => setAppointment({ ...appointment, date: e.target.value })} />
                <input type="time" onChange={(e) => setAppointment({ ...appointment, time: e.target.value })} />
                <textarea placeholder="Reason" onChange={(e) => setAppointment({ ...appointment, reason: e.target.value })} />
                <button onClick={submitAppointment}>Confirm</button>
              </div>
            )}

            <div className="chat-footer">
              <button onClick={() => setShowAppointment(true)}>📅</button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
