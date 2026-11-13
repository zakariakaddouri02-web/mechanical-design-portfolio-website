import { supabase } from "./supabase";

export const DEFAULT_HERO_COPY = {
  eyebrow: "Portfolio · Conception mécanique",
  title: "Mechanical\nDesign &\nSolidWorks.",
  description:
    "Modélisation de pièces mécaniques, assemblages et visualisations 3D techniques, conçus sous SolidWorks.",
  cta: "Voir les réalisations",
};

export type HeroCopy = typeof DEFAULT_HERO_COPY;

export interface SiteSettings {
  hero_image_url: string | null;
  hero_eyebrow: string | null;
  hero_title: string | null;
  hero_description: string | null;
  hero_cta: string | null;
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site_settings")
    .select("hero_image_url, hero_eyebrow, hero_title, hero_description, hero_cta")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export function getHeroCopy(settings: SiteSettings | null): HeroCopy {
  return {
    eyebrow: settings?.hero_eyebrow || DEFAULT_HERO_COPY.eyebrow,
    title: settings?.hero_title || DEFAULT_HERO_COPY.title,
    description: settings?.hero_description || DEFAULT_HERO_COPY.description,
    cta: settings?.hero_cta || DEFAULT_HERO_COPY.cta,
  };
}

export async function saveSiteSettings(
  updates: Partial<Pick<SiteSettings, "hero_image_url" | "hero_eyebrow" | "hero_title" | "hero_description" | "hero_cta">>
): Promise<void> {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, ...updates, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
}
