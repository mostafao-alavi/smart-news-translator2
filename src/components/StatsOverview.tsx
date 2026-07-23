import React from 'react';
import { StatsData } from '../types/client';
import { Globe, Newspaper, Languages, Clock, Activity } from 'lucide-react';

interface StatsOverviewProps {
  stats: StatsData | null;
  loading: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Active RSS Sources */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">منابع خبری RSS (sources)</p>
          <div className="flex items-baseline space-x-2 space-x-reverse mt-1">
            <span className="text-2xl font-bold text-gray-900 font-mono">
              {loading ? '...' : stats?.sources_count ?? 0}
            </span>
            <span className="text-xs text-gray-400">منبع فعال</span>
          </div>
        </div>
        <div className="bg-sky-50 text-sky-600 p-2.5 rounded-lg border border-sky-100">
          <Globe className="w-5 h-5" />
        </div>
      </div>

      {/* Scraped Articles */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">اخبار دریافت‌شده (articles)</p>
          <div className="flex items-baseline space-x-2 space-x-reverse mt-1">
            <span className="text-2xl font-bold text-gray-900 font-mono">
              {loading ? '...' : stats?.articles_count ?? 0}
            </span>
            <span className="text-xs text-gray-400">خبر ذخیره‌شده</span>
          </div>
        </div>
        <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg border border-amber-100">
          <Newspaper className="w-5 h-5" />
        </div>
      </div>

      {/* Persian Translations */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">ترجمه‌های کامل (translations)</p>
          <div className="flex items-baseline space-x-2 space-x-reverse mt-1">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              {loading ? '...' : stats?.translations_count ?? 0}
            </span>
            <span className="text-xs text-emerald-600/70">تکمیل شده</span>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
          <Languages className="w-5 h-5" />
        </div>
      </div>

      {/* Pending Translations Queue */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">صف انتظار ترجمه (pending)</p>
          <div className="flex items-baseline space-x-2 space-x-reverse mt-1">
            <span className="text-2xl font-bold text-orange-600 font-mono">
              {loading ? '...' : stats?.pending_translations_count ?? 0}
            </span>
            <span className="text-xs text-orange-600/70">آماده ترجمه</span>
          </div>
        </div>
        <div className="bg-orange-50 text-orange-600 p-2.5 rounded-lg border border-orange-100">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
