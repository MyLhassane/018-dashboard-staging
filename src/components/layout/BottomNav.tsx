import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Target, Tags, Settings, Rocket, ScrollText, Database, X } from "lucide-react";

const tabs = [
  { path: "/", label: "nav.overview", icon: LayoutDashboard },
  { path: "/players", label: "nav.players", icon: Users },
  { path: "/challenges", label: "nav.challenges", icon: Target },
  { path: "/categories", label: "nav.categories", icon: Tags },
  { path: "/publish", label: "nav.publish", icon: Rocket },
];

const systemItems = [
  { path: "/config", label: "nav.config", icon: Settings },
  { path: "/system/dev-log", label: "nav.devLog", icon: ScrollText },
  { path: "/system/data-log", label: "nav.dataLog", icon: Database },
];

const SYSTEM_PATHS = systemItems.map((s) => s.path);

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isSystemActive = SYSTEM_PATHS.includes(location.pathname);

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-0 transition-colors
                  ${isActive ? "text-gold" : "text-text-2"}`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold leading-tight">{t(tab.label)}</span>
              </button>
            );
          })}

          {/* النظام */}
          <button
            onClick={() => setSheetOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-0 transition-colors
              ${isSystemActive ? "text-gold" : "text-text-2"}`}
          >
            <Settings size={20} />
            <span className="text-[10px] font-semibold leading-tight">{t("nav.system")}</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl p-4 pb-8 space-y-1 animate-slide-up">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-sm font-bold">{t("nav.system")}</span>
              <button onClick={() => setSheetOpen(false)} className="text-text-2 hover:text-white">
                <X size={18} />
              </button>
            </div>
            {systemItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-start
                    ${isActive ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white hover:bg-surface-2"}`}
                >
                  <Icon size={18} />
                  {t(item.label)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
