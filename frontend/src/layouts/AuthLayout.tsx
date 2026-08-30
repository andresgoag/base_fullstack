import { Outlet } from "react-router";

export const AuthLayout = () => (
  <main
    id="main-content"
    tabIndex={-1}
    className="container d-flex align-items-center justify-content-center min-vh-100"
  >
    <div className="card p-4 shadow col-12 col-md-8 col-xl-4">
      <Outlet />
    </div>
  </main>
);
