import { useState, useEffect } from "react";
import { Settings, Plus, X } from "lucide-react";
import { useData } from "../contexts/DataContext";
import type { GameConfig } from "../lib/types";
import Button from "../components/ui/Button";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const defaultConfig: GameConfig = {
  general: {
    startDate: "2023-09-11T00:00:00.000Z",
    cardSize: 16,
    cardSizeOptions: [12, 16, 20],
    totalAttempts: 42,
    playerTimer: 10,
    scoring: { correctPoints: 3 },
  },
  roomCategories: {},
  theme: {
    primaryColor: "#ceff27",
    surfaceColor: "#3c2b4b",
  },
  positions: ["Gardien", "Défense", "Milieu", "Attaquant"],
};

export default function Config() {
  const { config: remoteConfig, loading, updateConfig } = useData();
  const [config, setConfigState] = useState<GameConfig>(defaultConfig);
  const { t } = useTranslation();
  const [newPosition, setNewPosition] = useState("");

  useEffect(() => {
    if (remoteConfig) setConfigState({ ...defaultConfig, ...remoteConfig, positions: remoteConfig.positions ?? defaultConfig.positions });
  }, [remoteConfig]);

  const handleSave = () => {
    updateConfig(config);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("config.title")}</h1>
          <p className="text-sm text-text-2 mt-1">{t("config.subtitle")}</p>
        </div>
        <Button onClick={handleSave} icon={<Settings size={16} />}>{t("common.save")}</Button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Settings size={16} />
          {t("config.generalSettings")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.startDate")}</label>
            <input
              type="date"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={config.general.startDate?.split("T")[0] || ""}
              onChange={(e) =>
                setConfigState({
                  ...config,
                  general: { ...config.general, startDate: new Date(e.target.value).toISOString() },
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.cardSize")}</label>
            <input
              type="number"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={config.general.cardSize}
              onChange={(e) =>
                setConfigState({
                  ...config,
                  general: { ...config.general, cardSize: Number(e.target.value) },
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.cardSizeOptions")}</label>
            <input
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={config.general.cardSizeOptions.join(", ")}
              onChange={(e) =>
                setConfigState({
                  ...config,
                  general: {
                    ...config.general,
                    cardSizeOptions: e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
                  },
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.totalAttempts")}</label>
            <input
              type="number"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={config.general.totalAttempts}
              onChange={(e) =>
                setConfigState({
                  ...config,
                  general: { ...config.general, totalAttempts: Number(e.target.value) },
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.playerTimer")}</label>
            <input
              type="number"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={config.general.playerTimer}
              onChange={(e) =>
                setConfigState({
                  ...config,
                  general: { ...config.general, playerTimer: Number(e.target.value) },
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.correctPoints")}</label>
            <input
              type="number"
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
              value={config.general.scoring.correctPoints}
              onChange={(e) =>
                setConfigState({
                  ...config,
                  general: {
                    ...config.general,
                    scoring: { correctPoints: Number(e.target.value) },
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
        <h2 className="text-sm font-bold">{t("settings.appearance")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.primaryColor")}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                value={config.theme.primaryColor}
                onChange={(e) =>
                  setConfigState({
                    ...config,
                    theme: { ...config.theme, primaryColor: e.target.value },
                  })
                }
              />
              <input
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition font-mono"
                value={config.theme.primaryColor}
                onChange={(e) =>
                  setConfigState({
                    ...config,
                    theme: { ...config.theme, primaryColor: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("config.surfaceColor")}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                value={config.theme.surfaceColor}
                onChange={(e) =>
                  setConfigState({
                    ...config,
                    theme: { ...config.theme, surfaceColor: e.target.value },
                  })
                }
              />
              <input
                className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition font-mono"
                value={config.theme.surfaceColor}
                onChange={(e) =>
                  setConfigState({
                    ...config,
                    theme: { ...config.theme, surfaceColor: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold">{t("config.roomCategories")}</h2>
        {Object.keys(config.roomCategories || {}).length === 0 ? (
          <p className="text-sm text-text-2">{t("config.noRoomCategories")}</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(config.roomCategories).map(([key, rc]) => (
              <div key={key} className="bg-surface-2 rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold">{rc.label}</span>
                  <span className="text-xs text-text-2 mr-2">{rc.category}</span>
                </div>
                <span className="text-xs font-mono text-text-2">{key}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold">{t("config.positions")}</h2>
        <div className="flex flex-wrap gap-2">
          {(config.positions ?? []).map((pos) => (
            <span
              key={pos}
              className="inline-flex items-center gap-1.5 bg-surface-2 border border-border text-sm font-semibold px-3 py-1.5 rounded-lg"
            >
              {pos}
              <button
                onClick={() =>
                  setConfigState({
                    ...config,
                    positions: config.positions.filter((p) => p !== pos),
                  })
                }
                className="text-text-2 hover:text-red transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gold/50 transition"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            placeholder={t("config.positionPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newPosition.trim()) {
                setConfigState({
                  ...config,
                  positions: [...(config.positions ?? []), newPosition.trim()],
                });
                setNewPosition("");
              }
            }}
          />
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => {
              if (newPosition.trim()) {
                setConfigState({
                  ...config,
                  positions: [...(config.positions ?? []), newPosition.trim()],
                });
                setNewPosition("");
              }
            }}
            disabled={!newPosition.trim()}
          >
            {t("common.add")}
          </Button>
        </div>
      </div>

      {/* Language */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold">{t("settings.language")}</h2>
        <div>
          <label className="block text-xs text-text-2 font-semibold mb-1.5">{t("settings.language")}</label>
          <p className="text-xs text-text-2 mb-2">{t("settings.languageDescription")}</p>
          <select
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>
    </div>
  );
}
