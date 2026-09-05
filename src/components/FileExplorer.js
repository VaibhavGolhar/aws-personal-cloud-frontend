import React, { useState } from "react";
import {
  FiFolder,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiHome,
  FiChevronLeft,
  FiEye,
} from "react-icons/fi";

export default function FileExplorer({
  folders,
  fileList,
  pathStack,
  onEnterFolder,
  onGoBack,
  onView,
  onDownload,
  onDeleteFile,
  onDeleteFolder,
  onDownloadBulk,
  onDeleteBulk,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);

  function toggleFile(file) {
    if (selectedFiles.find(f => f.id === file.id)) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, file]);
    }
  }

  function toggleFolder(folder) {
    if (selectedFolders.includes(folder)) {
      setSelectedFolders(prev => prev.filter(f => f !== folder));
    } else {
      setSelectedFolders(prev => [...prev, folder]);
    }
  }

  function handleBulkDownload() {
    if (onDownloadBulk) {
      onDownloadBulk(selectedFiles, selectedFolders);
      setSelectedFiles([]);
      setSelectedFolders([]);
    }
  }

  function handleBulkDelete() {
    if (onDeleteBulk) {
      onDeleteBulk(selectedFiles, selectedFolders);
      setSelectedFiles([]);
      setSelectedFolders([]);
    }
  }

  return (
    <section className="files-tab">
      {/* Breadcrumb navigation */}
      <div className="files-header-row">
        <div className="breadcrumbs">
          {pathStack.length > 0 ? (
            <button className="back-chip" onClick={onGoBack}>
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

      {/* Bulk actions bar */}
      {(selectedFiles.length > 0 || selectedFolders.length > 0) && (
        <div className="bulk-actions-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '10px 0', padding: '10px', background: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 500, marginRight: 'auto' }}>
            {selectedFiles.length} file(s) and {selectedFolders.length} folder(s) selected
          </span>
          <button className="primary-btn" onClick={handleBulkDownload}>
            <FiDownload />
            <span>Download Selected</span>
          </button>
          <button className="danger-btn" onClick={handleBulkDelete} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' }}>
            <FiTrash2 />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Folder cards */}
      <div className="folders-row">
        {folders.length > 0 &&
          folders.map((folder) => (
            <div key={folder} className="file-card">
              <input 
                type="checkbox" 
                checked={selectedFolders.includes(folder)} 
                onChange={() => toggleFolder(folder)}
                style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}
              />
              <button
                className="folder-card"
                onClick={() => onEnterFolder(folder)}
                style={{ paddingLeft: '30px' }}
              >
                <div className="folder-icon-wrapper">
                  <FiFolder />
                </div>
                <span className="folder-name">{folder}</span>
              </button>
              <div className="file-card-actions">
                <button
                  className="icon-btn danger"
                  onClick={() => onDeleteFolder(folder)}
                  title="Delete folder"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* File cards */}
      <div className="files-list-wrapper">
        {fileList.length > 0 ? (
          <div className="files-grid">
            {fileList.map((file) => {
              const name = file.filename.split("/").pop();
              return (
                <div key={file.id} className="file-card file-card-file">
                  <input 
                    type="checkbox" 
                    checked={!!selectedFiles.find(f => f.id === file.id)} 
                    onChange={() => toggleFile(file)}
                    style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}
                  />
                  <div className="file-card-main" style={{ paddingLeft: '30px' }}>
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
                      onClick={() => onView(file)}
                      title="Quick view"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="icon-btn light"
                      onClick={() => onDownload(file)}
                      title="Download"
                    >
                      <FiDownload />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => onDeleteFile(file.id)}
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
  );
}
