import { useAuthContext } from "context/auth/AuthContext";
import { Navigate, Outlet } from "react-router";

export const ProtectedRoute = () => {
  const { access } = useAuthContext();

  if (!access) {
    return <Navigate to="/auth/login" replace />;
  }
  return <Outlet />;
};
