import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import type { Challenge, Player, Category, GameConfig } from "../lib/types";
import { syncAll, setChallenge, setPlayer, setCategory, setConfig as setConfigDb } from "../lib/sync-engine";
import { deleteChallenge, deletePlayer, deleteCategory } from "../lib/db";
import i18n from "i18next";
import {
  getAll, put, del, addPending, getPending, getMeta, setMeta, onOnlineChange,
  getSyncLog, type SyncLogEntry, type StoreName,
} from "../lib/local-db";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface DataContextValue {
  challenges: Challenge[];
  players: Player[];
  categories: Record<string, Category>;
  config: GameConfig | null;
  loading: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncLog: SyncLogEntry[];
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
  updateChallenge: (gameNumber: number, data: Challenge) => void;
  addChallenge: (data: Challenge) => void;
  removeChallenge: (gameNumber: number) => void;
  updatePlayer: (id: number, data: Player) => void;
  addPlayer: (data: Player) => void;
  removePlayer: (id: number) => void;
  updateCategory: (id: string, data: Category) => void;
  addCategory: (data: Category) => void;
  removeCategory: (id: string) => void;
  updateConfig: (data: GameConfig) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [config, setConfigState] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncLog, setSyncLogEntries] = useState<SyncLogEntry[]>([]);
  const pendingRef = useRef(0);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const refreshPendingCount = useCallback(async () => {
    try {
      const p = await getPending();
      if (mountedRef.current) setPendingCount(p.length);
    } catch {}
  }, []);

  const showSaved = useCallback(() => {
    setSaveStatus("saved");
    setSaveError(null);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  }, []);

  const saveToLocal = useCallback(async (table: StoreName, key: string | number, data: any, action: "update" | "delete" = "update") => {
    try {
      if (action === "delete") {
        await del(table, key);
      } else {
        await put(table, key, data);
      }
      await addPending({ table, key, action, data: action === "update" ? data : null, timestamp: Date.now() });
      await refreshPendingCount();
    } catch {}
  }, [refreshPendingCount]);

  const loadFromLocal = useCallback(async () => {
    try {
      const [localChal, localPlay, localCat, localConf] = await Promise.all([
        getAll<Challenge>("challenges"),
        getAll<Player>("players"),
        getAll<Category>("categories"),
        getAll<GameConfig>("config"),
      ]);
      setChallenges(Object.values(localChal).filter(Boolean));
      setPlayers(Object.values(localPlay).filter(Boolean));
      setCategories(localCat || {});
      if (localConf?._main) setConfigState(localConf._main);
    } catch {}
  }, []);

  const syncNow = useCallback(async () => {
    const current = { challenges, players, categories, config };
    const result = await syncAll(current);
    if (!mountedRef.current) return;
    if (result.pulled) {
      await loadFromLocal();
      setLastSyncTime(Date.now());
    }
    await refreshPendingCount();
    try {
      const log = await getSyncLog();
      setSyncLogEntries(log);
    } catch {}
    if (result.conflicts > 0) {
      setSaveStatus("saved");
      setSaveError(i18n.t("sync.conflict", { count: result.conflicts }));
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => { setSaveStatus("idle"); setSaveError(null); }, 3000);
    }
    return result;
  }, [challenges, players, categories, config, loadFromLocal, refreshPendingCount]);

  // Initial load: IndexedDB first → background sync
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await loadFromLocal();
      if (mountedRef.current) setLoading(false);
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        try {
          await syncNow();
        } catch {}
      }
    })();
    const unsub = onOnlineChange((online) => {
      if (mountedRef.current) setIsOnline(online);
    });
    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    await syncNow();
  }, [syncNow]);

  const localSaveWithFirebase = useCallback(async (table: StoreName, key: string | number, data: any, firebaseFn: () => Promise<void>) => {
    await saveToLocal(table, key, data);
    pendingRef.current++;
    setSaveStatus("saving");
    try {
      await firebaseFn();
      pendingRef.current--;
      if (pendingRef.current === 0) showSaved();
    } catch {
      pendingRef.current--;
      setSaveStatus("error");
      setSaveError(i18n.t("sync.offline"));
    }
  }, [saveToLocal, showSaved]);

  const updateChallenge = useCallback((gameNumber: number, data: Challenge) => {
    setChallenges((prev) => prev.map((c) => (c.gameNumber === gameNumber ? data : c)));
    localSaveWithFirebase("challenges", gameNumber, data, () => setChallenge(gameNumber, data));
  }, [localSaveWithFirebase]);

  const addChallenge = useCallback((data: Challenge) => {
    setChallenges((prev) => [...prev, data]);
    localSaveWithFirebase("challenges", data.gameNumber, data, () => setChallenge(data.gameNumber, data));
  }, [localSaveWithFirebase]);

  const removeChallenge = useCallback((gameNumber: number) => {
    setChallenges((prev) => prev.filter((c) => c.gameNumber !== gameNumber));
    (async () => {
      await saveToLocal("challenges", gameNumber, null, "delete");
      try { await deleteChallenge(gameNumber); } catch {}
    })();
  }, [saveToLocal]);

  const updatePlayer = useCallback((id: number, data: Player) => {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    setPlayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
    localSaveWithFirebase("players", id, updated, () => setPlayer(id, updated));
  }, [localSaveWithFirebase]);

  const addPlayer = useCallback((data: Player) => {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    setPlayers((prev) => [updated, ...prev]);
    localSaveWithFirebase("players", updated.id, updated, () => setPlayer(updated.id, updated));
  }, [localSaveWithFirebase]);

  const removePlayer = useCallback((id: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    (async () => {
      await saveToLocal("players", id, null, "delete");
      try { await deletePlayer(id); } catch {}
    })();
  }, [saveToLocal]);

  const updateCategory = useCallback((id: string, data: Category) => {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    setCategories((prev) => ({ ...prev, [id]: updated }));
    localSaveWithFirebase("categories", id, updated, () => setCategory(id, updated));
  }, [localSaveWithFirebase]);

  const addCategory = useCallback((data: Category) => {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    setCategories((prev) => ({ ...prev, [updated.id]: updated }));
    localSaveWithFirebase("categories", updated.id, updated, () => setCategory(updated.id, updated));
  }, [localSaveWithFirebase]);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    (async () => {
      await saveToLocal("categories", id, null, "delete");
      try { await deleteCategory(id); } catch {}
    })();
  }, [saveToLocal]);

  const updateConfig = useCallback((data: GameConfig) => {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    setConfigState(updated);
    localSaveWithFirebase("config", "_main", updated, () => setConfigDb(updated));
  }, [localSaveWithFirebase]);

  return (
    <DataContext.Provider value={{
      challenges, players, categories, config, loading, saveStatus, saveError,
      isOnline, pendingCount, lastSyncTime, syncLog,
      refresh, syncNow,
      updateChallenge, addChallenge, removeChallenge,
      updatePlayer, addPlayer, removePlayer,
      updateCategory, addCategory, removeCategory,
      updateConfig,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
