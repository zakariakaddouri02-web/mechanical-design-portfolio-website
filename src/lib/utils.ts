export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function fileNameFromUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return "Fichier sélectionné";
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "Fichier");
  } catch {
    return url.split("/").pop() || "Fichier";
  }
}
