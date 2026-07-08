import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Save, Eye, EyeOff, Plus, Trash2, ChevronLeft } from "lucide-react";
import type { Challenge, ChallengePlayer, Category, Player } from "../../lib/types";
import Button from "../ui/Button";
import CategoryPicker from "../ui/CategoryPicker";
import PlayerPickerModal from "../ui/PlayerPickerModal";

interface Props {
  challenge: Challenge;
  categories: Record<string, Category>;
  players: Player[];
  onSave: (data: Challenge) => void;
  onClose: () => void;
  onDelete: (gameNumber: number) => void;
}

export default function FactorEditor({ challenge, categories, players, onSave, onClose, onDelete }: Props) {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<Challenge>(() => ({
    ...challenge,
    remit: challenge.remit ?? [],
    players: challenge.players ?? [],
  }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const existingPlayerIds = useMemo(() => new Set(editor.players.map((p) => p.id)), [editor.players]);

  const addCell = () => setEditor({ ...editor, remit: [...editor.remit, []] });

  const handleCellPick = (picked: Category[]) => {
    setEditor({
      ...editor,
      remit: picked.length > 0 ? [picked.map((c) => ({
        id: c.numericIds?.[0] ?? 0,
        name: c.name,
        type: typeToNumber(c.type),
        displayName: c.description || c.name.slice(0, 3).toUpperCase(),
      }))] : [],
    });
  };

  const handlePlayerPick = (selectedPlayers: Player[]) => {
    const newPlayers: ChallengePlayer[] = selectedPlayers.map((p) => ({
      id: p.id,
      f: p.f,
      g: p.g,
      v: [],
      p: p.positions?.[0] || "",
      image: p.image,
    }));
    setEditor({ ...editor, players: [...editor.players, ...newPlayers] });
    setShowPlayerPicker(false);
  };

  const togglePlayerTrait = (playerIndex: number, traitId: number) => {
    const p = editor.players[playerIndex];
    const v = p.v.includes(traitId) ? [] : [traitId];
    const newPlayers = [...editor.players];
    newPlayers[playerIndex] = { ...p, v };
    setEditor({ ...editor, players: newPlayers });
  };

  const removePlayer = (index: number) => {
    setEditor({ ...editor, players: editor.players.filter((_, i) => i !== index) });
    setEditingPlayerIndex(null);
  };

  const traitItems = editor.remit.flat();

  const getCategoryName = (id: number): string => {
    const cat = Object.values(categories).find((c) => c.numericIds?.includes(id));
    return cat?.description || String(id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
        <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
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
            <div className="bg-surface-2 rounded-lg p-4">
              <label className="text-xs text-text-2 font-semibold mb-2 block">{t("challenges.emptyGrid")}</label>
              {traitItems.length === 0 ? (
                <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)} icon={<Plus size={12} />}>
                  {t("common.add")}
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {traitItems.map((item) => (
                    <span key={item.id} className="text-xs bg-gold-dim/40 text-gold px-2 py-1 rounded font-semibold">
                      {item.displayName}
                    </span>
                  ))}
                  <button onClick={() => setPickerOpen(true)} className="text-xs text-text-2 hover:text-white px-2 py-1 rounded border border-border">
                    {t("common.edit")}
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-text-2 font-semibold">{t("challenges.players")} ({editor.players.length})</label>
                <Button variant="secondary" size="sm" onClick={() => setShowPlayerPicker(true)} icon={<Plus size={12} />}>{t("challenges.addPlayers")}</Button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {editor.players.map((p, pi) => {
                  const assignedTrait = p.v.length > 0 ? p.v[0] : null;
                  return (
                    <div key={pi} className="bg-surface-2 border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-text-2">{p.id}</span>
                          <span className="text-sm font-semibold">{p.f}</span>
                          <span className="text-xs text-text-2">{p.g}</span>
                        </div>
                        <button onClick={() => removePlayer(pi)} className="text-red/60 hover:text-red transition">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {traitItems.map((item) => {
                          const active = assignedTrait === item.id;
                          return (
                            <button key={item.id} onClick={() => togglePlayerTrait(pi, item.id)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${active ? "bg-gold-dim text-gold border-gold/50" : "bg-surface text-text-2 border-border hover:border-gold/30"}`}>
                              {item.displayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {editor.players.length === 0 && (
                  <div className="text-center py-6 text-text-2 text-sm">{t("challenges.emptyPlayers")}. {t("challenges.addPlayers")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <CategoryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleCellPick}
        selectedIds={editor.remit.flat().map((i) => i.id)}
        multi={true}
      />

      {showPlayerPicker && (
        <PlayerPickerModal
          players={players}
          remitItems={editor.remit.flat()}
          existingPlayerIds={existingPlayerIds}
          onSelect={handlePlayerPick}
          onClose={() => setShowPlayerPicker(false)}
        />
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
