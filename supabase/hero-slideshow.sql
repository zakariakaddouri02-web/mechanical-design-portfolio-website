-- À exécuter une fois pour activer le diaporama des images d'accueil.
alter table public.site_settings
  add column if not exists hero_image_urls text[] not null default '{}';

update public.site_settings
set hero_image_urls = array[hero_image_url]
where coalesce(cardinality(hero_image_urls), 0) = 0
  and hero_image_url is not null;
