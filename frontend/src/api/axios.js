// File: src/api/axios.js
import axios from "axios";
import useAuthStore from "../store/authStore";


const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await api.post("/auth/refresh");
        const { token, user } = response.data;

        useAuthStore.getState().setAuth(user, token);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
