import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthValue {
  session: Session | null;
  isAdmin: boolean;
  sessionLoading: boolean;
  adminLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);
const AUTH_CHECK_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("Supabase ne répond pas. Vérifiez la connexion puis réessayez.")),
      timeoutMs
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  });
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .abortSignal(AbortSignal.timeout(AUTH_CHECK_TIMEOUT_MS))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(Boolean(supabase));
  const [adminLoading, setAdminLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setSessionLoading(false);
      return;
    }

    let active = true;
    let authEventReceived = false;
    void withTimeout(client.auth.getSession(), AUTH_CHECK_TIMEOUT_MS)
      .then(({ data, error }) => {
        if (!active || authEventReceived) return;
        if (error) throw error;
        setAuthError(null);
        setAdminLoading(Boolean(data.session?.user?.id));
        setSession(data.session);
        setSessionLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active || authEventReceived) return;
        setSession(null);
        setAdminLoading(false);
        setSessionLoading(false);
        setAuthError(
          cause instanceof Error
            ? cause.message
            : "La session Supabase n'a pas pu être vérifiée."
        );
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      authEventReceived = true;
      setAuthError(null);
      setAdminLoading(Boolean(nextSession?.user?.id));
      setSession(nextSession);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    let active = true;
    setAdminLoading(true);
    void checkIsAdmin(userId)
      .then((allowed) => {
        if (!active) return;
        setAuthError(null);
        setIsAdmin(allowed);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setIsAdmin(false);
        setAuthError(
          cause instanceof Error
            ? `Vérification administrateur impossible : ${cause.message}`
            : "Vérification administrateur impossible. Réessayez."
        );
      })
      .finally(() => {
        if (active) setAdminLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, isAdmin, sessionLoading, adminLoading, authError, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider.");
  return context;
}
