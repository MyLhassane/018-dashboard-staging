import { useState, useMemo } from "react";
import {
  Search, X, Save, Eye, EyeOff, Plus, Trash2, Grid3X3,
  ChevronLeft, Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useData } from "../contexts/DataContext";
import type { Challenge, RemitItem, ChallengePlayer, Category, Player } from "../lib/types";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import CategoryPicker from "../components/ui/CategoryPicker";
import PlayerPickerModal from "../components/ui/PlayerPickerModal";

const POSITIONS_DEFAULT = ["Gardien", "Défense", "Milieu", "Attaquant"];

function ensureChallenge(data: Challenge): Challenge {
  return {
    ...data,
    players: data.players ?? [],
    remit: data.remit ?? [],
  };
}

export default function Challenges() {
  const { t } = useTranslation();
  const { challenges: rawChallenges, categories, players: allPlayers, config, loading, updateChallenge, addChallenge, removeChallenge } = useData();
  const POSITIONS = config?.positions ?? POSITIONS_DEFAULT;
  const challenges = useMemo(() => [...rawChallenges].sort((a, b) => b.gameNumber - a.gameNumber), [rawChallenges]);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Challenge | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCellIndex, setPickerCellIndex] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const openEditor = (gameNumber: number) => {
    const c = rawChallenges.find((ch) => ch.gameNumber === gameNumber);
    if (c) setEditor(ensureChallenge(c));
  };

  const handleSave = () => {
    if (!editor) return;
    updateChallenge(editor.gameNumber, {
      ...editor,
      updatedAt: new Date().toISOString(),
      updatedBy: "admin",
    });
    setEditor(null);
  };

  const togglePublished = (c: Challenge) => {
    updateChallenge(c.gameNumber, {
      ...c,
      publishedAt: c.publishedAt ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: "admin",
    });
  };

  const handleDelete = (gameNumber: number) => {
    removeChallenge(gameNumber);
    setConfirmDelete(null);
    setEditor(null);
  };

  const handleCreateNew = () => {
    const maxNum = challenges.length > 0 ? Math.max(...challenges.map((c) => c.gameNumber)) : 0;
    const num = maxNum + 1;
    const newChallenge: Challenge = {
      gameNumber: num,
      remit: [],
      players: [],
      publishedAt: null,
      updatedAt: new Date().toISOString(),
      updatedBy: "admin",
    };
    addChallenge(newChallenge);
    setShowNewForm(false);
    openEditor(num);
  };

  const openCellPicker = (cellIndex: number) => {
    setPickerCellIndex(cellIndex);
    setPickerOpen(true);
  };

  const handleCellPick = (picked: Category[]) => {
    if (pickerCellIndex === null || !editor) return;
    const newRemit = [...editor.remit];
    newRemit[pickerCellIndex] = picked.map((c) => ({
      id: c.numericIds?.[0] ?? 0,
      name: c.name,
      type: typeToNumber(c.type),
      displayName: c.description || c.name.slice(0, 3).toUpperCase(),
    }));
    setEditor({ ...editor, remit: newRemit });
  };

  const addCell = () => {
    if (!editor) return;
    setEditor({ ...editor, remit: [...editor.remit, []] });
  };

  const removeCell = (index: number) => {
    if (!editor) return;
    const newRemit = editor.remit.filter((_, i) => i !== index);
    setEditor({ ...editor, remit: newRemit });
  };

  const existingPlayerIds = useMemo(() => new Set(editor?.players.map((p) => p.id) ?? []), [editor?.players]);

  const handlePlayerPick = (selectedPlayers: Player[]) => {
    if (!editor) return;
    const newPlayers: ChallengePlayer[] = selectedPlayers.map((p) => ({
      id: p.id,
      f: p.f,
      g: p.g,
      v: [],
      p: p.positions?.[0] || "",
    }));
    setEditor({ ...editor, players: [...editor.players, ...newPlayers] });
    setShowPlayerPicker(false);
  };

  const removePlayer = (index: number) => {
    if (!editor) return;
    const newPlayers = editor.players.filter((_, i) => i !== index);
    setEditor({ ...editor, players: newPlayers });
    setEditingPlayerIndex(null);
  };

  const updatePlayer = (index: number, data: Partial<ChallengePlayer>) => {
    if (!editor) return;
    const newPlayers = [...editor.players];
    newPlayers[index] = { ...newPlayers[index], ...data };
    setEditor({ ...editor, players: newPlayers });
  };

  const togglePlayerCategory = (playerIndex: number, catId: number) => {
    if (!editor) return;
    const p = editor.players[playerIndex];
    const v = p.v.includes(catId) ? p.v.filter((id) => id !== catId) : [...p.v, catId];
    updatePlayer(playerIndex, { v });
  };

  const filtered = challenges.filter(
    (c) => !query || String(c.gameNumber).includes(query) || c.players?.some((p) => p.f.toLowerCase().includes(query.toLowerCase()))
  );

  const getCategoryName = (id: number): string => {
    const cat = Object.values(categories).find((c) => c.numericIds?.includes(id));
    return cat?.description || String(id);
  };

  const activePlayer = editingPlayerIndex !== null && editor ? editor.players[editingPlayerIndex] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("challenges.title")}</h1>
          <p className="text-sm text-text-2 mt-1">{t("players.challengeCount", { count: challenges.length })}</p>
        </div>
        <Button size="sm" onClick={() => setShowNewForm(true)} icon={<Plus size={14} />}>{t("common.new")}</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2" />
        <input
          className="w-full bg-surface border border-border rounded-lg pr-9 pl-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
          placeholder={t("players.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🎯" title={t("challenges.emptyGrid")} description={t("challenges.autoNumberDesc")} action={
          <Button onClick={() => setShowNewForm(true)} icon={<Plus size={14} />}>{t("challenges.newChallenge")}</Button>
        } />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-2 text-xs">
                  <th className="text-right px-4 py-3 font-semibold w-24">{t("challenges.challengeNumber")}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t("challenges.players")}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t("challenges.categories")}</th>
                  <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">{t("challenges.lastUpdate")}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t("challenges.status")}</th>
                  <th className="text-right px-4 py-3 font-semibold w-28"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const playerCount = c.players?.length ?? 0;
                  const remitCount = c.remit?.flat().length ?? 0;
                  return (
                    <tr key={c.gameNumber} className="border-b border-border/50 hover:bg-surface-2/50 transition">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEditor(c.gameNumber)}
                          className="font-mono text-xs font-semibold text-gold hover:underline"
                        >
                          #{c.gameNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3">{t("players.playerCount", { count: playerCount })}</td>
                      <td className="px-4 py-3 text-text-2">{t("challenges.selectedCategoriesCount", { count: remitCount })}</td>
                      <td className="px-4 py-3 text-xs text-text-2 hidden sm:table-cell">
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString(i18n.language) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {c.publishedAt ? (
                          <span className="text-xs bg-green/10 text-green px-2 py-0.5 rounded-full">{t("challenges.published")}</span>
                        ) : (
                          <span className="text-xs bg-surface-2 text-text-2 px-2 py-0.5 rounded-full">{t("challenges.draft")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditor(c.gameNumber)} icon={<Grid3X3 size={13} />}>{t("challenges.edit")}</Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); togglePublished(c); }}
                            icon={c.publishedAt ? <EyeOff size={13} /> : <Eye size={13} />} />
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.gameNumber); }}
                            icon={<Trash2 size={13} className="text-red/60" />} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4" onClick={() => setEditor(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setEditor(null)} className="text-text-2 hover:text-white transition">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-bold">{t("challenges.challengePrefix")} #{editor.gameNumber}</h2>
              </div>
              <div className="flex gap-2">
                <Button variant={editor.publishedAt ? "danger" : "ghost"} size="sm"
                  onClick={() => setEditor({ ...editor, publishedAt: editor.publishedAt ? null : new Date().toISOString() })}
                  icon={editor.publishedAt ? <EyeOff size={14} /> : <Eye size={14} />}>
                  {editor.publishedAt ? t("challenges.unpublish") : t("challenges.publish")}
                </Button>
                <Button variant="danger" size="sm"
                  onClick={() => setConfirmDelete(editor.gameNumber)}
                  icon={<Trash2 size={14} />} />
                <Button size="sm" onClick={handleSave} icon={<Save size={14} />}>{t("common.save")}</Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-surface-2 rounded-lg p-2.5">
                  <div className="text-lg font-bold">{editor.players.length}</div>
                  <div className="text-[10px] text-text-2">{t("challenges.statsPlayers")}</div>
                </div>
                <div className="bg-surface-2 rounded-lg p-2.5">
                  <div className="text-lg font-bold">{editor.remit.flat().length}</div>
                  <div className="text-[10px] text-text-2">{t("challenges.statsCategories")}</div>
                </div>
                <div className="bg-surface-2 rounded-lg p-2.5">
                  <div className="text-lg font-bold">{editor.remit.length}</div>
                  <div className="text-[10px] text-text-2">{t("challenges.statsCells")}</div>
                </div>
                <div className="bg-surface-2 rounded-lg p-2.5">
                  <div className={`text-lg font-bold ${editor.publishedAt ? "text-green" : "text-text-2"}`}>
                    {editor.publishedAt ? t("challenges.published") : t("challenges.draft")}
                  </div>
                  <div className="text-[10px] text-text-2">{t("challenges.status")}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-text-2 font-semibold">{t("challenges.emptyGrid")}</label>
                  <Button variant="secondary" size="sm" onClick={addCell} icon={<Plus size={12} />}>{t("challenges.addCell")}</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {editor.remit.map((group, gi) => (
                    <div key={gi} className="bg-surface-2 border border-border rounded-lg p-2 min-h-[72px] relative group">
                      <button
                        onClick={() => removeCell(gi)}
                        className="absolute -top-2 -left-2 w-5 h-5 bg-red/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                      >
                        <X size={10} />
                      </button>
                      <button
                        onClick={() => openCellPicker(gi)}
                        className="w-full min-h-[56px] flex flex-wrap gap-1 items-start content-start"
                      >
                        {group.length === 0 ? (
                          <span className="text-xs text-text-2 w-full text-center py-3">+ {t("common.add")}</span>
                        ) : group.length === 1 ? (
                          <span className="text-xs bg-gold-dim/40 text-gold px-2 py-1 rounded font-semibold w-full text-center">
                            {group[0].displayName}
                          </span>
                        ) : (
                          group.map((item) => (
                            <span key={item.id} className="text-[10px] bg-gold-dim/20 text-gold border border-gold/30 px-1.5 py-0.5 rounded font-semibold">
                              {item.displayName}
                            </span>
                          ))
                        )}
                      </button>
                    </div>
                  ))}
                  {editor.remit.length === 0 && (
                    <div className="col-span-full text-center py-8 text-text-2 text-sm">
                      {t("challenges.emptyGrid")}. {t("challenges.addCell")}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-text-2 font-semibold">{t("challenges.players")} ({editor.players.length})</label>
                  <Button variant="secondary" size="sm" onClick={() => setShowPlayerPicker(true)} icon={<Plus size={12} />}>{t("challenges.addPlayers")}</Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {editor.players.map((p, pi) => (
                    <button key={pi} onClick={() => setEditingPlayerIndex(pi)}
                      className="w-full text-right bg-surface-2 border border-border rounded-lg p-3 hover:border-gold/50 transition group">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-text-2 w-6 shrink-0">{p.id}</span>
                          <span className="text-sm font-semibold truncate">{p.f || "—"}</span>
                          <span className="text-xs text-text-2 truncate">{p.g || ""}</span>
                          {p.p && <span className="text-[10px] bg-gold-dim/30 text-gold px-1.5 py-0.5 rounded">{p.p}</span>}
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {p.v.slice(0, 3).map((catId) => (
                            <span key={catId} className="text-[9px] bg-gold-dim/20 text-gold border border-gold/30 px-1 rounded">
                              {getCategoryName(catId)}
                            </span>
                          ))}
                          {p.v.length > 3 && <span className="text-[9px] text-text-2">+{p.v.length - 3}</span>}
                        </div>
                        <ChevronLeft size={14} className="text-text-2 opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </div>
                    </button>
                  ))}
                  {editor.players.length === 0 && (
                    <div className="text-center py-6 text-text-2 text-sm">{t("challenges.emptyPlayers")}. {t("challenges.addPlayers")}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePlayer && editor && editingPlayerIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingPlayerIndex(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">{t("challenges.editPlayerTitle")} #{activePlayer.id}</h3>
              <button onClick={() => setEditingPlayerIndex(null)} className="text-text-2 hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("challenges.lastName")}</label>
                <input
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                  value={activePlayer.f}
                  onChange={(e) => updatePlayer(editingPlayerIndex, { f: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("challenges.firstName")}</label>
                <input
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                  value={activePlayer.g || ""}
                  onChange={(e) => updatePlayer(editingPlayerIndex, { g: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("challenges.position")}</label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map((pos) => {
                    const isActive = activePlayer.p === pos;
                    return (
                      <button
                        key={pos}
                        onClick={() => updatePlayer(editingPlayerIndex, { p: isActive ? "" : pos })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                          isActive
                            ? "border-gold bg-gold-dim text-gold"
                            : "border-border bg-surface-2 text-text-2 hover:text-white"
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-2 font-semibold mb-2">{t("challenges.selectedCategoriesCount", { count: activePlayer.v.length })}</label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {editor.remit.flat().filter((item, idx, self) => self.findIndex((it) => it.id === item.id) === idx).map((item) => {
                    const active = activePlayer.v.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => togglePlayerCategory(editingPlayerIndex, item.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          active
                            ? "bg-gold-dim text-gold border-gold/50"
                            : "bg-surface-2 text-text-2 border-border hover:border-gold/30"
                        }`}
                      >
                        {item.displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
              <Button variant="danger" size="sm" onClick={() => removePlayer(editingPlayerIndex)} icon={<Trash2 size={14} />}>
                {t("challenges.deletePlayer")}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditingPlayerIndex(null)}>{t("challenges.close")}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold">{t("challenges.newChallengeTitle")}</h3>
              <button onClick={() => setShowNewForm(false)} className="text-text-2 hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("challenges.challengeNumberLabel")}</label>
                <div className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm font-mono">
                  #{(challenges.length > 0 ? Math.max(...challenges.map((c) => c.gameNumber)) : 0) + 1}
                </div>
              </div>
              <p className="text-sm text-text-2">{t("challenges.autoNumberDesc")}</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <Button variant="secondary" onClick={() => setShowNewForm(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleCreateNew} icon={<Check size={16} />}>{t("common.create")}</Button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold">{t("challenges.confirmDelete")}</h3>
              <p className="text-sm text-text-2">{t("challenges.confirmDeleteMsg", { id: confirmDelete })}</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>{t("common.cancel")}</Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)} icon={<Trash2 size={16} />}>{t("common.delete")}</Button>
            </div>
          </div>
        </div>
      )}

      <CategoryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleCellPick}
        selectedIds={pickerCellIndex !== null && editor ? editor.remit[pickerCellIndex]?.map((i) => i.id) ?? [] : []}
        multi={true}
      />

      {showPlayerPicker && editor && (
        <PlayerPickerModal
          players={allPlayers}
          remitItems={editor.remit.flat()}
          existingPlayerIds={existingPlayerIds}
          onSelect={handlePlayerPick}
          onClose={() => setShowPlayerPicker(false)}
        />
      )}
    </div>
  );
}

function typeToNumber(type: string): number {
  const map: Record<string, string> = {
    national: "1", club: "2", league: "3", trophy: "6", achievement: "8",
  };
  return Number(map[type] || 0);
}
