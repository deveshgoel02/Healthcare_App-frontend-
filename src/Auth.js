import React, { useState } from "react";
import "./Login.css";

function Auth({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔐 Hackathon-safe auth (local only)
    localStorage.setItem(
      "healthbot_auth",
      JSON.stringify({ email })
    );

    onAuthSuccess();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="toggle-text">
          {isSignup ? "Already have an account?" : "New user?"}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? " Login" : " Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;
