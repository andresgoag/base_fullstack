import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ToastContext } from "./ToastContext";
import type { ShowToastData, ToastMessageData } from "./ToastContext";
import { ToastMessage } from "components/ToastMessage/ToastMessage";

type ContextProps = {
  children: React.ReactNode;
};

const DEFAULT_TOAST_DURATION_MS = 6000;

export const ToastContextProvider = ({ children }: ContextProps) => {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastMessageData[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());
  const isPaused = useRef(false);
  const remaining = useRef(new Map<number, number>());
  const startedAt = useRef(new Map<number, number>());

  const removeToast = useCallback((toast: ToastMessageData) => {
    const timer = timers.current.get(toast.id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(toast.id);
    remaining.current.delete(toast.id);
    startedAt.current.delete(toast.id);
    setToasts((current) => current.filter((kept) => kept.id !== toast.id));
  }, []);

  const scheduleRemoval = useCallback(
    (toast: ToastMessageData, delay: number) => {
      startedAt.current.set(toast.id, performance.now());
      remaining.current.set(toast.id, delay);
      timers.current.set(
        toast.id,
        window.setTimeout(() => {
          removeToast(toast);
        }, delay),
      );
    },
    [removeToast],
  );

  const showToast = useCallback(
    (toastData: ShowToastData) => {
      const toast = { ...toastData, id: nextId.current++ };
      setToasts((current) => [...current, toast]);
      if (!isPaused.current) {
        scheduleRemoval(toast, toast.duration ?? DEFAULT_TOAST_DURATION_MS);
      }
    },
    [scheduleRemoval],
  );

  const pauseDismissal = useCallback(() => {
    isPaused.current = true;
    timers.current.forEach((timer, id) => {
      window.clearTimeout(timer);
      const started = startedAt.current.get(id) ?? performance.now();
      const left =
        (remaining.current.get(id) ?? 0) - (performance.now() - started);
      remaining.current.set(id, Math.max(left, 0));
    });
    timers.current.clear();
  }, []);

  const resumeDismissal = useCallback(() => {
    isPaused.current = false;
    toasts.forEach((toast) => {
      if (timers.current.has(toast.id)) return;
      scheduleRemoval(
        toast,
        remaining.current.get(toast.id) ?? DEFAULT_TOAST_DURATION_MS,
      );
    });
  }, [toasts, scheduleRemoval]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="toast-container position-fixed bottom-0 end-0 p-3"
        role="region"
        aria-label={t("common.notifications")}
        onMouseEnter={pauseDismissal}
        onMouseLeave={resumeDismissal}
        onFocus={pauseDismissal}
        onBlur={resumeDismissal}
      >
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
