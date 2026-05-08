import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "./pages/Home/Home";
import { AuthLayout } from "./pages/Auth/Layout";
import { LoginForm } from "./pages/Auth/Login";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { Dashboard } from "pages/Dashboard/Dashboard";
import { WebSocketDemo } from "pages/Dashboard/WebSocketDemo";
import { AuthContextProvider } from "context/auth/AuthContextProvider";
import { RegisterForm } from "pages/Auth/Register";

const Router = () => {
  return (
    <BrowserRouter>
      <AuthContextProvider>
        <Routes>
          <Route path="/home" element={<Home />} />

          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginForm />} />
            <Route path="register" element={<RegisterForm />} />
          </Route>

          <Route path="/" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/websocket" element={<WebSocketDemo />} />
          </Route>
        </Routes>
      </AuthContextProvider>
    </BrowserRouter>
  );
};

export default Router;
