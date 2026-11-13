import gearboxMain from "../assets/gearbox-main.jpg?inline";
import gearboxDetail from "../assets/gearbox-detail.jpg?inline";
import gripperMain from "../assets/gripper-main.jpg?inline";
import gripperDetail from "../assets/gripper-detail.jpg?inline";
import impellerMain from "../assets/impeller-main.jpg?inline";
import impellerDetail from "../assets/impeller-detail.jpg?inline";
import bracketMain from "../assets/bracket-main.jpg?inline";
import modelCover from "../assets/model-cover.jpg?inline";
import type { Project } from "../lib/types";

// Public Khronos glTF sample, served with CORS. Used only while Supabase is not configured.
const DEMO_GLB =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb";

const now = "2026-01-01T00:00:00.000Z";

const base = {
  is_published: true,
  model_format: "glb" as const,
  created_at: now,
  updated_at: now,
};

export const DEMO_PROJECTS: Project[] = [
  {
    ...base,
    id: "demo-gearbox",
    title: "Réducteur à engrenages",
    description: "Assemblage éclaté, carter usiné et train d'engrenages hélicoïdaux.",
    type: "images",
    cover_url: gearboxMain,
    image_urls: [gearboxDetail],
    model_url: null,
    auto_rotate: false,
  },
  {
    ...base,
    id: "demo-gripper",
    title: "Préhenseur pneumatique",
    description: "Conception d'un module de préhension compact et de ses liaisons mécaniques.",
    type: "images",
    cover_url: gripperMain,
    image_urls: [gripperDetail],
    model_url: null,
    auto_rotate: false,
  },
  {
    ...base,
    id: "demo-model",
    title: "Assemblage mécanique 3D",
    description: "Modèle GLB explorable : rotation, zoom, déplacement et plein écran.",
    type: "model3d",
    cover_url: modelCover,
    image_urls: [],
    model_url: DEMO_GLB,
    auto_rotate: true,
  },
  {
    ...base,
    id: "demo-impeller",
    title: "Roue de pompe centrifuge",
    description: "Modélisation d'une roue à aubes et étude de ses détails de fabrication.",
    type: "images",
    cover_url: impellerMain,
    image_urls: [impellerDetail],
    model_url: null,
    auto_rotate: false,
  },
  {
    ...base,
    id: "demo-bracket",
    title: "Support usiné allégé",
    description: "Pièce de fixation en aluminium avec inserts et perçages de précision.",
    type: "images",
    cover_url: bracketMain,
    image_urls: [],
    model_url: null,
    auto_rotate: false,
  },
];
