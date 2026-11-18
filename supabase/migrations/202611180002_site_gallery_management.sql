alter table public.media_assets
  add column if not exists collection_title varchar(180) not null default '';

create table if not exists public.architectural_plan_media (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.architectural_plans (id) on delete cascade,
  storage_path text not null unique,
  alt_text varchar(250) not null default '',
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists architectural_plan_media_plan_order_idx
  on public.architectural_plan_media (plan_id, sort_order, created_at);

alter table public.architectural_plan_media enable row level security;

drop policy if exists "architectural_plan_media_public_read_published" on public.architectural_plan_media;
create policy "architectural_plan_media_public_read_published" on public.architectural_plan_media
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.architectural_plans p
      where p.id = plan_id and p.publication_status = 'published' and p.archived_at is null
    )
  );

drop policy if exists "architectural_plan_media_admin_manage" on public.architectural_plan_media;
create policy "architectural_plan_media_admin_manage" on public.architectural_plan_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.architectural_plan_media to anon, authenticated;
grant insert, update, delete on public.architectural_plan_media to authenticated;

create table if not exists public.site_content_controls (
  id text primary key check (id = 'public'),
  architectural_plans_managed boolean not null default false,
  construction_gallery_managed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.site_content_controls (id, architectural_plans_managed, construction_gallery_managed)
values ('public', true, true)
on conflict (id) do nothing;

alter table public.site_content_controls enable row level security;

drop policy if exists "site_content_controls_public_read" on public.site_content_controls;
create policy "site_content_controls_public_read" on public.site_content_controls
  for select to anon, authenticated using (id = 'public' or public.is_admin());

drop policy if exists "site_content_controls_admin_manage" on public.site_content_controls;
create policy "site_content_controls_admin_manage" on public.site_content_controls
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.site_content_controls to anon, authenticated;
grant insert, update, delete on public.site_content_controls to authenticated;

insert into public.architectural_plans (
  id, reference, title, slug, description, category, publication_status, preview_storage_path, published_at
)
values
  (
    '11111111-1111-4111-8111-111111111001', 'DAFS-PLN-001', 'Immeuble contemporain',
    'immeuble-contemporain-dafs-pln-001',
    'Un dossier de perspectives 3D présentant un immeuble contemporain à plusieurs niveaux, avec balcons et espaces de stationnement visibles. Le nombre de logements, les surfaces, le programme, les plans techniques et les possibilités d’adaptation sont à confirmer avec DAFS Sarlu.',
    'Immeuble résidentiel', 'published', 'local:/plans/immeuble-contemporain/vue-03.jpg', now()
  ),
  (
    '11111111-1111-4111-8111-111111111002', 'DAFS-PLN-002', 'Maison contemporaine à étage',
    'maison-contemporaine-dafs-pln-002',
    'Un ensemble de vues 3D autour d’une maison contemporaine à étage. Les pièces, les dimensions, les matériaux, le coût indicatif et la conformité au terrain doivent être étudiés avant tout projet.',
    'Maison contemporaine', 'published', 'local:/plans/maison-contemporaine/vue-01.jpg', now()
  )
on conflict (reference) do nothing;

insert into public.architectural_plan_media (plan_id, storage_path, alt_text, sort_order)
select p.id, 'local:/plans/' || v.folder || '/vue-' || lpad(v.view_number::text, 2, '0') || '.jpg',
  p.title || ' — vue ' || lpad(v.view_number::text, 2, '0'), v.view_number
from (
  select 'DAFS-PLN-001'::text as reference, 'immeuble-contemporain'::text as folder, n as view_number
  from generate_series(1, 12) n where n <> 3
  union all
  select 'DAFS-PLN-002', 'maison-contemporaine', n
  from generate_series(1, 8) n where n <> 1
) v
join public.architectural_plans p on p.reference = v.reference
on conflict (storage_path) do nothing;

insert into public.media_assets (
  title, description, alt_text, category, collection_title, storage_path, source_path,
  mime_type, file_size, is_published, sort_order
)
values
  ('Soudure d’armature', 'Travail de soudure sur une armature métallique.', 'Soudure d’une armature sur le chantier', 'construction', 'Fondations et ferraillage', 'local:/construction-media/photos/soudure-armature.jpg', 'CONSTRUCTION/img/09.03.08 (2).jpeg', 'image/jpeg', 0, true, 1),
  ('Armature métallique', 'Armature préparée pour un chantier.', 'Armature métallique préparée', 'construction', 'Fondations et ferraillage', 'local:/construction-media/photos/armature-metal.jpg', 'CONSTRUCTION/img/09.27.33.jpeg', 'image/jpeg', 0, true, 2),
  ('Équipe sur le chantier', 'Photo d’équipe transmise avec les médias de construction.', 'Équipe réunie sur un chantier', 'construction', 'Travaux sur site', 'local:/construction-media/photos/equipe-chantier.jpg', 'CONSTRUCTION/img/09.12.59.jpeg', 'image/jpeg', 0, true, 3)
on conflict (storage_path) do nothing;

insert into public.media_assets (
  title, description, alt_text, category, collection_title, storage_path, source_path,
  mime_type, file_size, is_published, sort_order
)
select
  v.group_title || ' — séquence ' || lpad(v.sequence_number::text, 2, '0'),
  '', v.group_title || ' — séquence ' || lpad(v.sequence_number::text, 2, '0'),
  'construction', v.group_title,
  'local:/construction-media/' || v.folder || '/sequence-' || lpad(v.sequence_number::text, 2, '0') || '.mp4',
  'CONSTRUCTION/videos/' || v.source_group || ' — séquence ' || lpad(v.sequence_number::text, 2, '0'),
  'video/mp4', 0, true, v.sort_base + v.sequence_number
from (
  select 'fondations'::text as folder, 'Fondations et ferraillage'::text as group_title, '09.03'::text as source_group, n as sequence_number, 0 as sort_base
  from generate_series(1, 9) n
  union all
  select 'structure', 'Armatures et structure', '09.14', n, 100
  from generate_series(1, 14) n
  union all
  select 'chantier', 'Travaux sur site', '09.31', n, 200
  from generate_series(1, 10) n
) v
on conflict (storage_path) do nothing;
