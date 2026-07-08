import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, User, Save, Plus, Trash2, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useData } from "../contexts/DataContext";
import type { Player, Category, PlayerDifficulty } from "../lib/types";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ImageUploader from "../components/ui/ImageUploader";
import ImagePreview from "../components/ui/ImagePreview";
import Pagination from "../components/ui/Pagination";
import { uploadImageFromDataUrl } from "../lib/upload";

const PAGE_SIZE = 25;

const MISSING_FILTERS: Record<string, (p: Player) => boolean> = {
  noImage: (p) => !p.image,
  noFirstName: (p) => !p.g,
  noPositions: (p) => !p.positions?.length,
  noCategoryLinks: (p) => !p.categoryLinks || !Object.keys(p.categoryLinks).length,
  noDifficulty: (p) => !p.difficulty,
};

const MISSING_LABELS: Record<string, string> = {
  noImage: "dataCompleteness.noImage",
  noFirstName: "dataCompleteness.noFirstName",
  noPositions: "dataCompleteness.noPositions",
  noCategoryLinks: "dataCompleteness.noCategoryLinks",
  noDifficulty: "dataCompleteness.noDifficulty",
};

const DIFFICULTY_OPTIONS: { value: PlayerDifficulty; label: string; color: string }[] = [
  { value: "Beginner", label: "Beginner", color: "bg-green/10 text-green border-green/30" },
  { value: "Medium", label: "Medium", color: "bg-gold-dim text-gold border-gold/30" },
  { value: "Elite", label: "Elite", color: "bg-red/10 text-red border-red/30" },
];

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  Beginner: { label: "Beginner", color: "bg-green/10 text-green" },
  Medium: { label: "Medium", color: "bg-gold-dim text-gold" },
  Elite: { label: "Elite", color: "bg-red/10 text-red" },
};

const getTypeNames = (t: (key: string) => string): Record<string, string> => ({
  league: t("categoryTypes.league"),
  national: t("categoryTypes.national"),
  club: t("categoryTypes.club"),
  trophy: t("categoryTypes.trophy"),
  achievement: t("categoryTypes.achievement"),
});

