import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  MOUSE,
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
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Object3D } from "three";
import { Maximize2, Minimize2, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";

interface STLViewerProps {
  src: string;
  alt: string;
  format?: "stl" | "glb";
  initialAutoRotate?: boolean;
  className?: string;
}

const INITIAL_BACKGROUND = 0xe9eef3;

export function STLViewer({
  src,
  alt,
  format = "stl",
  initialAutoRotate = true,
  className = "h-[62vh] min-h-[360px]",
}: STLViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef(initialAutoRotate);
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
    let model: Object3D | null = null;
    let cameraDistance = 5;
    let materials: MeshStandardMaterial[] = [];

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
      controls.mouseButtons.LEFT = 2;
      controls.mouseButtons.MIDDLE = MOUSE.DOLLY;
      controls.mouseButtons.RIGHT = MOUSE.ROTATE;
      controls.mouseButtons.LEFT = MOUSE.PAN;
      cameraResetRef.current = () => {
        const current = model;
        if (current) current.rotation.set(0, 0, 0);
        camera.position.set(cameraDistance * 0.77, cameraDistance * 0.51, cameraDistance * 0.77);
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
        if (autoRotateRef.current && model) {
          model.rotation.y += 0.003;
        }
        controls.update();
        renderer.render(scene, camera);
      });

      const fitAndAdd = (object: Object3D) => {
        if (!active) return;
        const wrapper = new Group();
        wrapper.add(object);
        wrapper.updateMatrixWorld(true);
        const bounds = new Box3().setFromObject(wrapper);
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        const radius = Math.max(size.length() / 2, 0.01);
        cameraDistance = radius * 3.65;
        wrapper.position.sub(center);
        wrapper.updateMatrixWorld(true);
        model = wrapper;
        scene.add(wrapper);
        camera.position.set(radius * 2.7, radius * 1.8, radius * 2.7);
        camera.near = Math.max(radius / 1000, 0.001);
        camera.far = radius * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.minDistance = radius * 1.05;
        controls.maxDistance = radius * 12;
        controls.update();
        setLoading(false);
      };

      const steelMaterial = () => {
        const steel = new MeshStandardMaterial({
            color: "#9ca8b4",
            metalness: 0.82,
            roughness: 0.26,
            envMapIntensity: 1.35,
          });
        materials.push(steel);
        return steel;
      };

      const onLoadError = (error: unknown) => {
        if (!active) return;
        setViewerError(error instanceof Error ? error.message : `Le fichier ${format.toUpperCase()} n'a pas pu être chargé.`);
        setLoading(false);
      };

      if (format === "stl") {
        new STLLoader().load(src, (geometry) => {
          if (!active) { geometry.dispose(); return; }
          geometry.computeVertexNormals();
          const mesh = new Mesh(geometry, steelMaterial());
          fitAndAdd(mesh);
        }, undefined, onLoadError);
      } else {
        new GLTFLoader().load(src, (gltf) => {
          if (!active) return;
          const steel = steelMaterial();
          gltf.scene.traverse((child) => {
            const mesh = child as Mesh;
            if (!mesh.isMesh) return;
            const oldMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            oldMaterials.forEach((material) => material.dispose());
            mesh.material = steel;
          });
          fitAndAdd(gltf.scene);
        }, undefined, onLoadError);
      }

      return () => {
        active = false;
        resizeObserver.disconnect();
        renderer.setAnimationLoop(null);
        controls.dispose();
        model?.traverse((child) => {
          const mesh = child as Mesh;
          if (mesh.isMesh) mesh.geometry.dispose();
        });
        materials.forEach((material) => material.dispose());
        environment.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        cameraResetRef.current = null;
      };
    } catch (error) {
      setViewerError(error instanceof Error ? error.message : "Le visualiseur STL n'a pas pu démarrer.");
      setLoading(false);
    }
  }, [src, format]);

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
            <a href={src} target="_blank" rel="noreferrer" className="mt-5 inline-block text-sm font-medium text-[#1557a8] underline">Ouvrir le fichier {format.toUpperCase()}</a>
          </div>
        </div>
      )}
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
        <p className="mono w-fit max-w-[80%] rounded-full bg-white/80 px-3 py-2 text-[9px] leading-4 text-[#596572] backdrop-blur-sm sm:text-[10px]">{alt} · Clic gauche : déplacer · Clic droit : rotation · Molette : zoom</p>
      </div>
    </div>
  );
}
