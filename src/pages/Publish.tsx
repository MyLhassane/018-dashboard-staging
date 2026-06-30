import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Rocket, CheckCircle, XCircle, Clock, Users, Target, Tags } from "lucide-react";
import { getDeployments, recordDeployment, getFullChallengeList } from "../lib/db";
import { publishAll, type PublishResult } from "../lib/publisher";
import { useData } from "../contexts/DataContext";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import type { Deployment, Challenge } from "../lib/types";

export default function Publish() {
  const { t } = useTranslation();
  const { challenges, players, categories, loading: dataLoading } = useData();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const [publishProgress, setPublishProgress] = useState<{ current: number; total: number; currentGame: number } | null>(null);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getDeployments();
      setDeployments(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeploy = async () => {
    setDeploying(true);
    setPublishResults(null);
    setPublishError(null);
    setPublishProgress({ current: 0, total: 0, currentGame: 0 });

    try {
      const fullChallenges: Challenge[] = await getFullChallengeList();
      const publishedChallenges = fullChallenges.filter(c => c.publishedAt);

      if (publishedChallenges.length === 0) {
        setPublishError(t("publish.noPublishedChallenges"));
        setDeploying(false);
        setPublishProgress(null);
        return;
      }

      setPublishProgress({ current: 0, total: publishedChallenges.length, currentGame: 0 });

      const results = await publishAll(publishedChallenges, (result) => {
        setPublishProgress(prev => prev ? {
          ...prev,
          current: prev.current + 1,
          currentGame: result.gameNumber,
        } : null);
      });

      setPublishResults(results);

      const successCount = results.filter(r => r.status === "success").length;
      const failedCount = results.filter(r => r.status === "failed").length;

      const deployment: Deployment = {
        deployedAt: new Date().toISOString(),
        deployedBy: "dashboard",
        status: failedCount === 0 ? "success" : "failed",
        vercelUrl: "https://elphenomeno.vercel.app",
        summary: {
          challenges: successCount,
          players: players.length,
        },
      };

      await recordDeployment(deployment);
      setDeployDone(true);
      setTimeout(() => setDeployDone(false), 5000);
      load();
    } catch (e: any) {
      setPublishError(e.message || t("publish.unknownError"));
      const failed: Deployment = {
        deployedAt: new Date().toISOString(),
        deployedBy: "dashboard",
        status: "failed",
        vercelUrl: "",
        summary: { challenges: 0, players: 0 },
      };
      await recordDeployment(failed);
      load();
    }
    setDeploying(false);
    setPublishProgress(null);
  };

  const loadingState = loading || dataLoading;

  if (loadingState) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t("publish.title")}</h1>
        <p className="text-sm text-text-2 mt-1">{t("publish.subtitle")}</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Rocket size={16} />
          {t("publish.summary")}
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-2 rounded-lg p-4 text-center">
            <Target size={20} className="mx-auto text-gold mb-1" />
            <div className="text-xl font-bold">{challenges.length}</div>
            <div className="text-xs text-text-2">{t("publish.challenge")}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-4 text-center">
            <Users size={20} className="mx-auto text-blue mb-1" />
            <div className="text-xl font-bold">{players.length.toLocaleString()}</div>
            <div className="text-xs text-text-2">{t("publish.player")}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-4 text-center">
            <Tags size={20} className="mx-auto text-green mb-1" />
            <div className="text-xl font-bold">{Object.keys(categories).length}</div>
            <div className="text-xs text-text-2">{t("publish.category")}</div>
          </div>
        </div>

        <Button
          onClick={handleDeploy}
          loading={deploying}
          icon={<Rocket size={16} />}
          className="w-full justify-center"
          size="lg"
          disabled={deploying}
        >
          {deployDone ? t("publish.deployDone") : deploying ? t("publish.publishing") : t("publish.publishToGame")}
        </Button>

        {publishProgress && deploying && (
          <div className="bg-blue/10 text-blue text-sm rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span>{t("publish.progress")}</span>
              <span className="font-mono">{publishProgress.current}/{publishProgress.total}</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2">
              <div
                className="bg-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${(publishProgress.current / publishProgress.total) * 100}%` }}
              />
            </div>
            {publishProgress.currentGame > 0 && (
              <div className="text-xs text-text-2 mt-1">
                {t("publish.publishingChallenge")} #{publishProgress.currentGame}
              </div>
            )}
          </div>
        )}

        {publishError && (
          <div className="bg-red/10 text-red text-sm rounded-lg p-3">
            {publishError}
          </div>
        )}

        {deployDone && !publishError && (
          <div className="bg-green/10 text-green text-sm rounded-lg p-3 text-center">
            {t("publish.successMessage")}
          </div>
        )}

        {publishResults && !deploying && (
          <div className="bg-surface-2 rounded-lg p-3 space-y-2">
            <div className="text-sm font-semibold">{t("publish.results")}</div>
            {publishResults.map((result) => (
              <div key={result.gameNumber} className="flex items-center justify-between text-sm">
                <span>{t("publish.challenge")} #{result.gameNumber}</span>
                {result.status === "success" ? (
                  <CheckCircle size={16} className="text-green" />
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red" />
                    {result.error && <span className="text-xs text-red">{result.error}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Clock size={16} />
          {t("publish.history")}
        </h2>

        {deployments.length === 0 ? (
          <EmptyState icon="🚀" title={t("publish.noDeployments")} description={t("publish.noDeploymentsDesc")} />
        ) : (
          <div className="space-y-2">
            {deployments.map((d, i) => (
              <div
                key={i}
                className="bg-surface-2 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {d.status === "success" ? (
                    <CheckCircle size={18} className="text-green flex-shrink-0" />
                  ) : (
                    <XCircle size={18} className="text-red flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">
                      {d.status === "success" ? t("publish.success") : t("publish.failed")}
                    </div>
                    <div className="text-xs text-text-2">
                      {new Date(d.deployedAt).toLocaleString(i18n.language)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-text-2 text-left">
                  <div>{d.summary.challenges} {t("publish.challenge")}</div>
                  <div>{d.summary.players} {t("publish.player")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
