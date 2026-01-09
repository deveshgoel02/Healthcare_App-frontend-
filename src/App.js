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

  return (
    <div className="app h-screen">
      <div className="chat-card">

        {/* HEADER */}
        <div className="chat-header">
          🩺 SWASTH BOT — AI Public Health Assistant
        </div>

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

        {/* OUTBREAKS */}
        <OutbreakDashboard city={city} />

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

          {loading && (
            <div className="message bot typing">
              <span></span><span></span><span></span>
            </div>
          )}

          {riskLevel && (
            <div className={`risk-banner ${riskLevel.toLowerCase()}`}>
              ⚠️ Risk Level: <b>{riskLevel}</b>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* IMAGE */}
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

        {/* INPUT */}
        <div className="chat-footer">
          <input
            type="text"
            placeholder="Describe your symptoms..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>
    </div>
  );
}

export default App;
