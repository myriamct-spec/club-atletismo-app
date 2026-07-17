import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-navy-800">
        Cargando…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-navy-800">
        Cargando…
      </div>
    );
  }

  if (usuario?.rol !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
