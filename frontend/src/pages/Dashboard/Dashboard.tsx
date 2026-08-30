import { useTranslation } from "react-i18next";
import { useAuthContext } from "context/auth/AuthContext";

export const Dashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuthContext();

  return (
    <div className="container mt-3">
      {currentUser.isLoading ? (
        <div className="placeholder-glow" role="status">
          <span className="visually-hidden">
            {t("dashboard.loadingGreeting")}
          </span>
          <span className="placeholder col-4" />
        </div>
      ) : (
        <h1>
          {t("dashboard.greeting", { name: currentUser.user?.first_name })}
        </h1>
      )}
      <h2>{t("dashboard.heading")}</h2>
    </div>
  );
};
