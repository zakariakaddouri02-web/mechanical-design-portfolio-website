import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const key = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ""
).trim();

export const isSupabaseConfigured = Boolean(url && key);

/**
 * Only the public anon/publishable key belongs in the browser.
 * All authorization is enforced server-side by Supabase Auth + RLS.
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const contactEmail =
  (import.meta.env.VITE_CONTACT_EMAIL || "contact@zakariakaddouri.com").trim();

export const linkedInUrl = (
  import.meta.env.VITE_LINKEDIN_URL || "https://www.linkedin.com/"
).trim();
