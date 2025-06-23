import { useAuthContext } from "context/auth/AuthContext";
import { Outlet, Navigate } from "react-router";

export const AuthLayout: React.FC = () => {
  const { access } = useAuthContext();

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
