import { isRouteErrorResponse, useRouteError } from "react-router";
import { useTranslation } from "react-i18next";
import { ROUTES } from "routes";

export const RouteError = () => {
  const { t } = useTranslation();
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${String(error.status)} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t("routeError.unexpected");

  return (
    <main
      id="main-content"
      tabIndex={-1}
      role="alert"
      className="container d-flex flex-column align-items-center justify-content-center min-vh-100 text-center"
    >
      <h1 className="display-5">{t("routeError.heading")}</h1>
      <p className="lead">{message}</p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          window.location.assign(ROUTES.dashboard);
        }}
      >
        {t("routeError.reload")}
      </button>
    </main>
  );
};
