import { useSyncExternalStore } from "react";
import { getSession, subscribeToSession } from "@/auth/session";

export const useSession = () =>
  useSyncExternalStore(subscribeToSession, getSession);
