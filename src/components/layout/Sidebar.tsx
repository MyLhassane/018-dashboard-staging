import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, Target, Tags, Settings, Rocket, DoorOpen, LogOut, ChevronDown, ScrollText, Database, Zap, Puzzle, Star, Key, Clapperboard, Grid3x3 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const links = [
  { path: "/", label: "nav.overview", icon: LayoutDashboard },
  { path: "/players", label: "nav.players", icon: Users },
  { path: "/categories", label: "nav.categories", icon: Tags },
  { path: "/publish", label: "nav.publish", icon: Rocket },
];

const gameChildren = [
  { path: "/challenges/elphenomeno", label: "games.elphenomeno", gameType: "elphenomeno", icon: Zap },
  { path: "/challenges/connections", label: "games.connections", gameType: "connections", icon: Puzzle },
  { path: "/challenges/factor", label: "games.factor", gameType: "factor", icon: Star },
  { path: "/challenges/decode", label: "games.decode", gameType: "decode", icon: Key },
  { path: "/challenges/impostor", label: "games.impostor", gameType: "impostor", icon: Clapperboard },
  { path: "/challenges/grid", label: "games.grid", gameType: "grid", icon: Grid3x3 },
];

const systemChildren = [
  { path: "/config", label: "nav.config", icon: Settings },
  { path: "/system/dev-log", label: "nav.devLog", icon: ScrollText },
  { path: "/system/data-log", label: "nav.dataLog", icon: Database },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const isChallengesActive = gameChildren.some((c) => location.pathname === c.path);
  const isSystemActive = systemChildren.some((c) => location.pathname === c.path);
  const [challengesOpen, setChallengesOpen] = useState(isChallengesActive);
  const [systemOpen, setSystemOpen] = useState(isSystemActive);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-s border-border h-screen sticky top-0 flex-shrink-0">
      <div className="p-5 border-b border-border">
        <h1 className="text-gold font-bold text-lg flex items-center gap-2">
          <DoorOpen size={20} />
          FIFA World Cup 2026
        </h1>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition text-start
                ${isActive ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white hover:bg-surface-2"}`}
            >
              <Icon size={18} />
              {t(link.label)}
            </button>
          );
        })}

        {/* التحديات — Accordion */}
        <button
          onClick={() => setChallengesOpen((v) => !v)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition text-start
            ${isChallengesActive && challengesOpen ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white hover:bg-surface-2"}`}
        >
          <Target size={18} />
          <span className="flex-1 text-start">{t("nav.challenges")}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${challengesOpen ? "rotate-180" : ""}`}
          />
        </button>

        {challengesOpen && (
          <div className="space-y-0.5 ms-2">
            {gameChildren.map((child) => {
              const isActive = location.pathname === child.path;
              const Icon = child.icon;
              return (
                <button
                  key={child.path}
                  onClick={() => navigate(child.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition text-start
                    ${isActive ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white hover:bg-surface-2"}`}
                >
                  <Icon size={16} />
                  {t(child.label)}
                </button>
              );
            })}
          </div>
        )}

        {/* النظام — Accordion */}
        <button
          onClick={() => setSystemOpen((v) => !v)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition text-start
            ${isSystemActive && systemOpen ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white hover:bg-surface-2"}`}
        >
          <Settings size={18} />
          <span className="flex-1 text-start">{t("nav.system")}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${systemOpen ? "rotate-180" : ""}`}
          />
        </button>

        {systemOpen && (
          <div className="space-y-0.5 ms-2">
            {systemChildren.map((child) => {
              const isActive = location.pathname === child.path;
              const Icon = child.icon;
              return (
                <button
                  key={child.path}
                  onClick={() => navigate(child.path)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition text-start
                    ${isActive ? "bg-gold-dim text-gold" : "text-text-2 hover:text-white hover:bg-surface-2"}`}
                >
                  <Icon size={16} />
                  {t(child.label)}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-text-2 truncate mb-2">{user?.email}</div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red hover:bg-red/10 transition"
        >
          <LogOut size={16} />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
