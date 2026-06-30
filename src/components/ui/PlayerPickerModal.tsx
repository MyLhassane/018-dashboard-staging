import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Check, Plus } from "lucide-react";
import type { Player, RemitItem } from "../lib/types";
import Button from "./Button";

interface PlayerPickerModalProps {
  players: Player[];
  remitItems: RemitItem[];
  existingPlayerIds: Set<number>;
  onSelect: (players: Player[]) => void;
  onClose: () => void;
}

export default function PlayerPickerModal({
  players,
  remitItems,
  existingPlayerIds,
  onSelect,
  onClose,
}: PlayerPickerModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const uniqueItems = useMemo(() => {
    const seen = new Set<number>();
    return remitItems.flat().filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [remitItems]);

  const remitItemIds = useMemo(() => new Set(uniqueItems.map((i) => i.id)), [uniqueItems]);

  const filtered = useMemo(() => {
    let list = players;
    if (remitItemIds.size > 0) {
      list = list.filter((p) =>
        Object.values(p.categoryLinks || {}).some((ids) => ids.some((id) => remitItemIds.has(id)))
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => String(p.id).includes(q) || p.f?.toLowerCase().includes(q) || p.g?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => b.id - a.id);
  }, [players, remitItemIds, search]);

  const togglePlayer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const selected = players.filter((p) => selectedIds.has(p.id));
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h3 className="text-lg font-bold">{t("players.title")}</h3>
          <button onClick={onClose} className="text-text-2 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
            <input
              className="w-full bg-surface-2 border border-border rounded-lg pr-9 pl-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              placeholder={t("players.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {uniqueItems.length > 0 && (
            <p className="text-xs text-text-2">
              {t("players.showingRelatedTo", { items: uniqueItems.map((i) => i.displayName).join("، ") })}
            </p>
          )}
          {uniqueItems.length === 0 && (
            <p className="text-xs text-amber-400">{t("players.noCategoriesWarning")}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-text-2 text-sm">
              {search ? t("players.noPlayerByName") : t("players.noPlayersLinked")}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((p) => {
                const disabled = existingPlayerIds.has(p.id);
                const checked = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    disabled={disabled}
                    onClick={() => { if (!disabled) togglePlayer(p.id); }}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg border transition ${
                      disabled
                        ? "border-border/30 opacity-40 cursor-not-allowed"
                        : checked
                          ? "border-gold/50 bg-gold-dim/10"
                          : "border-transparent hover:bg-surface-2 hover:border-border"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      disabled ? "border-text-2/30" : checked ? "border-gold bg-gold" : "border-border"
                    }`}>
                      {(checked || disabled) && <Check size={12} className={disabled ? "text-text-2/30" : "text-white"} />}
                    </div>
                    <span className="font-mono text-xs text-text-2 w-10 shrink-0">{p.id}</span>
                    <span className="text-sm font-semibold truncate">{p.f}</span>
                    {p.g && <span className="text-xs text-text-2 truncate">{p.g}</span>}
                    {p.positions && p.positions.length > 0 && (
                      <span className="text-[10px] bg-gold-dim/30 text-gold px-1.5 py-0.5 rounded shrink-0">
                        {p.positions.join("/")}
                      </span>
                    )}
                    {disabled && (
                      <span className="text-[10px] text-text-2 mr-auto">{t("players.alreadyExists")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-border shrink-0">
          <span className="text-xs text-text-2">{t("players.selectedCount", { count: selectedIds.size })}</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
            <Button onClick={handleAdd} disabled={selectedIds.size === 0} icon={<Plus size={16} />}>
              {t("players.add", { count: selectedIds.size })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
