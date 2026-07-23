import React from 'react';
import { Rss, Languages, Database, Settings, RefreshCw, Cpu, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'news' | 'sources' | 'settings';
  setActiveTab: (tab: 'news' | 'sources' | 'settings') => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefreshAll,
  isRefreshing,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Badge */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-gradient-to-tr from-orange-500 to-amber-500 p-2.5 rounded-xl text-white shadow-xs">
              <Rss className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight font-sans">
                  سامانه هوشمند پایش و ترجمه اخبار
                </h1>
                <span className="bg-orange-50 text-orange-700 border border-orange-200/80 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 inline text-orange-600" /> نسخه سازمانی
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                پلتفرم پایش خودکار فیدهای خبری، ترجمه زبانی با هوش مصنوعی و مدیریت محتوا
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'news'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>پایگاه اخبار و ترجمه</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sources'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>مدیریت منابع خبری</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 text-orange-600" />
              <span>مرکز مدیریت و تنظیمات</span>
            </button>

            {/* Live Connection Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>اتصال زنده به پایگاه داده</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              title="بروزرسانی اطلاعات"
              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors mr-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
