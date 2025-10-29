import React, { useState, useEffect } from "react";
import { apiFetch } from "./api";
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

    // Ignore dummy.txt for display
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
      return; // don't show dummy
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

  // --- 🔥 Delete Folder (new feature) ---
  async function handleDeleteFolder(folder) {
    const confirmDelete = window.confirm(`Delete folder "${folder}" and all its contents?`);
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
    window.open(`http://localhost:8080/api/files/${file.id}/download`, "_blank");
  }

  // --- Navigation ---
  function enterFolder(name) {
    setPathStack([...pathStack, name]);
  }

  function goBack() {
    setPathStack(pathStack.slice(0, -1));
  }

  // --- Auth UI ---
  if (!token)
    return (
      <div className="auth-container fade-in">
        <div className="auth-card">
          <h1>Welcome</h1>
          <p>Pay-as-you-go personal cloud — inspired by Google Drive.</p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

  // --- Main UI ---
  return (
    <div className="main-container fade-in">
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

      <main className="tab-content fade-in">
        {activeTab === "files" && (
          <section className="files-tab">
            <div className="folder-path">
              {pathStack.length > 0 && (
                <button className="back-btn" onClick={goBack}>
                  ⬅ Back
                </button>
              )}
              <span>/{pathStack.join("/")}</span>
            </div>

            <div className="file-controls">
              <input type="file" onChange={handleFileUpload} />
              <button onClick={handleCreateFolder}>+ New Folder</button>
            </div>

            <div className="folder-list">
              {folders.map((folder) => (
                <div key={folder} className="folder-item">
                  <span onClick={() => enterFolder(folder)}>📁 {folder}</span>
                  <button
                    className="delete-folder-btn"
                    onClick={() => handleDeleteFolder(folder)} // 🔥 added delete icon
                    title="Delete folder"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <ul className="file-list">
              {fileList.map((file) => (
                <li key={file.id} className="file-item">
                  <span>{file.filename.split("/").pop()}</span>
                  <div>
                    <button onClick={() => handleDownload(file)}>⬇</button>
                    <button onClick={() => handleFileDelete(file.id)}>🗑</button>
                  </div>
                </li>
              ))}
              {folders.length === 0 && fileList.length === 0 && <p>No files or folders here.</p>}
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
            <h4>
              Total: ${billing.total} {billing.currency}
            </h4>
          </section>
        )}

        {activeTab === "profile" && user && (
          <section className="profile-tab">
            <h3>Profile</h3>
            <p>
              <strong>Name:</strong> {user.fullName || "—"}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}