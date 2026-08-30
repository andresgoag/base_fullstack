import { Outlet } from "react-router";
import { MainNavbar } from "components/MainNavbar/MainNavbar";

export const AppLayout = () => (
  <>
    <MainNavbar />
    <main id="main-content" tabIndex={-1}>
      <Outlet />
    </main>
  </>
);
