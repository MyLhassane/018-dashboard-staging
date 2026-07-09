import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Check, Plus } from "lucide-react";
import type { Player, Category } from "../../lib/types";
import Button from "../ui/Button";
import ImagePreview from "../ui/ImagePreview";

const PAGE_SIZE = 25;

const typeNames: Record<string, string> = {
  league: "categoryTypes.league",
  national: "categoryTypes.national",
  club: "categoryTypes.club",
  trophy: "categoryTypes.trophy",
  achievement: "categoryTypes.achievement",
};

interface Props {
  players: Player[];
  categories: Record<string, Category>;
  existingPlayerIds: Set<number>;
  onSelect: (players: Player[]) => void;
  onClose: () => void;
}

export default function ElphenomenoPlayerBrowser({
  players,
  categories,
  existingPlayerIds,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategoryId, setFilterCategoryId] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const filteredCategoriesForType = useMemo(() => {
    return Object.values(categories)
      .filter((c) => !filterType || c.type === filterType)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories, filterType]);

  const filtered = useMemo(() => {
    let list = players;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => String(p.id).includes(q) || p.f?.toLowerCase().includes(q) || p.g?.toLowerCase().includes(q)
      );
    }
    if (filterCategoryId) {
      list = list.filter((p) => {
        const links = p.categoryLinks || {};
        for (const ids of Object.values(links)) {
          if (ids.includes(filterCategoryId)) return true;
        }
        return false;
      });
    }
    return [...list].sort((a, b) => b.id - a.id);
  }, [players, search, filterCategoryId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

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
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h3 className="text-lg font-bold">{t("elphenomeno.selectPlayers")}</h3>
          <button onClick={onClose} className="text-text-2 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3 shrink-0 border-b border-border">
          <div className="flex items-center gap-2">
            <select
              className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition shrink-0"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setFilterCategoryId(0); setPage(1); }}
            >
              <option value="">{t("common.all")}</option>
              {Object.entries(typeNames).map(([key, label]) => (
                <option key={key} value={key}>{t(label)}</option>
              ))}
            </select>
            <select
              className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition shrink-0 min-w-[140px]"
              value={filterCategoryId}
              onChange={(e) => { setFilterCategoryId(Number(e.target.value)); setPage(1); }}
            >
              <option value={0}>{t("common.all")}</option>
              {filteredCategoriesForType.map((cat) => (
                <option key={cat.id} value={cat.numericIds?.[0] ?? 0}>{cat.name}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
              <input
                className="w-full bg-surface-2 border border-border rounded-lg pr-9 pl-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                placeholder={t("players.searchPlaceholder")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {paginated.length === 0 ? (
            <div className="text-center py-12 text-text-2 text-sm">
              {search ? t("players.noPlayerByName") : t("players.noPlayers")}
            </div>
          ) : (
            <div className="space-y-1">
              {paginated.map((p) => {
                const exists = existingPlayerIds.has(p.id);
                const checked = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    disabled={exists}
                    onClick={() => { if (!exists) togglePlayer(p.id); }}
                    className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg border transition ${
                      exists
                        ? "border-border/30 opacity-40 cursor-not-allowed"
                        : checked
                          ? "border-gold/50 bg-gold-dim/10"
                          : "border-transparent hover:bg-surface-2 hover:border-border"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      exists ? "border-text-2/30" : checked ? "border-gold bg-gold" : "border-border"
                    }`}>
                      {(checked || exists) && <Check size={12} className={exists ? "text-text-2/30" : "text-black"} />}
                    </div>
                    <ImagePreview src={p.image} size={36} />
                    <span className="font-mono text-xs text-text-2 w-10 shrink-0">{p.id}</span>
                    <span className="text-sm font-semibold truncate">{p.f}</span>
                    {p.g && <span className="text-xs text-text-2 truncate">{p.g}</span>}
                    {p.positions && p.positions.length > 0 && (
                      <span className="text-[10px] bg-gold-dim/30 text-gold px-1.5 py-0.5 rounded shrink-0">
                        {p.positions.join("/")}
                      </span>
                    )}
                    {exists && (
                      <span className="text-[10px] text-text-2 mr-auto">{t("players.alreadyExists")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-2">{t("players.selectedCount", { count: selectedIds.size })}</span>
            <span className="text-xs text-text-2">
              {t("pagination.pageXofY", { page: safePage, total: totalPages })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              {t("pagination.previous")}
            </Button>
            <Button variant="ghost" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              {t("pagination.next")}
            </Button>
            <Button onClick={handleAdd} disabled={selectedIds.size === 0} icon={<Plus size={16} />}>
              {t("players.add", { count: selectedIds.size })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
