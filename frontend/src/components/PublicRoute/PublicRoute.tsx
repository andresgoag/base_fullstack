import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthContext } from "context/auth/AuthContext";
import { LoadingScreen } from "components/LoadingScreen/LoadingScreen";
import { getRedirectTarget } from "routes";

export const PublicRoute = () => {
  const { session } = useAuthContext();
  const location = useLocation();

  if (session.isRestoring) return <LoadingScreen />;

  if (session.isAuthenticated) {
    return <Navigate to={getRedirectTarget(location.state)} replace />;
  }
  return <Outlet />;
};
