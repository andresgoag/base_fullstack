import { useAuthContext } from "@/context/auth/AuthContext";
import { MainNavbar } from "@/components/MainNavbar/MainNavbar";

export const Dashboard = () => {
  const { currentUser, isLoadingUser } = useAuthContext();

  return (
    <>
      <MainNavbar />
      <div className="container mt-3">
        <h1>
          {isLoadingUser ? "Hello!" : `Hello ${currentUser?.first_name}!`}
        </h1>
        <h3>Dashboard</h3>
      </div>
    </>
  );
};
