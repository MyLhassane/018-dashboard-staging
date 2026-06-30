import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { t } = useTranslation();
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError(t("auth.enterEmailAndPassword"));
      return;
    }
    setLocalError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex items-center justify-center min-h-dvh px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-gold">FIFA World Cup 2026</h1>
          <p className="text-sm text-text-2 mt-1">{t("auth.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          {displayError && (
            <div className="text-sm text-red bg-red/10 rounded-lg px-4 py-3 text-center">
              {displayError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-2 mb-1.5">{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none
                focus:border-gold transition text-sm"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-2 mb-1.5">{t("auth.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="●●●●●●●●"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none
                focus:border-gold transition text-sm"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gold text-black font-bold text-sm transition
              hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                {t("auth.loggingIn")}
              </span>
            ) : (
              t("auth.login")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
