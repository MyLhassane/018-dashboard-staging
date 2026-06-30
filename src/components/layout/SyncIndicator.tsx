import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CloudOff, Loader2, CheckCircle2, Upload, AlertTriangle } from "lucide-react";
import { useData, type SaveStatus } from "../../contexts/DataContext";

export default function SyncIndicator() {
  const { t } = useTranslation();
  const { saveStatus, saveError, isOnline, pendingCount, syncNow } = useData();
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    if (pendingCount > 0) setShowPending(true);
  }, [pendingCount]);

  const statusStyles: Record<SaveStatus, { bg: string; text: string; icon: JSX.Element | null; label: string }> = {
    idle: { bg: "", text: "", icon: null, label: "" },
    saving: {
      bg: "bg-blue/10",
      text: "text-blue",
      icon: <Loader2 size={12} className="animate-spin" />,
      label: t("sync.saving"),
    },
    saved: {
      bg: "bg-green/10",
      text: "text-green",
      icon: <CheckCircle2 size={12} />,
      label: t("sync.saved"),
    },
    error: {
      bg: "bg-red/10",
      text: "text-red",
      icon: <CloudOff size={12} />,
      label: saveError ? saveError : t("sync.failed"),
    },
  };

  const s = statusStyles[saveStatus];

  if (!s.icon && pendingCount === 0 && isOnline !== false) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <div className={`flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium ${
        s.icon ? s.bg + " " + s.text : isOnline ? "bg-amber/10 text-amber" : "bg-red/10 text-red"
      }`}>
        {s.icon ? (
          <>
            {s.icon}
            <span>{s.label}</span>
          </>
        ) : !isOnline ? (
          <>
            <CloudOff size={12} />
            <span>{t("sync.offline")}{pendingCount > 0 ? ` (${t("sync.pendingChanges", { count: pendingCount })})` : ""}</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <AlertTriangle size={12} />
            <span>{t("sync.pendingChanges", { count: pendingCount })}</span>
            <button
              onClick={syncNow}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber/20 hover:bg-amber/30 transition"
            >
              <Upload size={10} />
              {t("sync.syncButton")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
