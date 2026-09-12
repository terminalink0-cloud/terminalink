import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  // CHANGED: sessionStorage, to match AuthContext.tsx. The token is
  // now stored per-tab instead of shared across the whole browser,
  // so it has to be read from the same place it's written.
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
