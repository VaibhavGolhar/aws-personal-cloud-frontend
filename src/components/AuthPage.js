import React, { useState } from "react";
import { FiCloud } from "react-icons/fi";
import ErrorAlert from "./ErrorAlert";

/**
 * AuthPage — Login/register form displayed when the user is not authenticated.
 *
 * Manages its own username/password local state since those fields are only
 * relevant to this component.
 *
 * @param {{ onLogin: Function, onRegister: Function, loading: boolean, error: string }} props
 */
export default function AuthPage({ onLogin, onRegister, loading, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    onLogin(username, password);
  }

  function handleRegister(e) {
    e.preventDefault();
    onRegister(username, password);
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

        {error && <ErrorAlert message={error} />}

        <form onSubmit={handleLogin} className="auth-form">
          <label>
            <span>Username</span>
            <input
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
