import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      {description && <p className="text-sm text-text-2 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
