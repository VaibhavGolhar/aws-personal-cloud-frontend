import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "../api";

const API_BASE = "http://localhost:8080/api";

/**
 * Custom hook that encapsulates all file management and folder navigation logic.
 *
 * Manages the flat file list from the API, derives folder structure from filenames,
 * handles uploads, downloads (via blob), deletes, and folder path navigation.
 *
 * @param {string} token - JWT token for authenticated API calls
 * @returns {object} File operations and state
 */
export default function useFiles(token) {
  const [files, setFiles] = useState([]);
  const [billing, setBilling] = useState(null);
  const [pathStack, setPathStack] = useState([]);
  const [error, setError] = useState("");

  const currentPath = pathStack.join("/");

  // Fetch files from the API
  const refreshFiles = useCallback(async () => {
    if (!token) return;
    try {
      const f = await apiFetch("/files", {}, token);
      setFiles(f);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    }
  }, [token]);

  // Fetch billing summary
  const refreshBilling = useCallback(async () => {
    if (!token) return;
    try {
      const b = await apiFetch("/billing/current", {}, token);
      setBilling(b);
    } catch (err) {
      console.error("Failed to fetch billing:", err);
    }
  }, [token]);

  // Initial data load
  useEffect(() => {
    if (!token) return;
    refreshFiles();
    refreshBilling();
  }, [token, refreshFiles, refreshBilling]);

  // Derive folders and files at the current path from the flat file list
  const { folders, fileList } = useMemo(() => {
    const foldersSet = new Set();
    const currentFiles = [];

    files.forEach((f) => {
      const parts = f.filename.split("/");

      // Ignore dummyfile.txt for display; use it only to infer folders
      if (f.filename.endsWith("/dummyfile.txt")) {
        const folderParts = parts.slice(0, -1);
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
            currentFiles.push(f);
          } else {
            const nextFolder = parts[pathParts.length];
            if (nextFolder) foldersSet.add(nextFolder);
          }
        }
      } else {
        if (parts.length === 1) {
          currentFiles.push(f);
        } else {
          foldersSet.add(parts[0]);
        }
      }
    });

    return { folders: Array.from(foldersSet), fileList: currentFiles };
  }, [files, currentPath]);

  // --- File operations ---

  async function uploadFile(file) {
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

  async function deleteFile(id) {
    try {
      await apiFetch(`/files/${id}`, { method: "DELETE" }, token);
      await refreshFiles();
    } catch (err) {
      setError(err.message);
    }
  }

  async function downloadFile(file) {
    try {
      const response = await fetch(`${API_BASE}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message);
    }
  }

  async function viewFile(file) {
    try {
      const response = await fetch(`${API_BASE}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("Error viewing file:", err);
      alert("Unable to preview file.");
    }
  }

  // --- Folder operations ---

  async function createFolder(name) {
    if (!name) return;
    if (name.includes("/")) {
      alert("Folder name cannot contain '/' characters");
      return;
    }
    const prefix = currentPath ? `${currentPath}/${name}` : name;
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

  async function deleteFolder(folder) {
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

  function enterFolder(name) {
    setPathStack((prev) => [...prev, name]);
  }

  function goBack() {
    setPathStack((prev) => prev.slice(0, -1));
  }

  return {
    files,
    billing,
    pathStack,
    currentPath,
    folders,
    fileList,
    error,
    setError,
    refreshFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    viewFile,
    createFolder,
    deleteFolder,
    enterFolder,
    goBack,
  };
}
