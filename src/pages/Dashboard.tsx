import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Eye,
  EyeOff,
  Images,
  ImagePlus,
  LogOut,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { ProjectEditor } from "../components/ProjectEditor";
import { ProjectViewer } from "../components/ProjectViewer";
import { useAuth } from "../lib/auth";
import {
  deleteProject,
  fetchAllProjects,
  setProjectPublished,
  uploadProjectAsset,
} from "../lib/projects";
import { supabase } from "../lib/supabase";
import {
  DEFAULT_HERO_COPY,
  fetchSiteSettings,
  getHeroCopy,
  saveSiteSettings,
  type HeroCopy,
} from "../lib/siteSettings";
import { getProjectImages, type Project } from "../lib/types";
import { errorMessage } from "../lib/utils";

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ project: Project | null } | null>(null);
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [heroCopy, setHeroCopy] = useState<HeroCopy>(DEFAULT_HERO_COPY);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetchSiteSettings()
      .then((settings) => {
        if (!active) return;
        setHeroImage(settings?.hero_image_url || null);
        setHeroCopy(getHeroCopy(settings));
      })
      .catch((cause) => {
        if (active) setSettingsError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!heroFile) {
      setHeroPreview(null);
      return;
    }
    const preview = URL.createObjectURL(heroFile);
    setHeroPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [heroFile]);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      setProjects(await fetchAllProjects());
      setError("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    void load();

    const channel = client
      .channel("portfolio-admin-projects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => void load()
      )
      .subscribe();
    const interval = window.setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      void client.removeChannel(channel);
    };
  }, [load]);

  async function handleToggle(project: Project) {
    setBusyId(project.id);
    setError("");
    try {
      await setProjectPublished(project.id, !project.is_published);
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${project.title} » ? Les fichiers associés dans Supabase Storage seront également supprimés.`
    );
    if (!confirmed) return;

    setBusyId(project.id);
    setError("");
    try {
      await deleteProject(project);
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveHeroImage() {
    if (!heroFile) return;
    setSettingsBusy(true);
    setSettingsError("");
    setSettingsMessage("");
    try {
      const url = await uploadProjectAsset(heroFile, "image");
      await saveSiteSettings({ hero_image_url: url });
      setHeroImage(url);
      setHeroFile(null);
      setSettingsMessage("L'image d'accueil a été mise à jour.");
    } catch (cause) {
      setSettingsError(errorMessage(cause));
    } finally {
      setSettingsBusy(false);
    }
  }

  async function handleSaveHeroCopy() {
    setSettingsBusy(true);
    setSettingsError("");
    setSettingsMessage("");
    try {
      await saveSiteSettings({
        hero_eyebrow: heroCopy.eyebrow,
        hero_title: heroCopy.title,
        hero_description: heroCopy.description,
        hero_cta: heroCopy.cta,
      });
      setSettingsMessage("Le texte d'accueil a été mis à jour.");
    } catch (cause) {
      setSettingsError(errorMessage(cause));
    } finally {
      setSettingsBusy(false);
    }
  }

  const actionClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[#dce2e9] bg-white px-3 py-2 text-xs font-medium text-[#4d5966] transition hover:border-[#9db8d8] hover:text-[#1557a8] disabled:opacity-45";

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <header className="border-b border-[#e2e7ed] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="mono flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#1557a8] text-[11px] text-white">
              ZK
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-[#121820]">ZAKARIA KADDOURI</p>
              <p className="mono mt-0.5 text-[9px] uppercase text-[#89919b]">Administration</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a href="/" target="_blank" rel="noreferrer" className={actionClass}>
              <Eye size={14} /> Voir le site
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className={actionClass}
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mono text-[10px] uppercase text-[#1557a8]">Tableau de bord</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#111820]">
              Réalisations
            </h1>
            <p className="mt-2 text-sm text-[#7a828d]">
              {session?.user?.email ? `Connecté : ${session.user.email}` : "Session administrateur"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className={actionClass}
          >
            <Settings2 size={15} /> Réglages du site
          </button>
          <button
            type="button"
            onClick={() => setEditor({ project: null })}
            className="inline-flex items-center gap-2 rounded-full bg-[#1557a8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f468c]"
          >
            <Plus size={16} /> Nouvelle réalisation
          </button>
        </div>

        {settingsOpen && (
          <section className="mt-8 rounded-[16px] border border-[#e1e6ec] bg-white p-5 shadow-[0_12px_40px_rgba(20,35,60,0.05)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mono text-[10px] uppercase text-[#1557a8]">Réglages du site</p>
                <h2 className="mt-2 text-lg font-semibold text-[#202a36]">Image d'accueil</h2>
                <p className="mt-1 text-sm text-[#7a828d]">Choisissez le visuel affiché en haut du portfolio. JPG, PNG, WEBP ou AVIF, 10 Mo maximum.</p>
              </div>
              {(heroPreview || heroImage) && (
                <img src={heroPreview || heroImage || undefined} alt="Aperçu de l'image d'accueil" className="h-24 w-36 rounded-lg border border-[#e1e6ec] object-cover" />
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dce2e9] bg-white px-4 py-2.5 text-xs font-medium text-[#4d5966] hover:border-[#9db8d8] hover:text-[#1557a8]">
                <ImagePlus size={15} /> Choisir une image
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(event) => setHeroFile(event.target.files?.[0] || null)} />
              </label>
              <button type="button" onClick={() => void handleSaveHeroImage()} disabled={!heroFile || settingsBusy} className="inline-flex items-center gap-2 rounded-full bg-[#1557a8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f468c] disabled:opacity-50">
                <Save size={14} /> {settingsBusy ? "Enregistrement..." : "Enregistrer"}
              </button>
              {heroFile && <span className="max-w-xs truncate text-xs text-[#7a828d]">{heroFile.name}</span>}
            </div>
            {settingsMessage && <p role="status" className="mt-4 text-sm text-[#257245]">{settingsMessage}</p>}
            {settingsError && <p role="alert" className="mt-4 text-sm text-[#9b3b3b]">{settingsError}</p>}
            <div className="mt-7 border-t border-[#e8ecf1] pt-6">
              <h3 className="text-sm font-semibold text-[#202a36]">Texte d'accueil</h3>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-xs font-medium text-[#4d5966]">
                  Petit titre
                  <input value={heroCopy.eyebrow} onChange={(event) => setHeroCopy((copy) => ({ ...copy, eyebrow: event.target.value }))} maxLength={100} className="rounded-lg border border-[#d9e0e8] px-3 py-2.5 text-sm font-normal text-[#202a36] outline-none focus:border-[#1557a8]" />
                </label>
                <label className="grid gap-2 text-xs font-medium text-[#4d5966]">
                  Grand titre (une ligne par retour à la ligne)
                  <textarea value={heroCopy.title} onChange={(event) => setHeroCopy((copy) => ({ ...copy, title: event.target.value }))} rows={3} maxLength={160} className="resize-y rounded-lg border border-[#d9e0e8] px-3 py-2.5 text-sm font-normal text-[#202a36] outline-none focus:border-[#1557a8]" />
                </label>
                <label className="grid gap-2 text-xs font-medium text-[#4d5966]">
                  Description
                  <textarea value={heroCopy.description} onChange={(event) => setHeroCopy((copy) => ({ ...copy, description: event.target.value }))} rows={3} maxLength={500} className="resize-y rounded-lg border border-[#d9e0e8] px-3 py-2.5 text-sm font-normal text-[#202a36] outline-none focus:border-[#1557a8]" />
                </label>
                <label className="grid gap-2 text-xs font-medium text-[#4d5966]">
                  Texte du bouton
                  <input value={heroCopy.cta} onChange={(event) => setHeroCopy((copy) => ({ ...copy, cta: event.target.value }))} maxLength={80} className="rounded-lg border border-[#d9e0e8] px-3 py-2.5 text-sm font-normal text-[#202a36] outline-none focus:border-[#1557a8]" />
                </label>
              </div>
              <button type="button" onClick={() => void handleSaveHeroCopy()} disabled={settingsBusy} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1557a8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f468c] disabled:opacity-50">
                <Save size={14} /> {settingsBusy ? "Enregistrement..." : "Enregistrer le texte"}
              </button>
            </div>
          </section>
        )}

        {error && (
          <p role="alert" className="mt-8 rounded-[10px] border border-[#f0cfcf] bg-[#fff7f7] px-4 py-3 text-sm text-[#9b3b3b]">
            {error}
          </p>
        )}

        <div className="mt-9 overflow-hidden rounded-[16px] border border-[#e1e6ec] bg-white shadow-[0_12px_40px_rgba(20,35,60,0.05)]">
          <div className="flex items-center justify-between border-b border-[#e8ecf1] px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-[#2b3541]">Tous les projets</h2>
            <span className="mono text-[10px] uppercase text-[#89919b]">
              {String(projects.length).padStart(2, "0")} au total
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4 px-6 py-20">
              <div className="spinner" />
              <p className="mono text-[10px] uppercase text-[#89919b]">Chargement</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-[#34404d]">Aucune réalisation enregistrée.</p>
              <p className="mt-2 text-sm text-[#7a828d]">
                Ajoutez une galerie d'images ou un modèle 3D pour commencer.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#edf0f3]">
              {projects.map((project) => {
                const isModel = project.type === "model3d";
                const imageCount = getProjectImages(project).length;
                const busy = busyId === project.id;
                return (
                  <div key={project.id} className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-[10px] border border-[#e1e6ec] bg-[#eef1f4] sm:h-20 sm:w-28 lg:w-32">
                      {project.cover_url ? (
                        <img src={project.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="mono inline-flex items-center gap-1.5 rounded-full bg-[#eef3f9] px-2.5 py-1 text-[9px] uppercase text-[#1557a8]">
                          {isModel ? <Box size={11} /> : <Images size={11} />}
                          {isModel ? `${project.model_format.toUpperCase()} interactif` : `${imageCount} image${imageCount > 1 ? "s" : ""}`}
                        </span>
                        <span
                          className={`mono rounded-full px-2.5 py-1 text-[9px] uppercase ${
                            project.is_published
                              ? "bg-[#e9f6ee] text-[#257245]"
                              : "bg-[#f0f1f3] text-[#747c86]"
                          }`}
                        >
                          {project.is_published ? "Publié" : "Masqué"}
                        </span>
                      </div>
                      <h3 className="truncate text-base font-semibold text-[#202a36]">{project.title}</h3>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-[#7a828d]">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => setViewProject(project)}
                        disabled={busy}
                        className={actionClass}
                        title="Prévisualiser"
                      >
                        <Eye size={14} /> Aperçu
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditor({ project })}
                        disabled={busy}
                        className={actionClass}
                        title="Modifier"
                      >
                        <Pencil size={14} /> Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggle(project)}
                        disabled={busy}
                        className={actionClass}
                        title={project.is_published ? "Masquer" : "Publier"}
                      >
                        {project.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                        {project.is_published ? "Masquer" : "Publier"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(project)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#f0d7d7] bg-white px-3 py-2 text-xs font-medium text-[#a13f3f] transition hover:bg-[#fff5f5] disabled:opacity-45"
                        title="Supprimer"
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {editor && (
        <ProjectEditor
          key={editor.project?.id || "new"}
          project={editor.project}
          onClose={() => setEditor(null)}
          onSaved={load}
        />
      )}
      {viewProject && (
        <ProjectViewer
          key={viewProject.id}
          project={viewProject}
          onClose={() => setViewProject(null)}
        />
      )}
    </div>
  );
}
