import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AuthContextProvider } from "@/context/auth/AuthContextProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute/ProtectedRoute";
import { FullPageSpinner } from "@/components/FullPageSpinner/FullPageSpinner";

const Home = lazy(() =>
  import("@/pages/Home/Home").then((module) => ({ default: module.Home })),
);
const AuthLayout = lazy(() =>
  import("@/pages/Auth/Layout").then((module) => ({
    default: module.AuthLayout,
  })),
);
const LoginForm = lazy(() =>
  import("@/pages/Auth/Login").then((module) => ({
    default: module.LoginForm,
  })),
);
const RegisterForm = lazy(() =>
  import("@/pages/Auth/Register").then((module) => ({
    default: module.RegisterForm,
  })),
);
const Dashboard = lazy(() =>
  import("@/pages/Dashboard/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);
const WebSocketDemo = lazy(() =>
  import("@/pages/Dashboard/WebSocketDemo").then((module) => ({
    default: module.WebSocketDemo,
  })),
);
const NotFound = lazy(() =>
  import("@/pages/NotFound/NotFound").then((module) => ({
    default: module.NotFound,
  })),
);

const Router = () => {
  return (
    <BrowserRouter>
      <AuthContextProvider>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/home" element={<Home />} />

            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<LoginForm />} />
              <Route path="register" element={<RegisterForm />} />
            </Route>

            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<Dashboard />} />
              <Route path="websocket" element={<WebSocketDemo />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthContextProvider>
    </BrowserRouter>
  );
};

export default Router;
