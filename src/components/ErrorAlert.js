import React from "react";
import { FiAlertCircle } from "react-icons/fi";

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="error-alert">
      <FiAlertCircle className="error-icon" />
      <span className="error-text">{message}</span>
      {onClose && (
        <button className="error-close-btn" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
}
