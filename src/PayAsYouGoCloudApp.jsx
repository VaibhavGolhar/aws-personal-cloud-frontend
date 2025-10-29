import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";

const LS_TOKEN = "payg_accessToken";

export default function PayAsYouGoCloudApp() {
  const [token, setToken] = useState(localStorage.getItem(LS_TOKEN) || "");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("files");
  const [files, setFiles] = useState([]);
  const [billing, setBilling] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Authentication ---
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(LS_TOKEN, data.accessToken);
      setToken(data.accessToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(LS_TOKEN, data.accessToken);
      setToken(data.accessToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(LS_TOKEN);
    setToken("");
    setUser(null);
  }

  // --- Fetch user + files + billing ---
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const me = await apiFetch("/auth/me", {}, token);
        setUser(me);
        const f = await apiFetch("/files", {}, token);
        setFiles(f);
        const b = await apiFetch("/billing/current", {}, token);
        setBilling(b);
      } catch (err) {
        console.error(err);
        handleLogout();
      }
    })();
  }, [token]);

  // --- File upload ---
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const uploaded = await apiFetch("/files", { method: "POST", body: form }, token);
      setFiles([uploaded, ...files]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFileDelete(id) {
    try {
      await apiFetch(`/files/${id}`, { method: "DELETE" }, token);
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDownload(file) {
    window.open(`http://localhost:8080/api/files/${file.id}/download`, "_blank");
  }

  if (!token)
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p>Pay-as-you-go personal cloud — inspired by Google Drive.</p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <button className="link-btn" onClick={handleRegister}>
            Create account
          </button>
        </div>
      </div>
    );

  return (
    <div className="main-container">
      <header>
        <h2>☁ Pay-as-you-go Cloud</h2>
        <nav>
          <button onClick={() => setActiveTab("files")} className={activeTab === "files" ? "active" : ""}>
            Files
          </button>
          <button onClick={() => setActiveTab("billing")} className={activeTab === "billing" ? "active" : ""}>
            Billing
          </button>
          <button onClick={() => setActiveTab("profile")} className={activeTab === "profile" ? "active" : ""}>
            Profile
          </button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main>
        {activeTab === "files" && (
          <section className="files-tab">
            <h3>Your Files</h3>
            <input type="file" onChange={handleFileUpload} />
            <ul className="file-list">
              {files.map(file => (
                <li key={file.id} className="file-item">
                  <span>{file.filename}</span>
                  <div>
                    <button onClick={() => handleDownload(file)}>⬇</button>
                    <button onClick={() => handleFileDelete(file.id)}>🗑</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === "billing" && billing && (
          <section className="billing-tab">
            <h3>Billing Summary</h3>
            <p>Storage used: {billing.storageGb} GB</p>
            <p>Storage cost: ${billing.storageCost}</p>
            <p>Read requests: {billing.readRequests} (${billing.readCost})</p>
            <p>Write requests: {billing.writeRequests} (${billing.writeCost})</p>
            <h4>Total: ${billing.total} {billing.currency}</h4>
          </section>
        )}

        {activeTab === "profile" && user && (
          <section className="profile-tab">
            <h3>Profile</h3>
            <p><strong>Name:</strong> {user.fullName || "—"}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </section>
        )}
      </main>
    </div>
  );
}