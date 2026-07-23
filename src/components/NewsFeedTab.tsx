import React, { useState } from 'react';
import { JoinedArticleNews, TranslationHistoryItem } from '../types/client';
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
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Bot,
  Zap,
  X,
  History
} from 'lucide-react';
import { AI_MODELS } from './SettingsTab';

interface NewsFeedTabProps {
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

  // Model Picker Modal State
  const [selectedArticleForTranslate, setSelectedArticleForTranslate] = useState<JoinedArticleNews | null>(null);
  const [chosenModel, setChosenModel] = useState<string>('@cf/meta/m2m100-1.2b');

  // Lazy loading article detail state
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [detailsMap, setDetailsMap] = useState<Record<number, { content?: string; translated_content?: string }>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  // Translation History Modal state
  const [historyArticle, setHistoryArticle] = useState<JoinedArticleNews | null>(null);
  const [historyLogs, setHistoryLogs] = useState<TranslationHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const openHistoryModal = async (article: JoinedArticleNews) => {
    setHistoryArticle(article);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/news/${article.id}/history`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success) {
            setHistoryLogs(json.data || []);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customModel, setCustomModel] = useState<string>('@cf/meta/m2m100-1.2b');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const toggleExpandArticle = async (id: number) => {
    if (expandedIds.has(id)) {
      const next = new Set(expandedIds);
      next.delete(id);
      setExpandedIds(next);
      return;
    }

    const next = new Set(expandedIds);
    next.add(id);
    setExpandedIds(next);

    if (!detailsMap[id]) {
      setLoadingDetailId(id);
      try {
        const res = await fetch(`/api/news/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setDetailsMap((prev) => ({
            ...prev,
            [id]: {
              content: json.data.content,
              translated_content: json.data.translated_content,
            },
          }));
        }
      } catch (e) {
        console.error('Error fetching article detail:', e);
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeSingleTranslate = async (id: number, modelToUse: string) => {
    setTranslatingId(id);
    setSelectedArticleForTranslate(null);
    await onTranslateArticle(id, modelToUse);
    setTranslatingId(null);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    setIsSubmittingCustom(true);
    const success = await onCreateCustomArticle(customTitle, customContent, customModel);
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
                توضیحات یا متن خبر (متن انگلیسی اختیاری):
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Researchers have achieved instantaneous multi-language processing on Cloudflare Workers."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 ltr text-left"
              />
            </div>

            {/* AI Model Selector for Custom Article */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
                <span>انتخاب موتور هوش مصنوعی برای ترجمه این خبر:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCustomModel(m.id)}
                    className={`p-2.5 rounded-lg border text-right transition-all flex flex-col justify-between ${
                      customModel === m.id
                        ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-gray-900">{m.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${m.color}`}>{m.badge}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingCustom}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
            >
              {isSubmittingCustom ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ترجمه و ذخیره‌سازی...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ترجمه فوری و ذخیره در D1</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Main Articles List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500" />
          <p className="text-sm">در حال دریافت آخرین اخبار و ترجمه‌ها از دیتابیس Cloudflare D1...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 space-y-3">
          <Globe className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-base font-bold text-gray-700">هیچ خبری یافت نشد!</p>
          <p className="text-xs text-gray-500">
            می‌توانید روی دکمه «دریافت اخبار جدید (Scraper)» کلیک کنید یا یک خبر دستی اضافه کنید.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNews.map((item) => {
            const isSingleTranslating = translatingId === item.id;
            const isExpanded = expandedIds.has(item.id);
            const isLoadingThisDetail = loadingDetailId === item.id;

            const originalText = detailsMap[item.id]?.content || item.content;
            const translatedText = detailsMap[item.id]?.translated_content || item.translated_content;

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl p-5 shadow-2xs space-y-4 transition-all"
              >
                {/* Source & Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="bg-gray-100 text-gray-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-gray-500" />
                      {item.source_name}
                    </span>

                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    {/* Translation Status Badge */}
                    {item.translation_status === 'completed' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ترجمه‌شده
                      </span>
                    ) : item.translation_status === 'processing' || isSingleTranslating ? (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                        در حال ترجمه...
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        در انتظار ترجمه
                      </span>
                    )}

                    {/* Single Article AI Model Selector & Translate Button */}
                    <button
                      onClick={() => setSelectedArticleForTranslate(item)}
                      disabled={isSingleTranslating}
                      title="ترجمه یا بازترجمه با هوش مصنوعی دلخواه"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      <Sparkles className={`w-3 h-3 text-orange-600 ${isSingleTranslating ? 'animate-spin' : ''}`} />
                      <span>{item.translated_title ? 'بازترجمه با AI' : 'ترجمه تکی AI'}</span>
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
                          <span>نسخه فارسی (ترجمه هوشمند AI)</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openHistoryModal(item)}
                            title="مشاهده آرشیو و مدل‌های قبلی ترجمه این خبر"
                            className="text-indigo-700 hover:text-indigo-900 text-xs flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
                          >
                            <History className="w-3.5 h-3.5 text-indigo-600" />
                            <span>آرشیو ترجمه‌ها</span>
                          </button>

                          <button
                            onClick={() => {
                              const trContent = detailsMap[item.id]?.translated_content || item.translated_content || '';
                              handleCopy(
                                item.id,
                                `${item.translated_title}\n\n${trContent}`
                              );
                            }}
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
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                        {item.translated_title}
                      </h3>

                      {/* Lazy Loaded Translated Content */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-orange-200/60 mt-2">
                          {isLoadingThisDetail ? (
                            <div className="flex items-center gap-2 text-xs text-orange-600 py-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>در حال دریافت متن کامل ترجمه از دیتابیس D1 (Lazy Loading)...</span>
                            </div>
                          ) : translatedText ? (
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pt-1 whitespace-pre-line">
                              {translatedText}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 italic">متن کامل برای این ترجمه موجود نیست.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        هنوز برای این خبر ترجمه فارسی تولید نشده است.
                      </span>
                      <button
                        onClick={() => setSelectedArticleForTranslate(item)}
                        disabled={isSingleTranslating}
                        className="text-orange-600 hover:underline text-xs font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>ترجمه فوری با مدل AI دلخواه</span>
                      </button>
                    </div>
                  )}

                  {/* Original Article Section */}
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-gray-400 mb-1">
                      عنوان و لینک اصلی (انگلیسی):
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-sky-700 hover:text-sky-900 hover:underline font-medium ltr text-left leading-snug flex items-center gap-1 group"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>
                    </div>

                    {/* Lazy Loaded Original Content */}
                    {isExpanded && (
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <div className="text-xs font-semibold text-gray-400 mb-1">
                          متن اصلی (English Content):
                        </div>
                        {isLoadingThisDetail ? (
                          <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>در حال دریافت...</span>
                          </div>
                        ) : originalText ? (
                          <p className="text-xs text-gray-600 ltr text-left leading-relaxed whitespace-pre-line bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            {originalText}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">متن اصلی موجود نیست.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Expand Button */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpandArticle(item.id)}
                    className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    <span>{isExpanded ? 'بستن متن کامل' : 'مشاهده متن کامل خبر'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {item.translated_title && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      Article ID: #{item.id}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Model Selection Modal for Re-translating an Article */}
      {selectedArticleForTranslate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>انتخاب موتور هوش مصنوعی برای ترجمه</span>
              </div>
              <button
                onClick={() => setSelectedArticleForTranslate(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-semibold">خبر انتخابی:</p>
              <p className="text-xs font-bold text-gray-800 ltr text-left line-clamp-2 bg-gray-50 p-2 rounded border border-gray-200">
                {selectedArticleForTranslate.title}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                موتور هوش مصنوعی مورد نظر را انتخاب کنید:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setChosenModel(m.id)}
                    className={`w-full text-right p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      chosenModel === m.id
                        ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/20'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{m.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${m.color}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{m.desc}</p>
                      <span className="text-[10px] text-gray-400 font-mono block">{m.provider}</span>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      chosenModel === m.id ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300'
                    }`}>
                      {chosenModel === m.id && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedArticleForTranslate(null)}
                className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg"
              >
                انصراف
              </button>

              <button
                onClick={() => executeSingleTranslate(selectedArticleForTranslate.id, chosenModel)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>شروع ترجمه با {AI_MODELS.find(x => x.id === chosenModel)?.name || 'AI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Translation Audit History Modal */}
      {historyArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <History className="w-4 h-4 text-indigo-600" />
                <span>آرشیو و تاریخچه نسخه ترجمه‌های این خبر</span>
              </div>
              <button
                onClick={() => setHistoryArticle(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-gray-500 font-medium">کد خبر: #{historyArticle.id}</span>
              <h4 className="text-xs font-bold text-gray-900 leading-snug">
                {historyArticle.title}
              </h4>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-indigo-600 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال دریافت سوابق ترجمه از سامانه...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-500">
                  سابقه‌ای برای ترجمه این خبر ثبت نشده است.
                </div>
              ) : (
                historyLogs.map((item, idx) => (
                  <div key={item.id || idx} className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 bg-indigo-100/80 border border-indigo-200 text-[10px] px-2 py-0.5 rounded font-mono">
                        مدل: {item.model_used || 'Standard AI'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.translated_at ? new Date(item.translated_at).toLocaleString('fa-IR') : '-'}
                      </span>
                    </div>

                    <p className="font-bold text-gray-900 leading-snug">
                      {item.translated_title}
                    </p>

                    <p className="text-gray-700 text-[11px] leading-relaxed line-clamp-3 bg-white p-2 rounded border border-gray-100">
                      {item.translated_content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setHistoryArticle(null)}
                className="bg-gray-800 text-white text-xs px-4 py-2 rounded-lg font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
