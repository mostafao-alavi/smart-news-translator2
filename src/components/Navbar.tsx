import React from 'react';
import { Rss, Languages, Database, Settings, RefreshCw, Sparkles, Home } from 'lucide-react';

interface NavbarProps {
  activeTab: 'news' | 'sources' | 'd1' | 'settings';
  setActiveTab: (tab: 'news' | 'sources' | 'd1' | 'settings') => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefreshAll,
  isRefreshing,
  onGoHome,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-50 shadow-xs">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 justify-between h-16 sm:h-20">
          {/* Brand & Badge */}
          <div className="flex items-center gap-2 ">
            <button
              onClick={onGoHome}
              className="bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-2.5 sm:p-3 rounded-2xl text-white shadow-md shadow-orange-500/20 shrink-0 hover:opacity-90 transition-opacity flex items-center gap-2 justify-center min-h-[44px] min-w-[44px]"
              title="صفحه اصلی ۱۰۰۰ دستان"
            >
              <Rss className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 ">
                <button
                  onClick={onGoHome}
                  className="text-lg sm:text-xl font-black text-gray-900 tracking-tight font-sans hover:text-orange-600 transition-colors text-start"
                >
                  ۱۰۰۰ دستان
                </button>
                <span className="bg-orange-50 text-orange-700 border border-orange-200/80 text-[11px] px-2.5 py-0.5 rounded-full font-bold hidden sm:flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-orange-600" /> نسخه ۱.۰.۰
                </span>
              </div>
              
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2 sm:">
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="flex items-center gap-2  px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all min-h-[44px]"
                title="صفحه اصلی"
              >
                <Home className="w-4 h-4 text-gray-500" />
                <span className="hidden md:inline">اصلی</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-2  px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                activeTab === 'news'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 font-bold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Languages className="w-4 h-4 shrink-0" />
              <span>اخبار</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-2  px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                activeTab === 'sources'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 font-bold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Rss className="w-4 h-4 shrink-0" />
              <span>منابع</span>
            </button>

            <button
              onClick={() => setActiveTab('d1')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                activeTab === 'd1'
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="flex items-center gap-1">
                داشبورد D1
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2  px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                activeTab === 'settings'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 font-bold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="hidden sm:inline">تنظیمات</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              title="بروزرسانی"
              className="p-2.5 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center gap-2 justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

