import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export default function DashboardHeader({
  setMobileOpen,
  theme,
  toggleTheme,
  setCurrentRoute,
  notifications = [],
}) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "GS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="dashboard-header">
      {/* Left: Mobile Toggle & Search */}
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search for anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="header-right">
        {/* Theme Toggle Icon */}
        <button
          onClick={toggleTheme}
          className="header-action-btn"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            className="header-action-btn"
            title="Notifications"
          >
            <Bell size={17} />
            {notifications.length > 0 && <span className="notification-dot" />}
          </button>

          {notifOpen && (
            <div
              className="profile-dropdown-menu"
              style={{ width: "280px", right: 0, padding: "0.75rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                  paddingBottom: "0.4rem",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  Notifications
                </span>
                <span
                  className="badge badge-emerald"
                  style={{ fontSize: "0.68rem" }}
                >
                  {notifications.length} New
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {notifications.length > 0 ? (
                  notifications.map((n, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: "0.78rem",
                        padding: "0.45rem",
                        borderRadius: "6px",
                        background: "var(--bg-surface)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.72rem",
                        }}
                      >
                        {n.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      textAlign: "center",
                      padding: "0.75rem 0",
                    }}
                  >
                    All notifications caught up!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-divider" />

        {/* User Profile Menu */}
        <div style={{ position: "relative" }} ref={profileRef}>
          <div
            className="user-profile-menu"
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <div className="user-avatar-circle">
              {getInitials(user?.full_name)}
            </div>
            <div className="user-header-details">
              <span className="user-header-name">
                {user?.full_name?.split(" ")[0] || "User"}
              </span>
              <span className="user-header-role">Growth Member</span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          </div>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="profile-dropdown-menu">
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "0.25rem",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {user?.full_name}
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.email}
                </div>
              </div>

              <button
                className="dropdown-item"
                onClick={() => {
                  setCurrentRoute("profile_edit");
                  setProfileOpen(false);
                }}
              >
                <User size={15} />
                <span>My Profile</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setCurrentRoute("datasets");
                  setProfileOpen(false);
                }}
              >
                <ShieldCheck size={15} />
                <span>Datasets & Reports</span>
              </button>

              <div
                style={{
                  height: "1px",
                  background: "var(--border-subtle)",
                  margin: "0.2rem 0",
                }}
              />

              <button
                className="dropdown-item danger"
                onClick={async () => {
                  setProfileOpen(false);
                  await logout();
                  setCurrentRoute("login");
                }}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
