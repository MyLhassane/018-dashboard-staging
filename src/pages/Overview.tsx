import { useNavigate } from "react-router-dom";
import { Users, Target, Tags, Rocket, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import StatCard from "../components/ui/StatCard";
import { useData } from "../contexts/DataContext";

export default function Overview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { challenges, players, categories, loading } = useData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("overview.title")}</h1>
        <p className="text-sm text-text-2 mt-1">{t("overview.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t("overview.players")}
          value={loading ? "..." : players.length.toLocaleString()}
          icon={<Users size={20} />}
        />
        <StatCard
          label={t("overview.challenges")}
          value={loading ? "..." : challenges.length}
          icon={<Target size={20} />}
        />
        <StatCard
          label={t("overview.categories")}
          value={loading ? "..." : Object.keys(categories).length}
          icon={<Tags size={20} />}
        />
        <StatCard
          label={t("overview.status")}
          value={loading ? "..." : t("overview.active")}
          icon={<Rocket size={20} />}
        />
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold mb-4">⚡ {t("overview.quickActions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate("/challenges")} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold/50 transition text-right">
            <span className="w-9 h-9 rounded-lg bg-gold-dim flex items-center justify-center text-gold">
              <Plus size={18} />
            </span>
            <div>
              <div className="text-sm font-bold">{t("overview.newUpdate")}</div>
              <div className="text-xs text-text-2">{t("overview.manageChallenges")}</div>
            </div>
          </button>

          <button onClick={() => navigate("/players")} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold/50 transition text-right">
            <span className="w-9 h-9 rounded-lg bg-gold-dim flex items-center justify-center text-gold">
              <Plus size={18} />
            </span>
            <div>
              <div className="text-sm font-bold">{t("overview.addPlayer")}</div>
              <div className="text-xs text-text-2">{t("overview.managePlayers")}</div>
            </div>
          </button>

          <button onClick={() => navigate("/publish")} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold/50 transition text-right">
            <span className="w-9 h-9 rounded-lg bg-gold-dim flex items-center justify-center text-gold">
              <Rocket size={18} />
            </span>
            <div>
              <div className="text-sm font-bold">{t("overview.publishUpdates")}</div>
              <div className="text-xs text-text-2">{t("overview.deployToVercel")}</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold mb-4">📋 {t("overview.recentActivity")}</h2>
        {loading ? (
          <div className="text-sm text-text-2">{t("overview.loading")}</div>
        ) : (
          <div className="text-sm text-text-2">
            {challenges.length === 0
              ? t("overview.noData")
              : t("overview.dataImported", { challenges: challenges.length, players: players.length })}
          </div>
        )}
      </div>
    </div>
  );
}
