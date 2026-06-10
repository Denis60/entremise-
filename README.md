# Entremise — MVP

Plateforme d'intermédiation économique régionale par IA (concours « Les Idées Neuves » CMSO).
*Ce n'est pas un annuaire : c'est une IA qui fait mûrir les besoins et révèle les solutions du territoire.*

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase** : auth (e-mail/mot de passe), Postgres avec RLS, fonctions SECURITY DEFINER (aucune clé service_role nécessaire)
- **Claude Sonnet** (API Anthropic) : maturation du besoin, anonymisation, matching, relais des contributions

## Démarrage local

```bash
npm install
# renseigner ANTHROPIC_API_KEY dans .env.local
npm run dev
```

`.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://rujbwdfmaczakuahxnjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon du projet>
ANTHROPIC_API_KEY=<clé console.anthropic.com>
ANTHROPIC_MODEL=claude-sonnet-4-6
```

## Déploiement Vercel

1. Pousser ce dossier sur un repo Git (GitHub).
2. Importer dans Vercel, ajouter les 4 variables d'environnement ci-dessus.
3. Dans Supabase → Authentication → URL Configuration : ajouter l'URL Vercel
   comme *Site URL* et `https://<app>.vercel.app/auth/callback` dans *Redirect URLs*.

## Conseil démo

Supabase → Authentication → Providers → Email : désactiver **Confirm email**
pour permettre des inscriptions instantanées pendant une démo.

## Périmètre fonctionnel (note fonctionnelle v2 du 10/06/2026)

- Parcours demandeur : conversation