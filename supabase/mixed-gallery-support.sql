-- À exécuter sur une base existante pour autoriser une galerie d'images avec le modèle 3D.
alter table public.projects drop constraint if exists projects_content_check;
alter table public.projects add constraint projects_content_check check (
  (type = 'images' and model_url is null and video_url is null)
  or (type = 'model3d' and model_url is not null and video_url is null)
  or (type = 'video' and model_url is null and video_url is not null and cardinality(image_urls) = 0)
);
