import { Outlet, Navigate } from "react-router";
import { useAuthContext } from "@/context/auth/AuthContext";
import { FullPageSpinner } from "@/components/FullPageSpinner/FullPageSpinner";

export const AuthLayout: React.FC = () => {
  const { session, isInitializing } = useAuthContext();

  if (isInitializing) {
    return <FullPageSpinner />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4 shadow col-12 col-md-8 col-xl-4">
        <Outlet />
      </div>
    </div>
  );
};
