import { db, ref, get, set, update, remove, query, orderByChild, limitToLast } from "./firebase";
import type { Challenge, Player, Category, GameConfig, Deployment, DevLogEntry, DevLogStatus, ActivityEntry } from "./types";

function dashRef(...paths: string[]) {
  return ref(db, paths.join("/"));
}

// Challenges
export async function getChallengeList(): Promise<{ gameNumber: number }[]> {
  const snap = await get(dashRef("challenges"));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.keys(data).map((k) => ({
    gameNumber: data[k].gameNumber ?? Number(k),
  }));
}

export async function getChallenge(gameNumber: number): Promise<Challenge | null> {
  const snap = await get(dashRef("challenges", String(gameNumber)));
  return snap.exists() ? (snap.val() as Challenge) : null;
}

export async function setChallenge(gameNumber: number, data: Challenge): Promise<void> {
  await set(dashRef("challenges", String(gameNumber)), data);
}

// Players
export async function getPlayerList(): Promise<{ id: number; f: string; g: string; challengeCount: number; positions: string[] }[]> {
  const snap = await get(dashRef("players"));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.values(data).map((p: any) => ({
    id: p.id, f: p.f, g: p.g,
    challengeCount: p.challengeCount ?? 0,
    positions: p.positions ?? [],
  }));
}

export async function getPlayer(id: number): Promise<Player | null> {
  const snap = await get(dashRef("players", String(id)));
  return snap.exists() ? (snap.val() as Player) : null;
}

export async function setPlayer(id: number, data: Player): Promise<void> {
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await set(dashRef("players", String(id)), cleaned);
}

// Categories
export async function getCategories(): Promise<Record<string, Category>> {
  const snap = await get(dashRef("categories"));
  return snap.exists() ? (snap.val() as Record<string, Category>) : {};
}

export async function setCategory(id: string, data: Category): Promise<void> {
  await set(dashRef("categories", String(id)), data);
}

// Config
export async function getConfig(): Promise<GameConfig | null> {
  const snap = await get(dashRef("config"));
  return snap.exists() ? (snap.val() as GameConfig) : null;
}

export async function setConfig(data: GameConfig): Promise<void> {
  await update(dashRef("config"), data as any);
}

// Search
export async function searchPlayers(query: string): Promise<{ id: number; f: string; g: string; challengeCount: number; positions: string[] }[]> {
  const list = await getPlayerList();
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(
    (p) =>
      String(p.id).includes(q) ||
      p.f?.toLowerCase().includes(q) ||
      p.g?.toLowerCase().includes(q)
  );
}

export async function getFullChallengeList(): Promise<Challenge[]> {
  const snap = await get(dashRef("challenges"));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.values(data).map((c: any) => ({
    gameNumber: c.gameNumber,
    remit: c.remit ?? [],
    players: c.players ?? [],
    publishedAt: c.publishedAt ?? null,
    updatedAt: c.updatedAt ?? "",
    updatedBy: c.updatedBy ?? "",
  }));
}

export async function getFullPlayerList(): Promise<Player[]> {
  const snap = await get(dashRef("players"));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.values(data).map((p: any) => ({
    id: p.id, f: p.f ?? "", g: p.g ?? "",
    positions: p.positions ?? [],
    categoryLinks: p.categoryLinks ?? {},
    challengeCount: p.challengeCount ?? 0,
    difficulty: p.difficulty ?? undefined,
    image: p.image ?? undefined,
  }));
}

// Delete
export async function deleteChallenge(gameNumber: number): Promise<void> {
  await remove(dashRef("challenges", String(gameNumber)));
}

export async function deletePlayer(id: number): Promise<void> {
  await remove(dashRef("players", String(id)));
}

export async function deleteCategory(id: string): Promise<void> {
  await remove(dashRef("categories", id));
}

// Deployments
export async function getDeployments(): Promise<Deployment[]> {
  const snap = await get(dashRef("deployments"));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.values(data).sort(
    (a: any, b: any) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
  ) as Deployment[];
}

