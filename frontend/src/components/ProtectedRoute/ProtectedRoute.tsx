import { Navigate, Outlet } from "react-router";
import { useAuthContext } from "@/context/auth/AuthContext";
import { FullPageSpinner } from "@/components/FullPageSpinner/FullPageSpinner";

export const ProtectedRoute = () => {
  const { session, isInitializing } = useAuthContext();

  if (isInitializing) {
    return <FullPageSpinner />;
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }
  return <Outlet />;
};
