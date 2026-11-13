import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { Maximize2, Minimize2, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";

interface STLViewerProps {
  src: string;
  alt: string;
  initialAutoRotate?: boolean;
  className?: string;
}

const INITIAL_BACKGROUND = 0xe9eef3;

export function STLViewer({
  src,
  alt,
  initialAutoRotate = true,
  className = "h-[62vh] min-h-[360px]",
}: STLViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef(initialAutoRotate);
  const meshRef = useRef<Mesh | null>(null);
  const cameraResetRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerError, setViewerError] = useState("");
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    setLoading(true);
    setViewerError("");
    let active = true;
    let geometry: import("three").BufferGeometry | null = null;
    let material: MeshStandardMaterial | null = null;

    try {
      const scene = new Scene();
      scene.background = new Color(INITIAL_BACKGROUND);
      const camera = new PerspectiveCamera(35, 1, 0.01, 10000);
      const renderer = new WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      host.replaceChildren(renderer.domElement);

      const pmrem = new PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room).texture;
      room.dispose();
      scene.environment = environment;

      scene.add(new AmbientLight(0xffffff, 0.75));
      const keyLight = new DirectionalLight(0xffffff, 2.4);
      keyLight.position.set(4, 6, 5);
      scene.add(keyLight);
      const fillLight = new DirectionalLight(0xc8d8ef, 1.3);
      fillLight.position.set(-5, 2, -3);
      scene.add(fillLight);
      const rimLight = new DirectionalLight(0xffffff, 1.8);
      rimLight.position.set(1, -3, -5);
      scene.add(rimLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.screenSpacePanning = true;
      cameraResetRef.current = () => {
        const current = meshRef.current;
        if (current) current.rotation.set(0, 0, 0);
        camera.position.set(3, 2, 3);
        controls.target.set(0, 0, 0);
        controls.update();
      };

      const resize = () => {
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      renderer.setAnimationLoop(() => {
        if (autoRotateRef.current && meshRef.current) {
          meshRef.current.rotation.y += 0.003;
        }
        controls.update();
        renderer.render(scene, camera);
      });

      const loader = new STLLoader();
      loader.load(
        src,
        (loadedGeometry) => {
          if (!active) {
            loadedGeometry.dispose();
            return;
          }
          geometry = loadedGeometry;
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();
          const center = geometry.boundingBox?.getCenter(new Vector3()) || new Vector3();
          geometry.translate(-center.x, -center.y, -center.z);
          geometry.computeBoundingSphere();
          const radius = Math.max(geometry.boundingSphere?.radius || 1, 0.01);

          material = new MeshStandardMaterial({
            color: "#9ca8b4",
            metalness: 0.82,
            roughness: 0.26,
            envMapIntensity: 1.35,
          });
          const mesh = new Mesh(geometry, material);
          meshRef.current = mesh;
          scene.add(mesh);

          camera.position.set(radius * 2.7, radius * 1.8, radius * 2.7);
          camera.near = Math.max(radius / 1000, 0.001);
          camera.far = radius * 100;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.minDistance = radius * 1.05;
          controls.maxDistance = radius * 12;
          controls.update();
          setLoading(false);
        },
        undefined,
        (error) => {
          if (!active) return;
          setViewerError(error instanceof Error ? error.message : "Le fichier STL n'a pas pu être chargé.");
          setLoading(false);
        }
      );

      return () => {
        active = false;
        resizeObserver.disconnect();
        renderer.setAnimationLoop(null);
        controls.dispose();
        geometry?.dispose();
        material?.dispose();
        environment.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        meshRef.current = null;
        cameraResetRef.current = null;
      };
    } catch (error) {
      setViewerError(error instanceof Error ? error.message : "Le visualiseur STL n'a pas pu démarrer.");
      setLoading(false);
    }
  }, [src]);

  useEffect(() => {
    setAutoRotate(initialAutoRotate);
  }, [initialAutoRotate]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const controlClass =
    "flex h-9 items-center gap-2 rounded-full border border-white/15 bg-[#111820]/75 px-3 text-xs font-medium text-white backdrop-blur-md transition hover:bg-[#111820]";

  return (
    <div ref={frameRef} className={`viewer-frame blueprint-grid-fine relative overflow-hidden bg-[#e9eef3] ${className}`}>
      <div ref={hostRef} className="absolute inset-0" />
      {loading && !viewerError && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/45">
          <div className="spinner" />
          <p className="mono text-[10px] uppercase text-[#5c6875]">Chargement du modèle STL</p>
        </div>
      )}
      {viewerError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f4f6f8]/95 px-8">
          <div className="max-w-md text-center">
            <TriangleAlert className="mx-auto mb-4 text-[#b45309]" size={26} strokeWidth={1.7} />
            <p className="text-sm leading-6 text-[#3f4853]">{viewerError}</p>
            <a href={src} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-medium text-[#1557a8] underline">Ouvrir le fichier STL</a>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 z-10 sm:left-5 sm:top-5">
        <span className="mono inline-flex items-center gap-2 rounded-full border border-[#1557a8]/15 bg-white/85 px-3 py-2 text-[9px] uppercase text-[#1557a8] backdrop-blur-sm">STL · acier</span>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex justify-end gap-2 sm:right-5 sm:top-5">
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={() => setAutoRotate((value) => !value)} aria-pressed={autoRotate} className={controlClass}>
            <RefreshCw size={14} className={autoRotate ? "text-[#7cb2ff]" : ""} /><span className="hidden sm:inline">Rotation auto</span>
          </button>
          <button type="button" onClick={() => cameraResetRef.current?.()} aria-label="Réinitialiser la caméra" className={controlClass}>
            <RotateCcw size={14} /><span className="hidden sm:inline">Réinitialiser</span>
          </button>
          <button type="button" onClick={() => void (document.fullscreenElement === frameRef.current ? document.exitFullscreen() : frameRef.current?.requestFullscreen())} aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"} className={controlClass}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}<span className="hidden sm:inline">Plein écran</span>
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 sm:bottom-5 sm:left-5 sm:right-5">
        <p className="mono w-fit max-w-[80%] rounded-full bg-white/80 px-3 py-2 text-[9px] leading-4 text-[#596572] backdrop-blur-sm sm:text-[10px]">{alt} · Glisser : rotation · Molette : zoom · Clic droit : déplacement</p>
      </div>
    </div>
  );
}
