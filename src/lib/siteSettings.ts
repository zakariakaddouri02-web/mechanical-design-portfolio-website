import { supabase } from "./supabase";

export async function fetchHeroImage(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site_settings")
    .select("hero_image_url")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.hero_image_url || null;
}

export async function saveHeroImage(url: string): Promise<void> {
  if (!supabase) throw new Error("Supabase n'est pas configuré.");
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, hero_image_url: url, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
}
