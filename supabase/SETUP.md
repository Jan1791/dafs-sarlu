# DAFS Sarlu — Supabase

Les applications publiques et admin utilisent le même projet Supabase. Les clés cliente sont dans les fichiers locaux `.env.local` (ignorés par Git). La clé secrète et le mot de passe PostgreSQL ne sont jamais utilisés dans les navigateurs.

## Appliquer le schéma

Dans le tableau de bord Supabase, ouvrir **SQL Editor** et exécuter les fichiers de migration dans l’ordre :

1. `migrations/202611150001_core_content.sql` crée les tables du catalogue, les profils et rôles, les règles RLS et les buckets Storage.
2. `migrations/202611150002_public_inquiries.sql` autorise l’envoi public limité des demandes de contact.
3. `migrations/202611150003_site_settings.sql` crée les coordonnées et informations d’entreprise modifiables depuis l’admin.
4. `migrations/202611150004_data_integrity.sql` synchronise les dates de modification et limite les champs de profil modifiables.
5. `migrations/202611170001_services_media.sql` ajoute les pages de services, la bibliothèque de médias et le bucket public `site-media` avec des droits d’écriture réservés aux administrateurs.
6. `migrations/202611170002_public_service_content.sql` ajoute les textes publics de départ sans écraser les champs déjà renseignés.
7. `migrations/202611170003_kinshasa_property_seed.sql` importe les quatre annonces et leurs médias fournis dans `public/property-media`.
8. `migrations/202611170004_expand_public_service_copy.sql` développe les textes initiaux de Déménagement & aménagement et Cleaner en conservant les versions déjà modifiées dans l’admin.
9. `migrations/202611170005_remove_old_public_phone.sql` retire l’ancien numéro des coordonnées publiques et de la page légale sans écraser les autres réglages.
10. `migrations/202611170006_homepage_title.sql` met à jour le titre de la page d’accueil.
11. `migrations/202611170007_restore_company_name_home_title.sql` conserve « DAFS Sarlu » et ajoute « Agence immobilière » au titre.
12. `migrations/202611180001_news_property_listings.sql` ajoute les quatre annonces du dossier `src/img/A-VENDRE/NEWS` et leurs galeries de photos/vidéos.
13. `migrations/202611180002_site_gallery_management.sql` active la gestion des plans architecturaux et de la galerie Construction, puis importe les plans, vues et médias de chantier déjà présents sur le site.
14. `migrations/202611180003_register_all_project_media.sql` ajoute les médias d’aménagement à la bibliothèque admin et autorise les vidéos de visite des biens dans Storage.

## Créer le premier compte administrateur

1. Dans **Authentication → Users**, créer un utilisateur avec l’adresse e-mail de l’administrateur.
2. Dans le SQL Editor, remplacer `admin@example.com` par cette adresse puis exécuter :

```sql
update public.profiles
set is_active = true,
    updated_at = now()
where id = (select id from auth.users where lower(email) = lower('admin@example.com'));

-- Si l’utilisateur a été créé avant l’installation du déclencheur de profil,
-- crée le profil manquant et l’active.
insert into public.profiles (id, is_active)
select id, true
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (id) do update set is_active = true, updated_at = now();

insert into public.user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
join auth.users u on u.id = p.id
join public.roles r on r.name = 'super_admin'
where lower(u.email) = lower('admin@example.com')
on conflict (user_id, role_id) do nothing;
```

3. Configurer Resend comme SMTP de Supabase Auth (voir ci-dessous) et configurer les clés publique et secrète Cloudflare Turnstile dans l’hébergement de production.

Le client public lit uniquement les propriétés publiées. La création, la modification, la publication et le téléversement des images demandent une session disposant d’un rôle actif. Le formulaire de contact passe par une route serveur, vérifie Turnstile en production et enregistre les demandes via des droits limités et une politique RLS d’insertion.

## Services et bibliothèque de médias

Après les quatre migrations initiales, exécuter la migration `202611170001_services_media.sql`. Elle crée les pages « Déménagement & aménagement » et « Cleaner », toutes deux publiées avec un texte de départ modifiable dans l’admin. La bibliothèque permet d’importer plusieurs fichiers ou un dossier complet, de reclasser chaque média, de l’associer à une page et de choisir s’il est public. Les vidéos sont transférées par blocs afin de reprendre plus fiablement les imports interrompus.

Pour les migrations de contenu ajoutées par la suite, exécuter chaque fichier numéroté suivant une seule fois et dans l’ordre. Le texte affiché par le site reste modifiable dans l’espace admin après l’application des migrations.

Après la migration 13, l’admin peut modifier chaque fiche de plan, ajouter ou retirer ses vues, et classer, publier ou supprimer les médias de Construction. Les contenus initiaux pointent vers les fichiers versionnés du site; leurs fiches peuvent être retirées de l’admin sans effacer ces fichiers du dépôt.

Après la migration 14 et le déploiement de l’admin, **Services & médias → Bibliothèque médias → Importer les médias du projet** transfère les fichiers existants vers les buckets Supabase adaptés et met à jour leurs références dans les annonces, les plans et la bibliothèque. L’import est reprenable : les références déjà migrées sont ignorées. Le projet contient environ 200 Mo de médias.

Les fichiers sources de `src/img` ne sont pas versionnés. Les médias retenus pour les annonces `A-VENDRE/NEWS` et le service `AMENAGEMENT` sont normalisés et versionnés dans `public/property-media/news` et `public/service-media/moving` pour l’affichage public. Les quatre annonces sont enregistrées par la migration 12. Pour pouvoir ensuite gérer les médias d’aménagement depuis **Admin → Services & médias → Bibliothèque médias**, il faudra importer le dossier correspondant dans Supabase Storage puis retirer le secours statique du site.

L’inspection des aperçus classe `AMENAGEMENT` comme déménagement/aménagement, `CONSTRUCTION` comme chantier et `PLAN-3D` comme architecture. Aucun lot n’identifie clairement des opérations de nettoyage : les photos de cette catégorie doivent être confirmées par le client avant d’être associées à Cleaner et publiées.

## Configurer Resend pour les courriels d’authentification

L’admin utilise Supabase Auth (connexion par e-mail et mot de passe). Il ne faut pas ajouter NextAuth/Prisma : cela créerait un second système d’authentification distinct des rôles Supabase.

1. Dans Resend, créer une clé API SMTP dédiée et vérifier le domaine d’envoi DAFS Sarlu (DNS SPF/DKIM).
2. Dans Supabase **Authentication → Email → SMTP Settings**, activer le SMTP personnalisé et saisir :
   - Host : smtp.resend.com
   - Port : 465 (SSL)
   - Username : resend
   - Password : la clé API SMTP Resend (secret)
   - Sender email : une adresse no-reply sur le domaine vérifié
   - Sender name : DAFS Sarlu
3. Enregistrer puis utiliser **Send test email** depuis Supabase. Ne pas mettre la clé Resend dans NEXT_PUBLIC_*, dans un fichier .env.example ou dans Git.

onboarding@resend.dev est réservé aux essais ; utilisez un domaine vérifié pour les e-mails de production. La configuration SMTP se fait dans Supabase, pas dans Next.js ni dans Vercel.
