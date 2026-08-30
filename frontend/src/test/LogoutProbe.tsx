import { useAuthContext } from "context/auth/AuthContext";

export const LogoutProbe = () => {
  const { logout } = useAuthContext();
  return (
    <button type="button" onClick={logout}>
      Sign out
    </button>
  );
};
