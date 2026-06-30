import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
}

export default function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-2 font-semibold">{label}</span>
        {icon && <span className="w-5 h-5 text-gold">{icon}</span>}
      </div>
      <span className="text-2xl font-bold">{value}</span>
      {trend && <span className="text-xs text-green">{trend}</span>}
    </div>
  );
}
