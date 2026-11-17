-- Update the configured public home-page headline requested by the client.
update public.site_settings
set settings = settings || jsonb_build_object(
  'home_title', concat('Agence Immobilière', chr(10), 'au service de vos projets.')
),
updated_at = now()
where id = 'global';
