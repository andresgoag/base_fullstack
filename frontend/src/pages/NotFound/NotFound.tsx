import { Link } from "react-router";

export const NotFound: React.FC = () => (
  <div className="container d-flex align-items-center justify-content-center min-vh-100">
    <div className="text-center">
      <h1 className="display-5">404</h1>
      <p className="text-muted">This page does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Go home
      </Link>
    </div>
  </div>
);
