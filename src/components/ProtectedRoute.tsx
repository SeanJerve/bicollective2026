import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireVendor?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireVendor = false,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const { user, loading, isVendor, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-heading text-xl">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireVendor && !isVendor && !isAdmin) {
    return <Navigate to="/vendor/store" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
