import { vi } from "vitest";

export function createMockFirebase() {
  const store: Record<string, any> = {};

  function resolve(path: string): { parent: string; key: string } {
    const parts = path.split("/");
    const key = parts.pop()!;
    const parent = parts.join("/");
    return { parent, key };
  }

  function getNested(obj: any, path: string): any {
    if (!path) return obj;
    return path.split("/").reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
  }

  function setNested(obj: any, path: string, value: any) {
    const parts = path.split("/");
    const key = parts.pop()!;
    const parent = parts.reduce((acc, part) => {
      if (!(part in acc)) acc[part] = {};
      return acc[part];
    }, obj);
    parent[key] = value;
  }

  function deleteNested(obj: any, path: string) {
    const { parent, key } = resolve(path);
    const p = parent ? getNested(obj, parent) : obj;
    if (p) delete p[key];
  }

  const mockRef = vi.fn((_db: any, path: string) => ({ path }));
  const mockGet = vi.fn(async (ref: { path: string }) => {
    const val = getNested(store, ref.path);
    return { exists: () => val !== undefined, val: () => val };
  });
  const mockSet = vi.fn(async (ref: { path: string }, data: any) => {
    setNested(store, ref.path, data);
  });
  const mockUpdate = vi.fn(async (ref: { path: string }, data: any) => {
    const existing = getNested(store, ref.path) || {};
    Object.assign(existing, data);
    setNested(store, ref.path, existing);
  });
  const mockRemove = vi.fn(async (ref: { path: string }) => {
    deleteNested(store, ref.path);
  });
  const mockOnValue = vi.fn();

  return {
    db: {} as any,
    store,
    ref: mockRef,
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    remove: mockRemove,
    onValue: mockOnValue,
  };
}

export function seedStore(store: Record<string, any>, key: string, data: any) {
  store[key] = data;
}
