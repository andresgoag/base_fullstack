import { useEffect, useRef } from "react";
import { useLocation, useMatches } from "react-router";
import { useTranslation } from "react-i18next";

type RouteHandle = { titleKey?: string };

const getTitleKey = (handle: unknown): string | undefined =>
  typeof handle === "object" && handle !== null && "titleKey" in handle
    ? (handle as RouteHandle).titleKey
    : undefined;

export const useRouteAnnouncement = () => {
  const matches = useMatches();
  const location = useLocation();
  const { t } = useTranslation();
  const announcementRef = useRef<HTMLDivElement>(null);
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    const titleKeys = matches
      .map((match) => getTitleKey(match.handle))
      .filter((titleKey): titleKey is string => titleKey !== undefined);
    const currentKey = titleKeys.at(-1);
    const applicationName = t("app.name");
    const pageTitle = currentKey === undefined ? null : t(currentKey);
    document.title =
      pageTitle === null
        ? applicationName
        : `${pageTitle} · ${applicationName}`;

    const hasNavigated =
      previousPathname.current !== null &&
      previousPathname.current !== location.pathname;
    previousPathname.current = location.pathname;
    if (!hasNavigated) return;

    if (announcementRef.current) {
      announcementRef.current.textContent = pageTitle ?? applicationName;
    }
    document.getElementById("main-content")?.focus();
  }, [matches, location.pathname, t]);

  return { announcementRef };
};
