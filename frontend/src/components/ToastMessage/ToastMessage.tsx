import { Toast } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { ToastMessageData } from "context/toast/ToastContext";

type ToastMessageProps = {
  toast: ToastMessageData;
  onClose: (toast: ToastMessageData) => void;
};

export const ToastMessage = ({ toast, onClose }: ToastMessageProps) => {
  const { t } = useTranslation();

  return (
    <Toast
      onClose={() => {
        onClose(toast);
      }}
      className="m-3"
      role={toast.type === "danger" ? "alert" : "status"}
      aria-live={toast.type === "danger" ? "assertive" : "polite"}
    >
      <Toast.Header closeLabel={t("common.close")}>
        <div className={`p-2 rounded me-2 bg-${toast.type}`} />
        <strong className="me-auto">
          {toast.title ?? t(`toast.${toast.type}`)}
        </strong>
      </Toast.Header>
      <Toast.Body>{toast.message}</Toast.Body>
    </Toast>
  );
};
