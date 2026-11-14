-- À exécuter une fois pour rendre le nom, la spécialité et les coordonnées modifiables.
alter table public.site_settings add column if not exists site_name text;
alter table public.site_settings add column if not exists site_tagline text;
alter table public.site_settings add column if not exists contact_email text;
alter table public.site_settings add column if not exists linkedin_url text;
