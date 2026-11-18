-- Keep the company name and add the requested agency descriptor to the home title.
update public.site_settings
set settings = settings || jsonb_build_object(
  'home_title', concat('DAFS Sarlu, Agence immobilière', chr(10), 'au service de vos projets.')
),
updated_at = now()
where id = 'global';
