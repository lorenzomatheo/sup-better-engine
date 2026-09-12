import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthProvider, ToastProvider, useAuth, Spinner } from "./lib";
import Layout from "./components/Layout";
import AuthPage from "./pages/Auth";
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
import ContextPage from "./pages/Context";
import { Features, Plans, Flow, Settings, Team } from "./pages/Workspace";
import {
  Catalog,
  Contacts,
  Appointments,
  OperationsList,
  Outbox,
} from "./pages/Operations";
import Inbox from "./pages/Inbox";
import Chat, { CustomerPortal } from "./pages/Chat";
import "./styles.css";
import "./experience.css";
import Landing from "./pages/Landing";
import Account, { PasswordRecovery } from "./pages/Account";
import { ThemeProvider, TourProvider } from "./components/Experience";
function Protected() {
  const location = useLocation();
  const { auth, loading } = useAuth();
  return loading ? (
    <Spinner />
  ) : auth ? (
    <Outlet />
  ) : location.pathname === "/" ? (
    <Landing />
  ) : (
    <Navigate to="/login" replace />
  );
}
function RoleGate({ roles }: { roles: string[] }) {
  const { auth } = useAuth();
  return roles.includes(auth?.user.role || "") ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <TourProvider>
              <React.Suspense fallback={<Spinner />}>
                <Routes>
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/welcome" element={<Landing />} />
                  <Route
                    path="/forgot-password"
                    element={<PasswordRecovery />}
                  />
                  <Route
                    path="/reset-password"
                    element={<PasswordRecovery />}
                  />
                  <Route path="/c/:slug" element={<Chat />} />
                  <Route path="/activate" element={<CustomerPortal />} />
                  <Route path="/portal" element={<CustomerPortal />} />
                  <Route element={<Protected />}>
                    <Route element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="account" element={<Account />} />
                      <Route path="conversations" element={<Inbox />} />
                      <Route path="contacts" element={<Contacts />} />
                      <Route path="appointments" element={<Appointments />} />
                      <Route path="operations" element={<OperationsList />} />
                      <Route path="flow" element={<Flow />} />
                      <Route path="features" element={<Features />} />
                      <Route path="context" element={<ContextPage />} />
                      <Route path="catalog" element={<Catalog />} />
                      <Route
                        element={<RoleGate roles={["manager", "leader"]} />}
                      >
                        <Route path="team" element={<Team />} />
                      </Route>
                      <Route element={<RoleGate roles={["manager"]} />}>
                        <Route path="settings" element={<Settings />} />
                        <Route path="plans" element={<Plans />} />
                        <Route path="outbox" element={<Outbox />} />
                      </Route>
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </React.Suspense>
            </TourProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
