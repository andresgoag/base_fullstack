import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useToastContext } from "context/toast/ToastContext";
import { createQueryClient } from "queries/queryClient";

type QueryProviderProps = {
  children: React.ReactNode;
};

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const { showToast } = useToastContext();
  const [queryClient] = useState(() =>
    createQueryClient((error) => {
      showToast({ message: error.message, type: "danger" });
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
