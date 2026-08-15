import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon,
}) => {
  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-10 sm:p-14 text-center shadow-xs max-w-xl mx-auto my-6 space-y-4 animate-in fade-in">
      <div className="w-16 h-16 bg-gray-100/90 border border-gray-200 text-gray-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
};
