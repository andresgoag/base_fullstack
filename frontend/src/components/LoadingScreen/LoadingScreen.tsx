import { useTranslation } from "react-i18next";

type LoadingScreenProps = {
  label?: string;
};

export const LoadingScreen = ({ label }: LoadingScreenProps) => {
  const { t } = useTranslation();

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">{label ?? t("common.loading")}</span>
      </div>
    </div>
  );
};
