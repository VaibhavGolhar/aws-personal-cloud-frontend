import React from "react";
import {
  FiFolder,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiHome,
  FiChevronLeft,
  FiEye,
} from "react-icons/fi";

/**
 * FileExplorer — Displays breadcrumb navigation, folder cards, and file cards.
 *
 * Receives all data and callbacks from the useFiles hook via props.
 * Does not manage any state of its own.
 *
 * @param {{
 *   folders: string[],
 *   fileList: object[],
 *   pathStack: string[],
 *   onEnterFolder: Function,
 *   onGoBack: Function,
 *   onView: Function,
 *   onDownload: Function,
 *   onDeleteFile: Function,
 *   onDeleteFolder: Function
 * }} props
 */
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
}) {
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

      {/* Folder cards */}
      <div className="folders-row">
        {folders.length > 0 &&
          folders.map((folder) => (
            <div key={folder} className="file-card">
              <button
                className="folder-card"
                onClick={() => onEnterFolder(folder)}
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
