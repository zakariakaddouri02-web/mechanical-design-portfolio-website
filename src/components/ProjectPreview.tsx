import { useState } from "react";
import { ArrowUpRight, Box, Eye, Images, X } from "lucide-react";
import { getProjectImages, type Project } from "../lib/types";
import { Modal } from "./Modal";
import { ProjectViewer } from "./ProjectViewer";

interface ProjectPreviewProps {
  project: Project;
  onClose: () => void;
}

export function ProjectPreview({ project, onClose }: ProjectPreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const isModel = project.type === "model3d";
  const images = getProjectImages(project);
  const canOpen = isModel ? Boolean(project.model_url) : images.length > 0;

  return (
    <>
      <Modal
        open={!viewerOpen}
        onClose={onClose}
        level={130}
        showClose={false}
        panelClassName="max-w-5xl overflow-hidden rounded-[18px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
        labelledBy="project-preview-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e7ebf0] px-6 py-5 sm:px-8">
          <div>
            <p className="mono text-[9px] uppercase text-[#1557a8]">
              Aperçu local · non enregistré
            </p>
            <h2 id="project-preview-title" className="mt-1.5 text-lg font-semibold tracking-[-0.03em]">
              Prévisualisation du projet
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'aperçu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e0e5eb] text-[#5f6874] transition hover:bg-[#f4f6f8]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1.12fr_0.88fr]">
          <button
            type="button"
            disabled={!canOpen}
            onClick={() => setViewerOpen(true)}
            aria-label={isModel ? "Tester le visualiseur 3D" : "Ouvrir la galerie d'images"}
            className="group relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[#e1e6ec] bg-[#edf0f4] text-left disabled:cursor-not-allowed"
          >
            {project.cover_url ? (
              <img
                src={project.cover_url}
                alt={project.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-sm text-[#8a929d]">
                Image de couverture manquante
              </span>
            )}
            {canOpen && (
              <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#1557a8] shadow-md">
                <ArrowUpRight size={18} />
              </span>
            )}
          </button>

          <div className="flex flex-col justify-center">
            <span className="mono inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf2fd] px-3 py-2 text-[9px] uppercase text-[#1557a8]">
              {isModel ? <Box size={12} /> : <Images size={12} />}
              {isModel ? "Modèle 3D interactif" : `${images.length} image${images.length > 1 ? "s" : ""}`}
            </span>
            <h3 className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.04em]">
              {project.title || "Sans titre"}
            </h3>
            {project.description && (
              <p className="mt-3 text-sm leading-6 text-[#6d7480]">{project.description}</p>
            )}

            <dl className="mt-6 space-y-2 border-t border-[#e7ebf0] pt-5 text-xs text-[#6d7480]">
              <div className="flex justify-between gap-4">
                <dt>Type</dt>
                <dd className="font-medium text-[#28323e]">{isModel ? "Fichier GLB" : "Galerie d'images"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Visibilité</dt>
                <dd className="font-medium text-[#28323e]">
                  {project.is_published ? "Publié" : "Masqué / brouillon"}
                </dd>
              </div>
              {isModel && (
                <div className="flex justify-between gap-4">
                  <dt>Rotation automatique</dt>
                  <dd className="font-medium text-[#28323e]">
                    {project.auto_rotate ? "Activée" : "Désactivée"}
                  </dd>
                </div>
              )}
            </dl>

            <button
              type="button"
              disabled={!canOpen}
              onClick={() => setViewerOpen(true)}
              className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[#1557a8] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f468c] disabled:opacity-50"
            >
              <Eye size={15} />
              {isModel ? "Tester le modèle 3D" : "Voir la galerie"}
            </button>
            <p className="mt-4 text-xs leading-5 text-[#949ca6]">
              Cet aperçu utilise les fichiers sélectionnés sans les importer ni publier le projet.
            </p>
          </div>
        </div>
      </Modal>

      {viewerOpen && <ProjectViewer project={project} onClose={onClose} />}
    </>
  );
}
