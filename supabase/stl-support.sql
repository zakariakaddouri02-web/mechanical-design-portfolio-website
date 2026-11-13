-- Exécuter une fois sur le projet Supabase existant pour accepter les fichiers STL.
alter table public.projects
  add column if not exists model_format text not null default 'glb';

alter table public.projects
  drop constraint if exists projects_model_format_check;
alter table public.projects
  add constraint projects_model_format_check
  check (model_format in ('glb', 'stl'));

update storage.buckets
set allowed_mime_types = array[
  'model/gltf-binary',
  'application/octet-stream',
  'model/stl',
  'application/sla'
]
where id = 'portfolio-models';

drop policy if exists "admin uploads portfolio models" on storage.objects;
create policy "admin uploads portfolio models"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-models'
    and (select public.is_admin())
    and lower(storage.extension(name)) in ('glb', 'stl')
  );
