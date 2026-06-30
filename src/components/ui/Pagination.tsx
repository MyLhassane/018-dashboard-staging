import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function generatePageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const { t, i18n } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const isRTL = i18n.dir() === "rtl";

  const pages = useMemo(() => generatePageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border">
      <span className="text-xs text-text-2 hidden sm:block">
        {t("pagination.showing", { from: startItem, to: endItem, total: totalItems })}
      </span>
      <span className="text-xs text-text-2 sm:hidden">
        {t("pagination.pageXofY", { page: currentPage, total: totalPages })}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg text-text-2 hover:text-white hover:bg-surface-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("pagination.previous")}
        >
          <PrevIcon size={16} />
        </button>

        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-text-2">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition ${
                page === currentPage
                  ? "bg-gold text-black"
                  : "text-text-2 hover:text-white hover:bg-surface-2"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg text-text-2 hover:text-white hover:bg-surface-2 transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("pagination.next")}
        >
          <NextIcon size={16} />
        </button>
      </div>
    </div>
  );
}
