import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "./api";
import {
  FiCloud,
  FiFolder,
  FiFileText,
  FiUpload,
  FiFolderPlus,
  FiDownload,
  FiTrash2,
  FiLogOut,
  FiUser,
  FiCreditCard,
  FiHome,
  FiChevronLeft,
} from "react-icons/fi";
import "./PayAsYouGoCloudApp.css";

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
  const [pathStack, setPathStack] = useState([]); // folder path navigation

  const fileInputRef = useRef(null);

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
        await refreshFiles();
        const b = await apiFetch("/billing/current", {}, token);
        setBilling(b);
      } catch (err) {
        console.error(err);
        handleLogout();
      }
    })();
  }, [token]);

  async function refreshFiles() {
    try {
      const f = await apiFetch("/files", {}, token);
      console.log("Fetched files:", f);
      setFiles(f);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    }
  }

  // --- File & folder helpers ---
  const currentPath = pathStack.join("/");

  // Build hierarchical structure
  const visibleFiles = files.filter(
    (f) => !f.filename.endsWith("/dummyfile.txt")
  );
  const foldersSet = new Set();
  const fileList = [];

  visibleFiles.forEach((f) => {
    const parts = f.filename.split("/");
    if (parts.length > 1) {
      // it's inside folder(s)
      if (currentPath) {
        const pathParts = currentPath.split("/");
        if (parts.slice(0, pathParts.length).join("/") === currentPath) {
          const nextPart = parts[pathParts.length];
          if (
            nextPart &&
            !nextPart.endsWith(".txt") &&
            parts.length > pathParts.length + 1
          ) {
            foldersSet.add(nextPart);
          } else if (nextPart && parts.length === pathParts.length + 1) {
            fileList.push(f);
          }
        }
      } else {
        foldersSet.add(parts[0]);
      }
    } else {
      if (!currentPath) fileList.push(f);
    }
  });

  const folders = Array.from(foldersSet);

  // --- Create Folder ---
  async function handleCreateFolder() {
    const folder = prompt("Enter new folder name:");
    if (!folder) return;
    if (folder.includes("/") || folder.includes("//")) {
      alert("Folder name cannot contain '/' characters");
      return;
    }

    const prefix = currentPath ? `${currentPath}/${folder}` : folder;
    const form = new FormData();
    // create an *empty* dummy.txt file to mark the folder
    const dummy = new Blob([], { type: "text/plain" });
    form.append("file", dummy, `${prefix}/dummyfile.txt`);
    try {
      await apiFetch("/files", { method: "POST", body: form }, token);
      await refreshFiles();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // --- File upload ---
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    form.append("file", file, filePath);
    try {
      await apiFetch("/files", { method: "POST", body: form }, token);
      await refreshFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      // reset input so uploading same file twice works
      e.target.value = "";
    }
  }

  async function handleFileDelete(id) {
    try {
      await apiFetch(`/files/${id}`, { method: "DELETE" }, token);
      await refreshFiles();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDownload(file) {
    window.open(
      `http://localhost:8080/api/files/${file.id}/download`,
      "_blank"
    );
  }

  // --- Navigation ---
  function enterFolder(name) {
    setPathStack([...pathStack, name]);
  }

  function goBack() {
    setPathStack(pathStack.slice(0, -1));
  }

  function triggerUpload() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // --- Storage meter (sidebar bottom) ---
  const maxStorageGb = 100;
  const usedStorageGb = billing?.storageGb ?? 0;
  const storagePercent = Math.min(
    (usedStorageGb / maxStorageGb) * 100,
    100
  );

  // --- Auth UI ---
  if (!token)
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

  // --- Main UI ---
  return (
    <div className="app-root fade-in">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <FiCloud />
          </div>
          <div className="app-title-block">
            <h1>Pay-as-you-go Cloud</h1>
            <span className="app-subtitle">
              Personal object storage — Google Drive–style UI, AWS-style billing
            </span>
          </div>
        </div>

        <div className="app-header-right">
          {user && (
            <div className="user-chip">
              <div className="user-avatar">
                {user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="user-meta">
                <span className="user-name">
                  {user.fullName || "Cloud User"}
                </span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}
          <button className="icon-btn logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div>
            <button className="primary-btn sidebar-new" onClick={triggerUpload}>
              <FiUpload />
              <span>New upload</span>
            </button>
            <button
              className="secondary-btn sidebar-new-folder"
              onClick={handleCreateFolder}
            >
              <FiFolderPlus />
              <span>New folder</span>
            </button>

            <nav className="sidebar-nav">
              <p className="sidebar-section-label">Navigation</p>
              <button
                className={`sidebar-item ${
                  activeTab === "files" ? "active" : ""
                }`}
                onClick={() => setActiveTab("files")}
              >
                <FiHome />
                <span>My Files</span>
              </button>
              <button
                className={`sidebar-item ${
                  activeTab === "billing" ? "active" : ""
                }`}
                onClick={() => setActiveTab("billing")}
              >
                <FiCreditCard />
                <span>Billing</span>
              </button>
              <button
                className={`sidebar-item ${
                  activeTab === "profile" ? "active" : ""
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <FiUser />
                <span>Profile</span>
              </button>
            </nav>
          </div>

          {/* Storage meter bottom-left */}
          <div className="storage-card">
            <div className="storage-header">
              <span className="storage-title">Storage</span>
              <FiCloud className="storage-icon" />
            </div>
            <div className="storage-bar-outer">
              <div
                className="storage-bar-inner"
                style={{ width: `${storagePercent || 0}%` }}
              ></div>
            </div>
            <div className="storage-meta-row">
              <span className="storage-amount">
                {usedStorageGb.toFixed(2)} GB / {maxStorageGb} GB
              </span>
              <span className="storage-percent">
                {storagePercent ? storagePercent.toFixed(0) : 0}%
              </span>
            </div>
            <p className="storage-caption">
              Billed pay-as-you-go from your usage.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            onChange={handleFileUpload}
          />

          {error && <div className="inline-error">{error}</div>}

          {activeTab === "files" && (
            <section className="files-tab">
              <div className="files-header-row">
                <div className="breadcrumbs">
                  {pathStack.length > 0 ? (
                    <button className="back-chip" onClick={goBack}>
                      <FiChevronLeft />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div className="back-chip back-chip-disabled">
                      <FiHome />
                      <span>Root</span>
                    </div>
                  )}
                  <span className="path-text">
                    /{pathStack.join("/") || ""}
                  </span>
                </div>
              </div>

              <div className="folders-row">
                {folders.length > 0 &&
                  folders.map((folder) => (
                    <button
                      key={folder}
                      className="folder-card"
                      onClick={() => enterFolder(folder)}
                    >
                      <div className="folder-icon-wrapper">
                        <FiFolder />
                      </div>
                      <span className="folder-name">{folder}</span>
                    </button>
                  ))}
              </div>

              <div className="files-list-wrapper">
                {fileList.length > 0 ? (
                  <div className="files-grid">
                    {fileList.map((file) => {
                      const name = file.filename.split("/").pop();
                      return (
                        <div key={file.id} className="file-card">
                          <div className="file-card-main">
                            <div className="file-icon-wrapper">
                              <FiFileText />
                            </div>
                            <div className="file-meta">
                              <span className="file-name" title={name}>
                                {name}
                              </span>
                              <span className="file-subtext">
                                ID: {file.id}
                              </span>
                            </div>
                          </div>
                          <div className="file-card-actions">
                            <button
                              className="icon-btn light"
                              onClick={() => handleDownload(file)}
                            >
                              <FiDownload />
                            </button>
                            <button
                              className="icon-btn danger"
                              onClick={() => handleFileDelete(file.id)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <FiFolder />
                    </div>
                    <h3>No files or folders here</h3>
                    <p>
                      Use <strong>New upload</strong> or{" "}
                      <strong>New folder</strong> in the sidebar to get
                      started.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "billing" && billing && (
            <section className="billing-tab card">
              <h2>Billing summary</h2>
              <p className="card-subtitle">
                Transparent, pay-as-you-go usage metrics.
              </p>

              <div className="billing-grid">
                <div className="billing-item">
                  <span className="billing-label">Storage used</span>
                  <span className="billing-value">
                    {billing.storageGb} GB
                  </span>
                </div>
                <div className="billing-item">
                  <span className="billing-label">Storage cost</span>
                  <span className="billing-value">
                    ${billing.storageCost}
                  </span>
                </div>
                <div className="billing-item">
                  <span className="billing-label">
                    Read requests (cost)
                  </span>
                  <span className="billing-value">
                    {billing.readRequests} (${billing.readCost})
                  </span>
                </div>
                <div className="billing-item">
                  <span className="billing-label">
                    Write requests (cost)
                  </span>
                  <span className="billing-value">
                    {billing.writeRequests} (${billing.writeCost})
                  </span>
                </div>
              </div>

              <div className="billing-total-row">
                <span>Total</span>
                <span className="billing-total">
                  ${billing.total} {billing.currency}
                </span>
              </div>
            </section>
          )}

          {activeTab === "profile" && user && (
            <section className="profile-tab card">
              <h2>Profile</h2>
              <p className="card-subtitle">
                Your identity on the pay-as-you-go cloud.
              </p>

              <div className="profile-grid">
                <div className="profile-row">
                  <span className="profile-label">Name</span>
                  <span className="profile-value">
                    {user.fullName || "—"}
                  </span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user.email}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">User ID</span>
                  <span className="profile-value">{user.id}</span>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}