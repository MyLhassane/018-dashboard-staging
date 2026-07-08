import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useData } from "../../contexts/DataContext";
import { Users, Target, Tags, ImageIcon, Type, MapPin, Layers, Globe, FileText, Hash, Send, Trophy } from "lucide-react";

interface MetricDef {
  key: string;
  label: string;
  icon: typeof Users;
  check: (item: any) => boolean;
}

interface MetricResult {
  key: string;
  label: string;
  icon: typeof Users;
  missing: number;
  total: number;
  pct: number;
}

interface SectionResult {
  key: string;
  label: string;
  icon: typeof Users;
  metrics: MetricResult[];
  totalItems: number;
  avgPct: number;
}

const playerMetrics: MetricDef[] = [
  { key: "noImage", label: "players.noImage", icon: ImageIcon, check: (p: any) => !p.image },
  { key: "noFirstName", label: "players.noFirstName", icon: Type, check: (p: any) => !p.g },
  { key: "noPositions", label: "players.noPositions", icon: MapPin, check: (p: any) => !p.positions?.length },
  { key: "noCategoryLinks", label: "players.noCategoryLinks", icon: Layers, check: (p: any) => !p.categoryLinks || !Object.keys(p.categoryLinks).length },
  { key: "noDifficulty", label: "players.noDifficulty", icon: Trophy, check: (p: any) => !p.difficulty },
];

const challengeMetrics: MetricDef[] = [
  { key: "unpublished", label: "challenges.unpublished", icon: Send, check: (c: any) => !c.publishedAt },
  { key: "noPlayers", label: "challenges.noPlayers", icon: Users, check: (c: any) => !c.players?.length },
];

const categoryMetrics: MetricDef[] = [
  { key: "noDescription", label: "categories.noDescription", icon: FileText, check: (c: any) => !c.description },
  { key: "noMedia", label: "categories.noMedia", icon: ImageIcon, check: (c: any) => !c.media },
  { key: "noNumericIds", label: "categories.noNumericIds", icon: Hash, check: (c: any) => !c.numericIds?.length },
];

function computeSection(items: any[], metrics: MetricDef[]): SectionResult {
  const metricResults: MetricResult[] = metrics.map((m) => {
    const missing = items.filter((item) => m.check(item)).length;
    const total = items.length;
    return {
      key: m.key,
      label: m.label,
      icon: m.icon,
      missing,
      total,
      pct: total > 0 ? Math.round(((total - missing) / total) * 100) : 100,
    };
  });
  const totalItems = items.length;
  const avgPct = metricResults.length > 0
    ? Math.round(metricResults.reduce((s, m) => s + m.pct, 0) / metricResults.length)
    : 100;

  return { key: "", label: "", icon: Users, metrics: metricResults, totalItems, avgPct };
}

function ProgressBar({ pct, size = "sm" }: { pct: number; size?: "sm" | "md" }) {
  const color =
    pct === 100 ? "bg-green" : pct >= 80 ? "bg-amber" : "bg-red";
  const h = size === "md" ? "h-2.5" : "h-1.5";
  return (
    <div className={`w-full ${h} bg-surface-2 rounded-full overflow-hidden`}>
      <div
        className={`${h} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function getScoreColor(pct: number): string {
  if (pct === 100) return "text-green";
  if (pct >= 80) return "text-amber";
  return "text-red";
}

const NAV_MAP: Record<string, string> = {
  noImage: "/players?missing=noImage",
  noFirstName: "/players?missing=noFirstName",
  noPositions: "/players?missing=noPositions",
  noCategoryLinks: "/players?missing=noCategoryLinks",
  noDifficulty: "/players?missing=noDifficulty",
  noDescription: "/categories?missing=noDescription",
  noMedia: "/categories?missing=noMedia",
  noNumericIds: "/categories?missing=noNumericIds",
};

export default function DataCompleteness() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { players, challenges, categories, loading } = useData();

  const playersData = players;
  const challengesData = challenges;
  const categoriesData = Object.values(categories);

  const playersSection = computeSection(playersData, playerMetrics);
  const challengesSection = computeSection(challengesData, challengeMetrics);
  const categoriesSection = computeSection(categoriesData, categoryMetrics);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
            <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
            <div className="h-2.5 bg-surface-2 rounded-full animate-pulse" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-6 bg-surface-2/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const sectionConfigs = [
    { key: "players", data: playersSection, icon: Users, label: t("dataLog.players") + ` (${playersData.length})`, color: "bg-blue/15 text-blue" },
    { key: "challenges", data: challengesSection, icon: Target, label: t("dataLog.challenges") + ` (${challengesData.length})`, color: "bg-gold-dim text-gold" },
    { key: "categories", data: categoriesSection, icon: Tags, label: t("dataLog.categories") + ` (${categoriesData.length})`, color: "bg-green/15 text-green" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sectionConfigs.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div
            key={section.key}
            className="bg-surface border border-border rounded-xl p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SectionIcon size={16} className="text-text-2" />
                <h3 className="text-sm font-bold">{section.label}</h3>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreColor(section.data.avgPct)} bg-surface-2`}>
                {section.data.avgPct}%
              </span>
            </div>

            {/* Total */}
            <p className="text-xs text-text-2">
              {t("dataCompleteness.total", { count: section.data.totalItems })}
            </p>

            {/* Progress */}
            <ProgressBar pct={section.data.avgPct} size="md" />

            {/* Metrics list */}
            <div className="space-y-2 pt-1">
              {section.data.metrics.map((m) => {
                const MetricIcon = m.icon;
                const hasIssues = m.missing > 0;
                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      const path = NAV_MAP[m.key];
                      if (path) navigate(path);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition text-right ${
                      hasIssues
                        ? "bg-surface-2/50 hover:bg-surface-2 cursor-pointer"
                        : ""
                    }`}
                    disabled={!hasIssues}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MetricIcon
                        size={12}
                        className={hasIssues ? "text-text-2" : "text-green/60"}
                      />
                      <span className="text-xs text-text-2 truncate">
                        {t(`dataCompleteness.${m.key}`)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold whitespace-nowrap ${
                        hasIssues ? "text-red" : "text-green"
                      }`}
                    >
                      {hasIssues
                        ? `${m.missing}/${m.total}`
                        : `0`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
