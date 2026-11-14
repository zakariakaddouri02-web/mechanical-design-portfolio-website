import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Object3D, Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import type { Project } from "../lib/types";

interface ProjectCardModelPreviewProps {
  project: Project;
}

function disposeObject(object: Object3D) {
  object.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        const possibleTexture = value as Texture;
        if (possibleTexture?.isTexture) possibleTexture.dispose();
      }
      material.dispose();
    }
  });
}

export function ProjectCardModelPreview({ project }: ProjectCardModelPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !project.model_url) return;
    const modelUrl = project.model_url;

    let active = true;
    let started = false;
    let renderer: WebGLRenderer | null = null;
    let scene: Scene | null = null;
    let model: Object3D | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let pmrem: PMREMGenerator | null = null;
    let environment: Texture | null = null;

    const start = () => {
      if (started || !active) return;
      started = true;

      try {
        scene = new Scene();
        scene.background = new Color(0xe9edf1);
        const camera = new PerspectiveCamera(34, 1, 0.01, 100000);
        renderer = new WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = SRGBColorSpace;
        host.replaceChildren(renderer.domElement);

        scene.add(new AmbientLight(0xffffff, 1.15));
        const keyLight = new DirectionalLight(0xffffff, 2.2);
        keyLight.position.set(4, 5, 5);
        scene.add(keyLight);
        const fillLight = new DirectionalLight(0xcbd8e8, 1.1);
        fillLight.position.set(-4, 2, -3);
        scene.add(fillLight);

        const resize = () => {
          if (!renderer || !host) return;
          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const fitModel = (object: Object3D) => {
          if (!active || !scene) {
            disposeObject(object);
            return;
          }
          model = object;
          const bounds = new Box3().setFromObject(object);
          const center = bounds.getCenter(new Vector3());
          object.position.sub(center);
          const size = bounds.getSize(new Vector3());
          const radius = Math.max(size.length() / 2, 0.01);
          camera.position.set(radius * 2.45, radius * 1.55, radius * 2.45);
          camera.near = Math.max(radius / 1000, 0.001);
          camera.far = radius * 100;
          camera.updateProjectionMatrix();
          scene.add(object);
          setReady(true);
          renderer?.setAnimationLoop(() => {
            if (!renderer || !scene) return;
            if (model) model.rotation.y += 0.003;
            renderer.render(scene, camera);
          });
        };

        if (project.model_format === "stl") {
          pmrem = new PMREMGenerator(renderer);
          const room = new RoomEnvironment();
          environment = pmrem.fromScene(room).texture;
          scene.environment = environment;
          room.dispose();
          const stlLoader = new STLLoader();
          stlLoader.load(
            modelUrl,
            (geometry) => {
              if (!active) {
                geometry.dispose();
                return;
              }
              geometry.computeVertexNormals();
              const material = new MeshStandardMaterial({
                color: "#9ca8b4",
                metalness: 0.82,
                roughness: 0.26,
                envMapIntensity: 1.35,
              });
              fitModel(new Mesh(geometry, material));
            },
            undefined,
            () => {
              // The cover image remains visible if the 3D preview cannot load.
            }
          );
        } else {
          new GLTFLoader().load(
            modelUrl,
            (gltf) => fitModel(gltf.scene || new Group()),
            undefined,
            () => {
              // The cover image remains visible if the 3D preview cannot load.
            }
          );
        }
      } catch {
        setReady(false);
      }
    };

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            start();
          }
        }, { rootMargin: "140px" });
    if (observer) observer.observe(host);
    else start();

    return () => {
      active = false;
      observer?.disconnect();
      resizeObserver?.disconnect();
      renderer?.setAnimationLoop(null);
      if (model) disposeObject(model);
      environment?.dispose();
      pmrem?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [project.model_format, project.model_url]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9edf1]">
      <img
        src={project.cover_url}
        alt={project.title}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      <div ref={hostRef} className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
