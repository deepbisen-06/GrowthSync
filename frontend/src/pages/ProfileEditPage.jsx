import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";
import { User, Save, ArrowLeft } from "lucide-react";

export default function ProfileEditPage({ setCurrentRoute }) {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    age: user?.age || "",
    gender: user?.gender || "",
    education_level: user?.education_level || "",
    course: user?.course || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    setIsSubmitting(true);
    try {
      await updateProfile({
        ...formData,
        age: parseInt(formData.age, 10),
      });
      setSuccess(
        "Profile updated successfully! Change recorded in PostgreSQL activity history.",
      );
    } catch (err) {
      setError(err.formattedMessage || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <button
        onClick={() => setCurrentRoute("dashboard")}
        className="btn btn-secondary"
        style={{
          marginBottom: "1.25rem",
          padding: "0.45rem 0.85rem",
          fontSize: "0.85rem",
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            <User size={20} className="text-blue-400" />
            <span>Edit Profile Information</span>
          </h1>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-fullname">
              Full Name
            </label>
            <input
              id="edit-fullname"
              name="full_name"
              type="text"
              className="form-control"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-age">
                Age
              </label>
              <input
                id="edit-age"
                name="age"
                type="number"
                min="13"
                max="120"
                className="form-control"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-gender">
                Gender
              </label>
              <select
                id="edit-gender"
                name="gender"
                className="form-control"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-education">
                Education Level
              </label>
              <select
                id="edit-education"
                name="education_level"
                className="form-control"
                value={formData.education_level}
                onChange={handleChange}
                required
              >
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
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-course">
                Course / Branch
              </label>
              <input
                id="edit-course"
                name="course"
                type="text"
                className="form-control"
                value={formData.course}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div
            style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Profile Updates</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCurrentRoute("dashboard")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
