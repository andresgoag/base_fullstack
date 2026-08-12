import { useState, useCallback, useRef, useMemo } from "react";
import { ToastContext } from "./ToastContext";
import type { ShowToastData, ToastMessageData } from "./ToastContext";
import { ToastMessage } from "@/components/ToastMessage/ToastMessage";

const DEFAULT_TOAST_DURATION_MS = 4000;

type ContextProps = {
  children: React.ReactNode;
};

export const ToastContextProvider = ({ children }: ContextProps) => {
  const [toasts, setToasts] = useState<ToastMessageData[]>([]);
  const nextId = useRef(1);

  const removeToast = useCallback((toast: ToastMessageData) => {
    setToasts((previous) =>
      previous.filter((candidate) => candidate.id !== toast.id),
    );
  }, []);

  const showToast = useCallback(
    (toastData: ShowToastData) => {
      const toast = { ...toastData, id: nextId.current++ };
      setToasts((previous) => [...previous, toast]);
      setTimeout(() => {
        removeToast(toast);
      }, toast.duration ?? DEFAULT_TOAST_DURATION_MS);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
