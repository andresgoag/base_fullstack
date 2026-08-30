import { useAuthContext } from "context/auth/AuthContext";
import { LoadingScreen } from "components/LoadingScreen/LoadingScreen";
import { Navigate, Outlet, useLocation } from "react-router";
import { ROUTES } from "routes";

export const ProtectedRoute = () => {
  const { session } = useAuthContext();
  const location = useLocation();

  if (session.isRestoring) return <LoadingScreen />;

  if (!session.isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <Outlet />;
};
