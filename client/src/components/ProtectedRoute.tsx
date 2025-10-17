import { Navigate } from "react-router-dom";
import authService from "../services/authService.ts";
import { JSX } from "react";

interface ProtectedRouteProps {
  element: JSX.Element;
  requireAdmin?: boolean;
}

function ProtectedRoute({ element, requireAdmin = false }: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUserInfo();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return element;
}

export default ProtectedRoute;
