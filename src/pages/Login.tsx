import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { ConfigNotice } from "../components/ConfigNotice";
import { checkIsAdmin, useAuth } from "../lib/auth";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const { session, isAdmin, sessionLoading, adminLoading, authError, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!sessionLoading && session && !adminLoading && isAdmin) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [session, isAdmin, sessionLoading, adminLoading, navigate]);

  useEffect(() => {
    if (authError) {
      setFormError(authError);
      return;
    }
    if (session && !adminLoading && !isAdmin) {
      setFormError("Ce compte n'est pas autorisé à administrer le portfolio.");
      void signOut();
    }
  }, [session, isAdmin, adminLoading, authError, signOut]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabase;
    if (!client || submitting) return;

    setSubmitting(true);
    setFormError("");
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setFormError(error?.message || "Email ou mot de passe incorrect.");
      setSubmitting(false);
      return;
    }

    let allowed: boolean;
    try {
      allowed = await checkIsAdmin(data.user.id);
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? `Vérification administrateur impossible : ${cause.message}`
          : "Vérification administrateur impossible. Réessayez."
      );
      setSubmitting(false);
      return;
    }
    if (!allowed) {
      await client.auth.signOut();
      setFormError("Ce compte n'est pas autorisé à administrer le portfolio.");
      setPassword("");
      setSubmitting(false);
      return;
    }

    navigate("/admin/dashboard", { replace: true });
  }

  if (!isSupabaseConfigured) {
    return <ConfigNotice title="Connexion indisponible" />;
  }

  if (sessionLoading || (session && adminLoading)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f7f8fa]">
        <div className="spinner" />
        <p className="mono text-[10px] uppercase text-[#7b8490]">Vérification de la session</p>
      </div>
    );
  }

  return (
    <main className="blueprint-grid flex min-h-screen items-center justify-center bg-[#f3f5f8] px-4 py-10 sm:px-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[20px] border border-[#dfe5ec] bg-white shadow-[0_30px_90px_rgba(20,35,60,0.12)] lg:grid-cols-2">
        <div className="blueprint-grid relative hidden flex-col justify-between overflow-hidden bg-[#101b2d] p-10 text-white lg:flex">
          <div className="absolute -right-16 top-24 h-64 w-64 rounded-full border border-[#4b8ee3]/20" />
          <div className="absolute -right-5 top-36 h-44 w-44 rounded-full border border-[#4b8ee3]/15" />
          <div className="relative">
            <div className="mono flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#1557a8] text-xs">
              ZK
            </div>
            <p className="mono mt-10 text-[10px] uppercase text-[#79a8e3]">
              Espace privé
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em]">
              Administration
              <br />
              du portfolio
            </h2>
          </div>
          <div className="relative space-y-4 text-sm text-white/65">
            <p className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-[#7eb2f1]" strokeWidth={1.8} />
              Authentification Supabase Auth
            </p>
            <p className="flex items-center gap-3">
              <LockKeyhole size={17} className="text-[#7eb2f1]" strokeWidth={1.8} />
              Opérations protégées par RLS
            </p>
          </div>
        </div>

        <div className="p-7 sm:p-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#7a828d] transition hover:text-[#1557a8]"
          >
            <ArrowLeft size={14} /> Retour au portfolio
          </Link>

          <div className="mt-9">
            <p className="mono text-[10px] uppercase text-[#1557a8]">Connexion</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111820]">
              Accès administrateur
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#737c88]">
              Connectez-vous avec le compte créé dans Supabase Auth.
            </p>
          </div>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-xs font-semibold text-[#34404d]">
                Adresse email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@exemple.com"
                className="w-full rounded-[10px] border border-[#d9e0e8] bg-white px-4 py-3 text-sm text-[#111820] outline-none transition placeholder:text-[#a3abb5] focus:border-[#1557a8] focus:ring-2 focus:ring-[#1557a8]/10"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-xs font-semibold text-[#34404d]">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••"
                  className="w-full rounded-[10px] border border-[#d9e0e8] bg-white px-4 py-3 pr-12 text-sm text-[#111820] outline-none transition placeholder:text-[#a3abb5] focus:border-[#1557a8] focus:ring-2 focus:ring-[#1557a8]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a929d] transition hover:text-[#1557a8]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {formError && (
              <p role="alert" className="rounded-[10px] border border-[#f0cfcf] bg-[#fff7f7] px-4 py-3 text-sm leading-6 text-[#9b3b3b]">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#1557a8] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0f468c] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-xs leading-5 text-[#949ca6]">
            Un seul administrateur est autorisé. Aucune inscription publique n'est proposée.
          </p>
        </div>
      </div>
    </main>
  );
}
