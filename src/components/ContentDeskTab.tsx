import React, { useState, useEffect } from 'react';
import { JoinedArticleNews } from '../types/client';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  Send,
  Trash2,
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  BookOpen,
  ArrowRight,
  Layers,
  Edit3,
  Copy,
  Check,
  ImageIcon,
  Eye,
  Columns2
} from 'lucide-react';
import { DatabaseErrorFallback } from './DatabaseErrorFallback';
import { EmptyState } from './EmptyState';
import { ArticleDualViewModal } from './ArticleDualViewModal';

interface ContentDeskTabProps {
  news: JoinedArticleNews[];
  loading: boolean;
  error?: boolean;
  onRefresh: () => void;
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onTranslateArticle: (id: number, model?: string) => Promise<any>;
  onDeleteArticle: (id: number) => void;
  onCreateCustomArticle?: (title: string, content: string, model?: string) => Promise<boolean>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  onNavigateTab?: (tab: 'dashboard' | 'sources' | 'content-desk' | 'destinations' | 'settings', subTab?: string) => void;
  initialSubTab?: string;
}

export const ContentDeskTab: React.FC<ContentDeskTabProps> = ({
  news,
  loading,
  error = false,
  onRefresh,
  onTriggerScraper,
  onTriggerTranslator,
  onTranslateArticle,
  onDeleteArticle,
  isTriggeringScraper,
  isTriggeringTranslator,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'translated' | 'published'>('all');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(news.length > 0 ? news[0].id : null);
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [publishingPlatform, setPublishingPlatform] = useState<'wordpress' | 'telegram' | 'both' | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<{ id: number; message: string; ok: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deskViewMode, setDeskViewMode] = useState<'both' | 'translated' | 'original'>('both');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lazy loading article detail (content & translated content)
  const [detailsMap, setDetailsMap] = useState<Record<number, { content?: string; translated_content?: string; translated_title?: string; featured_image?: string; tags?: string[] | string }>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Error fallback
  if (error) {
    return (
      <DatabaseErrorFallback
        message="دیتابیس در حال بازسازی است. لطفاً چند دقیقه دیگر تلاش کنید."
        onRetry={onRefresh}
        isRetrying={loading}
      />
    );
  }

  // Filter news
  const filteredNews = news.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.translated_title && item.translated_title.toLowerCase().includes(term)) ||
      (item.source_name && item.source_name.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterMode === 'pending') {
      return item.translation_status !== 'completed' && !item.translated_title;
    }
    if (filterMode === 'translated') {
      return item.translation_status === 'completed' || !!item.translated_title;
    }
    if (filterMode === 'published') {
      return item.wp_sync_status === 'published' || item.telegram_sync_status === 'published';
    }
    return true;
  });

  // Keep selected article in sync
  useEffect(() => {
    if (filteredNews.length > 0) {
      if (!selectedArticleId || !filteredNews.some((n) => n.id === selectedArticleId)) {
        setSelectedArticleId(filteredNews[0].id);
      }
    } else {
      setSelectedArticleId(null);
    }
  }, [filteredNews, selectedArticleId]);

  // Load article detailed text on selection
  useEffect(() => {
    if (selectedArticleId && !detailsMap[selectedArticleId]) {
      setLoadingDetail(true);
      fetch(`/api/news/${selectedArticleId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setDetailsMap((prev) => ({
              ...prev,
              [selectedArticleId]: json.data
            }));
          }
        })
        .catch((err) => console.error('Error fetching article detail:', err))
        .finally(() => setLoadingDetail(false));
    }
  }, [selectedArticleId, detailsMap]);

  const selectedArticle = news.find((n) => n.id === selectedArticleId);
  const detailData = selectedArticleId ? detailsMap[selectedArticleId] : null;

  const currentTitle = detailData?.translated_title !== undefined
    ? detailData.translated_title
    : (selectedArticle?.translated_title || '');

  const fullContent = detailData?.content || selectedArticle?.content || '';
  const fullTranslatedContent = detailData?.translated_content || selectedArticle?.translated_content || '';
  const featuredImage = detailData?.featured_image || selectedArticle?.featured_image;

  // Normalize tags
  let rawTags = detailData?.tags || selectedArticle?.tags;
  let tags: string[] = [];
  if (Array.isArray(rawTags)) {
    tags = rawTags;
  } else if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      tags = Array.isArray(parsed) ? parsed : [rawTags];
    } catch {
      tags = rawTags.split(/[,،]/).map((t) => t.trim()).filter(Boolean);
    }
  }

  // Action: Single Translate
  const handleSingleTranslate = async (id: number) => {
    setTranslatingId(id);
    try {
      await onTranslateArticle(id);
      // Refetch detail
      fetch(`/api/news/${id}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.success && j.data) {
            setDetailsMap((prev) => ({ ...prev, [id]: j.data }));
          }
        });
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setTranslatingId(null);
    }
  };

  // Action: Distribute to Specific Platforms (Separate WordPress / Telegram / Both)
  const handleDistributePlatform = async (id: number, target: 'wordpress' | 'telegram' | 'both') => {
    setPublishingId(id);
    setPublishingPlatform(target);
    setPublishFeedback(null);
    try {
      const currentDetail = detailsMap[id];
      const articleItem = news.find((n) => n.id === id);

      const titleToSend = currentDetail?.translated_title || articleItem?.translated_title || '';
      const contentToSend = currentDetail?.translated_content || articleItem?.translated_content || '';
      const tagsToSend = currentDetail?.tags || articleItem?.tags || null;

      const platforms = target === 'both' ? ['wordpress', 'telegram'] : [target];

      const res = await fetch(`/api/news/${id}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms,
          translated_title: titleToSend,
          translated_content: contentToSend,
          tags: tagsToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const parts = [];
        if (data.data?.telegram?.sent) parts.push('کانال تلگرام');
        if (data.data?.wordpress?.published) parts.push('سایت وردپرس');
        
        let targetStr = parts.length > 0 ? parts.join(' و ') : (target === 'telegram' ? 'کانال تلگرام' : target === 'wordpress' ? 'سایت وردپرس' : 'سایت و تلگرام');
        setPublishFeedback({ id, message: `✅ با موفقیت در ${targetStr} منتشر شد!`, ok: true });
        onRefresh();
      } else {
        setPublishFeedback({ id, message: `❌ خطا در انتشار: ${data.error || 'پاسخ ناموفق'}`, ok: false });
      }
    } catch (err: any) {
      setPublishFeedback({ id, message: `❌ خطا: ${err.message}`, ok: false });
    } finally {
      setPublishingId(null);
      setPublishingPlatform(null);
      setTimeout(() => setPublishFeedback(null), 6000);
    }
  };

  const handleCopyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingCount = news.filter((n) => !n.translated_title && n.translation_status !== 'completed').length;
  const translatedCount = news.filter((n) => !!n.translated_title || n.translation_status === 'completed').length;
  const publishedCount = news.filter((n) => n.wp_sync_status === 'published' || n.telegram_sync_status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Clean Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-500" />
            میز کار و تحریریه محتوا
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            مشاهده، ترجمه هوشمند با هوش مصنوعی و انتشار اخبار به تفکیک تلگرام و سایت وردپرس
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onTriggerScraper}
            disabled={isTriggeringScraper}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringScraper ? 'animate-spin text-orange-500' : ''}`} />
            <span>{isTriggeringScraper ? 'در حال پایش...' : 'پایش و دریافت اخبار جدید'}</span>
          </button>

          <button
            onClick={onTriggerTranslator}
            disabled={isTriggeringTranslator || pendingCount === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTriggeringTranslator ? 'animate-spin' : ''}`} />
            <span>
              {isTriggeringTranslator
                ? 'هوش مصنوعی در حال ترجمه...'
                : `ترجمه دسته‌ای صف (${pendingCount})`}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در عناوین و متون اخبار..."
            className="w-full pl-3 pr-9 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>

        {/* 4 State Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl shrink-0 flex-wrap">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            همه ({news.length})
          </button>

          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            در صف ترجمه ({pendingCount})
          </button>

          <button
            onClick={() => setFilterMode('translated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'translated'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            ترجمه شده ({translatedCount})
          </button>

          <button
            onClick={() => setFilterMode('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'published'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Send className="w-3 h-3" />
            منتشر شده ({publishedCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredNews.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="text-sm font-bold text-gray-800">هیچ خبری با فیلتر انتخاب شده یافت نشد</h3>
          <p className="text-xs text-gray-400">
            می‌توانید فیلتر جستجو را پاک کنید یا اخبار جدید را پایش نمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Article List (5 Columns on Desktop) */}
          <div className="lg:col-span-5 space-y-3 max-h-[780px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredNews.map((item) => {
              const isSelected = selectedArticleId === item.id;
              const isTranslated = !!item.translated_title || item.translation_status === 'completed';
              const isWpPublished = item.wp_sync_status === 'published';
              const isTelegramPublished = item.telegram_sync_status === 'published';
              const isItemTranslating = translatingId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedArticleId(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-orange-50/40 border-orange-300 ring-2 ring-orange-400/20 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {item.featured_image ? (
                      <img
                        src={item.featured_image}
                        alt="News"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed">
                        {item.translated_title || item.title}
                      </h4>

                      {/* Meta badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {isTranslated ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ترجمه
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            در صف ترجمه
                          </span>
                        )}

                        {/* WordPress Publish Badge */}
                        {isWpPublished && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1" title="منتشر شده در سایت وردپرس">
                            <Globe className="w-3 h-3 text-purple-600" />
                            سایت
                          </span>
                        )}

                        {/* Telegram Publish Badge */}
                        {isTelegramPublished && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1" title="منتشر شده در تلگرام">
                            <Send className="w-3 h-3 text-sky-600" />
                            تلگرام
                          </span>
                        )}

                        <span className="text-[10px] text-gray-400 mr-auto">
                          {new Date(item.published_at || item.created_at || '').toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400">
                      {item.source_name || 'Cointelegraph'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isTranslated && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleTranslate(item.id);
                          }}
                          disabled={isItemTranslating}
                          className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className={`w-3 h-3 ${isItemTranslating ? 'animate-spin' : ''}`} />
                          <span>{isItemTranslating ? 'ترجمه...' : 'ترجمه AI'}</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteArticle(item.id);
                        }}
                        className="p-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف خبر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Focused Article Reader / Editor (7 Columns on Desktop) */}
          <div className="lg:col-span-7 sticky top-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
            {selectedArticle ? (
              <>
                {/* Header & Source Link */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">منبع خبر:</span>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100">
                      {selectedArticle.source_name || 'Cointelegraph'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="مشاهده تمام صفحه و مقایسه رو در رو"
                    >
                      <Columns2 className="w-3.5 h-3.5 text-orange-400" />
                      <span>مقایسه تمام‌صفحه رو در رو</span>
                    </button>

                    <a
                      href={selectedArticle.original_url || selectedArticle.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-colors bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200"
                    >
                      <span>لینک خبر اصلی</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center justify-between bg-gray-100 p-1 rounded-xl">
                  <div className="text-xs font-bold text-gray-600 px-2">حالت نمایش:</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeskViewMode('both')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        deskViewMode === 'both' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      هر دو (مقایسه)
                    </button>
                    <button
                      onClick={() => setDeskViewMode('translated')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        deskViewMode === 'translated' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      متن فارسی
                    </button>
                    <button
                      onClick={() => setDeskViewMode('original')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        deskViewMode === 'original' ? 'bg-white text-blue-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      متن انگلیسی اصلی
                    </button>
                  </div>
                </div>

                {/* Featured Image */}
                {featuredImage && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative group">
                    <img
                      src={featuredImage}
                      alt={selectedArticle.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Persian Translated Title */}
                {(deskViewMode === 'both' || deskViewMode === 'translated') && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      عنوان فارسی خبر:
                    </label>
                    <input
                      type="text"
                      value={currentTitle || ''}
                      onChange={(e) => {
                        if (!selectedArticleId) return;
                        setDetailsMap((prev) => ({
                          ...prev,
                          [selectedArticleId]: {
                            ...prev[selectedArticleId],
                            translated_title: e.target.value
                          }
                        }));
                      }}
                      placeholder="هنوز ترجمه نشده است..."
                      className="w-full font-bold text-gray-900 text-sm bg-gray-50/70 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Original English Title */}
                {(deskViewMode === 'both' || deskViewMode === 'original') && (
                  <div className="bg-blue-50/40 rounded-xl p-3 border border-blue-100 text-xs text-gray-800 font-mono dir-ltr text-left leading-relaxed">
                    <span className="text-[10px] font-bold text-blue-600 block mb-1 dir-rtl text-right font-sans">
                      عنوان انگلیسی اصلی (ترجمه نشده):
                    </span>
                    {selectedArticle.title}
                  </div>
                )}

                {/* Dynamic Content Views based on deskViewMode */}
                <div className={`grid gap-4 ${deskViewMode === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Persian Content Text */}
                  {(deskViewMode === 'both' || deskViewMode === 'translated') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>متن ترجمه شده به فارسی:</span>
                        </label>
                        {fullTranslatedContent && (
                          <button
                            onClick={() => handleCopyText(fullTranslatedContent, selectedArticle.id)}
                            className="text-[10px] text-gray-500 hover:text-gray-900 flex items-center gap-1"
                          >
                            {copiedId === selectedArticle.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === selectedArticle.id ? 'کپی شد' : 'کپی'}</span>
                          </button>
                        )}
                      </div>

                      {loadingDetail ? (
                        <div className="h-48 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center text-xs text-gray-400 animate-pulse">
                          در حال بارگذاری متن مقاله...
                        </div>
                      ) : fullTranslatedContent ? (
                        <textarea
                          value={fullTranslatedContent || ''}
                          onChange={(e) => {
                            if (!selectedArticleId) return;
                            setDetailsMap((prev) => ({
                              ...prev,
                              [selectedArticleId]: {
                                ...prev[selectedArticleId],
                                translated_content: e.target.value
                              }
                            }));
                          }}
                          rows={10}
                          className="w-full text-xs text-gray-800 leading-relaxed bg-emerald-50/20 border border-emerald-200 rounded-xl p-3.5 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      ) : (
                        <div className="p-6 bg-amber-50/40 rounded-xl border border-amber-200 text-center space-y-2">
                          <p className="text-xs font-bold text-amber-800">این خبر هنوز ترجمه نشده است</p>
                          <button
                            onClick={() => handleSingleTranslate(selectedArticle.id)}
                            disabled={translatingId === selectedArticle.id}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${translatingId === selectedArticle.id ? 'animate-spin' : ''}`} />
                            <span>{translatingId === selectedArticle.id ? 'در حال ترجمه...' : 'ترجمه فوری با هوش مصنوعی'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Original Untranslated English Content */}
                  {(deskViewMode === 'both' || deskViewMode === 'original') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          <span>متن کامل اصلی (ترجمه نشده):</span>
                        </label>
                        {fullContent && (
                          <button
                            onClick={() => handleCopyText(fullContent, selectedArticle.id + 100000)}
                            className="text-[10px] text-gray-500 hover:text-gray-900 flex items-center gap-1"
                          >
                            {copiedId === selectedArticle.id + 100000 ? <Check className="w-3 h-3 text-blue-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === selectedArticle.id + 100000 ? 'کپی شد' : 'کپی اصلی'}</span>
                          </button>
                        )}
                      </div>

                      <div className="w-full text-xs text-gray-800 leading-relaxed font-mono dir-ltr text-left bg-blue-50/20 border border-blue-200 rounded-xl p-3.5 max-h-72 overflow-y-auto whitespace-pre-line">
                        {fullContent || 'متن کامل انگلیسی هنوز از منبع استخراج نشده است.'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
                      برچسب‌ها و کلمات کلیدی:
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publishing Status Dashboard Box (Separated Website vs Telegram) */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-900 flex items-center justify-between">
                    <span>وضعیت انتشار در مقاصد (Destinations Status)</span>
                    <span className="text-[11px] font-normal text-gray-500">جلوگیری از ارسال تکراری</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Site (WordPress) Status Card */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                      selectedArticle.wp_sync_status === 'published'
                        ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-purple-600" />
                            وب‌سایت (updaaate.ir)
                          </span>
                          {selectedArticle.wp_sync_status === 'published' ? (
                            <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                              منتشر شده
                            </span>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                              در انتظار
                            </span>
                          )}
                        </div>
                        {selectedArticle.wp_sync_status === 'published' && (
                          <div className="text-[10px] text-purple-700 mt-1">
                            شناسه پست: {selectedArticle.wp_post_id ? `#${selectedArticle.wp_post_id}` : 'ثبت‌شده'}
                            {selectedArticle.wp_published_at && ` • ${new Date(selectedArticle.wp_published_at).toLocaleTimeString('fa-IR')}`}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDistributePlatform(selectedArticle.id, 'wordpress')}
                        disabled={publishingId === selectedArticle.id || !fullTranslatedContent}
                        className={`text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          selectedArticle.wp_sync_status === 'published'
                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {publishingId === selectedArticle.id && publishingPlatform === 'wordpress' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {publishingId === selectedArticle.id && publishingPlatform === 'wordpress'
                            ? 'در حال ارسال به سایت...'
                            : selectedArticle.wp_sync_status === 'published'
                            ? 'ارسال مجدد به سایت'
                            : 'انتشار در سایت (WordPress)'}
                        </span>
                      </button>
                    </div>

                    {/* Telegram Status Card */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                      selectedArticle.telegram_sync_status === 'published'
                        ? 'bg-sky-50/70 border-sky-200 text-sky-900'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-sky-600" />
                            کانال تلگرام
                          </span>
                          {selectedArticle.telegram_sync_status === 'published' ? (
                            <span className="text-[10px] bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                              ارسال شده
                            </span>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                              در انتظار
                            </span>
                          )}
                        </div>
                        {selectedArticle.telegram_sync_status === 'published' && (
                          <div className="text-[10px] text-sky-700 mt-1">
                            شناسه پیام: {selectedArticle.telegram_message_id ? `#${selectedArticle.telegram_message_id}` : 'ارسال‌شده'}
                            {selectedArticle.telegram_published_at && ` • ${new Date(selectedArticle.telegram_published_at).toLocaleTimeString('fa-IR')}`}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDistributePlatform(selectedArticle.id, 'telegram')}
                        disabled={publishingId === selectedArticle.id || !fullTranslatedContent}
                        className={`text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          selectedArticle.telegram_sync_status === 'published'
                            ? 'bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-200'
                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                      >
                        {publishingId === selectedArticle.id && publishingPlatform === 'telegram' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {publishingId === selectedArticle.id && publishingPlatform === 'telegram'
                            ? 'در حال ارسال به تلگرام...'
                            : selectedArticle.telegram_sync_status === 'published'
                            ? 'ارسال مجدد به تلگرام'
                            : 'ارسال به کانال تلگرام'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Publish Status Feedback */}
                {publishFeedback && publishFeedback.id === selectedArticle.id && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold border ${
                      publishFeedback.ok
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {publishFeedback.message}
                  </div>
                )}

                {/* Bottom Combined Distribution Action Button */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-500">
                    {(selectedArticle.wp_sync_status === 'published' && selectedArticle.telegram_sync_status === 'published') ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        این خبر در هر دو مقصد (سایت و تلگرام) منتشر شده است.
                      </span>
                    ) : (
                      <span>می‌توانید به صورت جداگانه یا همزمان در هر دو مقصد منتشر کنید.</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDistributePlatform(selectedArticle.id, 'both')}
                    disabled={publishingId === selectedArticle.id || !fullTranslatedContent}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    {publishingId === selectedArticle.id && publishingPlatform === 'both' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>
                      {publishingId === selectedArticle.id && publishingPlatform === 'both'
                        ? 'در حال ارسال همزمان...'
                        : '⚡ انتشار همزمان (سایت + تلگرام)'}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-400 text-xs">
                یک خبر را از ستون کناری برای مشاهده یا ویرایش انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dual-View Article Modal (Original Untranslated & Translated Full Text) */}
      <ArticleDualViewModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTranslate={onTranslateArticle}
        onDistribute={(id) => handleDistributePlatform(id, 'both')}
        onRefresh={onRefresh}
      />
    </div>
  );
};
