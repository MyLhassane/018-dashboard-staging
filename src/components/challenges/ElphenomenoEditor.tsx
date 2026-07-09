import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Save, Eye, EyeOff, Plus, Trash2, ChevronLeft } from "lucide-react";
import type { Challenge, RemitItem, ChallengePlayer, Category, Player } from "../../lib/types";
import Button from "../ui/Button";
import ImagePreview from "../ui/ImagePreview";
import CategoryPicker from "../ui/CategoryPicker";
import ElphenomenoPlayerBrowser from "./ElphenomenoPlayerBrowser";

interface Props {
  challenge: Challenge;
  categories: Record<string, Category>;
  players: Player[];
  positions: string[];
  onSave: (data: Challenge) => void;
  onClose: () => void;
  onDelete: (gameNumber: number) => void;
}

export default function ElphenomenoEditor({ challenge, categories, players, positions, onSave, onClose, onDelete }: Props) {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<Challenge>(() => ({
    ...challenge,
    players: challenge.players ?? [],
    remit: challenge.remit ?? [],
  }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCellIndex, setPickerCellIndex] = useState<number | null>(null);
  const [showPlayerBrowser, setShowPlayerBrowser] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const remitIds = useMemo(() => new Set(editor.remit.flat().map((r) => r.id)), [editor.remit]);

  const { linkedPlayers, decoyPlayers } = useMemo(() => {
    const linked: { player: ChallengePlayer; index: number }[] = [];
    const decoy: { player: ChallengePlayer; index: number }[] = [];
    editor.players.forEach((p, i) => {
      if (p.v.length > 0 && p.v.some((id) => remitIds.has(id))) {
        linked.push({ player: p, index: i });
      } else {
        decoy.push({ player: p, index: i });
      }
    });
    return { linkedPlayers: linked, decoyPlayers: decoy };
  }, [editor.players, remitIds]);

  const categoryImage = (catId: number): string | undefined => {
    const cat = Object.values(categories).find((c) => c.numericIds?.includes(catId));
    return cat?.media;
  };

  const categoryDisplayName = (catId: number): string => {
    const cat = Object.values(categories).find((c) => c.numericIds?.includes(catId));
    return cat?.description || String(catId);
  };

  const linkedCountForCategory = (catId: number): number =>
    linkedPlayers.filter((lp) => lp.player.v.includes(catId)).length;

  const firstPlayerImageForCategory = (catId: number): string | undefined => {
    const found = linkedPlayers.find((lp) => lp.player.v.includes(catId));
    if (found?.player.image) return found.player.image;
    const full = players.find((p) => p.id === found?.player.id);
    return full?.image;
  };

  const handleCellPick = (picked: Category[]) => {
    if (pickerCellIndex === null) return;
    const newRemit = [...editor.remit];
    const cat = picked[0];
    if (cat) {
      newRemit[pickerCellIndex] = [{
        id: cat.numericIds?.[0] ?? 0,
        name: cat.name,
        type: typeToNumber(cat.type),
        displayName: cat.description || cat.name.slice(0, 3).toUpperCase(),
      }];
    } else {
      newRemit[pickerCellIndex] = [];
    }
    const newPlayers = editor.players.map((p) => {
      const fullPlayer = players.find((fp) => fp.id === p.id);
      if (!fullPlayer) return p;
      const newRemitIds = new Set(newRemit.flat().map((r) => r.id));
      const matching = Object.values(fullPlayer.categoryLinks || {})
        .flat()
        .filter((id) => newRemitIds.has(id));
      return { ...p, v: matching };
    });
    setEditor({ ...editor, remit: newRemit, players: newPlayers });
  };

  const handlePlayerPick = (selectedPlayers: Player[]) => {
    const newRemitIds = new Set(editor.remit.flat().map((r) => r.id));
    const newPlayers: ChallengePlayer[] = selectedPlayers.map((p) => {
      const matching = Object.values(p.categoryLinks || {})
        .flat()
        .filter((id) => newRemitIds.has(id));
      return {
        id: p.id,
        f: p.f,
        g: p.g,
        v: matching,
        p: p.positions?.[0] || "",
        image: p.image,
      };
    });
    setEditor({ ...editor, players: newPlayers });
    setShowPlayerBrowser(false);
  };

  const removePlayer = (index: number) => {
    setEditor({ ...editor, players: editor.players.filter((_, i) => i !== index) });
  };

  const isCellEmpty = (cell: RemitItem[]): boolean => !cell || cell.length === 0;

  const fullCategoryMap = useMemo(() => {
    const map: Record<number, Category> = {};
    Object.values(categories).forEach((c) => {
      (c.numericIds || []).forEach((nid) => { map[nid] = c; });
    });
    return map;
  }, [categories]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
        <div className="bg-surface border border-border rounded-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border shrink-0 gap-2">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-text-2 hover:text-white transition">
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
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14} />} />
              <Button size="sm" onClick={() => onSave(editor)} icon={<Save size={14} />}>{t("common.save")}</Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-surface-2 rounded-lg p-2.5">
                <div className="text-lg font-bold">{editor.remit.flat().length}/9</div>
                <div className="text-[10px] text-text-2">{t("elphenomeno.categories")}</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-2.5">
                <div className="text-lg font-bold">{editor.players.length}/40</div>
                <div className="text-[10px] text-text-2">{t("elphenomeno.players")}</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-2.5">
                <div className="text-lg font-bold text-green">{linkedPlayers.length}</div>
                <div className="text-[10px] text-text-2">{t("elphenomeno.linked")}</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-2.5">
                <div className={`text-lg font-bold ${editor.publishedAt ? "text-green" : "text-text-2"}`}>
                  {editor.publishedAt ? t("challenges.published") : t("challenges.draft")}
                </div>
                <div className="text-[10px] text-text-2">{t("challenges.status")}</div>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-2 font-semibold mb-2 block">{t("elphenomeno.categoryGrid")}</label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, ci) => {
                  const cell = editor.remit[ci];
                  const empty = !cell || cell.length === 0;
                  const catId = empty ? null : cell[0].id;
                  const count = catId !== null ? linkedCountForCategory(catId) : 0;
                  const sampleImg = catId !== null ? firstPlayerImageForCategory(catId) : undefined;
                  const catImg = catId !== null ? categoryImage(catId) : undefined;
                  return (
                    <button
                      key={ci}
                      onClick={() => { setPickerCellIndex(ci); setPickerOpen(true); }}
                      className={`relative bg-surface-2 border border-border rounded-lg aspect-square overflow-hidden group hover:border-gold/50 transition`}
                    >
                      {empty ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <Plus size={24} className="text-text-2" />
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {catImg ? (
                              <img src={catImg} className="w-full h-full object-cover opacity-40" />
                            ) : (
                              <span className="text-2xl font-bold text-gold/30">{cell[0].displayName}</span>
                            )}
                          </div>

                          <div className="absolute top-1 left-1">
                            {sampleImg ? (
                              <img src={sampleImg} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-surface object-cover shadow-md" />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-dashed border-text-2/30 flex items-center justify-center">
                                <Plus size={12} className="text-text-2/30" />
                              </div>
                            )}
                          </div>

                          <div className="absolute top-1 right-1 bg-black/60 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {count}
                          </div>

                          <div className="absolute bottom-1.5 left-1.5 right-1.5">
                            <span className="text-[10px] sm:text-xs font-bold text-white bg-black/50 px-1.5 py-0.5 rounded block text-center truncate">
                              {cell[0].displayName}
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-text-2 font-semibold">
                  {t("elphenomeno.linkedPlayers", { count: linkedPlayers.length })}
                </label>
                <Button variant="secondary" size="sm" onClick={() => setShowPlayerBrowser(true)} icon={<Plus size={12} />}>
                  {t("elphenomeno.selectPlayers")}
                </Button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {linkedPlayers.length === 0 ? (
                  <div className="text-center py-6 text-text-2 text-sm">{t("elphenomeno.noLinkedPlayers")}</div>
                ) : (
                  linkedPlayers.map(({ player, index }) => {
                    const catId = player.v.find((id) => remitIds.has(id));
                    const catImg = catId !== undefined ? categoryImage(catId) : undefined;
                    return (
                      <div key={index}
                        className="flex items-center gap-2 bg-surface-2 border border-border rounded-lg p-2"
                      >
                        {catImg && (
                          <div className="w-6 h-6 rounded overflow-hidden shrink-0 border border-border">
                            <img src={catImg} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <ImagePreview src={player.image} size={32} />
                        <span className="font-mono text-[10px] text-text-2 w-8 shrink-0">{player.id}</span>
                        <span className="text-sm font-semibold truncate">{player.f}</span>
                        {player.g && <span className="text-xs text-text-2 truncate hidden sm:inline">{player.g}</span>}
                        <span className="text-[10px] bg-gold-dim/30 text-gold px-1.5 py-0.5 rounded shrink-0">{player.p}</span>
                        <button onClick={() => removePlayer(index)} className="mr-auto text-text-2 hover:text-red transition shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-text-2 font-semibold">
                  {t("elphenomeno.decoyPlayers", { count: decoyPlayers.length })}
                </label>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {decoyPlayers.length === 0 ? (
                  <div className="text-center py-6 text-text-2 text-sm">{t("elphenomeno.noDecoyPlayers")}</div>
                ) : (
                  decoyPlayers.map(({ player, index }) => (
                    <div key={index}
                      className="flex items-center gap-2 bg-surface-2 border border-border rounded-lg p-2 opacity-70"
                    >
                      <ImagePreview src={player.image} size={32} />
                      <span className="font-mono text-[10px] text-text-2 w-8 shrink-0">{player.id}</span>
                      <span className="text-sm font-semibold truncate">{player.f}</span>
                      {player.g && <span className="text-xs text-text-2 truncate hidden sm:inline">{player.g}</span>}
                      <span className="text-[10px] bg-surface-2 text-text-2 px-1.5 py-0.5 rounded shrink-0">{player.p}</span>
                      <button onClick={() => removePlayer(index)} className="mr-auto text-text-2 hover:text-red transition shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CategoryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleCellPick}
        selectedIds={pickerCellIndex !== null ? editor.remit[pickerCellIndex]?.map((i) => i.id) ?? [] : []}
        multi={false}
      />

      {showPlayerBrowser && (
        <ElphenomenoPlayerBrowser
          players={players}
          categories={categories}
          existingPlayerIds={new Set(editor.players.map((p) => p.id))}
          onSelect={handlePlayerPick}
          onClose={() => setShowPlayerBrowser(false)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold">{t("challenges.confirmDelete")}</h3>
              <p className="text-sm text-text-2">{t("challenges.confirmDeleteMsg", { id: editor.gameNumber })}</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>{t("common.cancel")}</Button>
              <Button variant="danger" onClick={() => onDelete(editor.gameNumber)} icon={<Trash2 size={16} />}>{t("common.delete")}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function typeToNumber(type: string): number {
  const map: Record<string, string> = {
    national: "1", club: "2", league: "3", trophy: "6", achievement: "8",
  };
  return Number(map[type] || 0);
}
