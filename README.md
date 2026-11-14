# Portfolio — ZAKARIA KADDOURI

Portfolio professionnel, minimaliste et responsive pour présenter des réalisations en conception mécanique et modélisation 3D SolidWorks.

- **Une seule page publique** : présentation courte, grille de toutes les réalisations, galeries d'images et visualiseur GLB interactif.
- **Administration** : `/admin/login` et `/admin/dashboard`, protégées par Supabase Auth et RLS.
- **Stockage permanent** : images et fichiers `.glb` dans Supabase Storage, métadonnées dans PostgreSQL.
- **Synchronisation** : Realtime Supabase, avec rechargement périodique et au retour de l'onglet en secours.

---

## 1. Structure du projet

```text
.
├── index.html
├── public/_redirects           # Réécritures Netlify pour les routes de l'application
├── vercel.json                 # Réécritures Vercel (si besoin)
├── .env.example
├── supabase/
│   ├── schema.sql              # Tables, administrateur unique, RLS, Storage, Realtime
│   ├── site-settings.sql       # Migration de l'image d'accueil pour un projet existant
│   └── stl-support.sql         # Migration pour accepter les modèles STL
├── public/                     # (aucun média requis : les visuels de démo sont inline)
└── src/
    ├── App.tsx                 # Routeur + protection de l'administration
    ├── index.css               # Design system et animations
    ├── main.tsx
    ├── assets/                 # Visuels de démonstration, intégrés au build
    ├── components/
    │   ├── ConfigNotice.tsx
    │   ├── ImageLightbox.tsx
    │   ├── Modal.tsx
    │   ├── Model3DViewer.tsx   # <model-viewer> / Three.js : caméra, zoom, pan, plein écran
    │   ├── ProjectCard.tsx
    │   ├── ProjectEditor.tsx   # CRUD, imports, couverture, GLB, aperçu, publication
    │   ├── ProjectPreview.tsx
    │   └── ProjectViewer.tsx
    ├── data/demo.ts            # Projets affichés uniquement sans configuration Supabase
    ├── lib/
    │   ├── auth.tsx            # Session Supabase Auth + vérification du rôle admin
    │   ├── projects.ts         # Lecture/écriture DB + upload/suppression Storage
    │   ├── supabase.ts         # Client public Supabase
    │   ├── types.ts
    │   └── utils.ts
    └── pages/
        ├── Home.tsx            # Page publique unique
        ├── Login.tsx
        └── Dashboard.tsx
```

---

## 2. Démarrage local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Renseignez `.env.local` :

```env
VITE_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_PUBLIQUE
VITE_CONTACT_EMAIL=votre-email@exemple.com
VITE_LINKEDIN_URL=https://www.linkedin.com/in/votre-profil/
```

> Utilisez uniquement la clé publique **anon** (ou la nouvelle clé **publishable**, reconnue aussi par `VITE_SUPABASE_PUBLISHABLE_KEY`). Ne placez jamais la clé `service_role` dans le frontend.

Sans ces variables, la page publique affiche un **aperçu de démonstration** avec cinq projets, dont un véritable GLB interactif ; l'administration est alors désactivée et indique la configuration à effectuer.

---

## 3. Configuration Supabase

### 3.1 Base de données, RLS et Storage

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez **SQL Editor → New query**.
   Pour une base déjà créée, exécutez aussi `supabase/video-support.sql` afin d'ajouter le stockage des vidéos. Une nouvelle base reçoit ces éléments directement via `supabase/schema.sql`.
3. Collez tout le contenu de `supabase/schema.sql`, puis cliquez sur **Run**.
4. Sur un projet déjà initialisé, exécutez `supabase/site-settings.sql` pour l'image d'accueil et `supabase/stl-support.sql` pour les modèles STL.

Le script crée :

| Élément | Rôle |
| --- | --- |
| `public.projects` | Titre, description, type (`images` / `model3d` / `video`), couverture, images, URL 3D ou vidéo, publication |
| `public.admin_users` | Liste des administrateurs ; contrainte `singleton` pour **un seul administrateur** |
| `public.is_admin()` | Fonction `SECURITY DEFINER` utilisée par les politiques RLS |
| `portfolio-images` | Bucket public en lecture, 10 Mo par image, JPG/PNG/WEBP/AVIF |
| `portfolio-models` | Bucket public en lecture, 50 Mo par fichier, GLB/STL |
| `portfolio-videos` | Bucket public en lecture, 50 Mo par fichier, MP4 ou WebM |
| Politiques RLS | Visiteurs : lecture des projets publiés uniquement. Administrateur : lecture de tout, création, modification, suppression et gestion des fichiers |
| Publication Realtime | Met à jour automatiquement la page publique après changement |

