-- ============================================================================
-- ZAKARIA KADDOURI — Portfolio mécanique / SolidWorks
-- À exécuter une fois dans : Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Administrateur unique
-- ----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true check (singleton),
  created_at timestamptz not null default now(),
  constraint admin_users_single_row unique (singleton)
);

alter table public.admin_users enable row level security;

-- SECURITY DEFINER : allows policies to check the admin table without exposing it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admin reads own admin record" on public.admin_users;
create policy "admin reads own admin record"
  on public.admin_users
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- 2. Projets
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  description text not null default '' check (char_length(description) <= 600),
  type text not null check (type in ('images', 'model3d')),
  cover_url text not null check (char_length(btrim(cover_url)) > 0),
  image_urls text[] not null default '{}',
  model_url text,
  auto_rotate boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_content_check check (
    (type = 'images'   and model_url is null)
    or
    (type = 'model3d' and model_url is not null and cardinality(image_urls) = 0)
  )
);

create index if not exists projects_public_order_idx
  on public.projects (is_published, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

alter table public.projects enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "visitors read published projects" on public.projects;
drop policy if exists "admin reads all projects" on public.projects;
drop policy if exists "admin inserts projects" on public.projects;
drop policy if exists "admin updates projects" on public.projects;
drop policy if exists "admin deletes projects" on public.projects;

create policy "visitors read published projects"
  on public.projects for select
  to anon, authenticated
  using (is_published);

create policy "admin reads all projects"
  on public.projects for select
  to authenticated
  using ((select public.is_admin()));

create policy "admin inserts projects"
  on public.projects for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "admin updates projects"
  on public.projects for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admin deletes projects"
  on public.projects for delete
  to authenticated
  using ((select public.is_admin()));

-- ----------------------------------------------------------------------------
-- 3. Buckets Storage (lecture publique, écriture administrateur uniquement)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'portfolio-images',
    'portfolio-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'portfolio-models',
    'portfolio-models',
    true,
    52428800,
    array['model/gltf-binary', 'application/octet-stream']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant usage on schema storage to anon, authenticated;
grant select on storage.buckets, storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

drop policy if exists "public reads portfolio images" on storage.objects;
drop policy if exists "public reads portfolio models" on storage.objects;
drop policy if exists "admin uploads portfolio images" on storage.objects;
drop policy if exists "admin uploads portfolio models" on storage.objects;
drop policy if exists "admin manages portfolio assets" on storage.objects;
drop policy if exists "admin updates portfolio assets" on storage.objects;
drop policy if exists "admin deletes portfolio assets" on storage.objects;

create policy "public reads portfolio images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio-images');

create policy "public reads portfolio models"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio-models');

create policy "admin uploads portfolio images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-images'
    and (select public.is_admin())
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  );

create policy "admin uploads portfolio models"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-models'
    and (select public.is_admin())
    and lower(storage.extension(name)) = 'glb'
  );

create policy "admin updates portfolio assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('portfolio-images', 'portfolio-models')
    and (select public.is_admin())
  )
  with check (
    bucket_id in ('portfolio-images', 'portfolio-models')
    and (select public.is_admin())
  );

create policy "admin deletes portfolio assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('portfolio-images', 'portfolio-models')
    and (select public.is_admin())
  );

-- ----------------------------------------------------------------------------
-- 4. Réglages publics du site (image d'accueil)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. Realtime : synchronisation automatique de la page publique
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'projects'
     )
  then
    alter publication supabase_realtime add table public.projects;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Désignation de l'administrateur
-- ----------------------------------------------------------------------------
-- Créez d'abord l'utilisateur dans :
-- Supabase Dashboard > Authentication > Users > Add user (cochez "Confirm email").
-- Remplacez l'adresse ci-dessous, puis exécutez uniquement cette requête.
-- La contrainte "singleton" garantit qu'il n'y a qu'un seul administrateur.
--
-- insert into public.admin_users (user_id)
-- select id from auth.users
-- where lower(email) = lower('votre-email-admin@exemple.com')
-- on conflict (user_id) do nothing;
--
-- Pour remplacer l'administrateur existant :
-- delete from public.admin_users;
-- puis réexécutez l'insertion ci-dessus avec la nouvelle adresse.
