import { ArrowUpRight, Box, Images } from "lucide-react";
import { getProjectImages, type Project } from "../lib/types";

interface ProjectCardProps {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}

export function ProjectCard({ project, index, onOpen }: ProjectCardProps) {
  const isModel = project.type === "model3d";
  const imageCount = getProjectImages(project).length;

  return (
    <article
      className="reveal group"
      style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
    >
      <button
        type="button"
        onClick={() => onOpen(project)}
        aria-label={
          isModel
            ? `Ouvrir le modèle 3D interactif : ${project.title}`
            : `Ouvrir la galerie d'images : ${project.title}`
        }
        className="block w-full rounded-[14px] text-left focus-visible:outline-offset-6"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[#e4e8ed] bg-[#e9edf1] shadow-[0_10px_30px_rgba(22,36,56,0.045)] transition duration-500 group-hover:shadow-[0_20px_45px_rgba(22,36,56,0.11)]">
          <img
            src={project.cover_url}
            alt={project.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
          />
          <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-3 py-2 text-[10px] font-medium text-[#1d2b3a] shadow-sm backdrop-blur-md">
              {isModel ? (
                <Box size={13} className="text-[#1557a8]" strokeWidth={1.9} />
              ) : (
                <Images size={13} className="text-[#1557a8]" strokeWidth={1.9} />
              )}
              {isModel
                ? "Modèle 3D interactif"
                : `${imageCount} image${imageCount > 1 ? "s" : ""}`}
            </span>
          </div>
          <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1557a8] shadow-sm backdrop-blur-md transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:bottom-4 sm:right-4">
            <ArrowUpRight size={18} strokeWidth={1.8} />
          </span>
        </div>

        <div className="px-0.5 pt-5">
          <p className="mono text-[10px] uppercase text-[#8c949f]">
            {String(index + 1).padStart(2, "0")} / {isModel ? "Visualisation 3D" : "Galerie"}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#121820] transition-colors group-hover:text-[#1557a8]">
            {project.title}
          </h3>
          {project.description && (
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6d7480]">
              {project.description}
            </p>
          )}
        </div>
      </button>
    </article>
  );
}
