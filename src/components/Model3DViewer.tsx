import "@google/model-viewer";
import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

interface ViewerElement extends HTMLElement {
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  jumpCameraToGoal: () => void;
  resetTurntableRotation: (theta?: number) => void;
  updateFraming: () => void;
}

const INITIAL_ORBIT = "35deg 68deg 105%";
const INITIAL_TARGET = "auto auto auto";

interface Model3DViewerProps {
  src: string;
  alt: string;
  poster?: string;
  initialAutoRotate?: boolean;
  className?: string;
}

export function Model3DViewer({
  src,
  alt,
  poster,
  initialAutoRotate = true,
  className = "h-[62vh] min-h-[360px]",
}: Model3DViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerElement | null>(null);
  const initialSrcRef = useRef(src);
  const [loading, setLoading] = useState(true);
  const [viewerError, setViewerError] = useState("");
  const [controlNotice, setControlNotice] = useState("");
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const element = document.createElement("model-viewer") as ViewerElement;
    element.setAttribute("src", initialSrcRef.current);
    element.setAttribute("alt", alt);
    element.setAttribute("camera-controls", "");
    element.setAttribute("touch-action", "pan-y");
    element.setAttribute("camera-orbit", INITIAL_ORBIT);
    element.setAttribute("camera-target", INITIAL_TARGET);
    element.setAttribute("field-of-view", "30deg");
    element.setAttribute("interaction-prompt", "none");
    element.setAttribute("environment-image", "neutral");
    element.setAttribute("shadow-intensity", "1");
    element.setAttribute("shadow-softness", "0.8");
    element.setAttribute("exposure", "1.05");
    element.setAttribute("reveal", "auto");
    element.toggleAttribute("auto-rotate", initialAutoRotate);
    if (poster) element.setAttribute("poster", poster);

    const onLoad = () => {
      setLoading(false);
      setViewerError("");
      try {
        element.updateFraming();
      } catch {
        // Camera framing is optional; controls remain available.
      }
    };
    const onError = (event: Event) => {
      const detail = (event as CustomEvent<{ sourceError?: { message?: string } }>)
        .detail;
      setViewerError(
        detail?.sourceError?.message ||
          "Le fichier GLB n'a pas pu être chargé. Vérifiez son URL et les règles CORS."
      );
      setLoading(false);
    };

    element.addEventListener("load", onLoad);
    element.addEventListener("error", onError);
    host.appendChild(element);
    viewerRef.current = element;

    return () => {
      element.removeEventListener("load", onLoad);
      element.removeEventListener("error", onError);
      element.remove();
      viewerRef.current = null;
    };
    // The element is created once; later prop changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const element = viewerRef.current;
    if (!element) return;
    setLoading(true);
    setViewerError("");
    element.setAttribute("src", src);
    element.setAttribute("alt", alt);
    if (poster) element.setAttribute("poster", poster);
    else element.removeAttribute("poster");
    element.cameraOrbit = INITIAL_ORBIT;
    element.cameraTarget = INITIAL_TARGET;
    try {
      element.resetTurntableRotation(0);
      element.jumpCameraToGoal();
    } catch {
      // Custom element may still be upgrading on first paint.
    }
  }, [src, alt, poster]);

  useEffect(() => {
    setAutoRotate(initialAutoRotate);
  }, [initialAutoRotate]);

  useEffect(() => {
    viewerRef.current?.toggleAttribute("auto-rotate", autoRotate);
  }, [autoRotate]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function resetCamera() {
    const element = viewerRef.current;
    if (!element) return;
    element.cameraOrbit = INITIAL_ORBIT;
    element.cameraTarget = INITIAL_TARGET;
    element.fieldOfView = "30deg";
    try {
      element.resetTurntableRotation(0);
      element.jumpCameraToGoal();
      setControlNotice("");
    } catch {
      setControlNotice("Réinitialisation indisponible pendant le chargement.");
    }
  }

  async function toggleFullscreen() {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      if (document.fullscreenElement === frame) {
        await document.exitFullscreen();
      } else {
        await frame.requestFullscreen();
      }
      setControlNotice("");
    } catch {
      setControlNotice("Le mode plein écran n'est pas disponible sur cet appareil.");
    }
  }

  const controlClass =
    "flex h-9 items-center gap-2 rounded-full border border-white/15 bg-[#111820]/75 px-3 text-xs font-medium text-white backdrop-blur-md transition hover:bg-[#111820] disabled:opacity-40";

  return (
    <div
      ref={frameRef}
      className={`viewer-frame blueprint-grid-fine relative overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#ffffff_0%,#eef2f6_68%,#e5eaf0_100%)] ${className}`}
    >
      <div ref={hostRef} className="absolute inset-0" />

      {loading && !viewerError && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/45">
          <div className="spinner" />
          <p className="mono text-[10px] uppercase text-[#5c6875]">
            Chargement du modèle 3D
          </p>
        </div>
      )}

      {viewerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f4f6f8]/95 px-8">
          <div className="max-w-md text-center">
            <TriangleAlert className="mx-auto mb-4 text-[#b45309]" size={26} strokeWidth={1.7} />
            <p className="text-sm leading-6 text-[#3f4853]">{viewerError}</p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block text-sm font-medium text-[#1557a8] underline"
            >
              Ouvrir le fichier GLB
            </a>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2 sm:right-5 sm:top-5">
        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate((value) => !value)}
            aria-pressed={autoRotate}
            aria-label={autoRotate ? "Désactiver la rotation automatique" : "Activer la rotation automatique"}
            title={autoRotate ? "Désactiver la rotation automatique" : "Activer la rotation automatique"}
            className={controlClass}
          >
            <RefreshCw size={14} className={autoRotate ? "text-[#7cb2ff]" : ""} />
            <span className="hidden sm:inline">Rotation auto</span>
          </button>
          <button
            type="button"
            onClick={resetCamera}
            aria-label="Réinitialiser la caméra"
            title="Réinitialiser la caméra"
            className={controlClass}
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran"}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            className={controlClass}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline">Plein écran</span>
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-3 sm:bottom-5 sm:left-5 sm:right-5">
        <p className="mono max-w-[70%] rounded-full bg-white/80 px-3 py-2 text-[9px] leading-4 text-[#596572] backdrop-blur-sm sm:text-[10px]">
          Glisser : rotation · Molette : zoom · Clic droit / 2 doigts : déplacement
        </p>
        {controlNotice && (
          <p className="rounded-full bg-white/90 px-3 py-2 text-xs text-[#92400e]">
            {controlNotice}
          </p>
        )}
      </div>
    </div>
  );
}
