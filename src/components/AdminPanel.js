import React, { useState } from "react";
import { apiFetch } from "../api";

/**
 * AdminPanel — Self-contained admin panel for site-wide management.
 *
 * Manages its own state (summary, users list, user lookup) and makes its own
 * API calls, keeping admin complexity completely isolated from the main app.
 *
 * @param {{ token: string, isAdmin: boolean }} props
 */
export default function AdminPanel({ token, isAdmin }) {
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserId, setAdminUserId] = useState("");
  const [adminUserDetails, setAdminUserDetails] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  if (!isAdmin) return null;

  async function fetchAdminSummary() {
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

  return (
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
              <span className="billing-label">Est. monthly revenue</span>
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
                  <th>Username</th>
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
                    <td>{u.username}</td>
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
              <span className="profile-label">Username</span>
              <span className="profile-value">
                {adminUserDetails.username}
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
  );
}
