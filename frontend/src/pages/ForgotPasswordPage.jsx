import React, { useState } from "react";
import api from "../api/client";
import Alert from "../components/Alert";
import { KeyRound, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { EMAIL_REGEX } from "../utils/validation";

export default function ForgotPasswordPage({ setCurrentRoute }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError("Please enter a valid registered email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/forgot-password", {
        email: cleanEmail,
      });
      setSuccessMessage(
        res.data.message ||
          "If an account exists with this email, password reset instructions have been generated.",
      );
    } catch (err) {
      setError(
        err.formattedMessage ||
          "Failed to process password reset request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: "460px" }}>
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
            <KeyRound size={28} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">Forgot your password?</h1>
          <p className="auth-subtitle">
            Enter your registered email address and we'll help you reset your
            password.
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {successMessage ? (
          <div>
            <div
              style={{
                background: "var(--brand-emerald-light)",
                border: "1px solid var(--brand-emerald)",
                borderRadius: "10px",
                padding: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: "1.5rem",
                display: "flex",
                gap: "0.85rem",
                alignItems: "flex-start",
              }}
            >
              <CheckCircle2
                size={24}
                color="var(--brand-emerald)"
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <div>
                <h4
                  style={{
                    margin: "0 0 0.25rem 0",
                    fontSize: "0.95rem",
                    color: "var(--brand-emerald)",
                    fontWeight: 600,
                  }}
                >
                  Reset Request Dispatched
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    lineHeight: 1.45,
                    color: "var(--text-secondary)",
                  }}
                >
                  {successMessage}
                </p>
                <p
                  style={{
                    margin: "0.6rem 0 0 0",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                  }}
                >
                  (In local development mode, check your backend server console
                  to grab the generated password reset URL).
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setCurrentRoute("login")}
              style={{ padding: "0.85rem" }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: "1.25rem", padding: "0.85rem" }}
              disabled={isSubmitting}
              id="send-reset-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  <span>Processing Request...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setCurrentRoute("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontWeight: 500,
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
