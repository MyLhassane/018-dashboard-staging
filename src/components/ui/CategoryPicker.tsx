import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Check } from "lucide-react";
import { getCategories } from "../../lib/db";
import type { Category } from "../../lib/types";

const typeNames: Record<string, string> = {
  league: "categoryTypes.league",
  national: "categoryTypes.national",
  club: "categoryTypes.club",
  trophy: "categoryTypes.trophy",
  achievement: "categoryTypes.achievement",
};

const typeColors: Record<string, string> = {
  league: "bg-gold-dim text-gold",
  national: "bg-green/10 text-green",
  club: "bg-blue/10 text-blue",
  trophy: "bg-red/10 text-red",
  achievement: "bg-purple-500/10 text-purple-400",
};

interface CategoryPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (categories: Category[]) => void;
  selectedIds: number[];
  multi?: boolean;
}

export default function CategoryPicker({ open, onClose, onSelect, selectedIds, multi = true }: CategoryPickerProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [selected, setSelected] = useState<number[]>(selectedIds);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(selectedIds);
    getCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  const list = Object.values(categories).filter((c) => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.id.includes(query)) return false;
    if (filterType && c.type !== filterType) return false;
    return true;
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  const toggle = (cat: Category) => {
    const nid = cat.numericIds?.[0] ?? 0;
    if (multi) {
      setSelected((prev) =>
        prev.includes(nid) ? prev.filter((id) => id !== nid) : [...prev, nid]
      );
    } else {
      setSelected([nid]);
    }
  };

  const handleConfirm = () => {
    const picked = list.filter((c) => selected.includes(c.numericIds?.[0] ?? 0));
    onSelect(picked);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{t("categories.title")}</h2>
          <button onClick={onClose} className="text-text-2 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-border shrink-0 space-y-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
            <input
              className="w-full bg-surface-2 border border-border rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:border-gold/50 transition"
              placeholder={t("categories.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType("")}
              className={`text-xs px-2.5 py-1 rounded-full transition ${!filterType ? "bg-gold text-black" : "bg-surface-2 text-text-2 hover:text-white"}`}
            >
              {t("common.all")}
            </button>
            {Object.entries(typeNames).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`text-xs px-2.5 py-1 rounded-full transition ${filterType === key ? "bg-gold text-black" : "bg-surface-2 text-text-2 hover:text-white"}`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-text-2 text-sm">{t("categories.noCategories")}</div>
          ) : (
            <div className="space-y-0.5">
              {list.map((c) => {
                const nid = c.numericIds?.[0] ?? 0;
                const isSelected = selected.includes(nid);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition ${
                      isSelected ? "bg-gold-dim/30 border border-gold/30" : "hover:bg-surface-2 border border-transparent"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                      isSelected ? "border-gold bg-gold text-black" : "border-border"
                    }`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${typeColors[c.type] || "bg-surface-2 text-text-2"}`}>
                          {t(typeNames[c.type]) || c.type}
                        </span>
                        <span className="text-[10px] text-text-2 font-mono">{c.description}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border shrink-0">
          <span className="text-xs text-text-2">{t("categories.selectedCount", { count: selected.length })}</span>
          <button
            onClick={handleConfirm}
            className="bg-gold text-black font-bold text-sm px-5 py-2 rounded-lg hover:brightness-110 transition"
          >
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
