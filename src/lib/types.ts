export type ProjectType = "images" | "model3d" | "video";
export type ModelFormat = "glb" | "stl";

export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  cover_url: string;
  image_urls: string[];
  model_url: string | null;
  video_url: string | null;
  model_format: ModelFormat;
  auto_rotate: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectInput = Omit<Project, "id" | "created_at" | "updated_at">;

export const IMAGE_BUCKET = "portfolio-images";
export const MODEL_BUCKET = "portfolio-models";
export const VIDEO_BUCKET = "portfolio-videos";

export function getProjectImages(project: Project): string[] {
  return Array.from(
    new Set([project.cover_url, ...(project.image_urls || [])].filter(Boolean))
  );
}
