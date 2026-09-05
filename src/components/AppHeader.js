import React from "react";
import { FiCloud, FiLogOut } from "react-icons/fi";

/**
 * AppHeader — Top navigation bar with logo, app title, user chip, and logout button.
 *
 * @param {{ user: object, onLogout: Function }} props
 */
export default function AppHeader({ user, onLogout }) {
  return (
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
        <button className="icon-btn logout-btn" onClick={onLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
