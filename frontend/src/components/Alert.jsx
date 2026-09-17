import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

export default function Alert({ type = "info", message, onClose }) {
  if (!message) return null;

  const icons = {
    error: <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />,
    success: (
      <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
    ),
    info: <Info size={18} className="text-cyan-400 flex-shrink-0" />,
    warning: (
      <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
    ),
  };

  return (
    <div className={`alert alert-${type} flex items-center justify-between`}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
        {icons[type] || icons.info}
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "currentColor",
            cursor: "pointer",
            opacity: 0.7,
            padding: "2px",
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
