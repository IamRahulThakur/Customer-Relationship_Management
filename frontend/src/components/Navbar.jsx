// File: src/components/Navbar.jsx
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Navbar({ onMenuClick }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.log("Logout failed:", err);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden mr-3 p-1 rounded-md hover:bg-gray-700"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="font-bold text-sm md:text-base">
          Welcome, {user?.name || "User"}!
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-xs md:text-sm bg-gray-700 px-2 py-1 rounded">
          Role: {user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm md:text-base"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
