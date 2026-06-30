import { useState, useEffect, useCallback, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { ScrollText, Plus, Trash2, X, List, LayoutGrid, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { getDevLog, addDevLogEntry, deleteDevLogEntry, updateDevLogStatus } from "../lib/db";
import type { DevLogEntry, DevLogType, DevLogStatus } from "../lib/types";
import Button from "../components/ui/Button";

const DEV_TYPES: DevLogType[] = ["ميزة جديدة", "تصحيح", "تحسين", "تحديث بيانات", "إعدادات"];

const TYPE_COLORS: Record<DevLogType, string> = {
  "ميزة جديدة": "bg-blue/15 text-blue",
  "تصحيح": "bg-red/15 text-red",
  "تحسين": "bg-green/15 text-green",
  "تحديث بيانات": "bg-gold-dim text-gold",
  "إعدادات": "bg-surface-2 text-text-2",
};

const STATUS_COLORS: Record<DevLogStatus, string> = {
  new: "bg-blue/15 text-blue",
  in_progress: "bg-gold-dim text-gold",
  done: "bg-green/15 text-green",
};

const COLUMN_STYLES = {
  new: { border: "border-t-blue", header: "text-blue" },
  in_progress: { border: "border-t-gold", header: "text-gold" },
};

export default function DevLog() {
  const { t } = useTranslation();

  function formatDate(ts: number): string {
    const d = new Date(ts);
    const day = d.getDate();
    const months = [t("months.jan"), t("months.feb"), t("months.mar"), t("months.apr"), t("months.may"), t("months.jun"), t("months.jul"), t("months.aug"), t("months.sep"), t("months.oct"), t("months.nov"), t("months.dec")];
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${hours}:${mins}`;
  }

  const STATUS_LABELS: Record<DevLogStatus, string> = {
    new: t("devLog.new"),
    in_progress: t("devLog.inProgress"),
    done: t("devLog.done"),
  };

  const getTypeLabel = (type: DevLogType): string => {
    switch (type) {
      case "ميزة جديدة": return t("devLog.newFeature");
      case "تصحيح": return t("devLog.bugfix");
      case "تحسين": return t("devLog.improvement");
      case "تحديث بيانات": return t("devLog.dataUpdate");
      case "إعدادات": return t("devLog.settings");
      default: return type;
    }
  };

  const [entries, setEntries] = useState<DevLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", type: "ميزة جديدة" as DevLogType, notes: "" });
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [mobileTab, setMobileTab] = useState<DevLogStatus>("new");
  const [sheetEntry, setSheetEntry] = useState<DevLogEntry | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<DevLogStatus | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDevLog();
      setEntries(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    const entry: DevLogEntry = {
      id: Date.now().toString(),
      title: form.title.trim(),
      type: form.type,
      status: "new",
      timestamp: Date.now(),
      notes: form.notes.trim() || undefined,
    };
    await addDevLogEntry(entry);
    setEntries((prev) => [entry, ...prev]);
    setForm({ title: "", type: "ميزة جديدة", notes: "" });
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDevLogEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleStatusChange = useCallback(async (id: string, status: DevLogStatus) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    await updateDevLogStatus(id, status);
  }, []);

  const handleCheckbox = useCallback(async (id: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "done" } : e)));
    await updateDevLogStatus(id, "done");
  }, []);

  const handleMoveFromSheet = useCallback(async (id: string, status: DevLogStatus) => {
    setSheetEntry(null);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    await updateDevLogStatus(id, status);
  }, []);

  // Drag & Drop handlers
  const onDragStart = useCallback((e: DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDragId(id);
  }, []);

  const onDragOver = useCallback((e: DragEvent, col: DevLogStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const onDrop = useCallback((e: DragEvent, target: DevLogStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDragId(null);
    setDragOverCol(null);
    if (id) handleStatusChange(id, target);
  }, [handleStatusChange]);

  const onDragEnd = useCallback(() => {
    setDragId(null);
    setDragOverCol(null);
  }, []);

  const newEntries = entries.filter((e) => e.status === "new");
  const inProgressEntries = entries.filter((e) => e.status === "in_progress");
  const activeMobileEntries = mobileTab === "new" ? newEntries : inProgressEntries;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText size={22} />
            {t("devLog.title")}
          </h1>
          <p className="text-sm text-text-2 mt-1">{t("devLog.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-surface-2 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white"}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-md transition ${viewMode === "board" ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white"}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>{t("devLog.add")}</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <ScrollText size={40} className="mx-auto text-text-2 mb-3" />
          <p className="text-text-2 font-semibold">{t("devLog.noEntries")}</p>
          <p className="text-sm text-text-2 mt-1">{t("devLog.addFirst")}</p>
        </div>
      ) : viewMode === "list" ? (
        /* ========== LIST VIEW ========== */
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold">{entry.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[entry.type]}`}>
                    {getTypeLabel(entry.type)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status]}`}>
                    {STATUS_LABELS[entry.status]}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-text-2 mt-1 truncate">{entry.notes}</p>
                )}
              </div>
              <span className="text-xs text-text-2 whitespace-nowrap">{formatDate(entry.timestamp)}</span>
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-1.5 text-text-2 hover:text-red transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ========== BOARD VIEW — MOBILE TABS ========== */}
          <div className="md:hidden flex bg-surface-2 rounded-lg p-1 gap-1">
            {(["new", "in_progress"] as DevLogStatus[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition ${
                  mobileTab === tab ? "bg-gold text-black" : "text-text-2"
                }`}
              >
                {STATUS_LABELS[tab]}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  mobileTab === tab ? "bg-black/20" : "bg-surface text-text-2"
                }`}>
                  {tab === "new" ? newEntries.length : inProgressEntries.length}
                </span>
              </button>
            ))}
          </div>

          {/* ========== BOARD VIEW — COLUMNS ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["new", "in_progress"] as DevLogStatus[]).map((col) => {
              const items = col === "new" ? newEntries : inProgressEntries;
              const styles = COLUMN_STYLES[col];
              const isDragOver = dragOverCol === col;
              return (
                <div
                  key={col}
                  onDragOver={(e) => onDragOver(e, col)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, col)}
                  className={`bg-surface-2 rounded-xl border-t-3 ${styles.border} transition-all ${
                    isDragOver ? "ring-2 ring-gold/40 bg-gold-dim/30" : ""
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${styles.header}`}>{STATUS_LABELS[col]}</span>
                      <span className="text-xs text-text-2 bg-surface px-1.5 py-0.5 rounded-full">{items.length}</span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="px-3 pb-3 space-y-2 min-h-[80px]">
                    {items.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-text-2">{t("devLog.dragCardHere")}</p>
                      </div>
                    ) : (
                      items.map((entry) => (
                        <div
                          key={entry.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, entry.id)}
                          onDragEnd={onDragEnd}
                          onClick={() => {
                            if (col === "in_progress") return;
                            setSheetEntry(entry);
                          }}
                          className={`bg-surface border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all ${
                            dragId === entry.id ? "opacity-40 scale-95" : ""
                          }`}
                        >
                          {/* Type badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[entry.type]}`}>
                            {getTypeLabel(entry.type)}
                          </span>

                          {/* Title */}
                          <p className="text-sm font-bold mt-1.5">{entry.title}</p>

                          {/* Date */}
                          <p className="text-[11px] text-text-2 mt-1">{formatDate(entry.timestamp)}</p>

                          {/* Notes */}
                          {entry.notes && (
                            <p className="text-[11px] text-text-2 mt-1 truncate">{entry.notes}</p>
                          )}

                          {/* Bottom actions */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            {col === "in_progress" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckbox(entry.id);
                                }}
                                className="flex items-center gap-1.5 text-xs font-semibold text-green hover:text-green/80 transition"
                              >
                                <CheckCircle2 size={14} />
                                <span>{t("devLog.doneAction")}</span>
                              </button>
                            ) : (
                              <span />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry.id);
                              }}
                              className="p-1 text-text-2 hover:text-red transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ========== MOBILE BOTTOM SHEET — MOVE CARD ========== */}
      {sheetEntry && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSheetEntry(null)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl p-4 pb-8 space-y-1 animate-slide-up">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-sm font-bold">{t("devLog.moveTo")}</span>
              <button onClick={() => setSheetEntry(null)} className="text-text-2 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-text-2 px-4 mb-2 truncate">{sheetEntry.title}</div>
            {(["new", "in_progress"] as DevLogStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleMoveFromSheet(sheetEntry.id, s)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-right ${
                  sheetEntry.status === s ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white hover:bg-surface-2"
                }`}
              >
                {sheetEntry.status === s ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                {STATUS_LABELS[s]}
              </button>
            ))}
            <div className="border-t border-border my-2" />
            <button
              onClick={() => setSheetEntry(null)}
              className="w-full text-center py-3 text-sm text-text-2 hover:text-white transition"
            >
              {t("devLog.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* ========== ADD MODAL ========== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-md mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("devLog.addEntry")}</h2>
              <button onClick={() => setShowModal(false)} className="text-text-2 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("devLog.titleLabel")}</label>
              <input
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("devLog.titlePlaceholder")}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("devLog.typeLabel")}</label>
              <div className="flex flex-wrap gap-2">
                {DEV_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      form.type === t
                        ? "border-gold bg-gold-dim text-gold"
                        : "border-border bg-surface-2 text-text-2 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("devLog.notesLabel")}</label>
              <textarea
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t("devLog.notesPlaceholder")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAdd} disabled={!form.title.trim()}>{t("devLog.save")}</Button>
              <Button variant="ghost" onClick={() => setShowModal(false)}>{t("devLog.cancel")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
