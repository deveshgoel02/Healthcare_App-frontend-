import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import OutbreakDashboard from "./OutbreakDashboard";

const API_BASE = "https://healthcare-app-5.onrender.com";

/* =======================
   🔐 AUTH (ADDED)
======================= */
const AUTH_KEY = "healthbot_auth";

if (!localStorage.getItem(AUTH_KEY)) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ email: "demo@healthbot.ai" })
  );
}

/* 🔐 Simple persistent user identity */
const USER_ID = localStorage.getItem("healthbot_user") || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem("healthbot_user", id);
  return id;
})();

function App() {
  /* =======================
     🔐 AUTH STATES
  ======================= */
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem(AUTH_KEY)
  );
  const [view, setView] = useState("chat"); // chat | profile

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

  /* =======================
     🚪 LOGOUT
  ======================= */
  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  /* =======================
     🧠 EFFECTS (ALWAYS RUN)
  ======================= */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      () => console.warn("Location access denied")
    );
  }, [locationAnnounced]);

  useEffect(() => {
    if (isAdmin) loadAdminStats();
  }, [isAdmin]);

  const preprocessText = (text) => {
    if (!text) return "";
    return text
      .replace(/([^\n])\s+(\d+\.)\s+/g, "$1\n\n$2 ")
      .replace(/([^\n])\s+([*•-])\s+/g, "$1\n\n$2 ")
      .replace(/(\*\*.+?\*\*)\s*([^\n])/g, "$1\n$2");
  };

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
        { sender: "bot", text: data.answer || "⚠️ Please try again." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "**Server Error:** Unable to connect." },
      ]);
    }

    setLoading(false);
  };

  const submitAppointment = async () => {
    await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...appointment, user_id: USER_ID }),
    });

    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "✅ **Appointment booked successfully!**" },
    ]);

    setShowAppointment(false);
    setAppointment({ doctor: "", date: "", time: "", reason: "" });
  };

  const loadAdminStats = async () => {
    const res = await fetch(`${API_BASE}/admin/stats`);
    setAdminStats(await res.json());
  };

  const auth = JSON.parse(localStorage.getItem(AUTH_KEY)) || {};

  return (
    <div className="app h-screen">
      <div className="chat-card">

        {/* HEADER */}
        <div className="chat-header">
          🩺 SWASTH BOT — AI Public Health Assistant
          <button onClick={() => setView("profile")} style={{ float: "right" }}>
            👤 Profile
          </button>
        </div>

        {view === "profile" ? (
          <div className="profile-card">
            <p><b>Email:</b> {auth.email}</p>
            <p><b>User ID:</b> {USER_ID}</p>
            <button onClick={() => setView("chat")}>⬅ Back</button>
            <button onClick={logout}>🚪 Logout</button>
          </div>
        ) : (
          <>
            <OutbreakDashboard city={city} />

            {riskLevel && (
              <div className={`risk-banner ${riskLevel.toLowerCase()}`}>
                ⚠️ Risk Level: <strong>{riskLevel}</strong>
              </div>
            )}

            <div className="chat-body">
              {messages.map((m, i) => (
                <div key={i} className={`message-row ${m.sender}`}>
                  <ReactMarkdown>{preprocessText(m.text)}</ReactMarkdown>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="image-upload">
              <input type="file" onChange={(e) => setImage(e.target.files[0])} />
              <button onClick={uploadImage}>Upload Image</button>
            </div>

            <div className="chat-footer">
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
