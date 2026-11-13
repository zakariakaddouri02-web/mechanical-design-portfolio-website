import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Eye,
  ImagePlus,
  Images,
  Save,
  Upload,
  X,
} from "lucide-react";
import {
  createProject,
  updateProject,
  uploadProjectAsset,
  validateAssetFile,
} from "../lib/projects";
import type { Project, ProjectInput, ProjectType } from "../lib/types";
import { errorMessage, fileNameFromUrl, formatBytes } from "../lib/utils";
import { Modal } from "./Modal";
import { ProjectPreview } from "./ProjectPreview";

interface ProjectEditorProps {
  project: Project | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

type GalleryItem = {
  key: string;
  url: string;
  kind: "saved" | "new";
  index: number;
};

export function ProjectEditor({ project, onClose, onSaved }: ProjectEditorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("images");
  const [coverUrl, setCoverUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [modelUrl, setModelUrl] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [modelFile, setModelFile] = useState<File | null>(null);

  const [coverPreview, setCoverPreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [modelPreview, setModelPreview] = useState("");

  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(project?.title || "");
    setDescription(project?.description || "");
    setType(project?.type || "images");
    setCoverUrl(project?.cover_url || "");
    setGalleryUrls(project?.image_urls || []);
    setModelUrl(project?.model_url || "");
    setAutoRotate(project?.auto_rotate ?? true);
    setIsPublished(project?.is_published || false);
    setCoverFile(null);
    setGalleryFiles([]);
    setModelFile(null);
    setError("");
  }, [project]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview("");
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    const urls = galleryFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [galleryFiles]);

  useEffect(() => {
    if (!modelFile) {
      setModelPreview("");
      return;
    }
    const url = URL.createObjectURL(modelFile);
    setModelPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [modelFile]);

  const coverSource = coverPreview || coverUrl;
  const modelSource = modelPreview || modelUrl;
  const galleryItems: GalleryItem[] = [
    ...galleryUrls.map((url, index) => ({
      key: `saved-${index}`,
      url,
      kind: "saved" as const,
      index,
    })),
    ...galleryPreviews.map((url, index) => ({
      key: `new-${index}`,
      url,
      kind: "new" as const,
      index,
    })),
  ];

  function chooseCover(file?: File) {
    if (!file) return;
    const validation = validateAssetFile(file, "image");
    if (validation) {
      setError(validation);
      return;
    }
    setCoverFile(file);
    setError("");
  }

  function chooseGallery(files: FileList | null) {
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    for (const file of selected) {
      const validation = validateAssetFile(file, "image");
      if (validation) {
        setError(validation);
        return;
      }
    }
    setGalleryFiles((current) => [...current, ...selected]);
    setError("");
  }

  function chooseModel(file?: File) {
    if (!file) return;
    const validation = validateAssetFile(file, "model");
    if (validation) {
      setError(validation);
      return;
    }
    setModelFile(file);
    setError("");
  }

  function removeGalleryItem(item: GalleryItem) {
    if (item.kind === "saved") {
      setGalleryUrls((urls) => urls.filter((_, index) => index !== item.index));
    } else {
      setGalleryFiles((files) => files.filter((_, index) => index !== item.index));
    }
  }

  function buildDraft(): Project | null {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Ajoutez un titre au projet.");
      return null;
    }
    if (!coverSource) {
      setError("Ajoutez une image de couverture.");
      return null;
    }
    if (type === "model3d" && !modelSource) {
      setError("Importez un fichier .glb pour un projet 3D.");
      return null;
    }

    const timestamp = new Date().toISOString();
    return {
      id: project?.id || "local-preview",
      title: trimmedTitle,
      description: description.trim(),
      type,
      cover_url: coverSource,
      image_urls: type === "images" ? [...galleryUrls, ...galleryPreviews] : [],
      model_url: type === "model3d" ? modelSource : null,
      auto_rotate: type === "model3d" ? autoRotate : false,
      is_published: isPublished,
      created_at: project?.created_at || timestamp,
      updated_at: timestamp,
    };
  }

  function handlePreview() {
    const draft = buildDraft();
    if (draft) setPreviewProject(draft);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = buildDraft();
    if (!draft || saving) return;

    setSaving(true);
    setError("");
    try {
      const finalCoverUrl = coverFile
        ? await uploadProjectAsset(coverFile, "image")
        : coverUrl;

      const uploadedGallery: string[] = [];
      if (type === "images") {
        for (const file of galleryFiles) {
          uploadedGallery.push(await uploadProjectAsset(file, "image"));
        }
      }

      const finalModelUrl =
        type === "model3d"
          ? modelFile
            ? await uploadProjectAsset(modelFile, "model")
            : modelUrl
          : null;

      const payload: ProjectInput = {
        title: draft.title,
        description: draft.description,
        type,
        cover_url: finalCoverUrl,
        image_urls: type === "images" ? [...galleryUrls, ...uploadedGallery] : [],
        model_url: finalModelUrl,
        auto_rotate: draft.auto_rotate,
        is_published: draft.is_published,
      };

      if (project) await updateProject(project.id, payload);
      else await createProject(payload);

      await Promise.resolve(onSaved());
      onClose();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-[10px] border border-[#d9e0e8] bg-white px-4 py-3 text-sm text-[#111820] outline-none transition placeholder:text-[#a3abb5] focus:border-[#1557a8] focus:ring-2 focus:ring-[#1557a8]/10";
  const uploadBoxClass =
    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#cbd5e0] bg-[#f9fafc] px-4 py-6 text-center text-xs text-[#6d7480] transition hover:border-[#1557a8] hover:bg-[#f2f7fd]";

  return (
    <Modal
      open
      onClose={onClose}
      level={110}
      showClose={false}
      panelClassName="max-h-[92vh] max-w-4xl overflow-y-auto rounded-[18px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
      labelledBy="editor-title"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e7ebf0] bg-white/95 px-5 py-5 backdrop-blur-md sm:px-8">
        <div>
          <p className="mono text-[9px] uppercase text-[#1557a8]">
            {project ? "Modifier la réalisation" : "Nouvelle réalisation"}
          </p>
          <h2 id="editor-title" className="mt-1.5 text-xl font-semibold tracking-[-0.035em]">
            {project ? project.title : "Ajouter un projet"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l'éditeur"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e0e5eb] text-[#5f6874] transition hover:bg-[#f4f6f8]"
        >
          <X size={17} />
        </button>
      </div>

      <form onSubmit={(event) => void handleSave(event)} className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="project-title" className="mb-2 block text-xs font-semibold text-[#34404d]">
              Titre *
            </label>
            <input
              id="project-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex. Réducteur à engrenages"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="project-description" className="mb-2 block text-xs font-semibold text-[#34404d]">
              Description courte
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Quelques mots sur la réalisation..."
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-[#34404d]">Type de projet *</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setType("images")}
              aria-pressed={type === "images"}
              className={`flex items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left text-sm transition ${
                type === "images"
                  ? "border-[#1557a8] bg-[#f1f6fd] text-[#1557a8]"
                  : "border-[#dce2e9] bg-white text-[#52606e] hover:border-[#a9bdd6]"
              }`}
            >
              <Images size={18} strokeWidth={1.8} />
              <span>
                <strong className="block font-semibold">Galerie d'images</strong>
                <span className="text-xs opacity-70">Une ou plusieurs images</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setType("model3d")}
              aria-pressed={type === "model3d"}
              className={`flex items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left text-sm transition ${
                type === "model3d"
                  ? "border-[#1557a8] bg-[#f1f6fd] text-[#1557a8]"
                  : "border-[#dce2e9] bg-white text-[#52606e] hover:border-[#a9bdd6]"
              }`}
            >
              <Box size={18} strokeWidth={1.8} />
              <span>
                <strong className="block font-semibold">Modèle 3D GLB</strong>
                <span className="text-xs opacity-70">Visualiseur interactif</span>
              </span>
            </button>
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold text-[#34404d]">
              Image de couverture *
            </span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-28 w-full shrink-0 overflow-hidden rounded-[10px] border border-[#e1e6ec] bg-[#eef1f4] sm:w-40">
                {coverSource ? (
                  <img src={coverSource} alt="Couverture" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-[#98a1ac]">Aucune image</span>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="cover-input" className={uploadBoxClass}>
                  <Upload size={18} className="text-[#1557a8]" strokeWidth={1.8} />
                  <span className="font-medium text-[#34404d]">
                    {coverFile ? "Changer l'image" : "Importer une image"}
                  </span>
                  <span>JPG, PNG, WEBP ou AVIF · 10 Mo max.</span>
                </label>
                <input
                  id="cover-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={(event) => {
                    chooseCover(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {coverFile && (
                  <p className="mt-2 truncate text-xs text-[#6d7480]">
                    {coverFile.name} · {formatBytes(coverFile.size)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {type === "images" && (
            <div className="sm:col-span-2">
              <span className="mb-2 block text-xs font-semibold text-[#34404d]">
                Images supplémentaires
              </span>
              <label htmlFor="gallery-input" className={uploadBoxClass}>
                <ImagePlus size={18} className="text-[#1557a8]" strokeWidth={1.8} />
                <span className="font-medium text-[#34404d]">Ajouter plusieurs images</span>
                <span>La couverture sera affichée en première position dans la galerie.</span>
              </label>
              <input
                id="gallery-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(event) => {
                  chooseGallery(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              {galleryItems.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {galleryItems.map((item) => (
                    <div key={item.key} className="group relative aspect-square overflow-hidden rounded-[8px] border border-[#e1e6ec]">
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(item)}
                        aria-label="Retirer cette image"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-[#9b3b3b] shadow-sm"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === "model3d" && (
            <div className="space-y-5 sm:col-span-2">
              <div>
                <span className="mb-2 block text-xs font-semibold text-[#34404d]">
                  Fichier 3D GLB *
                </span>
                <label htmlFor="model-input" className={uploadBoxClass}>
                  <Box size={18} className="text-[#1557a8]" strokeWidth={1.8} />
                  <span className="font-medium text-[#34404d]">
                    {modelSource ? "Remplacer le modèle GLB" : "Importer un modèle GLB"}
                  </span>
                  <span>Un seul fichier .glb autonome · 50 Mo max.</span>
                </label>
                <input
                  id="model-input"
                  type="file"
                  accept=".glb,model/gltf-binary"
                  className="sr-only"
                  onChange={(event) => {
                    chooseModel(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {modelFile ? (
                  <p className="mt-2 truncate text-xs text-[#6d7480]">
                    {modelFile.name} · {formatBytes(modelFile.size)}
                  </p>
                ) : modelUrl ? (
                  <p className="mt-2 truncate text-xs text-[#6d7480]">
                    Modèle actuel : {fileNameFromUrl(modelUrl)}
                  </p>
                ) : null}
              </div>
              <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-[#48535f]">
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(event) => setAutoRotate(event.target.checked)}
                  className="h-4 w-4 accent-[#1557a8]"
                />
                Activer la rotation automatique à l'ouverture
              </label>
            </div>
          )}
        </div>

        <div className="rounded-[12px] border border-[#e2e7ed] bg-[#f9fafc] px-4 py-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1557a8]"
            />
            <span>
              <strong className="block text-sm font-semibold text-[#28323e]">
                Publier cette réalisation
              </strong>
              <span className="mt-1 block text-xs leading-5 text-[#7a828d]">
                Si décoché, le projet reste masqué sur la page publique.
              </span>
            </span>
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-[10px] border border-[#f0cfcf] bg-[#fff7f7] px-4 py-3 text-sm leading-6 text-[#9b3b3b]">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#e7ebf0] bg-white/95 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d9e0e8] px-5 py-2.5 text-sm font-medium text-[#55616d] transition hover:bg-[#f4f6f8]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-[#b9cfeb] px-5 py-2.5 text-sm font-medium text-[#1557a8] transition hover:bg-[#f1f6fd]"
          >
            <Eye size={15} /> Prévisualiser
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#1557a8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f468c] disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>

      {previewProject && (
        <ProjectPreview
          project={previewProject}
          onClose={() => setPreviewProject(null)}
        />
      )}
    </Modal>
  );
}
