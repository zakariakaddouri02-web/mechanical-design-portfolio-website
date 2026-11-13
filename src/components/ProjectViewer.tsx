import { Box, Move3D } from "lucide-react";
import { getProjectImages, type Project } from "../lib/types";
import { ImageLightbox } from "./ImageLightbox";
import { Modal } from "./Modal";
import { Model3DViewer } from "./Model3DViewer";

interface ProjectViewerProps {
  project: Project;
  onClose: () => void;
}

export function ProjectViewer({ project, onClose }: ProjectViewerProps) {
  if (project.type !== "model3d") {
    return (
      <ImageLightbox
        images={getProjectImages(project)}
        title={project.title}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      level={120}
      overlayClassName="bg-[#0b1018]/80 backdrop-blur-[8px]"
      panelClassName="max-w-6xl overflow-hidden rounded-[18px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.3)]"
      labelledBy="model-viewer-title"
    >
      <div className="flex flex-col gap-4 border-b border-[#e6eaf0] px-5 py-5 pr-16 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="mono rounded-full bg-[#eaf2fd] px-3 py-1.5 text-[9px] uppercase text-[#1557a8]">
            <Box size={12} className="mr-2 inline" strokeWidth={1.8} />
            Modèle 3D interactif
          </span>
          <span className="mono text-[9px] uppercase text-[#98a0ab]">
            Fichier GLB
          </span>
        </div>
        <div>
          <h2
            id="model-viewer-title"
            className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl"
          >
            {project.title}
          </h2>
          {project.description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#68717d]">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {project.model_url ? (
        <Model3DViewer
          src={project.model_url}
          poster={project.cover_url}
          alt={project.title}
          initialAutoRotate={project.auto_rotate}
          className="h-[58vh] min-h-[340px] sm:h-[64vh]"
        />
      ) : (
        <div className="flex h-[50vh] items-center justify-center px-6 text-center text-sm text-[#6d7480]">
          Aucun fichier GLB n'est associé à ce projet.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-5 py-4 text-xs text-[#7a828d] sm:px-7">
        <Move3D size={15} className="text-[#1557a8]" strokeWidth={1.8} />
        Explorez librement le modèle avec la souris ou le tactile.
      </div>
    </Modal>
  );
}
