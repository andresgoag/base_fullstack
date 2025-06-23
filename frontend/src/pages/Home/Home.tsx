import { Link } from "react-router";

export const Home: React.FC = () => {
  return (
    <div className="container">
      <div className="row p-3">
        <div className="col-12 d-flex justify-content-end">
          <Link to="/auth/login" className="btn btn-primary me-2">
            Login
          </Link>
          <Link to="/auth/register" className="btn btn-success">
            Register
          </Link>
        </div>
      </div>
      <div className="row p-3">
        <div className="col d-flex flex-column align-items-center">
          <h1>Welcome to the Home Page</h1>
          <p>This is the main page of our application.</p>
        </div>
      </div>
    </div>
  );
};
