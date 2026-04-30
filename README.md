# mimio-popi-front

Application web de suivi de tâches et de statuts, construite avec React, TypeScript, Vite et Supabase.

---

## Stack technique

| Catégorie | Technologie |
|---|---|
| Framework UI | React 19 + TypeScript |
| Bundler | Vite 7 |
| Routage | React Router v7 |
| Backend / Auth | Supabase (PostgreSQL + Auth) |
| Tests | Vitest + Testing Library + jsdom |
| Déploiement | Vercel |

---

## Prérequis

- **Node.js** >= 22.x
- **npm** >= 10.x
- Un projet **Supabase** actif

---

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd mimio-popi-front

# Installer les dépendances
npm ci
```

---

## Variables d'environnement

Copier le fichier d'exemple et renseigner les valeurs :

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) de votre projet Supabase |
| `VITE_SITE_URL` | URL publique de l'application (ex : `https://mimio-popi.vercel.app`) |

> Ces variables sont exposées côté client via Vite. Ne pas y mettre de secrets sensibles.

---

## Scripts disponibles

```bash
# Démarrer le serveur de développement (http://localhost:5173)
npm run dev

# Compiler pour la production
npm run build

# Prévisualiser le build de production en local
npm run preview

# Linter (ESLint)
npm run lint

# Lancer les tests une seule fois
npm run test

# Lancer les tests en mode watch
npm run test:watch

# Lancer les tests avec l'interface graphique Vitest
npm run test:ui
```

---

## Structure du projet

```
src/
├── assets/          # Polices et icônes
├── components/      # Composants partagés (navbar, statuts, tâches, guards)
├── contexts/        # Contextes React (AuthContext)
├── lib/             # Client Supabase
├── pages/
│   ├── auth/        # Inscription, connexion, callback, mot de passe oublié/reset
│   ├── params/      # Onboarding, paramètres du profil
│   ├── room/        # Page Room
│   ├── statuses/    # Liste des statuts, détail d'un statut
│   └── tasks/       # Liste des tâches
├── services/        # Logique métier (auth, profil, tâches, statuts, validation)
├── test/            # Configuration des tests (setupTests.ts)
└── types/           # Types TypeScript partagés
```

---

## Routes de l'application

### Pages publiques

| Route | Description |
|---|---|
| `/signup` | Inscription |
| `/login` | Connexion |
| `/auth/callback` | Callback OAuth / magic link Supabase |
| `/forgot-password` | Demande de réinitialisation de mot de passe |
| `/reset-password` | Réinitialisation du mot de passe |
| `/privacy` | Politique de confidentialité |

### Pages protégées (authentification requise)

| Route | Description |
|---|---|
| `/onboarding` | Étape d'onboarding obligatoire à la première connexion |

### Pages protégées (authentification + onboarding requis)

| Route | Description |
|---|---|
| `/` | Tableau de bord des statuts |
| `/tasks` | Gestion des tâches |
| `/statuses/:statusKey` | Détail d'un statut |
| `/room` | Page Room |

> Les pages protégées redirigent vers `/login` si l'utilisateur n'est pas connecté, et vers `/onboarding` si le profil n'est pas encore configuré.

---

## Tests

Les tests utilisent **Vitest** avec **jsdom** et **@testing-library/react**.

```bash
npm run test
```

Les fichiers de test (`*.test.ts` / `*.test.tsx`) sont colocalisés avec les fichiers source qu'ils couvrent.

---

## Déploiement sur Vercel

Le projet est préconfiguré pour Vercel (`vercel.json`) avec :
- `npm ci` comme commande d'installation
- `npm run build` comme commande de build
- `dist/` comme répertoire de sortie
- Fallback SPA : toutes les routes renvoient vers `index.html`

### Variables d'environnement Vercel

Dans **Vercel Project Settings > Environment Variables**, ajouter :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL` → `https://mimio-popi.vercel.app`

### Configuration Supabase Auth

Dans **Supabase Dashboard > Authentication > URL Configuration** :

| Champ | Valeur |
|---|---|
| Site URL | `https://mimio-popi.vercel.app` |
| Redirect URLs | `https://mimio-popi.vercel.app/auth/callback` |
| Redirect URLs (local) | `http://localhost:5173/auth/callback` |

Pour les **preview deployments Vercel**, ajouter également :

- `https://*-mimio-popi.vercel.app/auth/callback`

---

## Développement local

```bash
# 1. Installer les dépendances
npm ci

# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Lancer le serveur de développement
npm run dev
# → http://localhost:5173
```

---

## Licence

Projet privé — tous droits réservés.

