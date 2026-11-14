-- À exécuter une fois sur une base déjà initialisée avec schema.sql.
alter table public.projects add column if not exists video_url text;

alter table public.projects drop constraint if exists projects_type_check;
alter table public.projects add constraint projects_type_check
  check (type in ('images', 'model3d', 'video'));

alter table public.projects drop constraint if exists projects_content_check;
alter table public.projects add constraint projects_content_check check (
  (type = 'images' and model_url is null and video_url is null)
  or (type = 'model3d' and model_url is not null and video_url is null and cardinality(image_urls) = 0)
  or (type = 'video' and model_url is null and video_url is not null and cardinality(image_urls) = 0)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-videos', 'portfolio-videos', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public reads portfolio videos" on storage.objects;
create policy "public reads portfolio videos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'portfolio-videos');

drop policy if exists "admin uploads portfolio videos" on storage.objects;
create policy "admin uploads portfolio videos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio-videos'
    and (select public.is_admin())
    and lower(storage.extension(name)) in ('mp4', 'webm')
  );

drop policy if exists "admin updates portfolio assets" on storage.objects;
create policy "admin updates portfolio assets"
  on storage.objects for update to authenticated
  using (bucket_id in ('portfolio-images', 'portfolio-models', 'portfolio-videos') and (select public.is_admin()))
  with check (bucket_id in ('portfolio-images', 'portfolio-models', 'portfolio-videos') and (select public.is_admin()));

drop policy if exists "admin deletes portfolio assets" on storage.objects;
create policy "admin deletes portfolio assets"
  on storage.objects for delete to authenticated
  using (bucket_id in ('portfolio-images', 'portfolio-models', 'portfolio-videos') and (select public.is_admin()));
