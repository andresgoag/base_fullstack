import { Toast } from "react-bootstrap";
import type { ToastMessageData } from "models";

type ToastMessageProps = {
  toast: ToastMessageData;
  onClose: (toast: ToastMessageData) => void;
};

export function ToastMessage({ toast, onClose }: ToastMessageProps) {
  return (
    <Toast onClose={() => onClose(toast)} className="m-3">
      <Toast.Header>
        <div className={`p-2 rounded me-2 bg-${toast.type}`}></div>
        <strong className="me-auto">{toast.title}</strong>
      </Toast.Header>
      <Toast.Body>{toast.message}</Toast.Body>
    </Toast>
  );
}
