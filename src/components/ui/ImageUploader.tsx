import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  size?: number;
  label?: string;
}

export default function ImageUploader({ value, onChange, size = 96, label }: ImageUploaderProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h / w) * maxDim); w = maxDim; }
          else { w = Math.round((w / h) * maxDim); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL("image/png"));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }, [processFile]);

  return (
    <div>
      {label && (
        <label className="block text-xs text-text-2 font-semibold mb-1.5">{label}</label>
      )}
      <div
        className={`relative group rounded-lg border-2 border-dashed transition cursor-pointer overflow-hidden ${
          isDragging ? "border-gold bg-gold/5" : value ? "border-border hover:border-gold/50" : "border-border hover:border-gold/30"
        }`}
        style={{ width: size, height: size }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !value && fileInputRef.current?.click()}
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="text-xs text-white bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition"
              >
                {t("common.edit")}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
                className="text-xs text-white bg-red/70 px-2 py-1 rounded hover:bg-red transition"
              >
                {t("common.delete")}
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-text-2">
            <ImageIcon size={20} className="text-text-2/50" />
            <span className="text-[10px]">{t("common.dragOrClick")}</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
