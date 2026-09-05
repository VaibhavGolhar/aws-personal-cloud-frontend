import React, { useState, useRef } from "react";
import useAuth from "./hooks/useAuth";
import useFiles from "./hooks/useFiles";
import AuthPage from "./components/AuthPage";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import FileExplorer from "./components/FileExplorer";
import BillingTab from "./components/BillingTab";
import ProfileTab from "./components/ProfileTab";
import AdminPanel from "./components/AdminPanel";
import ErrorAlert from "./components/ErrorAlert";
import "./App.css";

/**
 * App — Root orchestrator component.
 *
 * Delegates authentication to useAuth, file management to useFiles,
 * and renders the appropriate tab component based on the active selection.
 * Reduced from 919 lines to ~80 lines by decomposing into focused
 * components and custom hooks following the Single Responsibility Principle.
 */
export default function App() {
  const { token, user, loading, error, login, register, logout } = useAuth();
  const fileOps = useFiles(token);
  const [activeTab, setActiveTab] = useState("files");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const isAdmin = user?.username === "admin";

  // Auth gate — show login page if no token
  if (!token) {
    return (
      <AuthPage
        onLogin={login}
        onRegister={register}
        loading={loading}
        error={error}
      />
    );
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFolderUploadClick() {
    folderInputRef.current?.click();
  }

  function handleFileUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    fileOps.uploadBulkFiles(files);
    e.target.value = "";
  }

  function handleCreateFolder() {
    const name = prompt("Enter new folder name:");
    if (name) fileOps.createFolder(name);
  }

  return (
    <div className="app-root fade-in">
      <AppHeader user={user} onLogout={logout} />

      <div className="app-shell">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUploadClick={handleUploadClick}
          onUploadFolderClick={handleFolderUploadClick}
          onCreateFolder={handleCreateFolder}
          isAdmin={isAdmin}
          billing={fileOps.billing}
        />

        <main className="main-content">
          {/* Hidden file input for uploads */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden-file-input"
            onChange={handleFileUpload}
            multiple
          />
          <input
            type="file"
            ref={folderInputRef}
            className="hidden-file-input"
            onChange={handleFileUpload}
            webkitdirectory="true"
            directory="true"
            multiple
          />

          {fileOps.error && (
            <ErrorAlert message={fileOps.error} />
          )}

          {activeTab === "files" && (
            <FileExplorer
              folders={fileOps.folders}
              fileList={fileOps.fileList}
              pathStack={fileOps.pathStack}
              onEnterFolder={fileOps.enterFolder}
              onGoBack={fileOps.goBack}
              onView={fileOps.viewFile}
              onDownload={fileOps.downloadFile}
              onDeleteFile={fileOps.deleteFile}
              onDeleteFolder={fileOps.deleteFolder}
              onDownloadBulk={fileOps.downloadBulk}
              onDeleteBulk={fileOps.deleteBulk}
            />
          )}

          {activeTab === "billing" && <BillingTab billing={fileOps.billing} />}

          {activeTab === "profile" && <ProfileTab user={user} />}

          {activeTab === "admin" && (
            <AdminPanel token={token} isAdmin={isAdmin} />
          )}
        </main>
      </div>
    </div>
  );
}