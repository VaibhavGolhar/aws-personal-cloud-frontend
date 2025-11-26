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
  FiEye,
  FiUsers,
} from "react-icons/fi";
import "./App.css";

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

  // --- admin state ---
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserId, setAdminUserId] = useState("");
  const [adminUserDetails, setAdminUserDetails] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  const fileInputRef = useRef(null);

  const isAdmin = user?.email === "admin@test.com";

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

  // --- Folder structure logic ---
  const currentPath = pathStack.join("/");
  const foldersSet = new Set();
  const fileList = [];

  files.forEach((f) => {
    const parts = f.filename.split("/");

    // Ignore dummyfile.txt for display; use it only to infer folders
    if (f.filename.endsWith("/dummyfile.txt")) {
      const folderParts = parts.slice(0, -1); // remove dummyfile.txt
      if (currentPath) {
        const pathParts = currentPath.split("/");
        if (folderParts.slice(0, pathParts.length).join("/") === currentPath) {
          const nextFolder = folderParts[pathParts.length];
          if (nextFolder) foldersSet.add(nextFolder);
        }
      } else {
        foldersSet.add(folderParts[0]);
      }
      return;
    }

    // If file belongs to current path
    if (currentPath) {
      const pathParts = currentPath.split("/");
      if (parts.slice(0, pathParts.length).join("/") === currentPath) {
        if (parts.length === pathParts.length + 1) {
          fileList.push(f);
        } else {
          const nextFolder = parts[pathParts.length];
          if (nextFolder) foldersSet.add(nextFolder);
        }
      }
    } else {
      // root
      if (parts.length === 1) {
        fileList.push(f);
      } else {
        foldersSet.add(parts[0]);
      }
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

  // --- Delete Folder (recursive) ---
  async function handleDeleteFolder(folder) {
    const confirmDelete = window.confirm(
      `Delete folder "${folder}" and all its contents?`
    );
    if (!confirmDelete) return;

    const folderPrefix = currentPath ? `${currentPath}/${folder}/` : `${folder}/`;
    const toDelete = files.filter((f) => f.filename.startsWith(folderPrefix));

    try {
      for (const f of toDelete) {
        await apiFetch(`/files/${f.id}`, { method: "DELETE" }, token);
      }
      await refreshFiles();
    } catch (err) {
      console.error("Error deleting folder:", err);
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

  // --- Quick View / Preview ---
  async function handleView(file) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/files/${file.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("Error viewing file:", err);
      alert("Unable to preview file.");
    }
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

  // --- Admin API handlers (buttons) ---
  async function fetchAdminSummary() {
    if (!isAdmin) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await apiFetch("/admin/summary", {}, token);
      setAdminSummary(res);
    } catch (err) {
      setAdminError(err.message || "Failed to load summary");
    } finally {
      setAdminLoading(false);
    }
  }

  async function fetchAdminUsers() {
    if (!isAdmin) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await apiFetch("/admin/users", {}, token);
      setAdminUsers(res);
    } catch (err) {
      setAdminError(err.message || "Failed to load users");
    } finally {
      setAdminLoading(false);
    }
  }

  async function fetchAdminUserById() {
    if (!isAdmin) return;
    const trimmed = adminUserId.trim();
    if (!trimmed) {
      setAdminError("Please enter a user ID.");
      return;
    }
    setAdminLoading(true);
    setAdminError("");
    try {
      const res = await apiFetch(`/admin/users/${trimmed}`, {}, token);
      setAdminUserDetails(res);
    } catch (err) {
      setAdminUserDetails(null);
      setAdminError(err.message || "Failed to load user");
    } finally {
      setAdminLoading(false);
    }
  }

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

              {/* Admin nav only for admin@test.com */}
              {isAdmin && (
                <>
                  <p className="sidebar-section-label sidebar-section-label-admin">
                    Admin
                  </p>
                  <button
                    className={`sidebar-item ${
                      activeTab === "admin" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("admin")}
                  >
                    <FiUsers />
                    <span>Admin panel</span>
                  </button>
                </>
              )}
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

              {/* Folder cards with delete */}
              <div className="folders-row">
                {folders.length > 0 &&
                  folders.map((folder) => (
                    <div key={folder} className="file-card">
                      <button
                        className="folder-card"
                        onClick={() => enterFolder(folder)}
                      >
                        <div className="folder-icon-wrapper">
                          <FiFolder />
                        </div>
                        <span className="folder-name">{folder}</span>
                      </button>
                      <div className="file-card-actions">
                        <button
                          className="icon-btn danger"
                          onClick={() => handleDeleteFolder(folder)}
                          title="Delete folder"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Files */}
              <div className="files-list-wrapper">
                {fileList.length > 0 ? (
                  <div className="files-grid">
                    {fileList.map((file) => {
                      const name = file.filename.split("/").pop();
                      return (
                        <div key={file.id} className="file-card file-card-file">
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

                          <div className="file-card-actions file-card-actions-bottom">
                            <button
                              className="icon-btn light"
                              onClick={() => handleView(file)}
                              title="Quick view"
                            >
                              <FiEye />
                            </button>
                            <button
                              className="icon-btn light"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <FiDownload />
                            </button>
                            <button
                              className="icon-btn danger"
                              onClick={() => handleFileDelete(file.id)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  folders.length === 0 && (
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
                  )
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

          {/* -------- Admin tab (only for admin@test.com) -------- */}
          {activeTab === "admin" && isAdmin && (
            <section className="card admin-tab">
              <h2>Admin panel</h2>
              <p className="card-subtitle">
                Site-wide usage, users list, and per-user billing.  
                These endpoints require <code>admin@test.com</code>.
              </p>

              {adminError && (
                <div className="inline-error admin-error">{adminError}</div>
              )}

              <div className="admin-actions-row">
                <button
                  className="primary-btn admin-btn"
                  onClick={fetchAdminSummary}
                  disabled={adminLoading}
                >
                  Get summary
                </button>

                <button
                  className="secondary-btn admin-btn"
                  onClick={fetchAdminUsers}
                  disabled={adminLoading}
                >
                  List all users
                </button>

                <div className="admin-userid-group">
                  <label>
                    <span>User ID</span>
                    <input
                      type="number"
                      className="admin-input"
                      value={adminUserId}
                      onChange={(e) => setAdminUserId(e.target.value)}
                      placeholder="e.g. 1"
                    />
                  </label>
                  <button
                    className="secondary-btn admin-btn"
                    onClick={fetchAdminUserById}
                    disabled={adminLoading}
                  >
                    Get user by ID
                  </button>
                </div>
              </div>

              {/* Summary block */}
              {adminSummary && (
                <div className="admin-summary">
                  <h3>Site summary</h3>
                  <div className="billing-grid">
                    <div className="billing-item">
                      <span className="billing-label">Total users</span>
                      <span className="billing-value">
                        {adminSummary.totalUsers}
                      </span>
                    </div>
                    <div className="billing-item">
                      <span className="billing-label">Total storage (GB)</span>
                      <span className="billing-value">
                        {adminSummary.totalStorageGb}
                      </span>
                    </div>
                    <div className="billing-item">
                      <span className="billing-label">Total objects</span>
                      <span className="billing-value">
                        {adminSummary.totalObjects}
                      </span>
                    </div>
                    <div className="billing-item">
                      <span className="billing-label">
                        Est. monthly revenue
                      </span>
                      <span className="billing-value">
                        {adminSummary.estimatedMonthlyRevenue}{" "}
                        {adminSummary.currency}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Users table */}
              {adminUsers && adminUsers.length > 0 && (
                <div className="admin-users">
                  <h3>All users</h3>
                  <div className="admin-table-wrapper">
                    <table className="admin-users-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Email</th>
                          <th>Name</th>
                          <th>Created</th>
                          <th>Storage (GB)</th>
                          <th>Objects</th>
                          <th>Billing total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((u) => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.email}</td>
                            <td>{u.fullName || "—"}</td>
                            <td>{u.createdAt}</td>
                            <td>{u.totalGb}</td>
                            <td>{u.objectCount}</td>
                            <td>
                              {u.billing?.total} {u.billing?.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Single user details */}
              {adminUserDetails && (
                <div className="admin-single-user">
                  <h3>User details (ID: {adminUserDetails.id})</h3>
                  <div className="profile-grid">
                    <div className="profile-row">
                      <span className="profile-label">Email</span>
                      <span className="profile-value">
                        {adminUserDetails.email}
                      </span>
                    </div>
                    <div className="profile-row">
                      <span className="profile-label">Full name</span>
                      <span className="profile-value">
                        {adminUserDetails.fullName || "—"}
                      </span>
                    </div>
                    <div className="profile-row">
                      <span className="profile-label">Created at</span>
                      <span className="profile-value">
                        {adminUserDetails.createdAt}
                      </span>
                    </div>
                    <div className="profile-row">
                      <span className="profile-label">Storage (GB)</span>
                      <span className="profile-value">
                        {adminUserDetails.totalGb}
                      </span>
                    </div>
                    <div className="profile-row">
                      <span className="profile-label">Objects</span>
                      <span className="profile-value">
                        {adminUserDetails.objectCount}
                      </span>
                    </div>
                    <div className="profile-row">
                      <span className="profile-label">Current bill</span>
                      <span className="profile-value">
                        {adminUserDetails.billing?.total}{" "}
                        {adminUserDetails.billing?.currency}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {adminLoading && (
                <p className="admin-loading">Loading admin data…</p>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}