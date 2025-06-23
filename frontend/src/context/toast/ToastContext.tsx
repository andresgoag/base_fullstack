import type { ToastMessageData } from "models";
import { createContext, useContext } from "react";

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
      "useToastContext must be used within a ToastContextProvider"
    );
  }
  return context;
};
