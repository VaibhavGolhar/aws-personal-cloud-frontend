import React from "react";

/**
 * ProfileTab — Displays the authenticated user's profile information.
 *
 * A pure presentational component with no side effects.
 *
 * @param {{ user: object }} props
 */
export default function ProfileTab({ user }) {
  if (!user) return null;

  return (
    <section className="profile-tab card">
      <h2>Profile</h2>
      <p className="card-subtitle">
        Your identity on the pay-as-you-go cloud.
      </p>

      <div className="profile-grid">
        <div className="profile-row">
          <span className="profile-label">Name</span>
          <span className="profile-value">{user.fullName || "—"}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">Username</span>
          <span className="profile-value">{user.username}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">User ID</span>
          <span className="profile-value">{user.id}</span>
        </div>
      </div>
    </section>
  );
}
