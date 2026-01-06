import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import OutbreakDashboard from "./OutbreakDashboard";

const API_BASE = "https://healthcare-app-5.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 **Hi! I’m HealthBot.**\n\nDescribe your symptoms and I’ll try to guide you.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("english");
  const [city, setCity] = useState(null);
  const chatEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Get user location once
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
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
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `📍 **Location detected:** ${detectedCity}\nI’ll include local outbreak alerts automatically.`,
              },
            ]);
          }
        } catch {
          console.warn("Location detection failed");
        }
      },
      () => console.warn("User denied location access")
    );
  }, []);

  const preprocessText = (text) => {
    if (!text) return "";
    let cleanText = text;
    cleanText = cleanText.replace(/([^\n])\s+(\d+\.)\s+/g, "$1\n\n$2 ");
    cleanText = cleanText.replace(/([^\n])\s+([*•-])\s+/g, "$1\n\n$2 ");
    cleanText = cleanText.replace(/(\*\*.+?\*\*)\s*([^\n])/g, "$1\n$2");
    return cleanText;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userMessage,
          language,
          city,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.answer || "⚠️ I couldn’t understand that. Please try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "**Server Error:** I can’t connect right now.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="app flex flex-col h-screen">
      <div className="chat-card flex flex-col flex-1">

        {/* HEADER */}
        <div className="chat-header">
          🩺 SWASTH BOT  — Multilingual AI
        </div>

        {/* LANGUAGE SELECTOR */}
        <div className="language-selector">
          <label>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={loading}
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="marathi">Marathi</option>
            <option value="tamil">Tamil</option>
            <option value="telugu">Telugu</option>
          </select>
        </div>

        {/* OUTBREAK DASHBOARD (CONSTRAINED) */}
        <div className="max-h-[35vh] overflow-y-auto px-3 z-10">
          <OutbreakDashboard city={city} />
        </div>

        {/* CHAT BODY */}
        <div className="chat-body flex-1 overflow-y-auto px-4 py-2">
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.sender}`}>
              {msg.sender === "bot" && <div className="avatar bot-pic">🤖</div>}
              <div className={`message ${msg.sender}`}>
                <ReactMarkdown>{preprocessText(msg.text)}</ReactMarkdown>
              </div>
              {msg.sender === "user" && <div className="avatar user-pic">👤</div>}
            </div>
          ))}

          {loading && (
            <div className="message-row bot">
              <div className="avatar bot-pic">🤖</div>
              <div className="message bot typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* FOOTER */}
        <div className="chat-footer sticky bottom-0 z-20 bg-white border-t">
          <input
            type="text"
            placeholder="Type your symptoms here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;
