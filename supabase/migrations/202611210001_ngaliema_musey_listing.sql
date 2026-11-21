-- Add the Ngaliema-Musey sale listing and its video gallery.
with source_listings as (
  select * from (values
    (
      '00000000-0000-4000-8000-000000000205'::uuid,
      'DAFS-NGM-001',
      'Maisons locatives et terrain à vendre à Ngaliema, Musey',
      'maisons-locatives-ngaliema-musey',
      'maison',
      '3 lots bâtis · 1 terrain nu · 60 000–95 000 USD par lot.',
      'Vente de quatre morcellements dans le quartier Musey, à Mbinza Ozone, commune de Ngaliema, en diagonale de Champ de Tir. Trois lots comprennent des maisons destinées à la location : un lot de 6 m × 19,70 m avec 2 portes, annoncé à 95 000 USD ; un lot de 6 m × 19,70 m avec 2 chambres et un salon, annoncé à 95 000 USD à discuter ; et un lot de 9 m × 14,60 m avec 2 portes, annoncé à 95 000 USD à discuter. Le quatrième lot est un terrain nu, annoncé à 60 000 USD à discuter. Document annoncé : fiche parcellaire. Dimensions, limites des lots, disponibilité et document à vérifier auprès de DAFS Sarlu. Visites sur demande.',
      'Ngaliema',
      'Mbinza Ozone, quartier Musey',
      'En diagonale de Champ de Tir · quartier Musey · adresse exacte à confirmer',
      null::numeric,
      null::smallint,
      null::smallint,
      60000::numeric,
      true
    )
  ) as listings(id, reference, title, slug, category_slug, short_description, description, municipality, neighborhood, address, land_area_m2, bedrooms, bathrooms, price_amount, is_negotiable)
)
insert into public.properties (
  id, reference, category_id, title, slug, short_description, description,
  operation_type, property_status, publication_status, country, province, city,
  municipality, neighborhood, address, land_area_m2, bedrooms, bathrooms,
  price_amount, currency, pricing_period, is_negotiable, published_at
)
select
  l.id, l.reference, c.id, l.title, l.slug, l.short_description, l.description,
  'sale', 'available', 'published', 'République démocratique du Congo', 'Kinshasa', 'Kinshasa',
  l.municipality, l.neighborhood, l.address, l.land_area_m2, l.bedrooms, l.bathrooms,
  l.price_amount, 'USD', 'fixed', l.is_negotiable, now()
from source_listings l
join public.property_categories c on c.slug = l.category_slug
on conflict do nothing;

with media(property_slug, media_path, caption, sort_order, is_primary) as (
  values
    ('maisons-locatives-ngaliema-musey', 'ngaliema-musey/cover.jpg', 'Couverture extraite de la vidéo de visite', 0, true),
    ('maisons-locatives-ngaliema-musey', 'ngaliema-musey/visite-01.mp4', 'Vidéo de visite fournie pour présenter les lots', 1, false)
)
insert into public.property_images (property_id, storage_path, alt_text, caption, is_primary, sort_order)
select
  p.id,
  'local:/property-media/news/' || m.media_path,
  p.title,
  m.caption,
  m.is_primary and not exists (
    select 1 from public.property_images existing
    where existing.property_id = p.id and existing.is_primary
  ),
  m.sort_order
from media m
join public.properties p on p.slug = m.property_slug
on conflict (storage_path) do nothing;