Les visiteurs anonymes ne possèdent aucune politique `INSERT`, `UPDATE` ou `DELETE` sur `projects` ni sur `storage.objects`.

### 3.2 Créer l'unique administrateur

1. **Authentication → Users → Add user** : créez un utilisateur avec email et mot de passe, et cochez la confirmation de l'email.
2. **Authentication → Providers → Email** : désactivez « Allow new users to sign up » afin qu'aucun autre compte ne puisse être créé publiquement.
3. Dans **SQL Editor**, remplacez l'email puis exécutez :

```sql
insert into public.admin_users (user_id)
select id from auth.users
where lower(email) = lower('votre-email-admin@exemple.com')
on conflict (user_id) do nothing;
```

Pour remplacer l'administrateur : `delete from public.admin_users;` puis réexécutez l'insertion.

Le mot de passe n'est jamais stocké dans JavaScript : il est transmis directement à Supabase Auth, qui gère le hachage, les JWT et les sessions. Le frontend vérifie aussi l'appartenance à `admin_users`, mais l'autorisation réelle est appliquée côté serveur par RLS.

### 3.3 Realtime

`schema.sql` ajoute `public.projects` à la publication `supabase_realtime`. Si votre projet désactive Realtime, l'application reste synchronisée grâce au rechargement toutes les 30 secondes, au focus de la fenêtre et au retour sur l'onglet.

---

## 4. Utilisation de l'administration

Accédez à :

- `http://localhost:5173/admin/login`
- `http://localhost:5173/admin/dashboard` (redirige vers la connexion sans session valide)

Depuis le tableau de bord :

- **Nouvelle réalisation** : titre, description, couverture, galerie d'images, modèle 3D ou vidéo MP4/WebM.
- **Modifier** : changer toutes les données, remplacer la couverture, ajouter/retirer des images, remplacer le GLB.
- **Prévisualiser** : ouvre l'aperçu local, la galerie ou le visualiseur 3D **avant enregistrement**.
- **Publier / Masquer** : contrôle la visibilité publique immédiate.
- **Supprimer** : supprime la ligne et les fichiers correspondants dans Storage.
- **Aperçu** sur une ligne : ouvre le rendu public du projet, publié ou non.
- **Réglages du site** : remplace l'image et les textes principaux du bloc d'accueil.

Formats et limites : images jusqu'à 10 Mo, modèles GLB ou STL et vidéos MP4/WebM jusqu'à 50 Mo. Les vidéos démarrent uniquement après un clic sur Lecture.

### Visualiseur 3D

Le composant Google `<model-viewer>` (basé sur Three.js) permet :

- rotation à la souris / au toucher ;
- zoom à la molette / au pincement ;
- déplacement de la caméra au clic droit ou avec deux doigts ;
- plein écran ;
- réinitialisation de la caméra ;
- rotation automatique activable/désactivable.

---

## 5. Déploiement sur Netlify

1. Poussez le projet sur GitHub/GitLab/Bitbucket (ne commitez pas `.env.local`).
2. Dans Netlify : **Add new site → Import an existing project**, puis choisissez le dépôt.
3. Configurez la commande de build `npm run build` et le dossier publié `dist`.
4. Dans **Site configuration → Environment variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (ou `VITE_SUPABASE_PUBLISHABLE_KEY`)
   - `VITE_CONTACT_EMAIL`
   - `VITE_LINKEDIN_URL`
5. Déployez, puis redéployez après toute modification des variables.
6. `public/_redirects` renvoie `/admin/*` vers `index.html` pour permettre l'accès direct aux routes d'administration. La dernière règle fournit aussi le fallback SPA.

L'URL publique affichera uniquement les projets `is_published = true`. L'administration reste accessible par son URL, mais toute opération non authentifiée est refusée par Supabase.

---

## 6. Notes

- Personnalisez `VITE_CONTACT_EMAIL` et `VITE_LINKEDIN_URL` : les valeurs par défaut sont des exemples.
- Les projets de démonstration ne sont **pas** enregistrés en base et disparaissent dès que Supabase est configuré.
- Les images de démonstration sont intégrées au HTML de production ; vos propres images et GLB sont stockés dans Supabase Storage.
- Le build utilise `vite-plugin-singlefile` : `dist/index.html` contient le CSS et le JavaScript de l'application.
