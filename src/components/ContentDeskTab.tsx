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
  Zap,
  Sliders,
  ShieldCheck,
  Eye,
  Filter,
  Cpu,
  X,
  Code2
} from 'lucide-react';
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

  // Lazy loading article detail (content & translated content)
  const [detailsMap, setDetailsMap] = useState<Record<number, { content?: string; translated_content?: string; translated_title?: string; featured_image?: string; tags?: string[] | string }>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [contentViewMode, setContentViewMode] = useState<'split' | 'persian' | 'english'>('split');

  // HTMLRewriter refetch & test states
  const [refetchingId, setRefetchingId] = useState<number | null>(null);
  const [refetchFeedback, setRefetchFeedback] = useState<{ id: number; message: string; ok: boolean } | null>(null);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testerTab, setTesterTab] = useState<'preview' | 'rules' | 'raw'>('preview');

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
    if (!selectedArticleId) return;
    if (detailsMap[selectedArticleId]) return;

    let isMounted = true;
    setLoadingDetail(true);
    fetch(`/api/news/${selectedArticleId}`)
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          return await res.json();
        } catch {
          return null;
        }
      })
      .then((json) => {
        if (isMounted && json && json.success && json.data) {
          setDetailsMap((prev) => ({
            ...prev,
            [selectedArticleId]: json.data
          }));
        }
      })
      .catch((err) => {
        console.warn('[ContentDesk] Article detail fetch note:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedArticleId]);

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

  // 1. Refetch full article webpage via HTMLRewriter
  const handleRefetchFullText = async (id: number) => {
    setRefetchingId(id);
    setRefetchFeedback(null);
    try {
      const res = await fetch(`/api/articles/${id}/refetch-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDetailsMap((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            content: data.data.content,
            featured_image: data.data.featured_image || prev[id]?.featured_image,
          }
        }));
        setRefetchFeedback({
          id,
          message: `✅ متن کامل با موفقیت استخراج شد (${data.data.text_length} کاراکتر)`,
          ok: true
        });
      } else {
        setRefetchFeedback({
          id,
          message: `❌ ${data.error || 'خطا در استخراج متن'}`,
          ok: false
        });
      }
    } catch (err: any) {
      setRefetchFeedback({
        id,
        message: `❌ خطا: ${err.message}`,
        ok: false
      });
    } finally {
      setRefetchingId(null);
      setTimeout(() => setRefetchFeedback(null), 5000);
    }
  };

  // 2. Test live HTMLRewriter extraction on any URL
  const handleTestLiveExtract = async (overrideUrl?: string) => {
    const target = (overrideUrl || testUrl).trim();
    if (!target || !target.startsWith('http')) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/extract-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTestResult(data.data);
      } else {
        setTestResult({ error: data.error || 'خطا در استخراج محتوا از این آدرس' });
      }
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // 3. Apply extracted content into current article draft
  const handleApplyExtractedToArticle = (extractedContent: string) => {
    if (!selectedArticleId || !extractedContent) return;
    setDetailsMap((prev) => ({
      ...prev,
      [selectedArticleId]: {
        ...prev[selectedArticleId],
        content: extractedContent,
      }
    }));
    setIsTesterOpen(false);
    setRefetchFeedback({
      id: selectedArticleId,
      message: '✅ متن استخراج‌شده به عنوان متن انگلیسی مقاله اعمال شد.',
      ok: true
    });
    setTimeout(() => setRefetchFeedback(null), 4000);
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
            onClick={() => {
              if (selectedArticle) {
                setTestUrl(selectedArticle.link || selectedArticle.original_url || 'https://cointelegraph.com/news/bitcoin-etf-inflows-reach-record-high');
              } else {
                setTestUrl('https://cointelegraph.com/news/bitcoin-etf-inflows-reach-record-high');
              }
              setIsTesterOpen(true);
            }}
            className="bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-sky-600" />
            <span>تحلیل‌گر و تست استخراج HTMLRewriter</span>
          </button>

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
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">منبع خبر:</span>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100">
                      {selectedArticle.source_name || 'Cointelegraph'}
                    </span>
                  </div>

                  <a
                    href={selectedArticle.original_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                  >
                    <span>مشاهده خبر اصلی</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Featured Image */}
                {featuredImage && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 relative group">
                    <img
                      src={featuredImage}
                      alt={selectedArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Persian Translated Title & English Title */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between mb-1">
                      <span>عنوان فارسی خبر (قابل ویرایش):</span>
                      {selectedArticle.translated_title && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          ترجمه شده
                        </span>
                      )}
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

                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/70 text-xs text-gray-600 font-mono ltr leading-relaxed">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 rtl font-sans">
                      تیتر انگلیسی اصلی (Original English Title):
                    </span>
                    {selectedArticle.title}
                  </div>
                </div>

                {/* View Switcher: Split / Persian Only / English Only */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-orange-500" />
                    <span>نمای تطبیقی محتوا:</span>
                  </span>

                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                      onClick={() => setContentViewMode('split')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        contentViewMode === 'split'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>تطبیقی (کنار هم)</span>
                    </button>
                    <button
                      onClick={() => setContentViewMode('persian')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        contentViewMode === 'persian'
                          ? 'bg-white text-emerald-600 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>فارسی</span>
                    </button>
                    <button
                      onClick={() => setContentViewMode('english')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        contentViewMode === 'english'
                          ? 'bg-white text-sky-600 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* Content Comparison Container */}
                {loadingDetail ? (
                  <div className="h-48 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center gap-2 text-xs text-gray-400 animate-pulse">
                    <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                    <span>در حال بارگذاری متن کامل و جزئیات خبر...</span>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${contentViewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Persian Column / Box */}
                    {(contentViewMode === 'split' || contentViewMode === 'persian') && (
                      <div className="bg-white border border-orange-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                        <div>
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                            <span className="text-xs font-bold text-orange-700 flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                              <span>متن ترجمه شده (فارسی)</span>
                            </span>
                            {fullTranslatedContent && (
                              <button
                                onClick={() => handleCopyText(fullTranslatedContent, selectedArticle.id)}
                                className="text-[10px] text-gray-500 hover:text-gray-900 flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 border border-gray-200"
                              >
                                {copiedId === selectedArticle.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedId === selectedArticle.id ? 'کپی شد' : 'کپی'}</span>
                              </button>
                            )}
                          </div>

                          {fullTranslatedContent ? (
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
                              rows={contentViewMode === 'split' ? 12 : 9}
                              placeholder="متن ترجمه شده خبر..."
                              className="w-full text-xs text-gray-800 leading-relaxed bg-gray-50/50 border border-gray-200 rounded-xl p-3 focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
                            />
                          ) : (
                            <div className="p-6 bg-amber-50/50 rounded-xl border border-amber-200 text-center space-y-2">
                              <p className="text-xs font-bold text-amber-800">این خبر هنوز ترجمه نشده است</p>
                              <button
                                onClick={() => handleSingleTranslate(selectedArticle.id)}
                                disabled={translatingId === selectedArticle.id}
                                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Sparkles className={`w-3.5 h-3.5 ${translatingId === selectedArticle.id ? 'animate-spin' : ''}`} />
                                <span>{translatingId === selectedArticle.id ? 'در حال ترجمه...' : 'ترجمه هوشمند AI'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* English Column / Box */}
                    {(contentViewMode === 'split' || contentViewMode === 'english') && (
                      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                        <div>
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 gap-2 flex-wrap">
                            <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-sky-600" />
                              <span>متن اصلی خبر (Original Source)</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRefetchFullText(selectedArticle.id)}
                                disabled={refetchingId === selectedArticle.id}
                                title="استخراج متن کامل و تمیز از وب‌سایت منبع با موتور HTMLRewriter"
                                className="text-[10px] text-sky-700 hover:text-sky-900 bg-sky-100/70 hover:bg-sky-200/70 border border-sky-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Zap className={`w-3 h-3 text-sky-600 ${refetchingId === selectedArticle.id ? 'animate-spin' : ''}`} />
                                <span>{refetchingId === selectedArticle.id ? 'در حال استخراج...' : '⚡ استخراج متن کامل (HTMLRewriter)'}</span>
                              </button>

                              <span className="text-[10px] text-gray-400 font-mono px-1.5 py-0.5 bg-white rounded border border-gray-200">
                                {fullContent ? `${fullContent.length} chars` : 'RSS Feed'}
                              </span>
                            </div>
                          </div>

                          {/* Refetch Feedback */}
                          {refetchFeedback && refetchFeedback.id === selectedArticle.id && (
                            <div className={`mb-2 p-2 rounded-xl text-[11px] font-bold border flex items-center justify-between ${
                              refetchFeedback.ok
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              <span>{refetchFeedback.message}</span>
                            </div>
                          )}

                          <div className={`overflow-y-auto text-xs text-gray-700 font-mono ltr text-left leading-relaxed bg-white p-3 rounded-xl border border-gray-200 whitespace-pre-line ${contentViewMode === 'split' ? 'max-h-[260px]' : 'max-h-[300px]'}`}>
                            {fullContent || selectedArticle.content || selectedArticle.summary || 'متن انگلیسی خامی در دسترس نیست.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

      {/* HTMLRewriter & Content Cleaner Live Inspector Modal */}
      {isTesterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    آزمایشگاه و تحلیل‌گر استخراج متن (Cloudflare HTMLRewriter)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    استخراج تمیز متن کامل اخبار، حذف خودکار تبلیغات و نویزها با موتور ابری
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTesterOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* URL Input & Quick Links */}
            <div className="p-4 border-b border-gray-100 space-y-3 bg-white">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://cointelegraph.com/news/..."
                    className="w-full pl-3 pr-9 py-2.5 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition-colors ltr text-left"
                  />
                </div>

                <button
                  onClick={() => handleTestLiveExtract()}
                  disabled={isTesting || !testUrl.trim()}
                  className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Zap className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'در حال استخراج...' : 'شروع استخراج'}</span>
                </button>
              </div>

              {/* Quick source presets */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                <span className="font-bold text-gray-700">نمونه‌ها:</span>
                {selectedArticle?.link && (
                  <button
                    onClick={() => {
                      const url = selectedArticle.link || selectedArticle.original_url || '';
                      setTestUrl(url);
                      handleTestLiveExtract(url);
                    }}
                    className="text-sky-700 hover:underline bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100"
                  >
                    خبر انتخاب‌شده جاری ({selectedArticle.source_name || 'فعلی'})
                  </button>
                )}
                <button
                  onClick={() => {
                    const sample = 'https://cointelegraph.com/news/crypto-market-rebound-fed-rate-cut';
                    setTestUrl(sample);
                    handleTestLiveExtract(sample);
                  }}
                  className="text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md"
                >
                  Cointelegraph
                </button>
                <button
                  onClick={() => {
                    const sample = 'https://decrypt.co/news-explorer';
                    setTestUrl(sample);
                    handleTestLiveExtract(sample);
                  }}
                  className="text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md"
                >
                  Decrypt
                </button>
                <button
                  onClick={() => {
                    const sample = 'https://www.coindesk.com/markets';
                    setTestUrl(sample);
                    handleTestLiveExtract(sample);
                  }}
                  className="text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md"
                >
                  CoinDesk
                </button>
              </div>
            </div>

            {/* Modal Body & Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
              {/* Tab Selector */}
              {testResult && !testResult.error && (
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setTesterTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        testerTab === 'preview' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600'
                      }`}
                    >
                      متن تمیز استخراج‌شده
                    </button>
                    <button
                      onClick={() => setTesterTab('rules')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        testerTab === 'rules' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600'
                      }`}
                    >
                      فیلترها و قوانین پاک‌سازی
                    </button>
                    <button
                      onClick={() => setTesterTab('raw')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        testerTab === 'raw' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600'
                      }`}
                    >
                      ساختار داده و خروجی خام
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-emerald-600" />
                      <span>{testResult.engine_used === 'cloudflare_htmlrewriter' ? 'Cloudflare HTMLRewriter' : 'Node DOM Engine'}</span>
                    </span>

                    {selectedArticle && testResult.full_text && (
                      <button
                        onClick={() => handleApplyExtractedToArticle(testResult.full_text)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>اعمال به خبر انتخابی در میز کار</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Testing Loading State */}
              {isTesting && (
                <div className="h-64 bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
                  <p className="text-xs font-bold text-gray-700">در حال دریافت صفحه وب و استخراج متن با موتور Cloudflare HTMLRewriter...</p>
                  <p className="text-[11px] text-gray-400">حذف خودکار تبلیغات، کادرهای شبکه‌های اجتماعی، دیسکلیمرها و نوارهای قیمت</p>
                </div>
              )}

              {/* Error State */}
              {testResult?.error && !isTesting && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-1">
                  <p className="font-bold">خطا در فرآیند استخراج:</p>
                  <p>{testResult.error}</p>
                </div>
              )}

              {/* Result: Preview Tab */}
              {testResult && !testResult.error && !isTesting && testerTab === 'preview' && (
                <div className="space-y-4">
                  {/* Stats Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block">تعداد کاراکتر:</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{testResult.stats?.char_count || testResult.text_length || 0}</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block">تعداد پاراگراف‌ها:</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{testResult.stats?.paragraph_count || testResult.paragraphs_count || 0}</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block">تیترهای H2/H3:</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{testResult.stats?.heading_count || (testResult.headings || []).length}</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-200">
                      <span className="text-[10px] text-gray-400 block">تصاویر شناسایی‌شده:</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">{testResult.images_count || 0}</span>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                    <h4 className="text-sm font-bold text-gray-900 ltr text-left">{testResult.title || 'بدون تیتر مستقیم'}</h4>
                    {testResult.author && (
                      <p className="text-xs text-sky-700 font-medium">نویسنده: {testResult.author}</p>
                    )}
                  </div>

                  {/* Extracted Text Box */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-800">متن کامل و پاک‌سازی شده (Clean Text Body):</span>
                      <button
                        onClick={() => handleCopyText(testResult.full_text, -99)}
                        className="text-[10px] text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        {copiedId === -99 ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === -99 ? 'کپی شد' : 'کپی کل متن'}</span>
                      </button>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto text-xs text-gray-800 font-mono ltr text-left leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-gray-200">
                      {testResult.full_text}
                    </div>
                  </div>
                </div>
              )}

              {/* Result: Rules Tab */}
              {testResult && !testResult.error && !isTesting && testerTab === 'rules' && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-orange-500" />
                      قوانین و فیلترهای فعال پاک‌سازی متن (Active Extraction Rules)
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1">
                      این قوانین به طور خودکار عناصر زائد و هرزنامه‌های صفحات وب را قبل از ارسال به مدل هوش مصنوعی پاک می‌کنند:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        حذف کادرهای تبلیغاتی و بنرها
                      </span>
                      <p className="text-[11px] text-gray-500">
                        حذف تگ‌های <code>.ad</code>، <code>.advertisement</code>، <code>.banner</code>، <code>.sponsor</code>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        حذف نوارهای قیمت و بازارهای زنده
                      </span>
                      <p className="text-[11px] text-gray-500">
                        پاک‌سازی نمادهای کریپتو و قیمت‌های لحظه‌ای در سربرگ صفحات Cointelegraph و CoinDesk
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        حذف لینک‌های درون متنی (Related Articles)
                      </span>
                      <p className="text-[11px] text-gray-500">
                        حذف بلوک‌های <code>Related: ...</code> و <code>Read More</code> که وسط متن خبر قرار دارند
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        حذف پلیرهای صوتی و پادکست‌ها
                      </span>
                      <p className="text-[11px] text-gray-500">
                        حذف تگ‌های <code>audio</code>، <code>.audio-player</code> و <code>.listen-to-article</code>
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        حذف سلب مسئولیت و پاورقی‌ها
                      </span>
                      <p className="text-[11px] text-gray-500">
                        قطع هوشمند متن در بخش <code>Disclaimer</code> و اطلاعات کپی‌رایت
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        حذف کوکی و پاپ‌آپ‌های اشتراک خبرنامه
                      </span>
                      <p className="text-[11px] text-gray-500">
                        حذف فرم‌های <code>Subscribe to newsletter</code> و دکمه‌های سوشال مدیا
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Result: Raw JSON Tab */}
              {testResult && !testResult.error && !isTesting && testerTab === 'raw' && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-gray-800">خروجی JSON کامل:</span>
                  <pre className="max-h-[340px] overflow-y-auto text-[11px] text-gray-700 font-mono ltr text-left bg-slate-900 text-slate-100 p-3 rounded-xl">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}

              {/* Empty Initial State */}
              {!testResult && !isTesting && (
                <div className="h-48 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Zap className="w-8 h-8 text-sky-400" />
                  <p className="text-xs font-bold text-gray-700">آدرس اینترنتی خبر را وارد کنید و دکمه «شروع استخراج» را بزنید</p>
                  <p className="text-[11px] text-gray-400 max-w-md">
                    موتور Cloudflare HTMLRewriter صفحه وب را دریافت و تمام متن اصلی را به همراه تصاویر و تیترها بدون تبلیغات استخراج می‌کند.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
