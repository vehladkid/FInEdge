import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Renders child routes only for a signed-in user; others are sent to /login and
// returned to the page they asked for afterwards.
export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-slate-400" role="status">
        Loading…
      </div>
    );
  }
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
