import { Link } from "react-router-dom";
import { ArrowLeft, Database } from "lucide-react";

export function ConfigNotice({
  title = "Configuration Supabase requise",
}: {
  title?: string;
}) {
  return (
    <main className="blueprint-grid flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6 py-16">
      <div className="w-full max-w-lg rounded-[18px] border border-[#e1e5eb] bg-white p-8 shadow-[0_24px_70px_rgba(20,35,60,0.08)] sm:p-10">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf2fd] text-[#1557a8]">
          <Database size={21} strokeWidth={1.8} />
        </div>
        <p className="mono mb-3 text-[10px] font-medium uppercase text-[#1557a8]">
          Administration
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[#68717d]">
          L'authentification et la gestion des projets utilisent Supabase Auth,
          PostgreSQL et Storage. Aucun identifiant n'est stocké dans le code.
          Ajoutez ces variables dans Netlify, sous <code>Site configuration → Environment variables</code>,
          puis relancez le déploiement :
        </p>
        <pre className="mono mt-6 overflow-x-auto rounded-xl bg-[#111820] p-4 text-xs leading-6 text-[#dce9fb]">
{`VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
        </pre>
        <p className="mt-4 text-xs leading-6 text-[#7a828d]">
          Utilisez uniquement la clé publique publishable. Ne mettez jamais une clé
          <code> sb_secret_</code> ou <code> service_role</code> dans les variables <code>VITE_*</code>.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#1557a8] hover:underline"
        >
          <ArrowLeft size={16} /> Retour au portfolio
        </Link>
      </div>
    </main>
  );
}
