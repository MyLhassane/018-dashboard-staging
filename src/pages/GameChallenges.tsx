import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, EyeOff, Trash2, Search, Upload, Rocket, CheckCircle, XCircle } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { getGameChallenges, setGameChallenge, removeGameChallenge } from "../lib/db";
import { publishAllGameChallenges, type PublishResult } from "../lib/publisher";
import type { Challenge, GameType } from "../lib/types";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ConnectionsEditor from "../components/challenges/ConnectionsEditor";
import FactorEditor from "../components/challenges/FactorEditor";
import DecodeEditor from "../components/challenges/DecodeEditor";
import ImpostorEditor from "../components/challenges/ImpostorEditor";
import GridEditor from "../components/challenges/GridEditor";
import JsonUploadModal from "../components/challenges/JsonUploadModal";

const GAME_NAMES: Record<string, string> = {
  elphenomeno: "games.elphenomeno",
  connections: "games.connections",
  factor: "games.factor",
  decode: "games.decode",
  impostor: "games.impostor",
  grid: "games.grid",
};

interface GameChallengesProps {
  gameType: GameType;
}

export default function GameChallenges({ gameType }: GameChallengesProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { players, categories, config, loading: dataLoading } = useData();
  const [localChallenges, setLocalChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [publishProgress, setPublishProgress] = useState<{ current: number; total: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const fetched = await getGameChallenges(gameType);
      setLocalChallenges(fetched);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadChallenges();
  }, [gameType]);

  const searched = useMemo(
    () => query
      ? localChallenges.filter((c) => String(c.gameNumber).includes(query) || c.players?.some((p) => p.f?.toLowerCase().includes(query.toLowerCase())))
      : localChallenges,
    [localChallenges, query]
  );

  const gameLabel = t(GAME_NAMES[gameType] || "nav.challenges");
  const positions = config?.positions ?? ["Gardien", "Défense", "Milieu", "Attaquant"];

  const handleSave = async (data: Challenge) => {
    setValidationError(null);
    if (gameType === "elphenomeno") {
      const remitCount = data.remit?.flat().length ?? 0;
      const playerCount = data.players?.length ?? 0;
      if (remitCount !== 9) {
        setValidationError(`elphenomeno challenge requires exactly 9 categories (remit items), got ${remitCount}`);
        return;
      }
      if (playerCount !== 40) {
        setValidationError(`elphenomeno challenge requires exactly 40 players, got ${playerCount}`);
        return;
      }
    }
    const enrichedPlayers = data.players.map((cp) => {
      if (cp.image) return cp;
      const fullPlayer = Object.values(players).find((p) => p.id === cp.id);
      return fullPlayer?.image ? { ...cp, image: fullPlayer.image } : cp;
    });
    const updated = {
      ...data,
      gameType,
      players: enrichedPlayers,
      updatedAt: new Date().toISOString(),
      updatedBy: "admin",
    };
    await setGameChallenge(gameType, updated.gameNumber, updated);
    setEditingChallenge(null);
    await loadChallenges();
  };

  const handleDelete = async (num: number) => {
    await removeGameChallenge(gameType, num);
    setConfirmDelete(null);
    setEditingChallenge(null);
    await loadChallenges();
  };

  const handleUploadDone = async (challenge: Challenge) => {
    await loadChallenges();
  };

  const handlePublish = async () => {
    const published = localChallenges.filter((c) => c.publishedAt);
    if (published.length === 0) return;
    setPublishing(true);
    setPublishResults(null);
    setPublishProgress({ current: 0, total: published.length });
    const results = await publishAllGameChallenges(gameType, published, (result) => {
      setPublishProgress((prev) => prev ? { ...prev, current: prev.current + 1 } : null);
    });
    setPublishResults(results);
    setPublishing(false);
    setPublishProgress(null);
  };

  const renderEditor = () => {
    if (!editingChallenge) return null;
    const commonProps = {
      challenge: editingChallenge,
      onSave: handleSave,
      onClose: () => setEditingChallenge(null),
      onDelete: handleDelete,
    };
    switch (gameType) {
      case "elphenomeno":
        return <ConnectionsEditor {...commonProps} categories={categories} players={players} positions={positions} />;
      case "connections":
        return <ConnectionsEditor {...commonProps} categories={categories} players={players} positions={positions} />;
      case "factor":
        return <FactorEditor {...commonProps} categories={categories} players={players} />;
      case "decode":
        return <DecodeEditor {...commonProps} players={players} />;
      case "impostor":
        return <ImpostorEditor {...commonProps} categories={categories} players={players} />;
      case "grid":
        return <GridEditor {...commonProps} categories={categories} players={players} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("gameChallenges.title", { game: gameLabel })}</h1>
          <p className="text-sm text-text-2 mt-1">{t("players.challengeCount", { count: localChallenges.length })}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handlePublish} loading={publishing} icon={<Rocket size={14} />} disabled={publishing || localChallenges.filter(c => c.publishedAt).length === 0}>
            {t("publish.publishToGame")}
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)} icon={<Upload size={14} />}>JSON</Button>
          <Button size="sm" onClick={() => {
            const maxNum = localChallenges.length > 0 ? Math.max(...localChallenges.map((c) => c.gameNumber)) : 1109;
            setEditingChallenge({
              gameNumber: maxNum + 1,
              gameType,
              remit: [],
              players: [],
              publishedAt: null,
              updatedAt: new Date().toISOString(),
              updatedBy: "admin",
            });
          }} icon={<Plus size={14} />}>{t("common.new")}</Button>
        </div>
      </div>

      {validationError && (
        <div className="bg-red/10 text-red text-sm rounded-lg p-3">{validationError}</div>
      )}

      {publishProgress && (
        <div className="bg-blue/10 text-blue text-sm rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span>{t("publish.publishing")}...</span>
            <span className="font-mono">{publishProgress.current}/{publishProgress.total}</span>
          </div>
          <div className="w-full bg-surface-2 rounded-full h-1.5">
            <div className="bg-blue h-1.5 rounded-full transition-all duration-300" style={{ width: `${(publishProgress.current / publishProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {publishResults && !publishing && (
        <div className="bg-surface-2 rounded-lg p-3 space-y-1">
          {publishResults.map((r) => (
            <div key={r.gameNumber} className="flex items-center justify-between text-sm">
              <span>{t("gameChallenges.challengeNumber")} #{r.gameNumber}</span>
              {r.status === "success" ? <CheckCircle size={14} className="text-green" /> : <XCircle size={14} className="text-red" />}
            </div>
          ))}
        </div>
      )}

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
      ) : searched.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={t("gameChallenges.noChallenges")}
          description={t("gameChallenges.createFirst")}
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-2 text-xs">
                  <th className="text-right px-4 py-3 font-semibold w-24">{t("gameChallenges.challengeNumber")}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t("gameChallenges.players")}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t("gameChallenges.categories")}</th>
                  <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">{t("gameChallenges.lastUpdate")}</th>
                  <th className="text-right px-4 py-3 font-semibold">{t("gameChallenges.status")}</th>
                  <th className="text-right px-4 py-3 font-semibold w-28"></th>
                </tr>
              </thead>
              <tbody>
                {searched.map((c) => {
                  const playerCount = c.players?.length ?? 0;
                  const remitCount = c.remit?.flat().length ?? 0;
                  return (
                    <tr key={c.gameNumber} className="border-b border-border/50 hover:bg-surface-2/50 transition">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingChallenge({ ...c })}
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
                          <span className="text-xs bg-green/10 text-green px-2 py-0.5 rounded-full">{t("gameChallenges.published")}</span>
                        ) : (
                          <span className="text-xs bg-surface-2 text-text-2 px-2 py-0.5 rounded-full">{t("gameChallenges.draft")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingChallenge({ ...c })}
                            icon={<span className="text-xs">✏️</span>}>
                            {t("challenges.edit")}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const updated = { ...c, publishedAt: c.publishedAt ? null : new Date().toISOString() };
                            handleSave(updated);
                          }}
                            icon={c.publishedAt ? <EyeOff size={13} /> : <Eye size={13} />} />
                          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(c.gameNumber)}
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

      {renderEditor()}

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

      {showUpload && (
        <JsonUploadModal
          gameType={gameType}
          onClose={() => setShowUpload(false)}
          onDone={handleUploadDone}
        />
      )}
    </div>
  );
}
