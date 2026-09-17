import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { validateRegistrationForm } from "../utils/validation";
import Alert from "../components/Alert";
import {
  TrendingUp,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  UserPlus,
} from "lucide-react";

export default function RegisterPage({ setCurrentRoute }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    age: "",
    gender: "",
    education_level: "",
    course: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password checklist
  const passwordCriteria = {
    length: formData.password.length >= 8,
    hasLetter: /[A-Za-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    matches:
      formData.password.length > 0 &&
      formData.password === formData.confirm_password,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverError) setServerError("");
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const { errors: validationErrors } = validateRegistrationForm(formData);
    if (validationErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    // Validate entire form
    const { isValid, errors: validationErrors } =
      validateRegistrationForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      setTouched({
        full_name: true,
        email: true,
        password: true,
        confirm_password: true,
        age: true,
        gender: true,
        education_level: true,
        course: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
      };
      await register(payload);
      setSuccessMessage(
        "Account created successfully in PostgreSQL! Redirecting to login...",
      );
      setTimeout(() => {
        setCurrentRoute("login");
      }, 1800);
    } catch (err) {
      setServerError(
        err.formattedMessage ||
          "Registration failed. Please check the provided information.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
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
          <h1 className="auth-title">Join GrowthSync</h1>
          <p className="auth-subtitle">
            "Track. Understand. Grow." &bull; Create your personal profile
          </p>
        </div>

        {serverError && (
          <Alert
            type="error"
            message={serverError}
            onClose={() => setServerError("")}
          />
        )}
        {successMessage && <Alert type="success" message={successMessage} />}

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Full Name & Email */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="full_name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className={`form-control ${touched.full_name && errors.full_name ? "is-invalid" : ""}`}
                placeholder="e.g. Jane Doe"
                value={formData.full_name}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
              {touched.full_name && errors.full_name && (
                <div className="form-error">
                  <X size={14} /> {errors.full_name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-control ${touched.email && errors.email ? "is-invalid" : ""}`}
                placeholder="e.g. jane@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
              {touched.email && errors.email && (
                <div className="form-error">
                  <X size={14} /> {errors.email}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`form-control ${touched.password && errors.password ? "is-invalid" : ""}`}
                placeholder="Min 8 chars, 1 letter, 1 number"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
              {touched.password && errors.password && (
                <div className="form-error">
                  <X size={14} /> {errors.password}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm_password">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                className={`form-control ${touched.confirm_password && errors.confirm_password ? "is-invalid" : ""}`}
                placeholder="Re-enter password"
                value={formData.confirm_password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
              {touched.confirm_password && errors.confirm_password && (
                <div className="form-error">
                  <X size={14} /> {errors.confirm_password}
                </div>
              )}
            </div>
          </div>

          {/* Real-time Password Requirements Checklist */}
          {formData.password && (
            <div
              className="password-requirements"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem 0.95rem",
                marginBottom: "1.25rem",
                fontSize: "0.78rem",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.3rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <ShieldCheck size={14} /> Security Requirements:
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: passwordCriteria.length
                    ? "var(--brand-emerald)"
                    : "var(--text-muted)",
                  marginBottom: "0.2rem",
                }}
              >
                {passwordCriteria.length ? (
                  <Check size={13} />
                ) : (
                  <X size={13} />
                )}{" "}
                At least 8 characters
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: passwordCriteria.hasLetter
                    ? "var(--brand-emerald)"
                    : "var(--text-muted)",
                  marginBottom: "0.2rem",
                }}
              >
                {passwordCriteria.hasLetter ? (
                  <Check size={13} />
                ) : (
                  <X size={13} />
                )}{" "}
                At least 1 letter (A-Z, a-z)
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: passwordCriteria.hasNumber
                    ? "var(--brand-emerald)"
                    : "var(--text-muted)",
                  marginBottom: "0.2rem",
                }}
              >
                {passwordCriteria.hasNumber ? (
                  <Check size={13} />
                ) : (
                  <X size={13} />
                )}{" "}
                At least 1 number (0-9)
              </div>
              {formData.confirm_password && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: passwordCriteria.matches
                      ? "var(--brand-emerald)"
                      : "var(--text-muted)",
                  }}
                >
                  {passwordCriteria.matches ? (
                    <Check size={13} />
                  ) : (
                    <X size={13} />
                  )}{" "}
                  Passwords match
                </div>
              )}
            </div>
          )}

          {/* Row 3: Age & Gender */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="age">
                Age <span className="required">*</span>
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min="13"
                max="120"
                className={`form-control ${touched.age && errors.age ? "is-invalid" : ""}`}
                placeholder="e.g. 21"
                value={formData.age}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
              {touched.age && errors.age && (
                <div className="form-error">
                  <X size={14} /> {errors.age}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="gender">
                Gender <span className="required">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                className={`form-control ${touched.gender && errors.gender ? "is-invalid" : ""}`}
                value={formData.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {touched.gender && errors.gender && (
                <div className="form-error">
                  <X size={14} /> {errors.gender}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Education Level & Course / Branch */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="education_level">
                Education Level <span className="required">*</span>
              </label>
              <select
                id="education_level"
                name="education_level"
                className={`form-control ${touched.education_level && errors.education_level ? "is-invalid" : ""}`}
                value={formData.education_level}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              >
                <option value="">Select Education Level</option>
                <option value="High School">High School</option>
                <option value="Undergraduate">
                  Undergraduate (B.Tech / B.E. / B.Sc / BCA)
                </option>
                <option value="Postgraduate">
                  Postgraduate (M.Tech / M.E. / M.Sc / MCA)
                </option>
                <option value="Doctorate / PhD">Doctorate / PhD</option>
                <option value="Other">Other</option>
              </select>
              {touched.education_level && errors.education_level && (
                <div className="form-error">
                  <X size={14} /> {errors.education_level}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="course">
                Course / Branch <span className="required">*</span>
              </label>
              <input
                id="course"
                name="course"
                type="text"
                className={`form-control ${touched.course && errors.course ? "is-invalid" : ""}`}
                placeholder="e.g. Computer Science & Eng."
                value={formData.course}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                required
              />
              {touched.course && errors.course && (
                <div className="form-error">
                  <X size={14} /> {errors.course}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: "1rem", padding: "0.85rem" }}
            disabled={isSubmitting}
            id="register-submit-btn"
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                <span>Creating Account in PostgreSQL...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Complete Registration</span>
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
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => setCurrentRoute("login")}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-emerald)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Log in here{" "}
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
