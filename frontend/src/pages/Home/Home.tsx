import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ROUTES } from "routes";

export const Home = () => {
  const { t } = useTranslation();

  return (
    <main id="main-content" tabIndex={-1} className="container">
      <div className="row p-3">
        <div className="col-12 d-flex justify-content-end">
          <Link to={ROUTES.login} className="btn btn-primary me-2">
            {t("home.login")}
          </Link>
          <Link to={ROUTES.register} className="btn btn-success">
            {t("home.register")}
          </Link>
        </div>
      </div>
      <div className="row p-3">
        <div className="col d-flex flex-column align-items-center">
          <h1>{t("home.heading")}</h1>
          <p>{t("home.intro")}</p>
        </div>
      </div>
    </main>
  );
};
