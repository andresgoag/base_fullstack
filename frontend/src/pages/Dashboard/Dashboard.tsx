import { useAuthContext } from "context/auth/AuthContext";
import { MainNavbar } from "components/MainNavbar/MainNavbar";
import { EchoChat } from "components/EchoChat/EchoChat";

export const Dashboard = () => {
  const { currentUser } = useAuthContext();

  return (
    <>
      <MainNavbar />
      <div className="container mt-3">
        <h1>Hello {currentUser?.first_name}!</h1>
        <h3>Dashboard</h3>

        <div className="row mt-4">
          <div className="col-md-8 offset-md-2">
            <EchoChat />
          </div>
        </div>
      </div>
    </>
  );
};
