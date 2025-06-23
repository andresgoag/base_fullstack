import { useState, useCallback } from "react";
import { ToastContext } from "./ToastContext";
import type { ShowToastData } from "./ToastContext";
import type { ToastMessageData } from "models";
import { ToastMessage } from "components/ToastMessage/ToastMessage";

type ContextProps = {
  children: React.ReactNode;
};

const getNextToastId = (() => {
  let id = 1;
  return () => id++;
})();

export const ToastContextProvider = ({ children }: ContextProps) => {
  const [toasts, setToasts] = useState<ToastMessageData[]>([]);

  const removeToast = useCallback((toast: ToastMessageData) => {
    setToasts(prev => prev.filter(t => t.id !== toast.id));
  }, []);

  const showToast = useCallback(
    (toastData: ShowToastData) => {
      const toast = { ...toastData, id: getNextToastId() };
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        removeToast(toast);
      }, toast.duration || 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3">
        {toasts.map(toast => (
          <ToastMessage key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
