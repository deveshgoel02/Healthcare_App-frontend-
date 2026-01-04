import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_BASE = "https://healthcare-app-4.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 **Hi! I’m HealthBot.**\n\nDescribe your symptoms and I’ll try to guide you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("English"); // ✅ NEW
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🔥 FORMATTING ENGINE
  const preprocessText = (text) => {
    if (!text) return "";
    let cleanText = text;

    cleanText = cleanText.replace(/([^\n])\s+(\d+\.)\s+/g, "$1\n\n$2 ");
    cleanText = cleanText.replace(/([^\n])\s+([*•-])\s+/g, "$1\n\n$2 ");
    cleanText = cleanText.replace(/(\*\*.+?\*\*)\s*([^\n])/g, "$1\n$2");

    return cleanText;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

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
          language: language, // ✅ SEND LANGUAGE
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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "**Server Error:** I cannot connect right now. Please try again later.",
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
          🩺 HealthBot — CACHE FIXED v100
        </div>

        {/* ✅ LANGUAGE SELECTOR */}
        <div className="language-selector">
          <label>Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={loading}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Marathi">Marathi</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
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
