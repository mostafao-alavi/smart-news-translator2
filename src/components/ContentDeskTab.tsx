import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JoinedArticleNews } from '../types/client';
import { Clock, CheckCircle2, Archive, Users, FileText, ArrowLeft } from 'lucide-react';
import { SmartQueueTab, ReviewStudioTab, EditorialCollabTab, DeepArchiveTab } from './ContentDeskSubTabs';
import { DatabaseErrorFallback } from './DatabaseErrorFallback';
import { EmptyState } from './EmptyState';

interface ContentDeskTabProps {
  news: JoinedArticleNews[];
  loading: boolean;
  error?: boolean;
  onRefresh: () => void;
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onTranslateArticle: (id: number, model?: string) => Promise<any>;
  onDeleteArticle: (id: number) => void;
  onCreateCustomArticle: (title: string, content: string, model?: string) => Promise<boolean>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  onNavigateTab?: (tab: 'dashboard' | 'sources' | 'content-desk' | 'destinations' | 'reports' | 'settings', subTab?: string) => void;
  initialSubTab?: 'queue' | 'studio' | 'collab' | 'archive';
}

export const ContentDeskTab: React.FC<ContentDeskTabProps> = (props) => {
  const { initialSubTab = 'queue', news, loading, error = false, onRefresh, onNavigateTab } = props;
  const [subTab, setSubTab] = useState<'queue' | 'studio' | 'collab' | 'archive'>(initialSubTab);
  const navigate = useNavigate();

  const handleGoToSources = () => {
    if (onNavigateTab) {
      onNavigateTab('sources');
    } else {
      navigate('/app/sources');
    }
  };

  // 1. Error Fallback UI
  if (error) {
    return (
      <DatabaseErrorFallback
        message="دیتابیس در حال بازسازی است. لطفاً چند دقیقه دیگر تلاش کنید."
        onRetry={onRefresh}
        isRetrying={loading}
      />
    );
  }

  // 2. Empty State UI (when not loading and news array is empty)
  if (!loading && news.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="هنوز ترجمه‌ای ثبت نشده است"
        description="منتظر اجرای خودکار اسکرپر باشید یا از تب «منابع» یک منبع اضافه کنید."
        actionText="رفتن به منابع"
        actionIcon={ArrowLeft}
        onAction={handleGoToSources}
      />
    );
  }

  // Filtered news subsets
  const pendingNews = news.filter((item) => item.translation_status === 'pending' || !item.translated_title);
  const reviewNews = news.filter((item) => item.translation_status === 'completed' && item.translated_title);

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Bar for Content Desk */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full scrollbar-none">
          {/* SubTab 1: Smart Queue */}
          <button
            onClick={() => setSubTab('queue')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'queue'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>مدیریت هوشمند صف (Smart Queue)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'queue' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingNews.length}
            </span>
          </button>

          {/* SubTab 2: Review Studio */}
          <button
            onClick={() => setSubTab('studio')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'studio'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>استودیوی ویرایش (Review Studio)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'studio' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {reviewNews.length}
            </span>
          </button>

          {/* SubTab 3: Editorial Collab */}
          <button
            onClick={() => setSubTab('collab')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'collab'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>کار تیمی (Collaboration)</span>
          </button>

          {/* SubTab 4: Deep Archive */}
          <button
            onClick={() => setSubTab('archive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'archive'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>بایگانی عمیق (Deep Archive)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'archive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {news.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main SubTab Content View */}
      {subTab === 'queue' && (
        <SmartQueueTab {...props} news={pendingNews} />
      )}

      {subTab === 'studio' && (
        <ReviewStudioTab news={reviewNews} />
      )}

      {subTab === 'collab' && (
        <EditorialCollabTab news={reviewNews} />
      )}

      {subTab === 'archive' && (
        <DeepArchiveTab news={news} />
      )}
    </div>
  );
};
