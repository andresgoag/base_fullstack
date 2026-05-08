import { useAuthContext } from "context/auth/AuthContext";
import { Navigate, Outlet } from "react-router";

export const ProtectedRoute = () => {
  const { access, isInitializing } = useAuthContext();

  if (isInitializing) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!access) {
    return <Navigate to="/auth/login" replace />;
  }
  return <Outlet />;
};
