import React, { useState } from "react";
import { FiCloud } from "react-icons/fi";

/**
 * AuthPage — Login/register form displayed when the user is not authenticated.
 *
 * Manages its own email/password local state since those fields are only
 * relevant to this component.
 *
 * @param {{ onLogin: Function, onRegister: Function, loading: boolean, error: string }} props
 */
export default function AuthPage({ onLogin, onRegister, loading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    onLogin(email, password);
  }

  function handleRegister(e) {
    e.preventDefault();
    onRegister(email, password);
  }

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div className="auth-logo-row">
          <div className="auth-logo-circle">
            <FiCloud />
          </div>
          <div>
            <h1>Pay-as-you-go Cloud</h1>
            <p className="auth-subtitle">
              Minimal personal storage, billed like AWS S3.
            </p>
          </div>
        </div>

        {error && <p className="error-badge">{error}</p>}

        <form onSubmit={handleLogin} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <button className="ghost-btn" onClick={handleRegister}>
          New here? <span>Create account</span>
        </button>
      </div>
    </div>
  );
}
