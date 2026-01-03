import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = "https://healthcare-app-4.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I’m HealthBot.\nDescribe your symptoms and I’ll try to guide you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🔥 ACTUAL FIX
  const formatText = (text) => {
    let cleaned = text;

    // Remove markdown
    cleaned = cleaned.replace(/\*\*/g, "");

    // Convert bullets to new lines
    cleaned = cleaned.replace(/ • /g, "\n• ");
    cleaned = cleaned.replace(/•/g, "\n•");

    // Force headings onto new lines
    cleaned = cleaned.replace(/Possible Causes:/gi, "\nPossible Causes:");
    cleaned = cleaned.replace(/Self-Care Steps:/gi, "\nSelf-Care Steps:");
    cleaned = cleaned.replace(/Relief Options:/gi, "\nRelief Options:");
    cleaned = cleaned.replace(/When to Seek Medical Attention:/gi, "\nWhen to Seek Medical Attention:");

    return cleaned
      .split("\n")
      .filter((line) => line.trim() !== "");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.answer || "⚠️ I couldn’t understand that.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Server unreachable.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="chat-card">
        <div className="chat-header">🩺 HealthBot</div>

        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={`bubble ${msg.sender}`}>
              {formatText(msg.text).map((line, idx) =>
                line.startsWith("•") ? (
                  <p key={idx} style={{ marginLeft: "16px" }}>
                    {line}
                  </p>
                ) : (
                  <p key={idx} style={{ fontWeight: line.endsWith(":") ? "600" : "400" }}>
                    {line}
                  </p>
                )
              )}
            </div>
          ))}

          {loading && (
            <div className="bubble bot typing">
              HealthBot is typing<span>.</span><span>.</span><span>.</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

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
