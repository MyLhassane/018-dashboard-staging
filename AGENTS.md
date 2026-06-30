# AGENTS.md - El Phenomeno Dashboard (STAGING)

## ⚠️ CRITICAL RULES

### Human in the Loop
- **NEVER push to GitHub without explicit user request**
- **NEVER deploy to Vercel without explicit user request**
- **The user is the final decision maker - always wait for approval**
- **DO NOT delete or overwrite existing data in Firebase without confirmation**

### Code Quality
- Run `npm run test` after every change
- Run `npx tsc --noEmit` to typecheck before committing
- Arabic is the primary language - all UI defaults to Arabic RTL
- Translations must be added to all 3 locales (ar, en, fr) simultaneously
- Commit messages in English, following conventional commits

## Project Structure

### Production (Partners See This)
| Location | Path |
|----------|------|
| Local | `/Users/hassan/01_Workspaces/dev/active/017-fifa_world_cup_2026/017-dashboard` |
| GitHub | `MyLhassane/zero-seventeen-dashboard` |
| Vercel | `017-dashboard.vercel.app` |

### Staging (Testing Only) - THIS IS STAGING
| Location | Path |
|----------|------|
| Local | `/Users/hassan/01_Workspaces/dev/active/018-elphenomeno/elphenomeno-dashboard-staging` |
| GitHub | `018-dashboard-staging` |
| Vercel | `zero-seventeen-dashboard-staging.vercel.app` |

### Image Storage
| Environment | GitHub Repo |
|-------------|-------------|
| Production | `MyLhassane/fifa2026-images` |
| Cloudflare Worker | `fifa2026-upload.mylhassane.workers.dev` |

### Challenge Storage
| Environment | GitHub Repo |
|-------------|-------------|
| Production | `MyLhassane/fifa2026-challenges` |
| Staging | `MyLhassane/fifa2026-challenges-staging` |

## Tech Stack
- React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- Firebase Auth + Realtime Database
- i18next + react-i18next (ar, en, fr)
- Deploy: Vercel (SPA, direct deploy)

## Firebase Isolation
- Dashboard: `zero-seventeen-dashboard` project
- Game: `fifa-world-cup-2026-7d608` project (separate, no shared data)

## Current State (2026-06-30)

### Completed
- ✅ Phase 1: Foundation (Vite, React, Tailwind, Firebase)
- ✅ Phase 2: Core Dashboard (Players, Challenges, Categories pages)
- ✅ Pagination (25/page, mobile-first)
- ✅ Image upload via Cloudflare Worker → GitHub
- ✅ Offline-first with IndexedDB + sync engine
- ✅ Vercel deployment with SPA routing

### Staging Experiments
- ✅ Publisher to GitHub challenges repo
- ✅ i18n keys for publish flow
- 🔄 Testing challenge publishing

## Important Notes

### This is STAGING
- This version is for testing only
- Partners do NOT see this
- Safe to experiment and break things

### Deployment
```bash
git push origin main
vercel --prod --yes
# Live at: https://zero-seventeen-dashboard-staging.vercel.app
```

## Resources
- **GitHub:** `018-dashboard-staging`
- **Vercel:** `zero-seventeen-dashboard-staging.vercel.app`
- **Firebase:** https://console.firebase.google.com/project/zero-seventeen-dashboard
