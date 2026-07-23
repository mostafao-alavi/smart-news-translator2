import React, { useState } from 'react';
import { JoinedArticleNews } from '../types/client';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Plus,
  Send,
} from 'lucide-react';

interface NewsFeedTabProps {
  news: JoinedArticleNews[];
  loading: boolean;
  onRefresh: () => void;
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onTranslateArticle: (id: number) => void;
  onDeleteArticle: (id: number) => void;
  onCreateCustomArticle: (title: string, content: string) => Promise<boolean>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
}

export const NewsFeedTab: React.FC<NewsFeedTabProps> = ({
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [translatingId, setTranslatingId] = useState<number | null>(null);

  // Custom article form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSingleTranslate = async (id: number) => {
    setTranslatingId(id);
    await onTranslateArticle(id);
    setTranslatingId(null);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    setIsSubmittingCustom(true);
    const success = await onCreateCustomArticle(customTitle, customContent);
    setIsSubmittingCustom(false);
    if (success) {
      setCustomTitle('');
      setCustomContent('');
      setShowCustomForm(false);
    }
  };

  const filteredNews = news.filter((item) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(term);
    const faTitleMatch = item.translated_title?.toLowerCase().includes(term) ?? false;
    const sourceMatch = item.source_name.toLowerCase().includes(term);
    return titleMatch || faTitleMatch || sourceMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجو در اخبار و ترجمه‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center space-x-2 space-x-reverse w-full sm:w-auto">
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 space-x-reverse"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>ثبت خبر دستی در D1</span>
          </button>

          <button
            onClick={onTriggerScraper}
            disabled={isTriggeringScraper}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 space-x-reverse disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isTriggeringScraper ? 'animate-spin' : ''}`} />
            <span>{isTriggeringScraper ? 'در حال اسکرپ...' : 'دریافت اخبار جدید (Scraper)'}</span>
          </button>

          <button
            onClick={onTriggerTranslator}
            disabled={isTriggeringTranslator}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-xs border border-orange-600 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 space-x-reverse disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-orange-100 ${isTriggeringTranslator ? 'animate-pulse' : ''}`} />
            <span>{isTriggeringTranslator ? 'در حال ترجمه...' : 'اجرای ترجمه هوشمند (Translator)'}</span>
          </button>
        </div>
      </div>

      {/* Custom Article Input Form Modal/Collapsible */}
      {showCustomForm && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>افزودن خبر انگلیسی دلخواه برای تست ترجمه هوشمند در دیتابیس D1</span>
            </h3>
            <button
              onClick={() => setShowCustomForm(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              انصراف
            </button>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                عنوان خبر انگلیسی (English Title):
              </label>
              <input
                type="text"
                placeholder="e.g. Breakthrough in Edge AI Neural Accelerators Announced"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 ltr text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                توضیحات یا متن خبر (توضیحات اختیاری):
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Researchers have achieved instantaneous multi-language processing on Cloudflare Workers."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 ltr text-left"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingCustom}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 space-x-reverse disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingCustom ? 'در حال ثبت و ترجمه...' : 'ذخیره در دیتابیس D1 و ترجمه هوشمند خودکار'}</span>
            </button>
          </form>
        </div>
      )}

      {/* News List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-orange-500" />
          <p className="text-sm">در حال دریافت جدیدترین اخبار از ورکر Cloudflare D1...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 space-y-4 shadow-xs">
          <Globe className="w-12 h-12 mx-auto text-gray-300" />
          <div>
            <h3 className="text-base font-semibold text-gray-800">هیچ خبری یافت نشد</h3>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm ? 'عبارت جستجو شده را تغییر دهید.' : 'برای دریافت اخبار از منابع RSS، دکمه دریافت اخبار را بفشارید.'}
            </p>
          </div>
          <button
            onClick={onTriggerScraper}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-1.5 space-x-reverse"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>شروع اسکرپ اخبار از منابع RSS</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNews.map((item) => {
            const isCompleted = item.translation_status === 'completed' && item.translated_title;
            const isPending = item.translation_status === 'pending';
            const isProcessing = item.translation_status === 'processing';
            const isSingleTranslating = translatingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all shadow-xs space-y-4"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium border border-gray-200 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-sky-600" />
                      {item.source_name}
                    </span>

                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.published_at || item.created_at).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Status Badge & Individual Article Controls */}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {isCompleted && (
                      <>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          ترجمه تکمیل شده
                        </span>
                        <span className="bg-purple-50 text-purple-700 border border-purple-200/80 text-xs px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          {item.model_used || '@cf/meta/m2m100-1.2b'}
                        </span>
                      </>
                    )}

                    {isPending && (
                      <span className="bg-orange-50 text-orange-700 border border-orange-200/80 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        در صف ترجمه AI
                      </span>
                    )}

                    {(isProcessing || isSingleTranslating) && (
                      <span className="bg-sky-50 text-sky-700 border border-sky-200/80 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        در حال ترجمه هوشمند...
                      </span>
                    )}

                    {/* Single Article Translate Button */}
                    <button
                      onClick={() => handleSingleTranslate(item.id)}
                      disabled={isSingleTranslating}
                      title="ترجمه اختصاصی این خبر با AI"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className={`w-3 h-3 text-orange-600 ${isSingleTranslating ? 'animate-spin' : ''}`} />
                      <span>{isSingleTranslating ? 'در حال ترجمه...' : 'ترجمه تکی AI'}</span>
                    </button>

                    {/* Delete Article Button */}
                    <button
                      onClick={() => onDeleteArticle(item.id)}
                      title="حذف خبر از D1"
                      className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Article Content */}
                <div className="space-y-3">
                  {/* Persian Translation Section */}
                  {item.translated_title ? (
                    <div className="bg-orange-50/40 border border-orange-200/70 rounded-xl p-4 relative space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-700 text-xs font-semibold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          نسخه فارسی (ترجمه‌شده با Workers AI / M2M100)
                        </span>

                        <button
                          onClick={() =>
                            handleCopy(
                              item.id,
                              `${item.translated_title}\n\n${item.translated_content || ''}`
                            )
                          }
                          className="text-gray-600 hover:text-orange-700 text-xs flex items-center gap-1 px-2 py-1 rounded bg-white border border-gray-200 shadow-2xs"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>کپی ترجمه</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                        {item.translated_title}
                      </h3>

                      {item.translated_content && (
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pt-1">
                          {item.translated_content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        هنوز برای این خبر ترجمه فارسی تولید نشده است.
                      </span>
                      <button
                        onClick={() => handleSingleTranslate(item.id)}
                        disabled={isSingleTranslating}
                        className="text-orange-600 hover:underline text-xs font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>ترجمه فوری این خبر</span>
                      </button>
                    </div>
                  )}

                  {/* Original Article Section */}
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-gray-400 mb-1">
                      عنوان و لینک اصلی (انگلیسی):
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 ltr text-left">
                        {item.title}
                      </p>
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 hover:text-sky-800 text-xs flex items-center gap-1 shrink-0 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg border border-sky-200/80"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>مشاهده منبع</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
