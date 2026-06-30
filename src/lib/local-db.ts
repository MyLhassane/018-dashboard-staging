const DB_NAME = "zero-seventeen-dashboard";
const DB_VERSION = 1;

export type StoreName = "challenges" | "players" | "categories" | "config" | "pending" | "syncLog" | "meta";

export interface PendingChange {
  id?: number;
  table: "challenges" | "players" | "categories" | "config";
  key: string | number;
  action: "update" | "delete";
  data: any;
  timestamp: number;
}

export interface SyncLogEntry {
  id?: number;
  timestamp: number;
  type: "push" | "pull" | "conflict" | "error";
  table: string;
  key: string | number;
  message: string;
  localData?: any;
  remoteData?: any;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const stores = ["challenges", "players", "categories", "config", "pending", "syncLog", "meta"];
      for (const name of stores) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { autoIncrement: name === "pending" || name === "syncLog" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function exec<T>(storeName: StoreName, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export async function getAll<V = any>(storeName: StoreName): Promise<Record<string, V>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.openCursor();
    const result: Record<string, V> = {};
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        result[String(cursor.key)] = cursor.value;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function get<V = any>(storeName: StoreName, key: IDBValidKey): Promise<V | undefined> {
  return exec(storeName, "readonly", (store) => store.get(key));
}

export async function put(storeName: StoreName, key: IDBValidKey, value: any): Promise<void> {
  const data = typeof value === "object" && value !== null ? { ...value, _t: Date.now() } : value;
  await exec(storeName, "readwrite", (store) => store.put(data, key));
}

export async function del(storeName: StoreName, key: IDBValidKey): Promise<void> {
  await exec(storeName, "readwrite", (store) => store.delete(key));
}

export async function clearStore(storeName: StoreName): Promise<void> {
  await exec(storeName, "readwrite", (store) => store.clear());
}

export async function getMeta(key: string): Promise<any> {
  return get("meta", key);
}

export async function setMeta(key: string, value: any): Promise<void> {
  await put("meta", key, value);
}

export async function addPending(change: Omit<PendingChange, "id">): Promise<void> {
  await exec("pending", "readwrite", (store) => store.add(change));
}

export async function getPending(): Promise<PendingChange[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", "readonly");
    const store = tx.objectStore("pending");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function clearPending(): Promise<void> {
  await clearStore("pending");
}

export async function addSyncLog(entry: Omit<SyncLogEntry, "id">): Promise<void> {
  await exec("syncLog", "readwrite", (store) => store.add(entry));
}

export async function getSyncLog(limit = 50): Promise<SyncLogEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncLog", "readonly");
    const store = tx.objectStore("syncLog");
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result ?? []) as SyncLogEntry[];
      resolve(all.slice(-limit).reverse());
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getOnlineStatus(): Promise<boolean> {
  return navigator.onLine;
}

export function onOnlineChange(cb: (online: boolean) => void): () => void {
  const go = () => cb(true);
  const god = () => cb(false);
  window.addEventListener("online", go);
  window.addEventListener("offline", god);
  return () => {
    window.removeEventListener("online", go);
    window.removeEventListener("offline", god);
  };
}
