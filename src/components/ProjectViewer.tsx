import { Play } from "lucide-react";
import { getProjectImages, type Project } from "../lib/types";
import { ImageLightbox } from "./ImageLightbox";
import { Modal } from "./Modal";

interface ProjectViewerProps {
  project: Project;
  onClose: () => void;
}

export function ProjectViewer({ project, onClose }: ProjectViewerProps) {
  if (project.type === "images") {
    return (
      <ImageLightbox
        images={getProjectImages(project)}
        title={project.title}
        onClose={onClose}
      />
    );
  }

  if (project.type === "video") {
    return (
      <Modal open onClose={onClose} level={120} overlayClassName="bg-[#0b1018]/80 backdrop-blur-[8px]" panelClassName="max-w-5xl overflow-hidden rounded-[18px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.3)]" labelledBy="video-viewer-title">
        <div className="border-b border-[#e6eaf0] px-5 py-5 pr-16 sm:px-7">
          <h2 id="video-viewer-title" className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">{project.title}</h2>
          {project.description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#68717d]">{project.description}</p>}
        </div>
        {project.video_url ? (
          <video src={project.video_url} poster={project.cover_url} controls playsInline preload="metadata" className="max-h-[72vh] w-full bg-black" aria-label={project.title} />
        ) : (
          <div className="flex h-[50vh] items-center justify-center gap-2 text-sm text-[#6d7480]"><Play size={18} /> Aucune vidéo n'est associée à ce projet.</div>
        )}
        <div className="px-5 py-3 text-xs text-[#7a828d] sm:px-7">Cliquez sur Lecture pour démarrer la vidéo.</div>
      </Modal>
    );
  }

  return (
    <ImageLightbox
      images={getProjectImages(project)}
      title={project.title}
      modelUrl={project.model_url}
      modelFormat={project.model_format}
      autoRotate={project.auto_rotate}
      onClose={onClose}
    />
  );
}
