import React from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, setCurrentRoute }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <div
          className="spinner"
          style={{ width: "2rem", height: "2rem", borderWidth: "3px" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Authentication Required</h2>
          <p
            style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}
          >
            Please log in or register to access this section of GrowthSync.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setCurrentRoute("login")}
              className="btn btn-primary"
            >
              Log In
            </button>
            <button
              onClick={() => setCurrentRoute("register")}
              className="btn btn-outline"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
