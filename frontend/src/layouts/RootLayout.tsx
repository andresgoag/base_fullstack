import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { AuthContextProvider } from "context/auth/AuthContextProvider";
import { useRouteAnnouncement } from "hooks/useRouteAnnouncement";

export const RootLayout = () => {
  const { t } = useTranslation();
  const { announcementRef } = useRouteAnnouncement();

  return (
    <AuthContextProvider>
      <a className="visually-hidden-focusable" href="#main-content">
        {t("common.skipToContent")}
      </a>
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        className="visually-hidden"
      />
      <Outlet />
    </AuthContextProvider>
  );
};