export async function recordDeployment(data: Deployment): Promise<void> {
  const key = new Date().toISOString().replace(/[:.]/g, "-");
  await set(dashRef("deployments", key), data);
}

// Dashboard overview stats
export async function getDashboardStats(): Promise<{
  totalPlayers: number;
  totalChallenges: number;
  totalCategories: number;
  lastDeployment: string | null;
}> {
  const [playersSnap, challengesSnap, categoriesSnap, deploymentsSnap] = await Promise.all([
    get(dashRef("players")),
    get(dashRef("challenges")),
    get(dashRef("categories")),
    get(dashRef("deployments")),
  ]);
  const totalPlayers = playersSnap.exists() ? Object.keys(playersSnap.val()).length : 0;
  const totalChallenges = challengesSnap.exists() ? Object.keys(challengesSnap.val()).length : 0;
  const totalCategories = categoriesSnap.exists() ? Object.keys(categoriesSnap.val()).length : 0;
  let lastDeployment: string | null = null;
  if (deploymentsSnap.exists()) {
    const deploys = Object.values(deploymentsSnap.val()) as Deployment[];
    const latest = deploys.sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())[0];
    lastDeployment = latest?.vercelUrl ?? null;
  }
  return { totalPlayers, totalChallenges, totalCategories, lastDeployment };
}

// DevLog
export async function getDevLog(): Promise<DevLogEntry[]> {
  const snap = await get(dashRef("devLog"));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.values(data)
    .sort((a: any, b: any) => (b.timestamp ?? 0) - (a.timestamp ?? 0)) as DevLogEntry[];
}

export async function addDevLogEntry(entry: DevLogEntry): Promise<void> {
  await set(dashRef("devLog", entry.id), entry);
}

export async function updateDevLogStatus(id: string, status: DevLogStatus): Promise<void> {
  const snap = await get(dashRef("devLog", id));
  if (snap.exists()) {
    await set(dashRef("devLog", id, "status"), status);
  }
}

export async function deleteDevLogEntry(id: string): Promise<void> {
  await remove(dashRef("devLog", id));
}

// Activity Log
export async function getRecentActivity(limit = 20): Promise<ActivityEntry[]> {
  const [playersSnap, challengesSnap, categoriesSnap, configSnap] = await Promise.all([
    get(dashRef("players")),
    get(dashRef("challenges")),
    get(dashRef("categories")),
    get(dashRef("config")),
  ]);

  const entries: ActivityEntry[] = [];

  if (playersSnap.exists()) {
    const data = playersSnap.val();
    Object.values(data).forEach((p: any) => {
      if (p.updatedAt) {
        entries.push({
          table: "players",
          action: p.f ? `تم تعديل اللاعب #${p.id}` : `لاعب جديد #${p.id}`,
          description: p.g && p.f ? `${p.g} ${p.f}` : `لاعب #${p.id}`,
          updatedAt: p.updatedAt,
        });
      }
    });
  }

  if (challengesSnap.exists()) {
    const data = challengesSnap.val();
    Object.values(data).forEach((c: any) => {
      if (c.updatedAt) {
        entries.push({
          table: "challenges",
          action: `تم تعديل التحدي #${c.gameNumber}`,
          description: `${c.players?.length ?? 0} لاعب`,
          updatedAt: c.updatedAt,
        });
      }
    });
  }

  if (categoriesSnap.exists()) {
    const data = categoriesSnap.val();
    Object.values(data).forEach((cat: any) => {
      if (cat.updatedAt) {
        entries.push({
          table: "categories",
          action: `تم تعديل التصنيف`,
          description: cat.name ?? cat.id,
          updatedAt: cat.updatedAt,
        });
      }
    });
  }

  if (configSnap.exists()) {
    const cfg = configSnap.val();
    if (cfg.updatedAt) {
      entries.push({
        table: "config",
        action: "تم تعديل الإعدادات",
        description: "إعدادات اللعبة",
        updatedAt: cfg.updatedAt,
      });
    }
  }

  return entries
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}
