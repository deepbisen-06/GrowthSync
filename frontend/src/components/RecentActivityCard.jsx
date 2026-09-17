import React from "react";
import {
  Clock,
  DollarSign,
  BookOpen,
  Activity,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function RecentActivityCard({
  activities = [],
  setCurrentRoute,
  maxItems = 5,
}) {
  const getActivityBadge = (type) => {
    switch (type) {
      case "FINANCIAL_DATA_ADDED":
        return {
          icon: DollarSign,
          color: "#10b981",
          bg: "var(--accent-financial-bg)",
          label: "Finance",
        };
      case "STUDY_DATA_ADDED":
        return {
          icon: BookOpen,
          color: "#3b82f6",
          bg: "var(--accent-study-bg)",
          label: "Study",
        };
      case "HABIT_DATA_ADDED":
        return {
          icon: Activity,
          color: "#8b5cf6",
          bg: "var(--accent-habit-bg)",
          label: "Habit",
        };
      case "PROFILE_UPDATED":
        return {
          icon: User,
          color: "#06b6d4",
          bg: "var(--accent-cyan-bg)",
          label: "Profile",
        };
      case "USER_REGISTERED":
      case "USER_LOGGED_IN":
      default:
        return {
          icon: ShieldCheck,
          color: "#f97316",
          bg: "var(--accent-activity-bg)",
          label: "Auth",
        };
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h2>
            <Clock size={18} className="text-orange-400" />
            <span>Recent Activity</span>
          </h2>
          <p>Live audit trail from PostgreSQL</p>
        </div>

        <button
          onClick={() => setCurrentRoute("activity")}
          className="btn btn-outline btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {displayedActivities.length === 0 ? (
        <div className="growth-empty-state" style={{ padding: "1.5rem 0" }}>
          <div
            className="empty-icon-wrap"
            style={{ width: "40px", height: "40px" }}
          >
            <Clock size={18} />
          </div>
          <div className="empty-state-title" style={{ fontSize: "0.9rem" }}>
            No Activity Recorded
          </div>
          <p className="empty-state-desc" style={{ fontSize: "0.76rem" }}>
            Every data submission and profile change is automatically audited in
            PostgreSQL.
          </p>
        </div>
      ) : (
        <div className="activity-list-container">
          {displayedActivities.map((item) => {
            const badge = getActivityBadge(item.activity_type);
            const Icon = badge.icon;
            return (
              <div key={item.id} className="activity-row-item">
                <div className="activity-left-col">
                  <div
                    className="activity-icon-container"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="activity-info-block">
                    <span className="activity-event-name">
                      {item.activity_description || item.activity_type}
                    </span>
                    <span className="activity-desc-text">
                      Category: {badge.label}
                    </span>
                  </div>
                </div>

                <div className="activity-meta-col">
                  <span className="activity-time-stamp">
                    {formatTimestamp(item.created_at)}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      fontSize: "0.65rem",
                      padding: "0.1rem 0.4rem",
                    }}
                  >
                    <CheckCircle size={10} /> Saved
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
