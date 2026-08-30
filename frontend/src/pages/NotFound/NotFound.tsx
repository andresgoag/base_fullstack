import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "context/auth/AuthContext";
import { MainNavbar } from "components/MainNavbar/MainNavbar";
import { ROUTES } from "routes";

export const NotFound = () => {
  const { t } = useTranslation();
  const { session } = useAuthContext();

  return (
    <>
      {session.isAuthenticated && <MainNavbar />}
      <main
        id="main-content"
        tabIndex={-1}
        className="container d-flex flex-column align-items-center justify-content-center py-5 text-center"
      >
        <h1 className="display-1">{t("notFound.code")}</h1>
        <p className="lead">{t("notFound.detail")}</p>
        <Link
          to={session.isAuthenticated ? ROUTES.dashboard : ROUTES.home}
          className="btn btn-primary"
        >
          {session.isAuthenticated
            ? t("common.backToDashboard")
            : t("common.backToHome")}
        </Link>
      </main>
    </>
  );
};
