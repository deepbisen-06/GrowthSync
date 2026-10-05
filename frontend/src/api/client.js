import axios from "axios";

// Dynamically match the current browser hostname (127.0.0.1 or localhost)
// to prevent cross-site cookie blocking between 127.0.0.1 and localhost
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD && typeof window !== "undefined") {
    return window.location.origin; // Same-origin reverse proxy in the deployment package.
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000`;
  }
  return "http://localhost:8000";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // Crucial for httpOnly cookie authentication
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach bearer token fallback if available in session
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("growthsync_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for clear error message extraction and 401 unauthorized handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "An unexpected error occurred. Please try again.";
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg || d.message).join("; ");
      } else if (data.message) {
        message = data.message;
      }
    } else if (error.message) {
      message = error.message;
    }
    error.formattedMessage = message;

    // Detect 401 Unauthorized from protected routes (excluding login/register attempts)
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || "";
      if (
        !requestUrl.includes("/api/auth/login") &&
        !requestUrl.includes("/api/auth/register")
      ) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("growthsync_token");
          window.dispatchEvent(
            new CustomEvent("growthsync:unauthorized", {
              detail: { message: error.formattedMessage },
            }),
          );
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
