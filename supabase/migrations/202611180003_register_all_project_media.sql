-- Allow listing galleries to keep their supplied video tours in the same bucket.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
where id = 'property-images';

-- Register the supplied moving and interior-arrangement photos and videos so
-- they can be reviewed, published and imported into Storage from the admin.
insert into public.media_assets (
  service_id, title, description, alt_text, category, collection_title,
  storage_path, source_path, mime_type, file_size, is_published, sort_order
)
select
  s.id,
  'Photo d’intervention ' || lpad(n::text, 2, '0'),
  'Photo fournie pour présenter le service de déménagement et d’aménagement.',
  'Déménagement et aménagement — photo ' || lpad(n::text, 2, '0'),
  'moving', 'Photos d’intervention',
  'local:/service-media/moving/photos/photo-' || lpad(n::text, 2, '0') || '.jpg',
  'service-media/moving/photos/photo-' || lpad(n::text, 2, '0') || '.jpg',
  'image/jpeg', 0, true, n
from public.service_pages s
cross join generate_series(1, 24) as photos(n)
where s.slug = 'demenagement-amenagement'
on conflict (storage_path) do nothing;

insert into public.media_assets (
  service_id, title, description, alt_text, category, collection_title,
  storage_path, source_path, mime_type, file_size, is_published, sort_order
)
select
  s.id,
  'Vidéo d’intervention ' || lpad(n::text, 2, '0'),
  'Séquence vidéo fournie pour présenter le service de déménagement et d’aménagement.',
  'Déménagement et aménagement — vidéo ' || lpad(n::text, 2, '0'),
  'moving', 'Vidéos d’intervention',
  'local:/service-media/moving/videos/video-' || lpad(n::text, 2, '0') || '.mp4',
  'service-media/moving/videos/video-' || lpad(n::text, 2, '0') || '.mp4',
  'video/mp4', 0, true, 100 + n
from public.service_pages s
cross join generate_series(1, 11) as videos(n)
where s.slug = 'demenagement-amenagement'
on conflict (storage_path) do nothing;

-- Keep video posters and supporting visuals available in the admin library,
-- without adding them to the public service gallery as separate photographs.
insert into public.media_assets (
  title, description, alt_text, category, storage_path, source_path,
  mime_type, file_size, is_published, sort_order
)
select
  'Miniature vidéo de déménagement ' || lpad(n::text, 2, '0'),
  'Image de prévisualisation associée à une vidéo du service.',
  'Miniature vidéo ' || lpad(n::text, 2, '0'),
  'other',
  'local:/service-media/moving/posters/video-' || lpad(n::text, 2, '0') || '.jpg',
  'service-media/moving/posters/video-' || lpad(n::text, 2, '0') || '.jpg',
  'image/jpeg', 0, false, 300 + n
from generate_series(1, 11) as posters(n)
on conflict (storage_path) do nothing;

insert into public.media_assets (
  title, description, alt_text, category, storage_path, source_path,
  mime_type, file_size, is_published, sort_order
)
values
  ('Miniature vidéo de construction', 'Image de prévisualisation de la galerie de chantier.', 'Miniature vidéo de construction', 'other', 'local:/construction-media/posters/structure.jpg', 'construction-media/posters/structure.jpg', 'image/jpeg', 0, false, 400),
  ('Rendu 3D architectural', 'Visuel architectural fourni avec la maquette du site.', 'Rendu 3D architectural', 'architecture', 'local:/architecture/immeuble-3d-render.jpg', 'architecture/immeuble-3d-render.jpg', 'image/jpeg', 0, true, 0),
  ('Logo DAFS Sarlu', 'Logo fourni avec les médias du projet.', 'Logo DAFS Sarlu', 'brand', 'local:/brand/dafs-sarlu-logo.jpeg', 'brand/dafs-sarlu-logo.jpeg', 'image/jpeg', 0, true, 0)
on conflict (storage_path) do nothing;
