# CECA-Solutions - Plateforme de formation en ligne

Plateforme React (Vite) mockup pour CECA-Solutions, cabinet africain spécialisé en gouvernance publique, marchés publics, audit et formation.

## Prérequis
- Node.js v18+ et npm
- macOS (zsh)

## Installation
```bash
cd /Users/apple/Desktop/Plate-Form-\ ceca
npm install
npm run dev
```

Ouvrir `http://localhost:5173`.

## Fonctions incluses
- Pages : Accueil, Catalogue, Détail formation, E-learning, À propos, Références, Contact, Admin
- E-learning : vidéos (embed), PDFs, quiz, progression sauvegardée (localStorage)
- Génération de certificats PDF via `jsPDF` (exemple client)
- SEO de base avec meta tags

Pour intégrer paiements (Wave / Orange Money / Stripe), connecter les SDKs côté back-end et remplacer les placeholders dans `src/pages/Formation.jsx`.

Supabase — configuration pas à pas
--------------------------------

Ce projet utilise Supabase pour l'authentification et peut utiliser Supabase comme base de données (option frontend-only ou backend). Suivez ces étapes pour créer un projet Supabase et configurer les variables d'environnement nécessaires.

1) Créer un projet Supabase
- Inscrivez-vous sur https://app.supabase.com et créez un nouveau projet.
- Notez l'URL du projet (ex: `https://xyzcompany.supabase.co`) et la `anon` key (publique) dans la section "Project Settings → API".
- Dans "Project Settings → API" récupérez aussi la `service_role` key si vous prévoyez d'utiliser des opérations admin côté serveur (NE JAMAIS exposer la `service_role` key dans le frontend).

2) Variables d'environnement
- Créez un fichier `.env` à la racine du projet (ou utilisez votre gestionnaire d'environnement). Vite n'expose que les variables préfixées par `VITE_` au client.

Exemple `.env` (à la racine pour le frontend) :

VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...

Si vous utilisez le serveur Express (optionnel) créez `server/.env` :

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...  # garder secret, ne commitez pas

- Après création/modification du fichier `.env`, relancez le serveur de développement (`npm run dev`).

3) Tables recommandées et RLS (exemple SQL)
-- Créez une table `profiles` pour stocker les métadonnées utilisateur liées à `auth.users` :

```sql
create table profiles (
	id uuid references auth.users on delete cascade,
	full_name text,
	role text,
	created_at timestamptz default now(),
	primary key (id)
);

-- Activer RLS et politiques pour que chaque utilisateur puisse gérer son profil
alter table profiles enable row level security;

create policy "Allow select for owner" on profiles
	for select using (auth.uid() = id);

create policy "Allow insert for owner" on profiles
	for insert with check (auth.uid() = id);

create policy "Allow update for owner" on profiles
	for update using (auth.uid() = id) with check (auth.uid() = id);
```

Remarque : adaptez les politiques à vos cas d'usage (formateurs/admins). Pour certaines opérations (ex : création de cours approuvés) vous pouvez utiliser le serveur avec la `service_role` key.

4) Intégration dans le projet
- Le client Supabase est initialisé dans `src/lib/supabase.js`. Exemple d'utilisation (déjà inclus dans le projet) :

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
```

- Le contexte d'auth (`src/context/AuthContext.jsx`) montre un exemple simple d'inscription et de connexion côté client via Supabase Auth.

5) Bonnes pratiques et sécurité
- Ne publiez jamais la `service_role` key côté client. Utilisez-la uniquement côté serveur pour opérations admin.
- Activez les politiques RLS (Row Level Security) sur les tables sensibles.
- Activez la vérification email dans Supabase Auth si vous souhaitez valider les comptes.

6) Commandes utiles (macOS, zsh)
```bash
# installer les dépendances frontend
cd "/Users/apple/Desktop/Plate-Form- ceca"
npm install

# lancer le frontend (après avoir ajouté .env)
npm run dev

# (optionnel) lancer le serveur Express local (si utilisé)
cd server
npm install
npm run dev
```

7) Prochaines étapes suggérées
- Créer une table `courses` et `enrollments` dans Supabase pour persister catalogues et inscriptions.
- Ajouter webhooks ou fonctions Edge pour générer et signer des certificats côté serveur lorsque l'apprenant réussit une évaluation.
- Configurer une stratégie de sauvegarde des assets (PDFs, vidéos) via Supabase Storage ou un CDN.

