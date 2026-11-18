-- Import the four listings and their public image/video galleries from NEWS.
with source_listings as (
  select * from (values
    (
      '00000000-0000-4000-8000-000000000201'::uuid, 'DAFS-KTN-001', 'Parcelle à vendre à Kintambo', 'parcelle-a-vendre-kintambo', 'parcelle',
      'Parcelle d’environ 195 m² à Kintambo, dimensions annoncées : 7,80 m × 25 m.',
      'Parcelle à vendre dans la commune de Kintambo, à un emplacement présenté comme idéal par l’annonceur. Dimensions annoncées : 7,80 m × 25 m (environ 195 m²). Prix annoncé : 215 000 USD, indiqué comme le dernier prix. Les documents sont décrits comme « normaux » dans l’annonce ; leur nature et leur validité sont à vérifier auprès du vendeur. Adresse exacte à compléter.',
      'Kintambo', null::text, 'Commune de Kintambo · adresse exacte à préciser', 195::numeric, null::smallint, null::smallint, 215000::numeric, false
    ),
    (
      '00000000-0000-4000-8000-000000000202'::uuid, 'DAFS-NGO-001', 'Parcelle à vendre à Binza Ozone, Cent-Casier', 'parcelle-a-vendre-binza-ozone-cent-casier', 'parcelle',
      'Parcelle d’environ 320 m² à Binza Ozone, référence Cent-Casier, sur macadam.',
      'Parcelle à vendre dans le quartier de Binza Ozone, référence Cent-Casier, sur une avenue asphaltée selon l’annonce. Dimensions annoncées : 16 m × 20 m (environ 320 m²). Le vendeur indique une possibilité de division en deux lots et mentionne également des dimensions de 8 m × 24 m à 150 000 USD par lot ; ces mesures sont à confirmer. Prix annoncé pour la parcelle : 300 000 USD, légèrement négociable. Certificat d’enregistrement annoncé, à vérifier. Visite sur demande.',
      'Ngaliema', 'Binza Ozone', 'Référence Cent-Casier · adresse exacte à confirmer', 320::numeric, null::smallint, null::smallint, 300000::numeric, true
    ),
    (
      '00000000-0000-4000-8000-000000000203'::uuid, 'DAFS-NGT-001', 'Maison de 2 chambres à Ngaliema, Champ de Tir', 'maison-a-vendre-ngaliema-champ-de-tir', 'maison',
      'Maison de 2 chambres sur une parcelle d’environ 180 m² à Binza Ozone, Champ de Tir.',
      'Maison avec parcelle à vendre dans le secteur Champ de Tir, à Binza Ozone, commune de Ngaliema. Référence communiquée : école Sévigné ; la parcelle se trouverait près du macadam. Dimensions annoncées : 12 m × 15 m (environ 180 m²). La maison comprendrait 2 chambres. Prix de départ annoncé : 150 000 USD, à discuter. Documents annoncés complets, à vérifier auprès du vendeur. Adresse exacte à confirmer.',
      'Ngaliema', 'Binza Ozone, Champ de Tir', 'Secteur Champ de Tir · référence école Sévigné · adresse exacte à confirmer', 180::numeric, 2::smallint, null::smallint, 150000::numeric, true
    ),
    (
      '00000000-0000-4000-8000-000000000204'::uuid, 'DAFS-NGO-002', 'Maison de 5 chambres à Ngaliema, Ozone Champ de Tir', 'maison-a-vendre-ngaliema-ozone-champ-de-tir', 'maison',
      'Parcelle d’environ 500 m² avec une maison annoncée de 5 chambres et un salon.',
      'Parcelle à vendre à Ngaliema, dans le secteur Ozone Champ de Tir. Dimensions annoncées : 25 m × 20 m (environ 500 m²). Une maison comprenant 5 chambres et un salon est mentionnée ; les autres pièces et caractéristiques restent à préciser. Prix annoncé : 500 000 USD, à discuter. Certificat d’enregistrement annoncé, à vérifier. Visite sur rendez-vous téléphonique. Adresse exacte à compléter.',
      'Ngaliema', 'Ozone Champ de Tir', 'Ngaliema, secteur Ozone Champ de Tir · adresse exacte à confirmer', 500::numeric, 5::smallint, null::smallint, 500000::numeric, true
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
  l.municipality, nullif(l.neighborhood, ''), nullif(l.address, ''), l.land_area_m2,
  l.bedrooms, l.bathrooms, l.price_amount, 'USD', 'fixed', l.is_negotiable, now()
from source_listings l
join public.property_categories c on c.slug = l.category_slug
on conflict do nothing;

with media(property_slug, media_path, caption, sort_order, is_primary) as (
  values
    ('parcelle-a-vendre-kintambo', 'kintambo/cover.jpg', 'Aperçu extrait de la vidéo de visite', 0, true),
    ('parcelle-a-vendre-kintambo', 'kintambo/visite-01.mp4', 'Vidéo de visite transmise pour l’annonce', 1, false),
    ('parcelle-a-vendre-binza-ozone-cent-casier', 'ngaliema-binza-ozone-cent-casier/cover.jpg', 'Aperçu extrait de la vidéo de visite', 0, true),
    ('parcelle-a-vendre-binza-ozone-cent-casier', 'ngaliema-binza-ozone-cent-casier/visite-01.mp4', 'Vidéo de visite transmise pour l’annonce', 1, false),
    ('maison-a-vendre-ngaliema-champ-de-tir', 'ngaliema-champ-tir-binza-ozone/cover.jpg', 'Aperçu extrait de la vidéo de visite', 0, true),
    ('maison-a-vendre-ngaliema-champ-de-tir', 'ngaliema-champ-tir-binza-ozone/visite-01.mp4', 'Vidéo de visite transmise pour l’annonce', 1, false),
    ('maison-a-vendre-ngaliema-ozone-champ-de-tir', 'ngaliema-ozone-champ-tir/photo-01.jpg', 'Vue 1', 0, true),
    ('maison-a-vendre-ngaliema-ozone-champ-de-tir', 'ngaliema-ozone-champ-tir/photo-02.jpg', 'Vue 2', 1, false),
    ('maison-a-vendre-ngaliema-ozone-champ-de-tir', 'ngaliema-ozone-champ-tir/photo-03.jpg', 'Vue 3', 2, false),
    ('maison-a-vendre-ngaliema-ozone-champ-de-tir', 'ngaliema-ozone-champ-tir/photo-04.jpg', 'Vue 4', 3, false),
    ('maison-a-vendre-ngaliema-ozone-champ-de-tir', 'ngaliema-ozone-champ-tir/visite-01.mp4', 'Vidéo de visite transmise pour l’annonce', 4, false)
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
