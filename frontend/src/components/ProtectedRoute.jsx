// File: src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
