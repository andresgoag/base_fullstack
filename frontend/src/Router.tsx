import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { RootLayout } from "layouts/RootLayout";
import { AppLayout } from "layouts/AppLayout";
import { AuthLayout } from "layouts/AuthLayout";
import { PublicRoute } from "components/PublicRoute/PublicRoute";
import { ProtectedRoute } from "components/ProtectedRoute/ProtectedRoute";
import { RouteError } from "components/RouteError/RouteError";
import { LoadingScreen } from "components/LoadingScreen/LoadingScreen";
import { ROUTES } from "routes";

const notFoundRoute = {
  lazy: async () => ({
    Component: (await import("pages/NotFound/NotFound")).NotFound,
  }),
  handle: { titleKey: "titles.notFound" },
};

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    HydrateFallback: LoadingScreen,
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            path: ROUTES.home,
            lazy: async () => ({
              Component: (await import("pages/Home/Home")).Home,
            }),
            handle: { titleKey: "titles.home" },
          },
          {
            element: <AuthLayout />,
            children: [
              {
                path: ROUTES.auth,
                element: <Navigate to={ROUTES.login} replace />,
              },
              {
                path: ROUTES.login,
                lazy: async () => ({
                  Component: (await import("pages/Auth/Login")).LoginForm,
                }),
                handle: { titleKey: "titles.login" },
              },
              {
                path: ROUTES.register,
                lazy: async () => ({
                  Component: (await import("pages/Auth/Register")).RegisterForm,
                }),
                handle: { titleKey: "titles.register" },
              },
              {
                path: ROUTES.forgotPassword,
                lazy: async () => ({
                  Component: (await import("pages/Auth/ForgotPassword"))
                    .ForgotPasswordForm,
                }),
                handle: { titleKey: "titles.forgotPassword" },
              },
              {
                path: ROUTES.resetPassword,
                lazy: async () => ({
                  Component: (await import("pages/Auth/ResetPassword"))
                    .ResetPasswordForm,
                }),
                handle: { titleKey: "titles.resetPassword" },
              },
              {
                path: ROUTES.activate,
                lazy: async () => ({
                  Component: (await import("pages/Auth/Activate"))
                    .ActivateAccount,
                }),
                handle: { titleKey: "titles.activate" },
              },
              {
                path: ROUTES.resendActivation,
                lazy: async () => ({
                  Component: (await import("pages/Auth/ResendActivation"))
                    .ResendActivationForm,
                }),
                handle: { titleKey: "titles.resendActivation" },
              },
              { path: ROUTES.authNotFound, ...notFoundRoute },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import("pages/Dashboard/Dashboard"))
                    .Dashboard,
                }),
                handle: { titleKey: "titles.dashboard" },
              },
              {
                path: ROUTES.websocket,
                lazy: async () => ({
                  Component: (await import("pages/Dashboard/WebSocketDemo"))
                    .WebSocketDemo,
                }),
                handle: { titleKey: "titles.websocket" },
              },
              {
                path: ROUTES.comments,
                lazy: async () => ({
                  Component: (await import("pages/Comments/SimilarComments"))
                    .SimilarComments,
                }),
                handle: { titleKey: "titles.comments" },
              },
              {
                path: ROUTES.account,
                lazy: async () => ({
                  Component: (await import("pages/Account/Account")).Account,
                }),
                handle: { titleKey: "titles.account" },
              },
            ],
          },
        ],
      },
      { path: ROUTES.notFound, ...notFoundRoute },
    ],
  },
];

export const router = createBrowserRouter(routes);
