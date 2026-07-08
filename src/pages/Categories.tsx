import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Tags, Save, Plus, Trash2, Filter } from "lucide-react";
import { useData } from "../contexts/DataContext";
import type { Category, Player } from "../lib/types";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PlayerPickerModal from "../components/ui/PlayerPickerModal";
import ImageUploader from "../components/ui/ImageUploader";
import ImagePreview from "../components/ui/ImagePreview";
import { uploadImageFromDataUrl } from "../lib/upload";
import { useTranslation } from "react-i18next";

const categoryTypes = ["league", "national", "club", "trophy", "achievement"] as const;

const typeColors: Record<string, string> = {
  league: "bg-gold-dim text-gold",
  national: "bg-green/10 text-green",
  club: "bg-blue/10 text-blue",
  trophy: "bg-red/10 text-red",
  achievement: "bg-purple-500/10 text-purple-400",
};

const MISSING_FILTERS: Record<string, (c: Category) => boolean> = {
  noDescription: (c) => !c.description,
  noMedia: (c) => !c.media,
  noNumericIds: (c) => !c.numericIds?.length,
};

const MISSING_LABELS: Record<string, string> = {
  noDescription: "dataCompleteness.noDescription",
  noMedia: "dataCompleteness.noMedia",
  noNumericIds: "dataCompleteness.noNumericIds",
};

