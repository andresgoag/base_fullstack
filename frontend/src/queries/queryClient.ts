import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "api/errors";

const MAX_RETRIES = 2;
const DEFAULT_STALE_TIME_MS = 60_000;
const DEFAULT_GARBAGE_COLLECT_TIME_MS = 300_000;

export const shouldRetryRequest = (
  failureCount: number,
  error: Error,
): boolean =>
  failureCount < MAX_RETRIES && error instanceof ApiError && error.isRetryable;

const isReportedGlobally = (error: Error): boolean =>
  !(error instanceof ApiError) || !error.isExpected;

export const createQueryClient = (
  reportError: (error: Error) => void,
): QueryClient =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isReportedGlobally(error)) reportError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isReportedGlobally(error)) reportError(error);
      },
    }),
    defaultOptions: {
      queries: {
        retry: shouldRetryRequest,
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GARBAGE_COLLECT_TIME_MS,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
