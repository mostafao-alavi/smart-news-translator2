import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DatabaseErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const DatabaseErrorFallback: React.FC<DatabaseErrorFallbackProps> = ({
  message = 'دیتابیس در حال بازسازی است. لطفاً چند دقیقه دیگر تلاش کنید.',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="bg-amber-50/80 border border-amber-300/90 rounded-2xl p-8 sm:p-10 text-center shadow-xs max-w-xl mx-auto my-6 space-y-4 animate-in fade-in">
      <div className="w-14 h-14 bg-amber-100 border border-amber-300 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
        <AlertTriangle className="w-7 h-7 text-amber-600" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-gray-900">عدم دسترسی موقت به پایگاه داده</h3>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
          {message}
        </p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>تلاش مجدد</span>
          </button>
        </div>
      )}
    </div>
  );
};
