import React from "react";
import {
  FiUpload,
  FiFolderPlus,
  FiHome,
  FiCreditCard,
  FiUser,
  FiUsers,
  FiCloud,
} from "react-icons/fi";

/**
 * Sidebar — Navigation panel with upload/folder actions, nav links, and storage meter.
 *
 * @param {{
 *   activeTab: string,
 *   onTabChange: Function,
 *   onUploadClick: Function,
 *   onUploadFolderClick: Function,
 *   onCreateFolder: Function,
 *   isAdmin: boolean,
 *   billing: object|null
 * }} props
 */
export default function Sidebar({
  activeTab,
  onTabChange,
  onUploadClick,
  onUploadFolderClick,
  onCreateFolder,
  isAdmin,
  billing,
}) {
  const maxStorageGb = 100;
  const usedStorageGb = billing?.storageGb ?? 0;
  const storagePercent = Math.min((usedStorageGb / maxStorageGb) * 100, 100);

  return (
    <aside className="sidebar">
      <div>
        <button className="primary-btn sidebar-new" onClick={onUploadClick}>
          <FiUpload />
          <span>Upload files</span>
        </button>
        <button className="primary-btn sidebar-new" onClick={onUploadFolderClick}>
          <FiUpload />
          <span>Upload folder</span>
        </button>
        <button
          className="secondary-btn sidebar-new-folder"
          onClick={onCreateFolder}
        >
          <FiFolderPlus />
          <span>New folder</span>
        </button>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Navigation</p>
          <button
            className={`sidebar-item ${activeTab === "files" ? "active" : ""}`}
            onClick={() => onTabChange("files")}
          >
            <FiHome />
            <span>My Files</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === "billing" ? "active" : ""}`}
            onClick={() => onTabChange("billing")}
          >
            <FiCreditCard />
            <span>Billing</span>
          </button>
          <button
            className={`sidebar-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => onTabChange("profile")}
          >
            <FiUser />
            <span>Profile</span>
          </button>

          {isAdmin && (
            <>
              <p className="sidebar-section-label sidebar-section-label-admin">
                Admin
              </p>
              <button
                className={`sidebar-item ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => onTabChange("admin")}
              >
                <FiUsers />
                <span>Admin panel</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Storage meter */}
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
  );
}
