import { createContext, useContext } from "react";

export type ToastMessageData = {
  id: number;
  message: string;
  type: "success" | "danger" | "secondary" | "warning";
  title?: string;
  duration?: number;
};

export type ShowToastData = Omit<ToastMessageData, "id">;

export type ToastContextObject = {
  showToast: (toastData: ShowToastData) => void;
};

export const ToastContext = createContext<ToastContextObject>({
  showToast: () => {},
});

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(
      "useToastContext must be used within a ToastContextProvider",
    );
  }
  return context;
};
