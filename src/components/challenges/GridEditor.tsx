import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Save, Eye, EyeOff, Trash2, ChevronLeft } from "lucide-react";
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

const EMPTY_GRID: number[][] = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];

export default function GridEditor({ challenge, categories, players, onSave, onClose, onDelete }: Props) {
  const { t } = useTranslation();
  const [editor, setEditor] = useState<Challenge>(() => ({
    ...challenge,
    gridConfig: challenge.gridConfig || {
      rowCategories: [[], [], []],
      columnCategories: [[], [], []],
      cells: EMPTY_GRID,
    },
    players: challenge.players ?? [],
  }));
  const [rowPickerOpen, setRowPickerOpen] = useState(false);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [pickingRowIndex, setPickingRowIndex] = useState<number | null>(null);
  const [pickingColIndex, setPickingColIndex] = useState<number | null>(null);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [pickingCell, setPickingCell] = useState<{ row: number; col: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const gridConfig = editor.gridConfig || { rowCategories: [[], [], []], columnCategories: [[], [], []], cells: EMPTY_GRID };

  const addGridPlayers = (selectedPlayers: Player[]) => {
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

  const assignCell = (row: number, col: number, playerId: number) => {
    const newCells = gridConfig.cells.map((r) => [...r]);
    newCells[row][col] = playerId;
    setEditor({ ...editor, gridConfig: { ...gridConfig, cells: newCells } });
  };

  const handleRowCategoryPick = (picked: Category[]) => {
    if (pickingRowIndex !== null) {
      const newRows = [...gridConfig.rowCategories];
      newRows[pickingRowIndex] = picked.map((c) => c.numericIds?.[0] ?? 0);
      setEditor({ ...editor, gridConfig: { ...gridConfig, rowCategories: newRows } });
    }
    setRowPickerOpen(false);
  };

  const handleColCategoryPick = (picked: Category[]) => {
    if (pickingColIndex !== null) {
      const newCols = [...gridConfig.columnCategories];
      newCols[pickingColIndex] = picked.map((c) => c.numericIds?.[0] ?? 0);
      setEditor({ ...editor, gridConfig: { ...gridConfig, columnCategories: newCols } });
    }
    setColPickerOpen(false);
  };

  const getCategoryName = (id: number): string => {
    const cat = Object.values(categories).find((c) => c.numericIds?.includes(id));
    return cat?.description || String(id);
  };

  const getPlayerName = (id: number): string => {
    if (id <= 0) return "";
    const p = players.find((pl) => pl.id === id);
    return p ? `${p.f} ${p.g}` : "";
  };

  const removePlayer = (playerId: number) => {
    const newCells = gridConfig.cells.map((r) => r.map((c) => (c === playerId ? -1 : c)));
    setEditor({ ...editor, gridConfig: { ...gridConfig, cells: newCells } });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
        <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-2 rounded-lg p-3">
                <label className="text-xs text-text-2 font-semibold mb-2 block">فئات الصفوف / Row Categories</label>
                <div className="space-y-2">
                  {[0, 1, 2].map((ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <span className="text-[10px] text-text-2 w-4">R{ri + 1}</span>
                      <button onClick={() => { setPickingRowIndex(ri); setRowPickerOpen(true); }}
                        className="flex-1 text-xs text-start bg-surface border border-border rounded px-2 py-1.5 hover:border-gold/50 transition">
                        {gridConfig.rowCategories[ri]?.length > 0
                          ? gridConfig.rowCategories[ri].map(getCategoryName).join(", ")
                          : `+ ${t("common.add")}`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface-2 rounded-lg p-3">
                <label className="text-xs text-text-2 font-semibold mb-2 block">فئات الأعمدة / Column Categories</label>
                <div className="space-y-2">
                  {[0, 1, 2].map((ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <span className="text-[10px] text-text-2 w-4">C{ci + 1}</span>
                      <button onClick={() => { setPickingColIndex(ci); setColPickerOpen(true); }}
                        className="flex-1 text-xs text-start bg-surface border border-border rounded px-2 py-1.5 hover:border-gold/50 transition">
                        {gridConfig.columnCategories[ci]?.length > 0
                          ? gridConfig.columnCategories[ci].map(getCategoryName).join(", ")
                          : `+ ${t("common.add")}`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-2 font-semibold mb-2 block">شبكة 3×3 / Grid</label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => {
                    const playerId = gridConfig.cells[row]?.[col] ?? -1;
                    const playerName = getPlayerName(playerId);
                    return (
                      <button key={`${row}-${col}`} onClick={() => setPickingCell({ row, col })}
                        className="bg-surface-2 border border-border rounded-lg p-3 min-h-[60px] hover:border-gold/50 transition">
                        {playerId > 0 ? (
                          <div className="text-xs font-semibold truncate">{playerName}</div>
                        ) : (
                          <span className="text-xs text-text-2">+ {t("common.add")}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-2 font-semibold mb-2 block">اللاعبون المختارون / Selected Players</label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(gridConfig.cells.flat().filter((id) => id > 0))).map((playerId) => (
                  <span key={playerId} className="text-xs bg-gold-dim/30 text-gold px-2 py-1 rounded-full flex items-center gap-1">
                    {getPlayerName(playerId)}
                    <button onClick={() => removePlayer(playerId)} className="hover:text-red transition">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {(gridConfig.cells.flat().filter((id) => id > 0).length === 0) && (
                  <span className="text-xs text-text-2">{t("challenges.emptyPlayers")}</span>
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
        open={rowPickerOpen}
        onClose={() => setRowPickerOpen(false)}
        onSelect={handleRowCategoryPick}
        selectedIds={pickingRowIndex !== null ? gridConfig.rowCategories[pickingRowIndex] || [] : []}
        multi={true}
      />

      <CategoryPicker
        open={colPickerOpen}
        onClose={() => setColPickerOpen(false)}
        onSelect={handleColCategoryPick}
        selectedIds={pickingColIndex !== null ? gridConfig.columnCategories[pickingColIndex] || [] : []}
        multi={true}
      />

      {showPlayerPicker && pickingCell && (
        <PlayerPickerModal
          players={players}
          remitItems={[]}
          existingPlayerIds={new Set(gridConfig.cells.flat().filter((id) => id > 0))}
          onSelect={(selected) => {
            if (selected.length > 0 && pickingCell) {
              assignCell(pickingCell.row, pickingCell.col, selected[0].id);
            }
            setShowPlayerPicker(false);
          }}
          onClose={() => setShowPlayerPicker(false)}
        />
      )}

      {pickingCell && !showPlayerPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setPickingCell(null)}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <h3 className="text-lg font-bold mb-4">اختيار لاعب للخلية ({pickingCell.row + 1}, {pickingCell.col + 1})</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {players.filter((p) => !gridConfig.cells.flat().includes(p.id) || gridConfig.cells[pickingCell.row]?.[pickingCell.col] === p.id).map((p) => {
                  const selected = gridConfig.cells[pickingCell.row]?.[pickingCell.col] === p.id;
                  return (
                    <button key={p.id} onClick={() => {
                      assignCell(pickingCell.row, pickingCell.col, selected ? -1 : p.id);
                      setPickingCell(null);
                    }}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition ${selected ? "bg-gold-dim text-gold" : "hover:bg-surface-2 text-text-2 hover:text-white"}`}>
                      <span className="font-mono text-[10px] text-text-2 ml-2">#{p.id}</span>
                      {p.f} {p.g}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={() => { setShowPlayerPicker(true); }}>
                  {t("common.search")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
