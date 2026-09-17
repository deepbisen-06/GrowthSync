import React, { useState, useEffect } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import {
  Lock,
  Check,
  X,
  Eye,
  EyeOff,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function ResetPasswordPage({ setCurrentRoute, initialToken }) {
  const [token] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return (urlParams.get("token") || initialToken || "").trim();
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tok = (urlParams.get("token") || initialToken || "").trim();
    return tok
      ? ""
      : "This password reset link is missing or invalid. Please request a new link.";
  });
  const [isTokenInvalid, setIsTokenInvalid] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tok = (urlParams.get("token") || initialToken || "").trim();
    return !tok;
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(4);

  // Live password validation checklist
  const criteria = {
    length: newPassword.length >= 8,
    hasLetter: /[A-Za-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isFormValid =
    criteria.length &&
    criteria.hasLetter &&
    criteria.hasNumber &&
    criteria.matches;

  // Auto redirect countdown on success
  useEffect(() => {
    let timer;
    if (isSuccess && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && redirectCountdown === 0) {
      setCurrentRoute("login");
    }
    return () => clearTimeout(timer);
  }, [isSuccess, redirectCountdown, setCurrentRoute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setIsTokenInvalid(true);
      setError("This password reset link is invalid or has expired.");
      return;
    }

    if (!isFormValid) {
      setError(
        "Please ensure your new password satisfies all security requirements.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      const msg =
        err.formattedMessage ||
        "Failed to reset password. The link may have expired or already been used.";
      setError(msg);
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("already been used")
      ) {
        setIsTokenInvalid(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: "480px" }}>
        <div className="auth-header">
          <div
            style={{
              display: "inline-flex",
              padding: "10px",
              borderRadius: "12px",
              background: "var(--brand-emerald-light)",
              color: "var(--brand-emerald)",
              marginBottom: "0.75rem",
            }}
          >
            <Lock size={28} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">
            {isSuccess ? "Password Reset Complete!" : "Create New Password"}
          </h1>
          <p className="auth-subtitle">
            {isSuccess
              ? "Your password has been updated securely."
              : "Choose a strong password for your GrowthSync account."}
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {isSuccess ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "var(--brand-emerald-light)",
                border: "1px solid var(--brand-emerald)",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
                color: "var(--text-primary)",
              }}
            >
              <CheckCircle2
                size={40}
                color="var(--brand-emerald)"
                style={{ margin: "0 auto 0.75rem auto", display: "block" }}
              />
              <h3
                style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                Password Updated Successfully! 🎉
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.45,
                }}
              >
                You can now log in using your newly configured password.
              </p>
              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                Redirecting to login in {redirectCountdown}s...
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setCurrentRoute("login")}
              style={{ padding: "0.85rem" }}
              id="back-to-login-btn"
            >
              <span>Back to Login</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : isTokenInvalid ? (
          <div>
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}
              >
                This password reset link is invalid, has expired (valid for 30
                minutes), or has already been used.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => setCurrentRoute("forgot_password")}
                style={{ padding: "0.85rem" }}
                id="request-new-link-btn"
              >
                <RotateCcw size={16} />
                <span>Request a New Reset Link</span>
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setCurrentRoute("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                ← Back to Login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ paddingRight: "2.5rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                  tabIndex="-1"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-new-password">
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ paddingRight: "2.5rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                  tabIndex="-1"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Live Password Criteria Checklist */}
            <div
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "8px",
                padding: "0.85rem 1rem",
                marginBottom: "1.25rem",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Password Security Checklist
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.4rem",
                  fontSize: "0.8rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: criteria.length
                      ? "var(--brand-emerald)"
                      : "var(--text-muted)",
                  }}
                >
                  {criteria.length ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} />
                  )}
                  <span>8+ characters</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: criteria.hasLetter
                      ? "var(--brand-emerald)"
                      : "var(--text-muted)",
                  }}
                >
                  {criteria.hasLetter ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} />
                  )}
                  <span>At least 1 letter</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: criteria.hasNumber
                      ? "var(--brand-emerald)"
                      : "var(--text-muted)",
                  }}
                >
                  {criteria.hasNumber ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} />
                  )}
                  <span>At least 1 number</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: criteria.matches
                      ? "var(--brand-emerald)"
                      : "var(--text-muted)",
                  }}
                >
                  {criteria.matches ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} />
                  )}
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ padding: "0.85rem" }}
              disabled={isSubmitting || !isFormValid}
              id="reset-password-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Reset Password</span>
                </>
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => setCurrentRoute("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