export default function Categories() {
  const { t } = useTranslation();
  const { categories: allCategories, players: allPlayers, loading, updateCategory, addCategory, removeCategory, updatePlayer } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const missingFilter = searchParams.get("missing") || "";
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [selected, setSelected] = useState<Category | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const linkedPlayerIds = useMemo(() => {
    if (!selected) return new Set<number>();
    const catId = selected.numericIds?.[0];
    if (!catId) return new Set<number>();
    return new Set(
      allPlayers.filter((p) =>
        Object.values(p.categoryLinks || {}).some((ids) => ids.includes(catId))
      ).map((p) => p.id)
    );
  }, [selected, allPlayers]);

  const linkedPlayers = useMemo(() =>
    allPlayers.filter((p) => linkedPlayerIds.has(p.id)),
    [allPlayers, linkedPlayerIds]
  );

  const handleLinkPlayers = (pickedPlayers: Player[]) => {
    if (!selected) return;
    const catId = selected.numericIds?.[0];
    if (!catId) return;
    const type = selected.type;
    for (const player of pickedPlayers) {
      const newLinks = { ...player.categoryLinks };
      if (!newLinks[type]) newLinks[type] = [];
      if (!newLinks[type].includes(catId)) {
        newLinks[type] = [...newLinks[type], catId];
      }
      updatePlayer(player.id, { ...player, categoryLinks: newLinks });
    }
    setShowPlayerPicker(false);
  };

  const handleUnlinkPlayer = (playerId: number) => {
    if (!selected) return;
    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) return;
    const catId = selected.numericIds?.[0];
    if (!catId) return;
    const newLinks = { ...player.categoryLinks };
    for (const key of Object.keys(newLinks)) {
      newLinks[key] = newLinks[key].filter((id) => id !== catId);
      if (newLinks[key].length === 0) delete newLinks[key];
    }
    updatePlayer(player.id, { ...player, categoryLinks: newLinks });
  };

  const list = useMemo(() =>
    Object.values(allCategories).filter((c) => {
      if (missingFilter && MISSING_FILTERS[missingFilter] && !MISSING_FILTERS[missingFilter](c)) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.id.includes(query)) return false;
      if (filterType && c.type !== filterType) return false;
      return true;
    }).sort((a, b) => b.sortOrder - a.sortOrder),
    [allCategories, missingFilter, query, filterType]
  );

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      let mediaData = selected.media;
      if (mediaData && mediaData.startsWith("data:")) {
        const secret = import.meta.env.VITE_UPLOAD_SECRET || "";
        const result = await uploadImageFromDataUrl(mediaData, secret);
        mediaData = result.url;
      }
      updateCategory(selected.id, { ...selected, media: mediaData });
      setSelected(null);
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    removeCategory(id);
    setConfirmDelete(null);
    setSelected(null);
  };

  const clearMissingFilter = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handleCreateNew = async (data: { name: string; type: string; description: string; linkedPlayerIds: number[]; media: string }) => {
    if (!data.name.trim()) return;
    const cats = Object.values(allCategories);
    const maxNumeric = cats.length > 0
      ? Math.max(...cats.flatMap((c) => c.numericIds || []))
      : 0;
    const nextId = maxNumeric + 1;

    let mediaData = data.media || "";
    if (mediaData && mediaData.startsWith("data:")) {
      try {
        const secret = import.meta.env.VITE_UPLOAD_SECRET || "";
        const result = await uploadImageFromDataUrl(mediaData, secret);
        mediaData = result.url;
      } catch (err: any) {
        alert(err.message || "Failed to upload image");
        return;
      }
    }

    const newCategory: Category = {
      id: `cat_${nextId}`,
      name: data.name.trim(),
      type: data.type as Category["type"],
      media: mediaData,
      numericIds: [nextId],
      description: data.description.trim(),
      sortOrder: cats.length + 1,
    };
    addCategory(newCategory);

    for (const playerId of data.linkedPlayerIds) {
      const player = allPlayers.find((p) => p.id === playerId);
      if (player) {
        const newLinks = { ...player.categoryLinks };
        if (!newLinks[newCategory.type]) newLinks[newCategory.type] = [];
        if (!newLinks[newCategory.type].includes(nextId)) {
          newLinks[newCategory.type] = [...newLinks[newCategory.type], nextId];
        }
        updatePlayer(player.id, { ...player, categoryLinks: newLinks });
      }
    }

    setShowNewForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("categories.title")}</h1>
          <p className="text-sm text-text-2 mt-1">{Object.keys(allCategories).length} {t("categories.count")}</p>
        </div>
        <Button size="sm" onClick={() => setShowNewForm(true)} icon={<Plus size={14} />}>{t("common.new")}</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
          <input
            className="w-full bg-surface border border-border rounded-lg pr-9 pl-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
            placeholder={t("categories.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">{t("common.all")}</option>
          {categoryTypes.map((key) => (
            <option key={key} value={key}>{t(`categoryTypes.${key}`)}</option>
          ))}
        </select>
      </div>

      {missingFilter && MISSING_LABELS[missingFilter] && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gold-dim/15 border border-gold/20 rounded-lg">
          <Filter size={14} className="text-gold" />
          <span className="text-sm font-semibold text-gold flex-1">
            {t(MISSING_LABELS[missingFilter])} — {list.length} {t("categories.title")}
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
      ) : list.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title={t("categories.empty")}
          description={query ? t("categories.tryAnotherSearch") : t("categories.addNew")}
          action={!query ? <Button onClick={() => setShowNewForm(true)} icon={<Plus size={14} />}>{t("categories.addCategory")}</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="bg-surface border border-border rounded-xl p-4 text-right hover:border-gold/50 transition group"
            >
              <div className="flex items-start gap-3">
                <ImagePreview src={c.media || undefined} size={40} fallbackIcon="image" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[c.type] || "bg-surface-2 text-text-2"}`}>
                      {t(`categoryTypes.${c.type}`)}
                    </span>
                    <span className="text-xs font-mono text-text-2 opacity-0 group-hover:opacity-100 transition">
                      {c.id}
                    </span>
                  </div>
                  <div className="text-sm font-semibold mb-1">{c.name}</div>
                  {c.description && (
                    <div className="text-xs text-text-2 line-clamp-2">{c.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-text-2">
                    <span>{t("categories.sortOrder")}: {c.sortOrder}</span>
                    {c.numericIds && <span>| {t("categories.numericIds")}: {c.numericIds.join(", ")}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Tags size={18} />
                {t("categories.editCategory")}
              </h2>
              <button onClick={() => setSelected(null)} className="text-text-2 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("categories.name")}</label>
                  <input
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                    value={selected.name}
                    onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                  />
                </div>
                <ImageUploader
                  value={selected.media || undefined}
                  onChange={(img) => setSelected({ ...selected, media: img || "" })}
                  size={72}
                />
              </div>

              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("categories.type")}</label>
                <select
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                  value={selected.type}
                  onChange={(e) => setSelected({ ...selected, type: e.target.value as Category["type"] })}
                >
                  {categoryTypes.map((key) => (
                    <option key={key} value={key}>{t(`categoryTypes.${key}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("categories.description")}</label>
                <textarea
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition resize-none"
                  rows={2}
                  value={selected.description}
                  onChange={(e) => setSelected({ ...selected, description: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-text-2 font-semibold">{t("categories.linkedPlayers")} ({linkedPlayerIds.size})</label>
                  <Button variant="secondary" size="sm" onClick={() => setShowPlayerPicker(true)} icon={<Plus size={12} />}>{t("categories.linkPlayers")}</Button>
                </div>
                {linkedPlayers.length === 0 ? (
                  <p className="text-xs text-text-2">{t("categories.noLinkedPlayers")}</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {linkedPlayers.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2">
                        <span className="font-mono text-[10px] text-text-2 w-8 shrink-0">{p.id}</span>
                        <span className="text-sm font-semibold truncate uppercase">{p.f}</span>
                        {p.g && <span className="text-xs text-text-2 truncate uppercase">{p.g}</span>}
                        <button
                          onClick={() => handleUnlinkPlayer(p.id)}
                          className="mr-auto text-red/60 hover:text-red transition shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-text-2 text-left border-t border-border pt-3">
                {t("categories.id")}: {selected.id}
                {selected.numericIds && selected.numericIds.length > 0 && <> | {t("categories.numericIds")}: {selected.numericIds.join(", ")}</>}
                {selected.media && <> | {t("categories.mediaPath")}: {selected.media}</>}
                {" | "}{t("categories.sortOrder")}: {selected.sortOrder}
              </div>
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
        <NewCategoryModal
          players={allPlayers}
          nextId={(() => {
            const cats = Object.values(allCategories);
            const maxNumeric = cats.length > 0 ? Math.max(...cats.flatMap((c) => c.numericIds || [])) : 0;
            return maxNumeric + 1;
          })()}
          sortOrder={Object.values(allCategories).length + 1}
          onConfirm={handleCreateNew}
          onClose={() => setShowNewForm(false)}
        />
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold">{t("categories.confirmDelete")}</h3>
              <p className="text-sm text-text-2">{t("categories.confirmDeleteMessage")}</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>{t("common.cancel")}</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)} icon={<Trash2 size={16} />}>{t("common.delete")}</Button>
            </div>
          </div>
        </div>
      )}

      {showPlayerPicker && selected && (
        <PlayerPickerModal
          players={allPlayers}
          remitItems={[]}
          existingPlayerIds={linkedPlayerIds}
          onSelect={handleLinkPlayers}
          onClose={() => setShowPlayerPicker(false)}
        />
      )}
    </div>
  );
}

function NewCategoryModal({ players, nextId, sortOrder, onConfirm, onClose }: { players: Player[]; nextId: number; sortOrder: number; onConfirm: (data: { name: string; type: string; description: string; linkedPlayerIds: number[]; media: string }) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [type, setType] = useState("national");
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState("");
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [linkedPlayers, setLinkedPlayers] = useState<Player[]>([]);

  const linkedPlayerIds = useMemo(() => new Set(linkedPlayers.map((p) => p.id)), [linkedPlayers]);

  const handleLinkPlayers = (picked: Player[]) => {
    setLinkedPlayers((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const newOnes = picked.filter((p) => !existing.has(p.id));
      return [...prev, ...newOnes];
    });
    setShowPlayerPicker(false);
  };

  const handleUnlinkPlayer = (playerId: number) => {
    setLinkedPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Tags size={18} />
            {t("categories.newCategory")}
          </h2>
          <button onClick={onClose} className="text-text-2 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("categories.name")}</label>
              <input
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("categories.namePlaceholder")}
                autoFocus
              />
            </div>
            <ImageUploader
              value={media || undefined}
              onChange={(img) => setMedia(img || "")}
              size={72}
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("categories.type")}</label>
            <select
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {categoryTypes.map((key) => (
                <option key={key} value={key}>{t(`categoryTypes.${key}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("categories.description")}</label>
            <textarea
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("categories.descriptionPlaceholder")}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-text-2 font-semibold">{t("categories.linkedPlayers")} ({linkedPlayers.length})</label>
              <Button variant="secondary" size="sm" onClick={() => setShowPlayerPicker(true)} icon={<Plus size={12} />}>{t("categories.linkPlayers")}</Button>
            </div>
            {linkedPlayers.length === 0 ? (
              <p className="text-xs text-text-2">{t("categories.noLinkedPlayers")}</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {linkedPlayers.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2">
                    <span className="font-mono text-[10px] text-text-2 w-8 shrink-0">{p.id}</span>
                    <span className="text-sm font-semibold truncate uppercase">{p.f}</span>
                    {p.g && <span className="text-xs text-text-2 truncate uppercase">{p.g}</span>}
                    <button
                      onClick={() => handleUnlinkPlayer(p.id)}
                      className="mr-auto text-red/60 hover:text-red transition shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[10px] text-text-2 text-left border-t border-border pt-3">
            {t("categories.id")}: cat_{nextId} | {t("categories.numericIds")}: {nextId} | {t("categories.sortOrder")}: {sortOrder}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={() => onConfirm({ name, type, description, linkedPlayerIds: Array.from(linkedPlayerIds), media })} disabled={!name.trim()} icon={<Plus size={16} />}>{t("common.add")}</Button>
        </div>
      </div>

      {showPlayerPicker && (
        <PlayerPickerModal
          players={players}
          remitItems={[]}
          existingPlayerIds={linkedPlayerIds}
          onSelect={handleLinkPlayers}
          onClose={() => setShowPlayerPicker(false)}
        />
      )}
    </div>
  );
}
