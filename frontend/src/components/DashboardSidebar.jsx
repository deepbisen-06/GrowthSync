import React from "react";
import {
  TrendingUp,
  LayoutDashboard,
  DollarSign,
  BookOpen,
  Activity,
  Clock,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Sun,
  Moon,
  X,
} from "lucide-react";

export default function DashboardSidebar({
  currentRoute,
  setCurrentRoute,
  theme,
  toggleTheme,
  mobileOpen,
  setMobileOpen,
  activityCount = 0,
}) {
  const mainNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "forecasting",
      label: "AI Forecasting",
      icon: TrendingUp,
      badge: "AI ML",
    },
    {
      id: "simulation",
      label: "Future Simulator",
      icon: Sparkles,
      badge: "What-If",
    },
    {
      id: "financial",
      label: "Financial Data",
      icon: DollarSign,
      badge: "Finance",
    },
    {
      id: "expenses",
      label: "Expense Categories",
      icon: DollarSign,
      badge: "New",
    },
    { id: "study", label: "Study Records", icon: BookOpen, badge: "Study" },
    { id: "habit", label: "Habit Tracker", icon: Activity, badge: "Habits" },
    {
      id: "activity",
      label: "Activity History",
      icon: Clock,
      count: activityCount,
    },
    { id: "datasets", label: "Reports & Datasets", icon: FileSpreadsheet },
  ];

  const handleNavClick = (id) => {
    setCurrentRoute(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`dashboard-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div
          className="sidebar-brand"
          onClick={() => handleNavClick("dashboard")}
        >
          <div className="brand-icon-wrapper">
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-info">
            <div className="brand-title">
              <span>GrowthSync</span>
              <span className="brand-dot">•</span>
            </div>
            <span className="brand-tagline">Track. Understand. Grow.</span>
          </div>

          {mobileOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen(false);
              }}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div className="sidebar-nav-container">
          <div className="sidebar-section-title">Menu</div>
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentRoute === item.id ||
              (item.id === "activity" && currentRoute === "activity_history");
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
                {item.badge && !item.count && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
                {typeof item.count === "number" && item.count > 0 && (
                  <span className="sidebar-badge">{item.count}</span>
                )}
              </button>
            );
          })}

          <div className="sidebar-section-title">System</div>
          <button
            className={`sidebar-nav-item ${currentRoute === "settings" ? "active" : ""}`}
            onClick={() => handleNavClick("profile_edit")}
          >
            <Settings size={18} className="nav-icon" />
            <span>Settings</span>
          </button>
        </div>

        {/* Motivational Card & Theme Toggle in Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-promo-card">
            <div className="sidebar-promo-title">
              <Sparkles size={14} className="text-emerald-400" />
              <span>Grow better every day!</span>
            </div>
            <p className="sidebar-promo-text">
              Track, analyze and improve your habits and progress seamlessly.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 0.25rem",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              Appearance
            </span>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.3rem 0.65rem",
              }}
              title="Toggle Light/Dark theme"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
