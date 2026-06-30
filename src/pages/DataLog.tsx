import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Database, RefreshCw, Users, Target, Tags, Settings } from "lucide-react";
import { getRecentActivity } from "../lib/db";
import type { ActivityEntry, ActivityTable } from "../lib/types";
import Button from "../components/ui/Button";

export default function DataLog() {
  const { t } = useTranslation();

  const TABLE_META: Record<ActivityTable, { label: string; color: string; icon: typeof Users }> = {
    players: { label: t("dataLog.players"), color: "bg-blue/15 text-blue", icon: Users },
    challenges: { label: t("dataLog.challenges"), color: "bg-gold-dim text-gold", icon: Target },
    categories: { label: t("dataLog.categories"), color: "bg-green/15 text-green", icon: Tags },
    config: { label: t("dataLog.config"), color: "bg-surface-2 text-text-2", icon: Settings },
  };

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const day = d.getDate();
    const months = [t("months.jan"), t("months.feb"), t("months.mar"), t("months.apr"), t("months.may"), t("months.jun"), t("months.jul"), t("months.aug"), t("months.sep"), t("months.oct"), t("months.nov"), t("months.dec")];
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${hours}:${mins}`;
  }

  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRecentActivity(30);
      setEntries(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database size={22} />
            {t("dataLog.title")}
          </h1>
          <p className="text-sm text-text-2 mt-1">{t("dataLog.subtitle")}</p>
        </div>
        <Button variant="ghost" onClick={load} icon={<RefreshCw size={16} className={loading ? "animate-spin" : ""} />}>
          {t("dataLog.refresh")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <Database size={40} className="mx-auto text-text-2 mb-3" />
          <p className="text-text-2 font-semibold">{t("dataLog.noChanges")}</p>
          <p className="text-sm text-text-2 mt-1">{t("dataLog.changesWillAppear")}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {entries.map((entry, i) => {
            const meta = TABLE_META[entry.table];
            const Icon = meta.icon;
            return (
              <div
                key={`${entry.table}-${entry.updatedAt}-${i}`}
                className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-text-2" />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold">{entry.action}</span>
                  <span className="text-xs text-text-2 mr-2">— {entry.description}</span>
                </div>
                <span className="text-xs text-text-2 whitespace-nowrap">{formatDate(entry.updatedAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
