import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";
import { LogIn, TrendingUp, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage({ setCurrentRoute }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      setCurrentRoute("dashboard");
    } catch (err) {
      setError(
        err.formattedMessage ||
          "Invalid credentials. Please verify your email and password.",
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
            <TrendingUp size={28} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">Welcome to GrowthSync</h1>
          <p className="auth-subtitle">
            "Track. Understand. Grow." &bull; Sign in to your dashboard
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <label
                className="form-label"
                htmlFor="login-password"
                style={{ marginBottom: 0 }}
              >
                Password
              </label>
              <button
                type="button"
                id="forgot-password-link-btn"
                onClick={() => setCurrentRoute("forgot_password")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand-emerald)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingRight: "2.5rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                  justifyContent: "center",
                  padding: "4px",
                }}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: "1.25rem", padding: "0.85rem" }}
            disabled={isSubmitting}
            id="login-submit-btn"
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                <span>Authenticating with PostgreSQL...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
          }}
        >
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => setCurrentRoute("register")}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-emerald)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create an account{" "}
            <ArrowRight
              size={14}
              style={{ display: "inline", verticalAlign: "middle" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
