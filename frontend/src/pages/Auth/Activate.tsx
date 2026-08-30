import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useActivateAccount } from "queries/users";
import { LoadingScreen } from "components/LoadingScreen/LoadingScreen";
import { ROUTES } from "routes";

export const ActivateAccount = () => {
  const { t } = useTranslation();
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const hasRequestedActivation = useRef(false);
  const { mutate, isPending, isSuccess, isError, error } = useActivateAccount();

  useEffect(() => {
    if (!uid || !token || hasRequestedActivation.current) return;
    hasRequestedActivation.current = true;
    mutate({ uid, token });
  }, [uid, token, mutate]);

  if (!uid || !token) {
    return (
      <>
        <h1 className="h3 mb-3 text-center">
          {t("auth.activate.invalidLink")}
        </h1>
        <div className="d-flex justify-content-center">
          <Link to={ROUTES.resendActivation}>
            {t("auth.activate.requestNewLink")}
          </Link>
        </div>
      </>
    );
  }

  if (isPending) return <LoadingScreen label={t("auth.activate.working")} />;

  if (isSuccess) {
    return (
      <>
        <h1 className="h3 mb-3 text-center">{t("auth.activate.done")}</h1>
        <p className="text-muted text-center">
          {t("auth.activate.doneDetail")}
        </p>
        <div className="d-flex justify-content-center">
          <Link to={ROUTES.login} className="btn btn-primary">
            {t("auth.activate.goToLogin")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="h3 mb-3 text-center">{t("auth.activate.failed")}</h1>
      {isError && (
        <div className="alert alert-danger" role="alert">
          {error.message}
        </div>
      )}
      <div className="d-flex justify-content-center">
        <Link to={ROUTES.resendActivation}>
          {t("auth.activate.requestNewLink")}
        </Link>
      </div>
    </>
  );
};
