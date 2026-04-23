import { useAuthContext } from "context/auth/AuthContext";
import { Outlet, Navigate } from "react-router";

export const AuthLayout: React.FC = () => {
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

  if (access) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4 shadow col-12 col-md-8 col-xl-4">
        <Outlet />
      </div>
    </div>
  );
};
