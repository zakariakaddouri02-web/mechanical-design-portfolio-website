import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Box, X } from "lucide-react";
import type { ModelFormat } from "../lib/types";
import { Modal } from "./Modal";
import { STLViewer } from "./STLViewer";

interface ImageLightboxProps {
  images: string[];
  title: string;
  initialIndex?: number;
  modelUrl?: string | null;
  modelFormat?: ModelFormat;
  autoRotate?: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  title,
  initialIndex = 0,
  modelUrl = null,
  modelFormat = "glb",
  autoRotate = true,
  onClose,
}: ImageLightboxProps) {
  const slideCount = images.length + (modelUrl ? 1 : 0);
  const [index, setIndex] = useState(Math.min(Math.max(initialIndex, 0), Math.max(slideCount - 1, 0)));
  const isModelSlide = Boolean(modelUrl) && index === images.length;

  useEffect(() => {
    setIndex(Math.min(Math.max(initialIndex, 0), Math.max(slideCount - 1, 0)));
  }, [initialIndex, slideCount]);

  useEffect(() => {
    if (slideCount < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % slideCount);
      else if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + slideCount) % slideCount);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [slideCount]);

  const navClass = "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 sm:h-12 sm:w-12";

  return (
    <Modal open onClose={onClose} level={120} showClose={false} overlayClassName="bg-[#0a0e14]/92 backdrop-blur-[8px]" panelClassName="max-w-6xl" labelledBy="lightbox-title">
      <div className="flex min-h-[70vh] flex-col px-3 py-4 text-white sm:px-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mono mb-1 text-[9px] uppercase text-[#8fb8ec]">{modelUrl ? "Galerie du projet" : "Galerie d'images"}</p>
            <h2 id="lightbox-title" className="truncate text-lg font-medium sm:text-xl">{title}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {slideCount > 1 && <span className="mono text-[10px] text-white/65">{String(index + 1).padStart(2, "0")} / {String(slideCount).padStart(2, "0")}</span>}
            <button type="button" onClick={onClose} aria-label="Fermer la galerie" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"><X size={18} /></button>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          {isModelSlide && modelUrl ? (
            <div className="w-full overflow-hidden rounded-[10px]">
              <STLViewer src={modelUrl} alt={title} format={modelFormat} initialAutoRotate={autoRotate} className="h-[68vh] min-h-[320px]" />
            </div>
          ) : images[index] ? (
            <img src={images[index]} alt={`${title} — image ${index + 1}`} className="max-h-[68vh] w-full rounded-[10px] object-contain" />
          ) : <p className="text-sm text-white/70">Aucune image disponible.</p>}

          {slideCount > 1 && <>
            <button type="button" onClick={() => setIndex((current) => (current - 1 + slideCount) % slideCount)} aria-label="Élément précédent" className={`${navClass} absolute left-0 sm:left-2`}><ArrowLeft size={19} /></button>
            <button type="button" onClick={() => setIndex((current) => (current + 1) % slideCount)} aria-label="Élément suivant" className={`${navClass} absolute right-0 sm:right-2`}><ArrowRight size={19} /></button>
          </>}
        </div>

        {slideCount > 1 && <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => <button key={`${image}-${imageIndex}`} type="button" onClick={() => setIndex(imageIndex)} aria-label={`Afficher l'image ${imageIndex + 1}`} aria-current={imageIndex === index} className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-16 sm:w-24 ${imageIndex === index ? "border-[#6ba5ee]" : "border-transparent opacity-55 hover:opacity-100"}`}><img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /></button>)}
          {modelUrl && <button type="button" onClick={() => setIndex(images.length)} aria-label="Afficher le modèle 3D" aria-current={isModelSlide} className={`flex h-14 w-20 shrink-0 items-center justify-center rounded-md border-2 bg-[#dfe5eb] transition sm:h-16 sm:w-24 ${isModelSlide ? "border-[#6ba5ee] text-[#1557a8]" : "border-transparent text-[#506071] opacity-65 hover:opacity-100"}`}><span className="flex flex-col items-center gap-1"><Box size={20} /><span className="mono text-[8px] uppercase">Modèle 3D</span></span></button>}
        </div>}
      </div>
    </Modal>
  );
}
