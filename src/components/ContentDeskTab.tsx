import React, { useState } from 'react';
import { JoinedArticleNews } from '../types/client';
import { NewsFeedTab } from './NewsFeedTab';
import { Clock, CheckCircle2, Archive, Sparkles } from 'lucide-react';

interface ContentDeskTabProps {
  news: JoinedArticleNews[];
  loading: boolean;
  onRefresh: () => void;
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onTranslateArticle: (id: number, model?: string) => Promise<any>;
  onDeleteArticle: (id: number) => void;
  onCreateCustomArticle: (title: string, content: string, model?: string) => Promise<boolean>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  initialSubTab?: 'pending' | 'review' | 'archive';
}

export const ContentDeskTab: React.FC<ContentDeskTabProps> = ({
  news,
  loading,
  onRefresh,
  onTriggerScraper,
  onTriggerTranslator,
  onTranslateArticle,
  onDeleteArticle,
  onCreateCustomArticle,
  isTriggeringScraper,
  isTriggeringTranslator,
  initialSubTab = 'archive',
}) => {
  const [subTab, setSubTab] = useState<'pending' | 'review' | 'archive'>(initialSubTab);

  // Filtered news subsets
  const pendingNews = news.filter((item) => item.translation_status === 'pending' || !item.translated_title);
  const reviewNews = news.filter((item) => item.translation_status === 'completed' && item.translated_title);

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Bar for Content Desk */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          {/* SubTab 1: Pending Queue */}
          <button
            onClick={() => setSubTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>در صف ترجمه (Pending Queue)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingNews.length}
            </span>
          </button>

          {/* SubTab 2: Needs Review */}
          <button
            onClick={() => setSubTab('review')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'review'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>نیاز به بررسی و تایید (Review)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'review' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {reviewNews.length}
            </span>
          </button>

          {/* SubTab 3: Archive */}
          <button
            onClick={() => setSubTab('archive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'archive'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>بایگانی کامل اخبار (Archive)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'archive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {news.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main SubTab Content View */}
      {subTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">اخبار خام در صف ترجمه هوش مصنوعی</h3>
                <p className="text-xs text-gray-600 mt-0.5">اخباری که توسط پایشگر RSS استخراج شده و منتظر پردازش Workers AI هستند</p>
              </div>
            </div>

            <button
              onClick={onTriggerTranslator}
              disabled={isTriggeringTranslator}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Sparkles className={`w-4 h-4 ${isTriggeringTranslator ? 'animate-spin' : ''}`} />
              <span>پردازش دسته‌ای کل صف ترجمه</span>
            </button>
          </div>

          <NewsFeedTab
            news={pendingNews}
            loading={loading}
            onRefresh={onRefresh}
            onTriggerScraper={onTriggerScraper}
            onTriggerTranslator={onTriggerTranslator}
            onTranslateArticle={onTranslateArticle}
            onDeleteArticle={onDeleteArticle}
            onCreateCustomArticle={onCreateCustomArticle}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
          />
        </div>
      )}

      {subTab === 'review' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">میز بررسی و تایید سردبیری (Editor Approval Desk)</h3>
                <p className="text-xs text-gray-600 mt-0.5">اخبار ترجمه‌شده توسط AI که آماده تایید نهایی و انتشار مستقیم روی سایت وردپرس هستند</p>
              </div>
            </div>
          </div>

          <NewsFeedTab
            news={reviewNews}
            loading={loading}
            onRefresh={onRefresh}
            onTriggerScraper={onTriggerScraper}
            onTriggerTranslator={onTriggerTranslator}
            onTranslateArticle={onTranslateArticle}
            onDeleteArticle={onDeleteArticle}
            onCreateCustomArticle={onCreateCustomArticle}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
          />
        </div>
      )}

      {subTab === 'archive' && (
        <NewsFeedTab
          news={news}
          loading={loading}
          onRefresh={onRefresh}
          onTriggerScraper={onTriggerScraper}
          onTriggerTranslator={onTriggerTranslator}
          onTranslateArticle={onTranslateArticle}
          onDeleteArticle={onDeleteArticle}
          onCreateCustomArticle={onCreateCustomArticle}
          isTriggeringScraper={isTriggeringScraper}
          isTriggeringTranslator={isTriggeringTranslator}
        />
      )}
    </div>
  );
};
