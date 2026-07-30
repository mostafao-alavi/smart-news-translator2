import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  FileEdit,
  Send,
  BarChart3,
  Sliders,
  RefreshCw,
  Sparkles,
  Rss,
  Home
} from 'lucide-react';

export type MainAppTab =
  | 'dashboard'
  | 'sources'
  | 'content-desk'
  | 'destinations'
  | 'reports'
  | 'settings';

interface NavbarProps {
  activeTab: MainAppTab;
  setActiveTab: (tab: MainAppTab) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onGoHome?: () => void;
  pendingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefreshAll,
  isRefreshing,
  onGoHome,
  pendingCount = 0,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-50 shadow-xs">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onGoHome}
              className="bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-2.5 sm:p-3 rounded-2xl text-white shadow-md shadow-orange-500/20 shrink-0 hover:opacity-90 transition-opacity flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer"
              title="صفحه اصلی ۱۰۰۰ دستان"
            >
              <Rss className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoHome}
                  className="text-lg sm:text-xl font-black text-gray-900 tracking-tight font-sans hover:text-orange-600 transition-colors text-start cursor-pointer"
                >
                  ۱۰۰۰ دستان
                </button>
                <span className="bg-orange-50 text-orange-700 border border-orange-200/80 text-[11px] px-2.5 py-0.5 rounded-full font-bold hidden lg:flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-orange-600" /> نسخه ۱.۰.۰
                </span>
              </div>
            </div>
          </div>

          {/* Main 6 Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto text-nowrap py-1">
            {/* 1. Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>پیشخوان</span>
            </button>

            {/* 2. Input Sources */}
            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                activeTab === 'sources'
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Inbox className="w-4 h-4 shrink-0" />
              <span>منابع ورودی</span>
            </button>

            {/* 3. Content Desk (Core Workspace) */}
            <button
              onClick={() => setActiveTab('content-desk')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer relative ${
                activeTab === 'content-desk'
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileEdit className="w-4 h-4 shrink-0" />
              <span>میز کار محتوا</span>
              {pendingCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'content-desk' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            {/* 4. Destinations & Distribution */}
            <button
              onClick={() => setActiveTab('destinations')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                activeTab === 'destinations'
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>مقاصد و توزیع</span>
            </button>

            {/* 5. Reports & Logs */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>گزارش‌ها و لاگ‌ها</span>
            </button>

            {/* 6. System & AI Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>تنظیمات سیستم</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all min-h-[44px] cursor-pointer"
                title="صفحه اصلی معرفی"
              >
                <Home className="w-4 h-4 text-gray-500" />
                <span>صفحه معرفی</span>
              </button>
            )}

            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              title="بروزرسانی داده‌های سامانه"
              className="p-2.5 text-gray-600 hover:text-orange-600 hover:bg-gray-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
