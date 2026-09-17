import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardSidebar from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import FinancialPage from "./pages/FinancialPage";
import StudyPage from "./pages/StudyPage";
import HabitPage from "./pages/HabitPage";
import DatasetsPage from "./pages/DatasetsPage";
import ActivityHistoryPage from "./pages/ActivityHistoryPage";
import ForecastingPage from "./pages/ForecastingPage";
import SimulatorPage from "./pages/SimulatorPage";
import ExpensesPage from "./pages/ExpensesPage";

const PUBLIC_ROUTES = [
  "register",
  "login",
  "forgot_password",
  "reset_password",
];

function AppContent() {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(() => {
    // Check initial URL pathname or search params
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (path === "/reset-password" || searchParams.has("token")) {
      return "reset_password";
    }
    if (path === "/forgot-password") {
      return "forgot_password";
    }
    return "register";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Theme Management (Light / Dark) with persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("growthsync_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("growthsync_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Route protection and redirection
  useEffect(() => {
    if (!loading) {
      if (user && PUBLIC_ROUTES.includes(currentRoute)) {
        setCurrentRoute("dashboard");
      } else if (!user && !PUBLIC_ROUTES.includes(currentRoute)) {
        setCurrentRoute("login");
      }
    }
  }, [user, loading, currentRoute]);

  const renderPage = () => {
    switch (currentRoute) {
      case "register":
        return <RegisterPage setCurrentRoute={setCurrentRoute} />;
      case "login":
        return <LoginPage setCurrentRoute={setCurrentRoute} />;
      case "forgot_password":
        return <ForgotPasswordPage setCurrentRoute={setCurrentRoute} />;
      case "reset_password":
        return <ResetPasswordPage setCurrentRoute={setCurrentRoute} />;
      case "dashboard":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <DashboardPage setCurrentRoute={setCurrentRoute} />
          </ProtectedRoute>
        );
      case "forecasting":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <ForecastingPage setCurrentRoute={setCurrentRoute} />
          </ProtectedRoute>
        );
      case "simulation":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <SimulatorPage setCurrentRoute={setCurrentRoute} />
          </ProtectedRoute>
        );
      case "expenses":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <div className="dashboard-content">
              <ExpensesPage setCurrentRoute={setCurrentRoute} />
            </div>
          </ProtectedRoute>
        );
      case "profile_edit":
      case "settings":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <div className="dashboard-content">
              <ProfileEditPage setCurrentRoute={setCurrentRoute} />
            </div>
          </ProtectedRoute>
        );
      case "financial":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <div className="dashboard-content">
              <FinancialPage setCurrentRoute={setCurrentRoute} />
            </div>
          </ProtectedRoute>
        );
      case "study":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <div className="dashboard-content">
              <StudyPage setCurrentRoute={setCurrentRoute} />
            </div>
          </ProtectedRoute>
        );
      case "habit":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <div className="dashboard-content">
              <HabitPage setCurrentRoute={setCurrentRoute} />
            </div>
          </ProtectedRoute>
        );
      case "activity":
      case "activity_history":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <div className="dashboard-content">
              <ActivityHistoryPage setCurrentRoute={setCurrentRoute} />
            </div>
          </ProtectedRoute>
        );
      case "datasets":
        return (
          <ProtectedRoute setCurrentRoute={setCurrentRoute}>
            <div className="dashboard-content">
              <DatasetsPage setCurrentRoute={setCurrentRoute} />
            </div>
          </ProtectedRoute>
        );
      default:
        return <RegisterPage setCurrentRoute={setCurrentRoute} />;
    }
  };

  // Public unauthenticated view (Login/Register/Forgot/Reset)
  if (!user && PUBLIC_ROUTES.includes(currentRoute)) {
    return (
      <div className="app-layout" style={{ justifyContent: "center" }}>
        <main style={{ width: "100%", maxWidth: "600px", padding: "1.5rem" }}>
          {renderPage()}
        </main>
      </div>
    );
  }

  // Authenticated GrowthSync Layout (Sidebar + Header + Content)
  return (
    <div className="app-layout">
      <DashboardSidebar
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        theme={theme}
        toggleTheme={toggleTheme}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="app-main-wrapper">
        <DashboardHeader
          setMobileOpen={setMobileOpen}
          theme={theme}
          toggleTheme={toggleTheme}
          setCurrentRoute={setCurrentRoute}
          notifications={[
            {
              title: "GrowthSync",
              text: "Track finances, study sessions and daily habits",
            },
            {
              title: "GrowthSync Tip",
              text: "Log daily habits to see performance curves",
            },
          ]}
        />

        <main style={{ flex: 1 }}>{renderPage()}</main>

        <footer
          style={{
            borderTop: "1px solid var(--border-color)",
            padding: "1.25rem 1.75rem",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            marginTop: "auto",
          }}
        >
          <p>
            GrowthSync &bull; "Track. Understand. Grow." &bull; Infosys
            Springboard Internship Project
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
