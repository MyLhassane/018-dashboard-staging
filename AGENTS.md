# AGENTS.md - El Phenomeno Dashboard (STAGING)

## ⚠️ CRITICAL RULES

### Human in the Loop
- **NEVER push to GitHub without explicit user request**
- **NEVER deploy to Vercel without explicit user request**
- **The user is the final decision maker - always wait for approval**
- **We are in development mode - do NOT deploy unless told explicitly**
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
| GitHub | `MyLhassane/018-dashboard-staging` |
| Vercel | `elphenomeno-dashboard-staging.vercel.app` |

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
- ✅ Fulfilled from production (all pages, components, i18n)
- ✅ Publisher to GitHub challenges repo (`src/lib/publisher.ts`)
- ✅ i18n keys for publish flow (ar, en, fr)
- ✅ Deployed to Vercel

### Completed - Accordion Challenges UI (Sprint 2026-06-30)
- ✅ Challenges nav link → accordion with 5 game sub-items in Sidebar
- ✅ Routes: `/challenges/connections`, `/challenges/factor`, `/challenges/decode`, `/challenges/impostor`, `/challenges/grid`
- ✅ GameChallenges.tsx — per-game page with add/edit/publish/delete + search
- ✅ Game-specific editor components in `src/components/challenges/`:
  - `ConnectionsEditor` — Full grid editor (remit cells + players with v[] assignments)
  - `FactorEditor` — Trait categories + one primary trait per player
  - `DecodeEditor` — Mystery player selector + 9 clue progression (order, text, answer)
  - `ImpostorEditor` — Category selector + player list with impostor/real toggle
  - `GridEditor` — Row/column category selectors + 3×3 grid cell assignment
- ✅ types.ts: Added `GameType`, `DecodeClue`, `ImpostorConfig`, `GridConfig`, extended `Challenge` with `gameType`
- ✅ i18n: `games.*` and `gameChallenges.*` keys in all 3 locales (ar, en, fr)
- ✅ Build passes clean

### Current Data Architecture
```
Challenge {
  gameNumber: number
  gameType: "connections" | "factor" | "decode" | "impostor" | "grid"
  remit: RemitItem[][]          // categories grid (Connections, Factor)
  players: ChallengePlayer[]    // players with v: number[] (Connections: categories, Factor: traits)
  decodeConfig?: DecodeClue[]   // Decode R9: 9 clues with order/text/answer
  impostorConfig?: ImpostorConfig  // Impostor: { categoryId, impostorPlayerId }
  gridConfig?: GridConfig          // Grid: { rowCategories, columnCategories, cells }
  publishedAt: string | null
  updatedAt, updatedBy
}
```

### New Architecture — Game Challenges (2026-06-30)
- **New Firebase path**: `elphenomeno/challenges/{gameType}/{gameNumber}` (separate from old `challenges/{gameNumber}`)
- **JSON upload button** on each game's challenges page — upload `.json` file directly to Firebase (bypasses Firebase Console's destructive import)
- **Auto-index**: Each game type gets `elphenomeno/challenges/{gameType}/index.json` auto-generated on write/delete
- **Publish to GitHub**: `publishGameChallenge()` and `publishAllGameChallenges()` write to `elphenomeno/challenges/{gameType}/{gameNumber}.json`
- `db.ts`: Added `getGameChallenges()`, `setGameChallenge()`, `removeGameChallenge()`, `getGameChallengeIndex()`
- `publisher.ts`: Added `publishGameChallenge()`, `publishGameIndex()`, `unpublishGameChallenge()`, `publishAllGameChallenges()`
- `GameChallenges.tsx`: Rewritten to load/save from new path + JSON upload modal
- Old `challenges/{gameNumber}` path left completely untouched

### Fixes Applied (2026-06-30)
- ✅ `publisher.ts`: `stripInternalFields` now keeps `gameType`, `decodeConfig`, `impostorConfig`, `gridConfig`
- ✅ `db.ts`: `getFullChallengeList` returns all new fields (`gameType`, optional configs`)
- ✅ Real connections challenge data created at `new_connections_challenge.json` (uses real players from Firebase export)
- ⚠️ Push script at `push_challenge.py` — run with Firebase credentials to deploy challenge #1109

## Important Notes

### This is STAGING
- This version is for testing only
- Partners do NOT see this
- Safe to experiment and break things

## Deployment
```bash
git push origin main
vercel --prod --yes
# Live at: https://elphenomeno-dashboard-staging.vercel.app
```

## Resources
- **GitHub:** https://github.com/MyLhassane/018-dashboard-staging
- **Vercel:** https://elphenomeno-dashboard-staging.vercel.app
- **Firebase:** https://console.firebase.google.com/project/zero-seventeen-dashboard
