-- À exécuter une fois sur le projet Supabase existant pour activer le réglage
-- de l'image d'accueil depuis le tableau de bord d'administration.
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  hero_image_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

drop policy if exists "visitors read site settings" on public.site_settings;
create policy "visitors read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "admin inserts site settings" on public.site_settings;
create policy "admin inserts site settings"
  on public.site_settings for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "admin updates site settings" on public.site_settings;
create policy "admin updates site settings"
  on public.site_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;
