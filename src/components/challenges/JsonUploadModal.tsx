import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Upload, FileText, Check, AlertTriangle } from "lucide-react";
import type { Challenge, GameType } from "../../lib/types";
import { setGameChallenge } from "../../lib/db";
import Button from "../ui/Button";

interface Props {
  gameType: GameType;
  onClose: () => void;
  onDone: (challenge: Challenge) => void;
}

export default function JsonUploadModal({ gameType, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFile = (f: File) => {
    setError(null);
    setPreview(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.gameNumber || !data.remit || !data.players) {
          setError("الملف لا يحتوي على challenge صالح. يجب أن يحتوي على gameNumber, remit, players");
          return;
        }
        data.gameType = gameType;
        data.updatedAt = new Date().toISOString();
        data.updatedBy = "admin";
        setPreview(data as Challenge);
      } catch {
        setError("خطأ في قراءة ملف JSON");
      }
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    setError(null);
    try {
      await setGameChallenge(gameType, preview.gameNumber, preview);
      setSuccess(true);
      setTimeout(() => {
        onDone(preview);
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e.message || "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold">رفع JSON / Upload JSON</h3>
          <button onClick={onClose} className="text-text-2 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-gold/50 transition"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload size={32} className="mx-auto text-text-2 mb-2" />
            <p className="text-sm text-text-2">{t("common.dragOrClick")}</p>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-text-2 bg-surface-2 rounded-lg p-3">
              <FileText size={16} className="text-gold" />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-[10px] text-text-2">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red bg-red/10 rounded-lg p-3">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {preview && (
            <div className="bg-surface-2 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gold">#{preview.gameNumber}</span>
                <span className="text-xs text-text-2">{preview.players?.length || 0} لاعب</span>
              </div>
              <div className="text-xs text-text-2">
                {preview.remit?.flat()?.length || 0} فئة • {preview.remit?.length || 0} خلية
              </div>
              {preview.publishedAt ? (
                <span className="text-xs bg-green/10 text-green px-2 py-0.5 rounded-full">منشور</span>
              ) : (
                <span className="text-xs bg-surface text-text-2 px-2 py-0.5 rounded-full">مسودة</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            onClick={handleUpload}
            disabled={!preview || uploading || success}
            icon={success ? <Check size={16} /> : <Upload size={16} />}
          >
            {success ? "تم الرفع!" : uploading ? "جاري الرفع..." : "رفع إلى Firebase"}
          </Button>
        </div>
      </div>
    </div>
  );
}
