import { supabase } from "./supabase";
import {
  IMAGE_BUCKET,
  MODEL_BUCKET,
  type Project,
  type ProjectInput,
} from "./types";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_MODEL_BYTES = 50 * 1024 * 1024;

function getClient() {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

function normalizeProjects(data: unknown): Project[] {
  if (!Array.isArray(data)) return [];
  return (data as Project[]).map((row) => ({
    ...row,
    description: row.description || "",
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
    model_url: row.model_url || null,
    auto_rotate: Boolean(row.auto_rotate),
    is_published: Boolean(row.is_published),
  }));
}

export async function fetchPublishedProjects(): Promise<Project[]> {
  const client = getClient();
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return normalizeProjects(data);
}

export async function fetchAllProjects(): Promise<Project[]> {
  const client = getClient();
  const { data, error } = await client
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return normalizeProjects(data);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const client = getClient();
  const { data, error } = await client
    .from("projects")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizeProjects([data])[0];
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from("projects")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setProjectPublished(
  id: string,
  isPublished: boolean
): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from("projects")
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

function getExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

function randomName(extension: string) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${id}.${extension}`;
}

export function validateAssetFile(
  file: File,
  kind: "image" | "model"
): string | null {
  const extension = getExtension(file);
  if (kind === "image") {
    if (!IMAGE_EXTENSIONS.includes(extension)) {
      return "Images acceptées : JPG, PNG, WEBP ou AVIF.";
    }
    if (file.size > MAX_IMAGE_BYTES) return "Image trop volumineuse (10 Mo max.).";
  } else {
    if (extension !== "glb") {
      return "Le modèle interactif doit être un fichier .glb.";
    }
    if (file.size > MAX_MODEL_BYTES) return "Modèle trop volumineux (50 Mo max.).";
  }
  return null;
}

export async function uploadProjectAsset(
  file: File,
  kind: "image" | "model"
): Promise<string> {
  const validationError = validateAssetFile(file, kind);
  if (validationError) throw new Error(validationError);

  const client = getClient();
  const extension = getExtension(file);
  const bucket = kind === "image" ? IMAGE_BUCKET : MODEL_BUCKET;
  const path = randomName(extension);
  const contentType =
    kind === "model"
      ? "model/gltf-binary"
      : file.type.startsWith("image/")
        ? file.type
        : `image/${extension === "jpg" ? "jpeg" : extension}`;

  const { error } = await client.storage
    .from(bucket)
    .upload(path, file, { contentType, cacheControl: "3600", upsert: false });
  if (error) throw new Error(`Stockage : ${error.message}`);

  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function storagePathFromPublicUrl(url: string) {
  for (const bucket of [IMAGE_BUCKET, MODEL_BUCKET]) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.indexOf(marker);
    if (index >= 0) {
      const path = url.slice(index + marker.length).split("?")[0];
      try {
        return { bucket, path: decodeURIComponent(path) };
      } catch {
        return { bucket, path };
      }
    }
  }
  return null;
}

async function removeStoredAssets(project: Project) {
  const client = getClient();
  const assets = [
    project.cover_url,
    ...(project.image_urls || []),
    project.model_url || "",
  ]
    .filter(Boolean)
    .map(storagePathFromPublicUrl)
    .filter((item): item is { bucket: string; path: string } => item !== null);

  const grouped = new Map<string, string[]>();
  for (const asset of assets) {
    grouped.set(asset.bucket, [...(grouped.get(asset.bucket) || []), asset.path]);
  }

  await Promise.all(
    Array.from(grouped.entries()).map(async ([bucket, paths]) => {
      await client.storage.from(bucket).remove(Array.from(new Set(paths)));
    })
  );
}

export async function deleteProject(project: Project): Promise<void> {
  const client = getClient();
  const { error } = await client.from("projects").delete().eq("id", project.id);
  if (error) throw new Error(error.message);
  await removeStoredAssets(project);
}
