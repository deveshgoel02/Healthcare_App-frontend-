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
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🔥 FORMATTING ENGINE: Forces new lines for lists
  const preprocessText = (text) => {
    if (!text) return "";
    let cleanText = text;

    // 1. Force new line before numbered lists (e.g., "1. ", "2. ")
    // Looks for a digit followed by a dot, surrounded by spaces
    cleanText = cleanText.replace(/([^\n])\s+(\d+\.)\s+/g, "$1\n\n$2 ");

    // 2. Force new line before bullet points (*, -, •)
    // Looks for a bullet character surrounded by spaces
    cleanText = cleanText.replace(/([^\n])\s+([*•-])\s+/g, "$1\n\n$2 ");

    // 3. Force new line after bold headings if they are stuck to text
    // Example: "**Causes:**Stress" -> "**Causes:**\nStress"
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
        body: JSON.stringify({ text: userMessage }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.answer || "⚠️ I couldn’t understand that. Please try again.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "**Server Error:** I cannot connect to the brain right now. Please try again later.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="chat-card">
        {/* Header */}
        <div className="chat-header">
          <div className="header-info">
            <span className="bot-avatar">🩺</span>
            <div>
              <h2>HealthBot</h2>
              <p>AI Medical Assistant</p>
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.sender}`}>
              {msg.sender === "bot" && <div className="avatar bot-pic">🤖</div>}
              
              <div className={`message ${msg.sender}`}>
                {/* preprocessText breaks the "wall of text" before Markdown renders it */}
                <ReactMarkdown>
                  {preprocessText(msg.text)}
                </ReactMarkdown>
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

        {/* Footer */}
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