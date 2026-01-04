import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

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
  const [language, setLanguage] = useState("english"); // 🔥 backend expects lowercase
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🧠 Formatting helper (prevents wall-of-text)
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

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userMessage,
          language: language, // ✅ language sent to backend
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            data.answer ||
            "⚠️ I couldn’t understand that. Please try again.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "**Server Error:** I can’t connect right now. Please try again later.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="chat-card">
        {/* HEADER */}
        <div className="chat-header">
          🩺 HealthBot — Multilingual AI
        </div>

        {/* 🌍 LANGUAGE SELECTOR */}
        <div className="language-selector">
          <label htmlFor="language">Language</label>
          <select
            id="language"
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

        {/* CHAT BODY */}
        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.sender}`}>
              {msg.sender === "bot" && (
                <div className="avatar bot-pic">🤖</div>
              )}

              <div className={`message ${msg.sender}`}>
                <ReactMarkdown>
                  {preprocessText(msg.text)}
                </ReactMarkdown>
              </div>

              {msg.sender === "user" && (
                <div className="avatar user-pic">👤</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message-row bot">
              <div className="avatar bot-pic">🤖</div>
              <div className="message bot typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* FOOTER */}
        <div className="chat-footer">
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
