import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Save, Eye, EyeOff, Trash2, ChevronLeft } from "lucide-react";
import type { Challenge, DecodeClue, Player } from "../../lib/types";
import Button from "../ui/Button";

const CLUE_CATEGORIES = [
  "position", "nationality", "league", "era", "clubTier",
  "specificClub", "achievement", "nickname", "reveal",
];

const CLUE_LABELS: Record<string, string> = {
  position: "المركز / Position",
  nationality: "الجنسية / Nationality",
  league: "الدوري / League",
  era: "العصر / Era",
  clubTier: "مستوى النادي / Club Tier",
  specificClub: "النادي / Club",
  achievement: "الإنجاز / Achievement",
  nickname: "اللقب / Nickname",
  reveal: "الكشف الكامل / Full Reveal",
};

interface Props {
  challenge: Challenge;
  players: Player[];
  onSave: (data: Challenge) => void;
  onClose: () => void;
  onDelete: (gameNumber: number) => void;
}

export default function DecodeEditor({ challenge, players, onSave, onClose, onDelete }: Props) {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<Challenge>(() => ({
    ...challenge,
    decodeConfig: challenge.decodeConfig ?? CLUE_CATEGORIES.map((_, i) => ({
      order: i,
      category: CLUE_CATEGORIES[i],
      text: "",
      answer: "",
    })),
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const clues = editor.decodeConfig || [];
  const mysteryPlayerId = editor.players[0]?.id || 0;
  const mysteryPlayer = players.find((p) => p.id === mysteryPlayerId);

  const setMysteryPlayer = (playerId: number) => {
    const found = players.find((p) => p.id === playerId);
    setEditor({
      ...editor,
      players: [{
        id: playerId,
        f: found?.f || "",
        g: found?.g || "",
        v: [],
        p: found?.positions?.[0] || "",
        image: found?.image,
      }],
    });
  };

  const updateClue = (index: number, field: keyof DecodeClue, value: string | number) => {
    const newClues = [...clues];
    newClues[index] = { ...newClues[index], [field]: value };
    setEditor({ ...editor, decodeConfig: newClues });
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
              <label className="text-xs text-text-2 font-semibold mb-2 block">اللاعب الغامض / Mystery Player</label>
              <select
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
                value={mysteryPlayerId}
                onChange={(e) => setMysteryPlayer(Number(e.target.value))}
              >
                <option value={0}>— اختر لاعباً —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>#{p.id} {p.f} {p.g}</option>
                ))}
              </select>
              {mysteryPlayer && (
                <div className="mt-2 text-xs text-gold">
                  {mysteryPlayer.f} {mysteryPlayer.g} — {mysteryPlayer.positions?.join(", ")}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-text-2 font-semibold mb-3 block">التلميحات المتدرجة / Clue Progression</label>
              <div className="space-y-3">
                {clues.sort((a, b) => a.order - b.order).map((clue, i) => (
                  <div key={i} className="bg-surface-2 border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gold">#{i + 1} — {CLUE_LABELS[clue.category] || clue.category}</span>
                    </div>
                    <div className="space-y-2">
                      <input
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold/50 transition"
                        placeholder="نص التلميحة / Clue text..."
                        value={clue.text}
                        onChange={(e) => updateClue(i, "text", e.target.value)}
                      />
                      <input
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold/50 transition"
                        placeholder="الإجابة / Answer..."
                        value={clue.answer}
                        onChange={(e) => updateClue(i, "answer", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
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
    </>
  );
}
