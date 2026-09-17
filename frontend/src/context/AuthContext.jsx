import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verify authentication session via httpOnly cookie on load
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/auth/me");
      setUser(res.data);
      setAuthError(null);
      return res.data;
    } catch {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("growthsync_token");
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for 401 unauthorized events from any protected dashboard endpoint
  useEffect(() => {
    const handleUnauthorized = (event) => {
      const msg =
        event?.detail?.message || "Session expired. Please log in again.";
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("growthsync_token");
      }
      setUser(null);
      setAuthError(msg);
    };

    window.addEventListener("growthsync:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("growthsync:unauthorized", handleUnauthorized);
  }, []);

  const register = async (formData) => {
    setAuthError(null);
    const res = await api.post("/api/auth/register", formData);
    return res.data;
  };

  const login = async (email, password) => {
    setAuthError(null);
    const res = await api.post("/api/auth/login", { email, password });

    // Store token fallback if provided
    if (res.data.access_token && typeof window !== "undefined") {
      sessionStorage.setItem("growthsync_token", res.data.access_token);
    }

    // Verify /api/auth/me immediately to confirm session cookie is active
    try {
      const meRes = await api.get("/api/auth/me");
      setUser(meRes.data);
    } catch {
      // Fall back to login response user data
      setUser(res.data.user);
    }

    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("growthsync_token");
      }
      setUser(null);
      setAuthError(null);
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.put("/api/users/profile", profileData);
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        setAuthError,
        register,
        login,
        logout,
        updateProfile,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
