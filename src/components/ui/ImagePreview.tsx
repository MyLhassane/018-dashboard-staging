import { useState } from "react";
import { User, ImageIcon } from "lucide-react";

interface ImagePreviewProps {
  src?: string;
  alt?: string;
  size?: number;
  fallbackIcon?: "player" | "image";
  className?: string;
}

export default function ImagePreview({ src, alt = "", size = 32, fallbackIcon = "player", className = "" }: ImagePreviewProps) {
  const [hasError, setHasError] = useState(false);
  const showFallback = !src || hasError;

  return (
    <div
      className={`rounded-lg overflow-hidden shrink-0 bg-surface-2 border border-border flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        fallbackIcon === "player" ? (
          <User size={size * 0.45} className="text-text-2/50" />
        ) : (
          <ImageIcon size={size * 0.45} className="text-text-2/50" />
        )
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
