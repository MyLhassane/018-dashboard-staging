# FIFA World Cup 2026 — Admin Dashboard

Private admin dashboard for managing the FIFA World Cup 2026 interactive game. Firewalled — no public access, no discoverable URL.

## Stack

- **React 19** + **TypeScript 6**
- **Vite 8** + **Tailwind CSS 4**
- **Firebase Auth** (Email/Password) — admin-only login
- **Firebase Realtime Database** — flat RTDB structure (no nesting)
- **Vercel** — deployment

## Structure

```
src/
├── components/
│   ├── layout/     AppShell, Sidebar, BottomNav (mobile-first)
│   └── ui/         Button, StatCard, CategoryPicker, EmptyState
├── contexts/       AuthContext (Firebase Auth)
├── lib/            firebase.ts, db.ts, types.ts
└── pages/          Overview, Challenges, Players, Categories, Config, Publish, Login
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Firebase RTDB Paths

All collections sit at root level:

- `admins/` — admin accounts
- `challenges/` — game challenges
- `players/` — player profiles
- `categories/` — challenge categories
- `config/` — game configuration
- `deployments/` — deployment records

## Auth

Email/Password login only. No OAuth. No public registration. Admin accounts created manually in Firebase Console.

## Deployment

Deployed via Vercel. Build output in `dist/`. SPA rewrite handled in `vercel.json`.
