import React, { useState, useEffect } from 'react';
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
  FileText,
  Loader2,
  Bot,
  X,
  History,
  Columns,
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
  Filter,
  Eye,
  BookOpen,
  Layers,
  Share2,
  Languages
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'translated' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [translatingId, setTranslatingId] = useState<number | null>(null);

  // Split View State
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [mobileShowDetail, setMobileShowDetail] = useState<boolean>(false);
  const [detailViewMode, setDetailViewMode] = useState<'combined' | 'persian' | 'english'>('combined');

  // Model Picker Modal State
  const [selectedArticleForTranslate, setSelectedArticleForTranslate] = useState<JoinedArticleNews | null>(null);
  const [chosenModel, setChosenModel] = useState<string>('@cf/meta/m2m100-1.2b');

  // Lazy loading article detail state
  const [detailsMap, setDetailsMap] = useState<Record<number, { content?: string; translated_content?: string }>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  // Translation History Modal state
  const [historyArticle, setHistoryArticle] = useState<JoinedArticleNews | null>(null);
  const [historyLogs, setHistoryLogs] = useState<TranslationHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Custom article form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customModel, setCustomModel] = useState<string>('@cf/meta/m2m100-1.2b');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // WordPress Sync State
  const [syncingWpId, setSyncingWpId] = useState<number | null>(null);
  const [wpSyncMessage, setWpSyncMessage] = useState<string | null>(null);

  const handleWpSync = async (articleId?: number) => {
    try {
      if (articleId) setSyncingWpId(articleId);
      const res = await fetch('/api/trigger-wp-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, limit: articleId ? 1 : 5 }),
      });
      const data = await res.json();
      if (data.success) {
        setWpSyncMessage(`موفقیت: ${data.data?.successCount || 0} خبر در وردپرس (updaaate.ir) منتشر شد.`);
        onRefresh();
      } else {
        setWpSyncMessage(`خطا: ${data.error || 'خطا در همگام‌سازی وردپرس'}`);
      }
    } catch (err: any) {
      setWpSyncMessage(`خطا: ${err.message}`);
    } finally {
      setSyncingWpId(null);
      setTimeout(() => setWpSyncMessage(null), 5000);
    }
  };

  const filteredNews = news.filter((item) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(term) ?? false;
    const faTitleMatch = item.translated_title?.toLowerCase().includes(term) ?? false;
    const sourceMatch = item.source_name?.toLowerCase().includes(term) ?? false;
    const matchesSearch = titleMatch || faTitleMatch || sourceMatch;

    if (statusFilter === 'translated') {
      return matchesSearch && item.translation_status === 'completed';
    }
    if (statusFilter === 'pending') {
      return matchesSearch && item.translation_status !== 'completed';
    }
    return matchesSearch;
  });

  // Auto-select first article if none selected
  useEffect(() => {
    if (filteredNews.length > 0 && selectedArticleId === null) {
      setSelectedArticleId(filteredNews[0].id);
    }
  }, [filteredNews, selectedArticleId]);

  // Load article details when selected
  useEffect(() => {
    if (selectedArticleId && !detailsMap[selectedArticleId]) {
      setLoadingDetailId(selectedArticleId);
      fetch(`/api/news/${selectedArticleId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setDetailsMap((prev) => ({
              ...prev,
              [selectedArticleId]: {
                content: json.data.content,
                translated_content: json.data.translated_content,
              },
            }));
          }
        })
        .catch((e) => console.error('Error fetching article detail:', e))
        .finally(() => setLoadingDetailId(null));
    }
  }, [selectedArticleId, detailsMap]);

  const selectedArticle = news.find((item) => item.id === selectedArticleId) || null;

  const handleSelectArticle = (id: number) => {
    setSelectedArticleId(id);
    setMobileShowDetail(true);
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

  const openHistoryModal = async (article: JoinedArticleNews) => {
    setHistoryArticle(article);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/news/${article.id}/history`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setHistoryLogs(json.data || []);
        }
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoadingHistory(false);
    }
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

  return (
    <div className="space-y-4">
      {/* Top Global Control Toolbar (Apple HIG Toolbar Header) */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Left Action Buttons & Split View Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="hidden md:flex items-center gap-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200/80 transition-all min-h-[40px]"
            title={showSidebar ? 'پنهان‌سازی نوار کناری (Sidebar)' : 'نمایش نوار کناری (Sidebar)'}
          >
            {showSidebar ? <PanelRightClose className="w-4 h-4 text-gray-600" /> : <PanelRightOpen className="w-4 h-4 text-orange-600" />}
            <span>{showSidebar ? 'بستن منو' : 'بازکردن منو'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-2.5 min-h-[40px]"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>خبر جدید</span>
            </button>

            <button
              onClick={onTriggerScraper}
              disabled={isTriggeringScraper}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-2.5 disabled:opacity-50 min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isTriggeringScraper ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isTriggeringScraper ? 'در حال اسکرپ...' : 'پایش RSS'}</span>
            </button>

            <button
              onClick={onTriggerTranslator}
              disabled={isTriggeringTranslator}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-2xs border border-orange-600 text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2.5 disabled:opacity-50 min-h-[40px]"
            >
              <Sparkles className={`w-3.5 h-3.5 text-orange-100 ${isTriggeringTranslator ? 'animate-pulse' : ''}`} />
              <span>{isTriggeringTranslator ? 'ترجمه...' : 'ترجمه هوشمند AI'}</span>
            </button>

            <button
              onClick={() => handleWpSync()}
              disabled={syncingWpId !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xs border border-blue-700 text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2.5 disabled:opacity-50 min-h-[40px]"
              title="انتشار مقالات ترجمه‌شده در سایت وردپرسی updaaate.ir"
            >
              <Share2 className={`w-3.5 h-3.5 text-blue-100 ${syncingWpId !== null ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">انتشار در وردپرس</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute end-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/80 border border-gray-200/90 text-gray-900 placeholder-gray-400 rounded-xl pe-9 ps-3 py-2 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setStatusFilter('translated')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'translated' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              ترجمه‌شده
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              در انتظار
            </button>
          </div>
        </div>
      </div>

      {/* WordPress Toast notification */}
      {wpSyncMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
          wpSyncMessage.startsWith('موفقیت') 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{wpSyncMessage}</span>
          <button onClick={() => setWpSyncMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Custom Article Form Collapsible */}
      {showCustomForm && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 justify-between border-b border-emerald-200/80 pb-3">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>ثبت مستقیم خبر انگلیسی برای ترجمه هوشمند در دیتابیس D1</span>
            </h3>
            <button onClick={() => setShowCustomForm(false)} className="text-xs text-gray-500 hover:text-gray-700">
              انصراف
            </button>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">عنوان خبر به انگلیسی (English Title):</label>
              <input
                type="text"
                placeholder="e.g. Breakthrough in Edge AI Neural Accelerators Announced"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 ltr text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">متن اصلی خبر (English Content):</label>
              <textarea
                rows={2}
                placeholder="e.g. Researchers have achieved instantaneous multi-language processing on Cloudflare Workers."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 ltr text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-purple-600" />
                <span>انتخاب موتور هوش مصنوعی ترجمه:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCustomModel(m.id)}
                    className={`p-2.5 rounded-xl border text-start transition-all flex flex-col justify-between ${
                      customModel === m.id
                        ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-between w-full">
                      <span className="text-xs font-bold text-gray-900">{m.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${m.color}`}>{m.badge}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingCustom}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2  disabled:opacity-50"
            >
              {isSubmittingCustom ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ترجمه و ثبت...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ترجمه و ثبت فوری در دیتابیس</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Main Split View Container (Apple HIG Navigation Split View) */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-150px)] min-h-[550px]">
        {/* Column 1: Master List Pane (Sidebar) */}
        <div
          className={`${
            showSidebar ? 'md:w-80 lg:w-96' : 'hidden'
          } ${mobileShowDetail ? 'hidden md:block' : 'block'} w-full border-e border-gray-200 bg-gray-50/70 flex flex-col shrink-0`}
        >
          {/* Master List Header */}
          <div className="p-3 bg-white border-b border-gray-200 flex items-center gap-2 justify-between text-xs text-gray-500 font-bold">
            <span className="flex items-center gap-2.5 text-gray-700">
              <Columns className="w-4 h-4 text-orange-500" />
              <span>اخبار ({filteredNews.length})</span>
            </span>
            <button onClick={onRefresh} className="p-1 hover:text-orange-600" title="بروزرسانی">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scrollable Master Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                <p>در حال بارگذاری اخبار...</p>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                <Globe className="w-8 h-8 mx-auto text-gray-300" />
                <p className="font-bold text-gray-700">خبری یافت نشد</p>
              </div>
            ) : (
              filteredNews.map((item) => {
                const isSelected = item.id === selectedArticleId;
                const isTranslated = item.translation_status === 'completed';

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectArticle(item.id)}
                    className={`w-full text-start p-3 rounded-xl transition-all block space-y-1.5 relative ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                        : 'hover:bg-gray-100 text-gray-900 bg-white border border-gray-100'
                    }`}
                  >
                    {/* Item Header */}
                    <div className="flex items-center gap-2 justify-between gap-1 text-[11px]">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.source_name}
                      </span>

                      <div className="flex items-center gap-2">
                        {item.wp_sync_status === 'published' && (
                          <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Share2 className="w-2.5 h-2.5" /> WP
                          </span>
                        )}
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isTranslated ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                        <span className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                          {new Date(item.created_at).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                      {item.featured_image && (
                        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-100/50">
                          <img src={item.featured_image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        {/* Item Title */}
                        <p className={`text-xs sm:text-sm line-clamp-2 leading-snug ${isSelected ? 'text-white' : 'text-gray-900 font-bold'}`}>
                          {item.translated_title || item.title}
                        </p>

                        {item.translated_title && (
                          <p className={`text-[10px] line-clamp-1 ltr text-left ${isSelected ? 'text-orange-100' : 'text-gray-400 font-mono'}`}>
                            {item.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Detail Content Pane */}
        <div
          className={`${
            !mobileShowDetail ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col bg-slate-50/50 overflow-hidden`}
        >
          {selectedArticle ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Detail Header Toolbar (Apple HIG Glassmorphism Toolbar) */}
              <div className="p-3 sm:p-4 bg-white/90 backdrop-blur-md border-b border-gray-200/90 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0 shadow-2xs z-10">
                {/* Top Row / Left Info */}
                <div className="flex items-center gap-2 justify-between lg:justify-start gap-2.5">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowDetail(false)}
                    className="md:hidden flex items-center gap-2 bg-white hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 px-3 py-1.5 rounded-xl shadow-2xs"
                  >
                    <ArrowRight className="w-4 h-4 text-orange-600" />
                    <span>فهرست</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="bg-orange-50 text-orange-700 border border-orange-200/90 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-2.5 shadow-2xs">
                      <Globe className="w-3.5 h-3.5 text-orange-600" />
                      {selectedArticle.source_name}
                    </span>

                    <span className="text-[11px] text-gray-500 font-medium hidden sm:inline-flex items-center gap-2 bg-gray-100/80 px-2.5 py-1 rounded-lg border border-gray-200/60">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {new Date(selectedArticle.created_at).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>

                {/* View Mode Segmented Control (Apple HIG Segmented Picker) */}
                <div className="flex items-center gap-2 justify-center bg-gray-200/70 p-1 rounded-xl border border-gray-300/50 self-center">
                  <button
                    onClick={() => setDetailViewMode('combined')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-2.5 ${
                      detailViewMode === 'combined'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-orange-500" />
                    <span>تطبیقی (دو زبانه)</span>
                  </button>

                  <button
                    onClick={() => setDetailViewMode('persian')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-2.5 ${
                      detailViewMode === 'persian'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فارسی</span>
                  </button>

                  <button
                    onClick={() => setDetailViewMode('english')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-2.5 ${
                      detailViewMode === 'english'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>English</span>
                  </button>
                </div>

                {/* Right Action Toolbar */}
                <div className="flex items-center gap-2 justify-end gap-2 shrink-0">
                  <button
                    onClick={() => openHistoryModal(selectedArticle)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2.5 shadow-2xs"
                    title="مشاهده سوابق و نسخه های قبلی ترجمه"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden xl:inline">سوابق</span>
                  </button>

                  <button
                    onClick={() => setSelectedArticleForTranslate(selectedArticle)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xs text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-100" />
                    <span>ترجمه AI</span>
                  </button>

                  <button
                    onClick={() => handleWpSync(selectedArticle.id)}
                    disabled={syncingWpId === selectedArticle.id}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2.5 shadow-2xs disabled:opacity-50"
                    title="ارسال این مقاله به وردپرس"
                  >
                    <Share2 className={`w-3.5 h-3.5 text-blue-600 ${syncingWpId === selectedArticle.id ? 'animate-spin' : ''}`} />
                    <span className="hidden xl:inline">
                      {selectedArticle.wp_sync_status === 'published' ? 'ارسال مجدد به WP' : 'ارسال به WP'}
                    </span>
                  </button>

                  <button
                    onClick={() => onDeleteArticle(selectedArticle.id)}
                    className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl border border-gray-200/80 hover:border-rose-200 transition-all bg-white"
                    title="حذف این خبر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Main Detail Content Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
                {/* Persian Translated Card (Shown in 'combined' or 'persian' mode) */}
                {(detailViewMode === 'combined' || detailViewMode === 'persian') && (
                  <>
                    {selectedArticle.translated_title ? (
                      <div className="bg-white border border-orange-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs relative overflow-hidden group">
                        {/* Soft background glow */}
                        <div className="absolute -top-12 -end-12 w-48 h-48 bg-orange-100/50 rounded-full blur-2xl pointer-events-none" />

                        {/* Card Top Action Bar */}
                        <div className="flex items-center gap-2 justify-between border-b border-gray-100 pb-3 relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-2 shadow-2xs">
                              <Sparkles className="w-3 h-3" />
                              <span>ترجمه هوشمند ۱۰۰۰ دستان</span>
                            </span>
                            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                              • فارسی روان و شیوای تخصصی
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const trContent =
                                  detailsMap[selectedArticle.id]?.translated_content || selectedArticle.translated_content || '';
                                handleCopy(selectedArticle.id, `${selectedArticle.translated_title}\n\n${trContent}`);
                              }}
                              className="text-xs font-bold text-gray-700 hover:text-orange-700 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all flex items-center gap-2.5"
                            >
                              {copiedId === selectedArticle.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">کپی شد</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>کپی متن</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Article Featured Image */}
                        {selectedArticle.featured_image && (
                          <div className="relative z-10 w-full mb-6 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <img 
                              src={selectedArticle.featured_image} 
                              alt={selectedArticle.translated_title || selectedArticle.title}
                              className="w-full h-auto object-cover max-h-96"
                            />
                          </div>
                        )}

                        {/* Article Persian Title */}
                        <h1 className="text-xl sm:text-3xl font-black text-gray-900 leading-snug tracking-tight relative z-10">
                          {selectedArticle.translated_title}
                        </h1>

                        {/* Article Persian Body */}
                        {loadingDetailId === selectedArticle.id ? (
                          <div className="py-12 text-center text-xs text-orange-600 flex items-center gap-2 justify-center gap-2 bg-orange-50/50 rounded-2xl">
                            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                            <span>در حال دريافت متن کامل ترجمه از پایگاه داده D1...</span>
                          </div>
                        ) : (
                          <div className="text-gray-800 text-base sm:text-lg leading-relaxed whitespace-pre-line pt-2 font-normal border-t border-gray-100/80 space-y-4 relative z-10">
                            {detailsMap[selectedArticle.id]?.translated_content || selectedArticle.translated_content || 'متنی برای این خبر ثبت نشده است.'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-3xl p-6 text-xs text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className="p-3 bg-amber-100 rounded-2xl shrink-0">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-amber-950">ترجمه فارسی موجود نیست</p>
                            <p className="text-xs text-amber-800">این خبر هنوز توسط موتور هوش مصنوعی ترجمه نشده است.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedArticleForTranslate(selectedArticle)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 shrink-0 flex items-center gap-2.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>شروع ترجمه هوشمند</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* English Original Card (Shown in 'combined' or 'english' mode) */}
                {(detailViewMode === 'combined' || detailViewMode === 'english') && (
                  <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 justify-between border-b border-gray-100 pb-3">
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-sky-600" />
                        <span>متن اصلی خبر (Original English Source):</span>
                      </span>

                      <a
                        href={selectedArticle.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-2 ltr bg-sky-50 px-3 py-1 rounded-lg border border-sky-200/80 transition-colors"
                      >
                        <span>Original Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {selectedArticle.featured_image && (
                      <div className="w-full mb-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <img 
                          src={selectedArticle.featured_image} 
                          alt={selectedArticle.title}
                          className="w-full h-auto object-cover max-h-96"
                        />
                      </div>
                    )}

                    <h2 className="text-base sm:text-xl font-bold text-gray-900 ltr text-left leading-snug">
                      {selectedArticle.title}
                    </h2>

                    {loadingDetailId === selectedArticle.id ? (
                      <div className="py-6 text-center text-xs text-gray-400 flex items-center gap-2 justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading original text...</span>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-700 ltr text-left font-mono leading-relaxed bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200/70 whitespace-pre-line">
                        {detailsMap[selectedArticle.id]?.content || selectedArticle.content || 'No original content available.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
              <div className="p-4 bg-orange-50 rounded-full text-orange-500">
                <Eye className="w-10 h-10" />
              </div>
              <p className="text-base font-bold text-gray-800">خبری انتخاب نشده است</p>
              <p className="text-xs text-gray-500 max-w-xs">
                جهت رویت، مطالعه و ترجمه، یکی از اخبار فهرست سمت راست را انتخاب نمایید.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Model Selection Modal for Re-translating an Article */}
      {selectedArticleForTranslate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center gap-2 justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 justify-between border-b border-gray-100 pb-3">
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
              <p className="text-xs font-bold text-gray-800 ltr text-left line-clamp-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                {selectedArticleForTranslate.title}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                موتور هوش مصنوعی مورد نظر را انتخاب کنید:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pe-1">
                {AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setChosenModel(m.id)}
                    className={`w-full text-start p-3 rounded-2xl border transition-all flex items-start gap-2 justify-between gap-3 ${
                      chosenModel === m.id
                        ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/20'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{m.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${m.color}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{m.desc}</p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center gap-2 justify-center shrink-0 mt-1 ${
                        chosenModel === m.id ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300'
                      }`}
                    >
                      {chosenModel === m.id && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedArticleForTranslate(null)}
                className="text-xs text-gray-600 hover:bg-gray-100 px-3.5 py-2 rounded-xl"
              >
                انصراف
              </button>

              <button
                onClick={() => executeSingleTranslate(selectedArticleForTranslate.id, chosenModel)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-md shadow-orange-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>شروع ترجمه با {AI_MODELS.find((x) => x.id === chosenModel)?.name || 'AI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Translation Audit History Modal */}
      {historyArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center gap-2 justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-2 justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <History className="w-4 h-4 text-indigo-600" />
                <span>آرشیو و تاریخچه سوابق ترجمه</span>
              </div>
              <button onClick={() => setHistoryArticle(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-gray-500 font-mono">کد خبر: #{historyArticle.id}</span>
              <h4 className="text-xs font-bold text-gray-900 leading-snug">{historyArticle.title}</h4>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pe-1">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-indigo-600 flex items-center gap-2 justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال دریافت سوابق ترجمه از سامانه...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500">
                  سابقه‌ای برای ترجمه این خبر ثبت نشده است.
                </div>
              ) : (
                historyLogs.map((item, idx) => (
                  <div key={item.id || idx} className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-bold text-indigo-900 bg-indigo-100/80 border border-indigo-200 text-[10px] px-2 py-0.5 rounded font-mono">
                        مدل: {item.model_used || 'Standard AI'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.translated_at ? new Date(item.translated_at).toLocaleString('fa-IR') : '-'}
                      </span>
                    </div>

                    <p className="font-bold text-gray-900 leading-snug">{item.translated_title}</p>
                    <p className="text-gray-700 text-[11px] leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-gray-100">
                      {item.translated_content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setHistoryArticle(null)} className="bg-gray-900 text-white text-xs px-5 py-2.5 rounded-xl font-bold">
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
