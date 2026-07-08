import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Save, Eye, EyeOff, Trash2, ChevronLeft, Plus } from "lucide-react";
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

export default function ImpostorEditor({ challenge, categories, players, onSave, onClose, onDelete }: Props) {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<Challenge>(() => ({
    ...challenge,
    impostorConfig: challenge.impostorConfig || { categoryId: 0, impostorPlayerId: 0 },
    players: challenge.players ?? [],
  }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const impostorConfig = editor.impostorConfig || { categoryId: 0, impostorPlayerId: 0 };
  const category = Object.values(categories).find((c) => c.numericIds?.includes(impostorConfig.categoryId));

  const setCategoryId = (catId: number) => {
    setEditor({ ...editor, impostorConfig: { ...impostorConfig, categoryId: catId } });
  };

  const toggleImpostor = (playerId: number) => {
    setEditor({
      ...editor,
      impostorConfig: {
        ...impostorConfig,
        impostorPlayerId: impostorConfig.impostorPlayerId === playerId ? 0 : playerId,
      },
    });
  };

  const handleCategoryPick = (picked: Category[]) => {
    if (picked.length > 0) {
      setCategoryId(picked[0].numericIds?.[0] ?? 0);
    }
    setPickerOpen(false);
  };

  const removePlayer = (index: number) => {
    setEditor({ ...editor, players: editor.players.filter((_, i) => i !== index) });
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
              <label className="text-xs text-text-2 font-semibold mb-2 block">الفئة / Category</label>
              {category ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-gold-dim/40 text-gold px-3 py-1.5 rounded font-semibold">
                    {category.description || category.name}
                  </span>
                  <button onClick={() => setPickerOpen(true)} className="text-xs text-text-2 hover:text-white border border-border px-2 py-1 rounded">
                    {t("common.edit")}
                  </button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                  {t("common.add")}
                </Button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-text-2 font-semibold">{t("challenges.players")} ({editor.players.length})</label>
                <Button variant="secondary" size="sm" onClick={() => setShowPlayerPicker(true)} icon={<Plus size={12} />}>{t("challenges.addPlayers")}</Button>
              </div>
              <div className="space-y-2">
                {editor.players.map((p, pi) => {
                  const isImpostor = p.id === impostorConfig.impostorPlayerId;
                  return (
                    <div key={pi} className="bg-surface-2 border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-text-2">{p.id}</span>
                          <span className="text-sm font-semibold truncate">{p.f}</span>
                          <span className="text-xs text-text-2 truncate">{p.g}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => toggleImpostor(p.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                              isImpostor
                                ? "bg-red/20 text-red border-red/50"
                                : "bg-surface text-text-2 border-border hover:border-gold/30"
                            }`}>
                            {isImpostor ? "دخيل! / Impostor!" : "حقيقي / Real"}
                          </button>
                          <button onClick={() => removePlayer(pi)} className="text-red/60 hover:text-red transition">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {editor.players.length === 0 && (
                  <div className="text-center py-6 text-text-2 text-sm">{t("challenges.emptyPlayers")}</div>
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
        onSelect={handleCategoryPick}
        selectedIds={impostorConfig.categoryId ? [impostorConfig.categoryId] : []}
        multi={false}
      />

      {showPlayerPicker && (
        <PlayerPickerModal
          players={players}
          remitItems={[]}
          existingPlayerIds={new Set(editor.players.map((p) => p.id))}
          onSelect={handlePlayerPick}
          onClose={() => setShowPlayerPicker(false)}
        />
      )}
    </>
  );
}