export default function Players() {
  const { t } = useTranslation();
  const { players: allPlayers, categories: allCategories, config, loading, updatePlayer, addPlayer, removePlayer } = useData();
  const POSITIONS = config?.positions ?? ["Gardien", "Défense", "Milieu", "Attaquant"];
  const typeNames = useMemo(() => getTypeNames(t), [t]);
  const [searchParams, setSearchParams] = useSearchParams();
  const missingFilter = searchParams.get("missing") || "";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Player | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategoryId, setFilterCategoryId] = useState<number>(0);
  const [catQuery, setCatQuery] = useState("");
  const [catFilterType, setCatFilterType] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCategoriesForType = useMemo(() => {
    return Object.values(allCategories)
      .filter((c) => !filterType || c.type === filterType)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [allCategories, filterType]);

  const filtered = useMemo(() => {
    let list = allPlayers;
    if (missingFilter && MISSING_FILTERS[missingFilter]) {
      list = list.filter(MISSING_FILTERS[missingFilter]);
    }
    if (query) {
      const q = query.toLowerCase();
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
  }, [allPlayers, missingFilter, query, filterCategoryId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPlayers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safeCurrentPage]);

  const clearMissingFilter = useCallback(() => {
    setSearchParams({});
    setCurrentPage(1);
  }, [setSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
  }, []);

  const handleFilterCategoryChange = useCallback((value: number) => {
    setFilterCategoryId(value);
    setCurrentPage(1);
  }, []);

  const openEditor = (id: number) => {
    const p = allPlayers.find((pl) => pl.id === id);
    if (p) setSelected(p);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      let imageData = selected.image;
      if (imageData && imageData.startsWith("data:")) {
        const secret = import.meta.env.VITE_UPLOAD_SECRET || "";
        const result = await uploadImageFromDataUrl(imageData, secret);
        imageData = result.url;
      }
      updatePlayer(selected.id, { ...selected, image: imageData });
      setSelected(null);
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    removePlayer(id);
    setConfirmDelete(null);
    setSelected(null);
  };

  const togglePosition = (pos: string) => {
    if (!selected) return;
    const current = selected.positions || [];
    const updated = current.length === 1 && current[0] === pos ? [] : [pos];
    setSelected({ ...selected, positions: updated });
  };

  const isCategoryLinked = (cat: Category): boolean => {
    if (!selected) return false;
    const catId = cat.numericIds?.[0];
    if (!catId) return false;
    return Object.values(selected.categoryLinks || {}).some((ids) => ids.includes(catId));
  };

  const toggleCategory = (cat: Category) => {
    if (!selected) return;
    const catId = cat.numericIds?.[0];
    if (!catId) return;
    const type = cat.type;
    const newLinks = { ...selected.categoryLinks };
    const arr = newLinks[type] || [];
    if (arr.includes(catId)) {
      const filtered = arr.filter((id) => id !== catId);
      if (filtered.length === 0) delete newLinks[type];
      else newLinks[type] = filtered;
    } else {
      newLinks[type] = [...arr, catId];
    }
    setSelected({ ...selected, categoryLinks: newLinks });
  };

  const handleCreateNew = async (data: { f: string; g: string; difficulty: PlayerDifficulty; positions: string[]; categoryIds: number[]; image?: string }) => {
    if (!data.f.trim()) return;
    const maxId = allPlayers.length > 0 ? Math.max(...allPlayers.map((p) => p.id)) : 0;
    const id = maxId + 1;

    const categoryLinks: Record<string, number[]> = {};
    for (const catId of data.categoryIds) {
      const cat = Object.values(allCategories).find((c) => c.numericIds?.[0] === catId);
      if (cat) {
        if (!categoryLinks[cat.type]) categoryLinks[cat.type] = [];
        categoryLinks[cat.type].push(catId);
      }
    }

    let imageData = data.image;
    if (imageData && imageData.startsWith("data:")) {
      try {
        const secret = import.meta.env.VITE_UPLOAD_SECRET || "";
        const result = await uploadImageFromDataUrl(imageData, secret);
        imageData = result.url;
      } catch (err: any) {
        alert(err.message || "Failed to upload image");
        return;
      }
    }

    const newPlayer: Player = {
      id,
      f: data.f.trim(),
      g: data.g.trim(),
      positions: data.positions,
      categoryLinks,
      challengeCount: 0,
      difficulty: data.difficulty,
      image: imageData,
    };
    addPlayer(newPlayer);
    setShowNewForm(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("players.title")}</h1>
          <p className="text-sm text-text-2 mt-1">{t("players.playerCount", { count: filtered.length })}</p>
        </div>
        <Button size="sm" onClick={() => setShowNewForm(true)} icon={<Plus size={14} />}>{t("common.new")}</Button>
      </div>

      <div className="flex items-center gap-2">
        <select
          className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition shrink-0"
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setFilterCategoryId(0); setCurrentPage(1); }}
        >
          <option value="">{t("common.all")}</option>
          {Object.entries(typeNames).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition shrink-0 min-w-[140px]"
          value={filterCategoryId}
          onChange={(e) => handleFilterCategoryChange(Number(e.target.value))}
        >
          <option value={0}>{t("common.all")}</option>
          {filteredCategoriesForType.map((cat) => (
            <option key={cat.numericIds?.[0]} value={cat.numericIds?.[0]}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
          <input
            className="w-full bg-surface border border-border rounded-lg pr-9 pl-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
            placeholder={t("players.searchPlaceholder")}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          />
        </div>
      </div>

      {missingFilter && MISSING_LABELS[missingFilter] && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gold-dim/15 border border-gold/20 rounded-lg">
          <Filter size={14} className="text-gold" />
          <span className="text-sm font-semibold text-gold flex-1">
            {t(MISSING_LABELS[missingFilter])} — {filtered.length} {t("players.title")}
          </span>
          <button
            onClick={clearMissingFilter}
            className="text-xs text-text-2 hover:text-white transition flex items-center gap-1"
          >
            <X size={14} />
            {t("common.clear")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="👤"
          title={query ? t("players.noPlayerWithName") : t("players.noPlayers")}
          description={query ? t("players.tryAnotherName") : t("players.addNewPlayer")}
          action={!query ? <Button onClick={() => setShowNewForm(true)} icon={<Plus size={14} />}>{t("players.addPlayer")}</Button> : undefined}
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-2 text-xs">
                  <th className="text-right px-4 py-2.5 font-semibold">ID</th>
                  <th className="text-right px-4 py-2.5 font-semibold"></th>
                  <th className="text-right px-4 py-2.5 font-semibold">{t("players.lastName")}</th>
                  <th className="text-right px-4 py-2.5 font-semibold hidden md:table-cell">{t("players.firstName")}</th>
                  <th className="text-right px-4 py-2.5 font-semibold">{t("players.challenges")}</th>
                  <th className="text-right px-4 py-2.5 font-semibold hidden lg:table-cell">{t("players.difficulty")}</th>
                  <th className="text-right px-4 py-2.5 font-semibold hidden md:table-cell">{t("players.positions")}</th>
                  <th className="text-right px-4 py-2.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 hover:bg-surface-2/50 transition cursor-pointer"
                    onClick={() => openEditor(p.id)}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-2.5"><ImagePreview src={p.image} size={40} /></td>
                    <td className="px-4 py-2.5 font-semibold uppercase">{p.f}</td>
                    <td className="px-4 py-2.5 text-text-2 hidden md:table-cell uppercase">{p.g || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs bg-gold-dim text-gold px-2 py-0.5 rounded-full">
                        {p.challengeCount}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      {p.difficulty ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_MAP[p.difficulty]?.color || ""}`}>
                          {p.difficulty}
                        </span>
                      ) : (
                        <span className="text-xs text-text-2">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-xs text-text-2">{p.positions.length > 0 ? p.positions.join(", ") : "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Button variant="ghost" size="sm">{t("common.edit")}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="sm:hidden divide-y divide-border/50">
            {paginatedPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => openEditor(p.id)}
                className="w-full text-right flex items-center gap-3 px-4 py-3 hover:bg-surface-2/50 transition"
              >
                <ImagePreview src={p.image} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{p.f}</span>
                    {p.g && <span className="text-xs text-text-2 truncate">{p.g}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-text-2">#{p.id}</span>
                    <span className="text-[10px] bg-gold-dim text-gold px-1.5 py-0.5 rounded-full">
                      {p.challengeCount}
                    </span>
                    {p.difficulty && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DIFFICULTY_MAP[p.difficulty]?.color || ""}`}>
                        {p.difficulty}
                      </span>
                    )}
                    {p.positions.length > 0 && (
                      <span className="text-[10px] text-text-2">{p.positions.join(", ")}</span>
                    )}
                  </div>
                </div>
                <span className="text-text-2 text-xs">{t("common.edit")}</span>
              </button>
            ))}
          </div>

          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <User size={18} />
                {t("players.editPlayer")}
              </h2>
              <button onClick={() => setSelected(null)} className="text-text-2 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("players.lastName")}</label>
                <input
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                  value={selected.f}
                  onChange={(e) => setSelected({ ...selected, f: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("players.firstName")}</label>
                <input
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                  value={selected.g}
                  onChange={(e) => setSelected({ ...selected, g: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-text-2 font-semibold mb-2">{t("players.difficulty")}</label>
                  <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelected({ ...selected, difficulty: selected.difficulty === opt.value ? undefined : opt.value })}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg border transition ${
                          selected.difficulty === opt.value
                            ? opt.color
                            : "bg-surface-2 text-text-2 border-border hover:border-gold/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ImageUploader
                  value={selected.image}
                  onChange={(img) => setSelected({ ...selected, image: img })}
                  size={72}
                />
              </div>

              <div>
                <label className="block text-xs text-text-2 font-semibold mb-2">{t("players.positions")}</label>
                <div className="flex gap-2">
                  {POSITIONS.map((pos) => {
                    const isActive = (selected.positions || []).length === 1 && (selected.positions || [])[0] === pos;
                    return (
                      <button
                        key={pos}
                        onClick={() => togglePosition(pos)}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg border transition ${
                          isActive
                            ? "bg-gold-dim text-gold border-gold/50"
                            : "bg-surface-2 text-text-2 border-border hover:border-gold/30"
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-2 font-semibold mb-2">{t("players.categories")}</label>
                {Object.values(allCategories).length === 0 ? (
                  <span className="text-xs text-text-2">{t("players.noCategories")}</span>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2" />
                        <input
                          className="w-full bg-surface-2 border border-border rounded-lg pr-8 pl-2.5 py-1.5 text-xs outline-none focus:border-gold/50 transition"
                          placeholder={t("players.searchCategoryPlaceholder")}
                          value={catQuery}
                          onChange={(e) => setCatQuery(e.target.value)}
                        />
                      </div>
                      <select
                        className="bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold/50 transition"
                        value={catFilterType}
                        onChange={(e) => setCatFilterType(e.target.value)}
                      >
                        <option value="">{t("common.all")}</option>
                        {Object.entries(typeNames).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    {(() => {
                      const sorted = Object.values(allCategories)
                        .filter((c) => {
                          if (catQuery && !c.name.toLowerCase().includes(catQuery.toLowerCase())) return false;
                          if (catFilterType && c.type !== catFilterType) return false;
                          return true;
                        })
                        .sort((a, b) => a.sortOrder - b.sortOrder);
                      const selectedCats = sorted.filter((cat) => isCategoryLinked(cat));
                      const unselectedCats = sorted.filter((cat) => !isCategoryLinked(cat));
                      return (
                        <>
                          {selectedCats.length > 0 && (
                            <div className="mb-2.5 p-2.5 rounded-lg bg-gold-dim/20 border border-gold/20">
                              <div className="text-[10px] font-semibold text-gold mb-2 px-1">
                                {t("players.selectedCategories")} ({selectedCats.length})
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCats.map((cat) => (
                                  <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gold-dim text-gold border-gold/50 transition hover:brightness-110"
                                  >
                                    {cat.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {unselectedCats.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => toggleCategory(cat)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-surface-2 text-text-2 border-border hover:border-gold/30 transition"
                              >
                                {cat.name}
                              </button>
                            ))}
                          </div>
                          {selectedCats.length === 0 && unselectedCats.length === 0 && (
                            <span className="text-xs text-text-2">{t("players.noResults")}</span>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-xs text-text-2">
              <span>{t("players.id")}: <strong className="font-mono">{selected.id}</strong></span>
              <span>{t("players.challenges")}: <strong>{selected.challengeCount}</strong></span>
            </div>

            <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(selected.id)} icon={<Trash2 size={14} />}>{t("common.delete")}</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSelected(null)}>{t("common.cancel")}</Button>
                <Button onClick={handleSave} loading={saving} icon={<Save size={16} />}>{t("common.save")}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewForm && (
        <NewPlayerModal
          nextId={allPlayers.length > 0 ? Math.max(...allPlayers.map((p) => p.id)) + 1 : 1}
          categories={allCategories}
          positions={POSITIONS}
          onConfirm={handleCreateNew}
          onClose={() => setShowNewForm(false)}
        />
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold">{t("players.confirmDeleteTitle")}</h3>
              <p className="text-sm text-text-2">{t("players.confirmDeleteMessage")}</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>{t("common.cancel")}</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)} icon={<Trash2 size={16} />}>{t("common.delete")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewPlayerModal({
  nextId,
  categories,
  positions,
  onConfirm,
  onClose,
}: {
  nextId: number;
  categories: Record<string, Category>;
  positions: string[];
  onConfirm: (data: { f: string; g: string; difficulty: PlayerDifficulty; positions: string[]; categoryIds: number[]; image?: string }) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const typeNames = useMemo(() => getTypeNames(t), [t]);
  const [f, setF] = useState("");
  const [g, setG] = useState("");
  const [difficulty, setDifficulty] = useState<PlayerDifficulty | undefined>(undefined);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [catQuery, setCatQuery] = useState("");
  const [catFilterType, setCatFilterType] = useState<string>("");

  const sortedCategories = useMemo(
    () => Object.values(categories).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const togglePosition = (pos: string) => {
    setSelectedPositions((prev) =>
      prev.length === 1 && prev[0] === pos ? [] : [pos]
    );
  };

  const canSave = f.trim() && difficulty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User size={18} />
            {t("players.newPlayer")}
          </h2>
          <button onClick={onClose} className="text-text-2 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("players.lastName")}</label>
            <input
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={f}
              onChange={(e) => setF(e.target.value)}
              placeholder={t("players.enterLastName")}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("players.firstName")}</label>
            <input
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={g}
              onChange={(e) => setG(e.target.value)}
              placeholder={t("players.enterFirstName")}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-text-2 font-semibold mb-2">{t("players.difficultyRequired")}</label>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={`text-xs font-semibold px-4 py-2 rounded-lg border transition ${
                      difficulty === opt.value
                        ? opt.color
                        : "bg-surface-2 text-text-2 border-border hover:border-gold/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <ImageUploader
              value={image}
              onChange={setImage}
              size={72}
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-2">{t("players.positions")}</label>
            <div className="flex gap-2">
              {positions.map((pos) => {
                const isActive = selectedPositions.length === 1 && selectedPositions[0] === pos;
                return (
                  <button
                    key={pos}
                    onClick={() => togglePosition(pos)}
                    className={`text-xs font-semibold px-4 py-2 rounded-lg border transition ${
                      isActive
                        ? "bg-gold-dim text-gold border-gold/50"
                        : "bg-surface-2 text-text-2 border-border hover:border-gold/30"
                    }`}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-2">{t("players.categories")}</label>
            {sortedCategories.length === 0 ? (
              <span className="text-xs text-text-2">{t("players.noCategories")}</span>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2" />
                    <input
                      className="w-full bg-surface-2 border border-border rounded-lg pr-8 pl-2.5 py-1.5 text-xs outline-none focus:border-gold/50 transition"
                      placeholder={t("players.searchCategoryPlaceholder")}
                      value={catQuery}
                      onChange={(e) => setCatQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="bg-surface-2 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-gold/50 transition"
                    value={catFilterType}
                    onChange={(e) => setCatFilterType(e.target.value)}
                  >
                    <option value="">{t("common.all")}</option>
                    {Object.entries(typeNames).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const filtered = sortedCategories.filter((c) => {
                    if (catQuery && !c.name.toLowerCase().includes(catQuery.toLowerCase())) return false;
                    if (catFilterType && c.type !== catFilterType) return false;
                    return true;
                  });
                  const selectedCats = filtered.filter((cat) => {
                    const catId = cat.numericIds?.[0];
                    return catId && selectedCategoryIds.includes(catId);
                  });
                  const unselectedCats = filtered.filter((cat) => {
                    const catId = cat.numericIds?.[0];
                    return !catId || !selectedCategoryIds.includes(catId);
                  });
                  return (
                    <>
                      {selectedCats.length > 0 && (
                        <div className="mb-2.5 p-2.5 rounded-lg bg-gold-dim/20 border border-gold/20">
                          <div className="text-[10px] font-semibold text-gold mb-2 px-1">
                            {t("players.selectedCategories")} ({selectedCats.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCats.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => toggleCategory(cat.numericIds![0])}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-gold-dim text-gold border-gold/50 transition hover:brightness-110"
                              >
                                {cat.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {unselectedCats.map((cat) => {
                          const catId = cat.numericIds?.[0];
                          if (!catId) return null;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => toggleCategory(catId)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-surface-2 text-text-2 border-border hover:border-gold/30 transition"
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                      {selectedCats.length === 0 && unselectedCats.length === 0 && (
                        <span className="text-xs text-text-2">{t("players.noResults")}</span>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-xs text-text-2">
          <span>{t("players.id")}: <strong className="font-mono">#{nextId}</strong></span>
          <span>{t("players.challenges")}: <strong>0</strong></span>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            onClick={() => onConfirm({ f, g, difficulty: difficulty!, positions: selectedPositions, categoryIds: selectedCategoryIds, image })}
            disabled={!canSave}
            icon={<Plus size={16} />}
          >
            {t("common.add")}
          </Button>
        </div>
      </div>
    </div>
  );
}
