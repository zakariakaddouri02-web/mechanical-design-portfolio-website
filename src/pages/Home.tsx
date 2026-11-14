import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Mail } from "lucide-react";
import heroRender from "../assets/model-cover.jpg?inline";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectViewer } from "../components/ProjectViewer";
import { DEMO_PROJECTS } from "../data/demo";
import { fetchPublishedProjects } from "../lib/projects";
import {
  DEFAULT_HERO_COPY,
  DEFAULT_SITE_PROFILE,
  fetchSiteSettings,
  getHeroCopy,
  getSiteProfile,
} from "../lib/siteSettings";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { Project } from "../lib/types";
import { errorMessage } from "../lib/utils";

function usePublishedProjects() {
  const [projects, setProjects] = useState<Project[]>(
    isSupabaseConfigured ? [] : DEMO_PROJECTS
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    try {
      const data = await fetchPublishedProjects();
      setProjects(data);
      setError(null);
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

    // Realtime when replication is enabled, with polling as a reliable fallback.
    const channel = client
      .channel("portfolio-public-projects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => void load()
      )
      .subscribe();
    const interval = window.setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      void client.removeChannel(channel);
    };
  }, [load]);

  return { projects, loading, error, reload: load };
}

function SkeletonGrid() {
  return (
    <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse">
          <div className="aspect-[4/3] rounded-[14px] bg-[#e9edf1]" />
          <div className="mt-5 h-3 w-20 rounded bg-[#e9edf1]" />
          <div className="mt-3 h-5 w-3/4 rounded bg-[#e9edf1]" />
          <div className="mt-3 h-4 w-full rounded bg-[#eef1f4]" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { projects, loading, error, reload } = usePublishedProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [heroImages, setHeroImages] = useState<string[]>([heroRender]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroCopy, setHeroCopy] = useState(DEFAULT_HERO_COPY);
  const [siteProfile, setSiteProfile] = useState(DEFAULT_SITE_PROFILE);

  useEffect(() => {
    let active = true;
    void fetchSiteSettings()
      .then((settings) => {
        if (!active) return;
        const images = settings?.hero_image_urls?.length
          ? settings.hero_image_urls
          : settings?.hero_image_url ? [settings.hero_image_url] : [heroRender];
        setHeroImages(images);
        setHeroIndex(0);
        setHeroCopy(getHeroCopy(settings));
        setSiteProfile(getSiteProfile(settings));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (heroImages.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-40 border-b border-[#e5e9ee]/90 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <a href="#top" className="flex items-center gap-3" aria-label="Retour en haut">
            <span className="mono flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#1557a8] text-[11px] font-medium text-white">
              ZK
            </span>
            <span className="text-[11px] font-bold tracking-[0.16em] text-[#121820] sm:text-[13px]">
              {siteProfile.name}
            </span>
          </a>
          <nav className="flex items-center gap-5 text-[13px] font-medium text-[#59636f] sm:gap-8">
            <a className="transition hover:text-[#1557a8]" href="#projects">
              Réalisations
            </a>
            <a className="transition hover:text-[#1557a8]" href="#contact">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section id="top" className="relative overflow-hidden border-b border-[#e5e9ee] bg-white">
          <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_right,black,transparent_75%)]" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16 lg:px-10 lg:py-24">
            <div className="reveal">
              <p className="mono flex items-center gap-3 text-[10px] uppercase text-[#1557a8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1557a8]" />
                {heroCopy.eyebrow}
              </p>
              <h1 className="mt-8 whitespace-pre-line text-[clamp(2.75rem,7vw,5.7rem)] font-semibold leading-[0.96] tracking-[-0.065em] text-[#10151c]">
                {heroCopy.title.split("\n").map((line, index) => (
                  <span className="block" key={`${index}-${line}`}>
                    {line.split("&").map((part, partIndex, parts) => (
                      <span key={`${partIndex}-${part}`}>
                        {part}
                        {partIndex < parts.length - 1 && (
                          <span className="text-[#1557a8]">&</span>
                        )}
                      </span>
                    ))}
                  </span>
                ))}
              </h1>
              <p className="mt-8 max-w-lg text-base leading-7 text-[#66707c]">
                {heroCopy.description}
              </p>
              <a
                href="#projects"
                className="mt-9 inline-flex items-center gap-2 border-b border-[#1557a8] pb-1 text-sm font-semibold text-[#1557a8] transition hover:gap-3"
              >
                {heroCopy.cta} <ArrowDownRight size={17} strokeWidth={1.8} />
              </a>
            </div>

            <div className="reveal reveal-delay-2 relative">
              <div className="absolute -bottom-5 -left-5 hidden h-32 w-32 rounded-2xl border border-[#1557a8]/15 blueprint-grid-fine sm:block" />
              <div className="hero-float relative rounded-[16px] border border-[#dfe5ec] bg-white p-2 shadow-[0_25px_70px_rgba(24,40,64,0.12)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-[#eef1f4]">
                  {heroImages.map((image, index) => (
                    <img key={`${image}-${index}`} src={image} alt="Rendu CAO d'un assemblage mécanique" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === heroIndex ? "opacity-100" : "opacity-0"}`} />
                  ))}
                  <div className="absolute bottom-3 left-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 backdrop-blur-sm">
                    <span className="mono text-[9px] uppercase text-[#1557a8]">
                      CAO / Assemblage 3D
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-3">
                  <span className="mono text-[9px] uppercase text-[#89919b]">
                    SolidWorks · Rendu technique
                  </span>
                  <span className="flex gap-1.5" aria-label={`Image ${heroIndex + 1} sur ${heroImages.length}`}>
                    {heroImages.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setHeroIndex(index)} aria-label={`Afficher l'image ${index + 1}`} aria-current={index === heroIndex} className={`h-1.5 w-1.5 rounded-full transition-colors ${index === heroIndex ? "bg-[#1557a8]" : "bg-[#c9d2dc]"}`} />)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 sm:mb-14">
            <div className="reveal">
              <p className="mono text-[10px] uppercase text-[#1557a8]">
                Sélection de projets
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#111820] sm:text-4xl">
                Mes Réalisations
              </h2>
            </div>
            <p className="mono pb-1 text-[10px] uppercase text-[#8a929d]">
              {loading ? "Chargement" : `${String(projects.length).padStart(2, "0")} projet${projects.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <div className="rounded-[14px] border border-[#f0d7d7] bg-white p-8 text-center">
              <p className="text-sm text-[#8a3a3a]">{error}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-5 rounded-full bg-[#1557a8] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f468c]"
              >
                Réessayer
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#cfd7e1] bg-white/60 px-6 py-16 text-center">
              <p className="text-lg font-medium text-[#293340]">
                Aucune réalisation publiée pour le moment.
              </p>
              <p className="mt-2 text-sm text-[#7a828d]">
                Les projets publiés depuis l'administration apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onOpen={setSelectedProject}
                />
              ))}
            </div>
          )}

          {!isSupabaseConfigured && (
            <p className="mt-12 border-t border-[#e2e7ed] pt-5 text-xs leading-6 text-[#89919b]">
              Aperçu de démonstration. Configurez Supabase pour remplacer ces exemples
              par vos réalisations et activer l'administration.
            </p>
          )}
        </section>
      </main>

      <footer id="contact" className="scroll-mt-20 border-t border-[#e2e7ed] bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-9 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-10">
          <div>
            <p className="mono text-[10px] uppercase text-[#1557a8]">Contact</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#111820] sm:text-3xl">
              {siteProfile.name}
            </h2>
            <p className="mt-2 text-sm text-[#7a828d]">{siteProfile.tagline}</p>
          </div>
          <div className="flex flex-col gap-3 text-sm font-medium">
            <a
              href={`mailto:${siteProfile.email}`}
              className="inline-flex items-center gap-2.5 text-[#26313e] transition hover:text-[#1557a8]"
            >
              <Mail size={16} strokeWidth={1.8} /> {siteProfile.email}
            </a>
            <a
              href={siteProfile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 text-[#26313e] transition hover:text-[#1557a8]"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
              </svg>
              LinkedIn
              <ArrowUpRight size={14} className="opacity-55" />
            </a>
          </div>
        </div>
        <div className="border-t border-[#edf0f3]">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[11px] text-[#949ca6] sm:px-8 lg:px-10">
            <span>© {new Date().getFullYear()} {siteProfile.name}</span>
            <span className="mono text-[9px] uppercase">Conception mécanique · Modélisation 3D</span>
            <Link to="/admin/login" className="transition hover:text-[#1557a8]">
              Administration
            </Link>
          </div>
        </div>
      </footer>

      {selectedProject && (
        <ProjectViewer
          key={selectedProject.id}
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
