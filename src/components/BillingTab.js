import React from "react";

/**
 * BillingTab — Displays the user's current billing summary.
 *
 * A pure presentational component with no side effects.
 *
 * @param {{ billing: object }} props
 */
export default function BillingTab({ billing }) {
  if (!billing) return null;

  return (
    <section className="billing-tab card">
      <h2>Billing summary</h2>
      <p className="card-subtitle">
        Transparent, pay-as-you-go usage metrics.
      </p>

      <div className="billing-grid">
        <div className="billing-item">
          <span className="billing-label">Storage used</span>
          <span className="billing-value">{billing.storageGb} GB</span>
        </div>
        <div className="billing-item">
          <span className="billing-label">Storage cost</span>
          <span className="billing-value">${billing.storageCost}</span>
        </div>
        <div className="billing-item">
          <span className="billing-label">Read requests (cost)</span>
          <span className="billing-value">
            {billing.readRequests} (${billing.readCost})
          </span>
        </div>
        <div className="billing-item">
          <span className="billing-label">Write requests (cost)</span>
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
  );
}
