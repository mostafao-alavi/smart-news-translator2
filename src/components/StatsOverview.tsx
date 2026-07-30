import React from 'react';
import { StatsData } from '../types/client';
import { Globe, Newspaper, Languages, Clock, Share2 } from 'lucide-react';

interface StatsOverviewProps {
  stats: StatsData | null;
  loading: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* Active RSS Sources */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 flex items-center gap-2 justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">منابع فعال</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-gray-900 font-mono">
              {loading ? '...' : stats?.sources_count ?? 0}
            </span>
            <span className="text-[11px] text-gray-400">منبع</span>
          </div>
        </div>
        <div className="bg-sky-50 text-sky-600 p-2 rounded-lg border border-sky-100">
          <Globe className="w-4 h-4" />
        </div>
      </div>

      {/* Scraped Articles */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 flex items-center gap-2 justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">کل اخبار</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-gray-900 font-mono">
              {loading ? '...' : stats?.articles_count ?? 0}
            </span>
            <span className="text-[11px] text-gray-400">خبر</span>
          </div>
        </div>
        <div className="bg-amber-50 text-amber-600 p-2 rounded-lg border border-amber-100">
          <Newspaper className="w-4 h-4" />
        </div>
      </div>

      {/* Persian Translations */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 flex items-center gap-2 justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">ترجمه‌های موفق</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-600 font-mono">
              {loading ? '...' : stats?.translations_count ?? 0}
            </span>
            <span className="text-[11px] text-emerald-600/70">تکمیل شده</span>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100">
          <Languages className="w-4 h-4" />
        </div>
      </div>

      {/* WordPress Published */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 flex items-center gap-2 justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">منتشرشده در وردپرس</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-blue-600 font-mono">
              {loading ? '...' : stats?.wp_published_count ?? 0}
            </span>
            <span className="text-[11px] text-blue-600/70">updaaate.ir</span>
          </div>
        </div>
        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg border border-blue-100">
          <Share2 className="w-4 h-4" />
        </div>
      </div>

      {/* Pending Translations Queue */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 flex items-center gap-2 justify-between shadow-xs hover:border-gray-300 transition-all">
        <div>
          <p className="text-xs font-medium text-gray-500">در صف پردازش</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-orange-600 font-mono">
              {loading ? '...' : stats?.pending_translations_count ?? 0}
            </span>
            <span className="text-[11px] text-orange-600/70">آماده ترجمه</span>
          </div>
        </div>
        <div className="bg-orange-50 text-orange-600 p-2 rounded-lg border border-orange-100">
          <Clock className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
