# Déploiement de l’espace admin

L’application est préparée pour Vercel avec Next.js. Configurer ces variables dans le projet d’hébergement :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PUBLIC_SITE_URL`

Le schéma Supabase doit être appliqué avant la première connexion. Créer ensuite le premier compte Auth et lui attribuer le rôle administrateur selon `DAFS-Services/supabase/SETUP.md`.

Dans Supabase **Authentication → URL Configuration**, ajouter l’URL HTTPS de l’admin aux URL du site et de redirection. Configurer un SMTP dédié pour les courriels d’authentification avant d’ouvrir l’accès.

Le dépôt GitHub contient les deux applications. Dans Vercel, importer ce dépôt et définir **Root Directory** sur admin. Le guide commun se trouve dans ../DEPLOYMENT.md.

Les annonces, plans, demandes clients et coordonnées sont gérés par l’admin. Les modules barèmes/simulateur, gestion des utilisateurs, rapports et réservations détaillées nécessitent encore leur modèle de données et leurs règles métier.
