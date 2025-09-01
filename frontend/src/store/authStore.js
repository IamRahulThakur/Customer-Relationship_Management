// File: src/store/authStore.js
import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,
  setAuth: (user, token) => set({ user, token, loading: false }),
  clearAuth: () => set({ user: null, token: null, loading: false }),
  setLoading: (value) => set({ loading: value }),
}));

export default useAuthStore;