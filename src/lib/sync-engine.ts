import {
  getFullChallengeList, getFullPlayerList, getCategories as getFirebaseCategories,
  getConfig as getFirebaseConfig,
  setChallenge, setPlayer, setCategory, setConfig as setConfigDb,
  deleteChallenge, deletePlayer, deleteCategory,
} from "./db";
import type { Challenge, Player, Category, GameConfig } from "./types";
import {
  getAll, put, del, getMeta, setMeta, addPending, getPending, clearPending, addSyncLog,
  type StoreName,
} from "./local-db";

const META_LAST_SYNC = "lastSyncTime";
const META_CONFLICT_COUNT = "conflictCount";

function stripMeta<T>(data: T): T {
  if (typeof data === "object" && data !== null) {
    const { _t, ...rest } = data as any;
    return rest as T;
  }
  return data;
}

// Push a single pending change to Firebase
async function pushChange(table: string, key: string | number, action: string, data: any): Promise<void> {
  switch (table) {
    case "challenges":
      if (action === "update") await setChallenge(Number(key), stripMeta(data));
      else await deleteChallenge(Number(key));
      break;
    case "players":
      if (action === "update") await setPlayer(Number(key), stripMeta(data));
      else await deletePlayer(Number(key));
      break;
    case "categories":
      if (action === "update") await setCategory(String(key), stripMeta(data));
      else await deleteCategory(String(key));
      break;
    case "config":
      if (action === "update") await setConfigDb(stripMeta(data));
      break;
  }
}

// Sync: push pending → pull all → overwrite local → log conflicts
export async function syncAll(
  currentLocal?: { challenges: Challenge[]; players: Player[]; categories: Record<string, Category>; config: GameConfig | null }
): Promise<{ pushed: number; pulled: boolean; conflicts: number; error: string | null }> {
  const result = { pushed: 0, pulled: false, conflicts: 0, error: null as string | null };

  try {
    // 1. Push pending changes
    const pending = await getPending();
    for (const change of pending) {
      try {
        await pushChange(change.table, change.key, change.action, change.data);
        result.pushed++;
      } catch (e: any) {
        await addSyncLog({
          timestamp: Date.now(), type: "error",
          table: change.table, key: change.key,
          message: `فشل دفع التغيير: ${e?.message || "خطأ غير معروف"}`,
          localData: change.data,
        });
      }
    }

    // 2. Pull all from Firebase
    const [remoteChallenges, remotePlayers, remoteCategories, remoteConfig] = await Promise.all([
      getFullChallengeList(),
      getFullPlayerList(),
      getFirebaseCategories(),
      getFirebaseConfig(),
    ]);

    // 3. Detect conflicts and overwrite local
    const lastSync = (await getMeta(META_LAST_SYNC)) || 0;

    // Challenges
    for (const remote of remoteChallenges) {
      const key = remote.gameNumber;
      const local = currentLocal?.challenges.find((c) => c.gameNumber === key);
      if (local) {
        const localT = (local as any)._t || 0;
        const remoteT = new Date(remote.updatedAt || 0).getTime();
        if (localT > lastSync && remoteT > lastSync && Math.abs(remoteT - localT) > 5000) {
          // Conflict: both changed since last sync
          result.conflicts++;
          await addSyncLog({
            timestamp: Date.now(), type: "conflict",
            table: "challenges", key,
            message: "تعارض: التعديل المحلي والبعيد — تم حفظ المحلي وسجل البعيد",
            localData: local, remoteData: remote,
          });
          await setMeta(META_CONFLICT_COUNT, result.conflicts);
        }
      }
      await put("challenges", key, remote);
    }

    // Players
    for (const remote of remotePlayers) {
      const key = remote.id;
      await put("players", key, remote);
    }

    // Categories
    for (const [key, remote] of Object.entries(remoteCategories)) {
      await put("categories", key, remote);
    }

    // Config
    if (remoteConfig) {
      await put("config", "_main", remoteConfig);
    }

    // 4. Clear pending (successfully pushed)
    await clearPending();

    // 5. Update last sync time
    await setMeta(META_LAST_SYNC, Date.now());

    result.pulled = true;

    await addSyncLog({
      timestamp: Date.now(), type: "pull",
      table: "all", key: "_",
      message: `تمت المزامنة: دفع ${result.pushed} تغيير، سحب ${remoteChallenges.length} تحدي + ${remotePlayers.length} لاعب + ${Object.keys(remoteCategories).length} تصنيف`,
    });

  } catch (e: any) {
    result.error = e?.message || "فشلت المزامنة";
    await addSyncLog({
      timestamp: Date.now(), type: "error",
      table: "all", key: "_",
      message: result.error,
    });
  }

  return result;
}

// Export firebase functions for direct use by DataContext
export { setChallenge, setPlayer, setCategory, setConfigDb as setConfig };
