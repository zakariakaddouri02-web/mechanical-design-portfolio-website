import { useEffect, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { AuthProvider, useAuth } from "./lib/auth";
import { isSupabaseConfigured } from "./lib/supabase";
import { ConfigNotice } from "./components/ConfigNotice";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f7f8fa]">
      <div className="spinner" />
      <p className="mono text-[10px] uppercase text-[#7b8490]">{label}</p>
    </div>
  );
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, isAdmin, sessionLoading, adminLoading, signOut } = useAuth();

  if (!isSupabaseConfigured) {
    return <ConfigNotice title="Administration non configurée" />;
  }
  if (sessionLoading || adminLoading) {
    return <FullScreenLoader label="Vérification de la session" />;
  }
  if (!session) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <main className="blueprint-grid flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6">
        <div className="w-full max-w-md rounded-[18px] border border-[#e1e5eb] bg-white p-9 text-center shadow-[0_24px_70px_rgba(20,35,60,0.08)]">
          <ShieldAlert className="mx-auto mb-5 text-[#b45309]" size={30} strokeWidth={1.7} />
          <h1 className="text-xl font-semibold tracking-[-0.03em]">Accès non autorisé</h1>
          <p className="mt-3 text-sm leading-6 text-[#6d7480]">
            Ce compte n'est pas enregistré comme administrateur du portfolio.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-7 rounded-full bg-[#1557a8] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f468c]"
          >
            Se déconnecter
          </button>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdmin>
                <Dashboard />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
