import React, { useState } from 'react';
import { SourceItem } from '../types/client';
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Rss,
  Sparkles,
  Trash2,
  RefreshCw,
  SearchCheck,
  CheckSquare,
  Square,
  PauseCircle,
  PlayCircle,
  SlidersHorizontal,
  X,
  Check,
  Code2,
  ListOrdered,
  Power,
  Layers,
  Sparkle,
} from 'lucide-react';
import { DatabaseErrorFallback } from './DatabaseErrorFallback';
import { EmptyState } from './EmptyState';

interface SourcesTabProps {
  sources: SourceItem[];
  loading: boolean;
  error?: boolean;
  onAddSource: (
    name: string,
    url: string,
    language?: string,
    category?: string,
    selector?: string,
    scrape_limit?: number,
    is_active?: boolean
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  onDeleteSource: (id: number) => void;
  onUpdateSource: (id: number, data: Partial<SourceItem>) => Promise<boolean>;
  onBulkDeleteSources: (ids: number[]) => Promise<boolean>;
  onBulkToggleStatus: (ids: number[], is_active: boolean) => Promise<boolean>;
  onScrapeSource: (id: number) => void;
  onTestFeed: (url: string) => Promise<{ isValid: boolean; feedTitle?: string; itemsFound?: number; errorDetails?: string } | null>;
  onRefresh: () => void;
}

export const SourcesTab: React.FC<SourcesTabProps> = ({
  sources,
  loading,
  error = false,
  onAddSource,
  onDeleteSource,
  onUpdateSource,
  onBulkDeleteSources,
  onBulkToggleStatus,
  onScrapeSource,
  onTestFeed,
  onRefresh,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState('tech');
  const [selector, setSelector] = useState('');
  const [scrapeLimit, setScrapeLimit] = useState<number>(10);
  const [isActiveForm, setIsActiveForm] = useState<boolean>(true);

  // Status & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingFeed, setIsTestingFeed] = useState(false);
  const [testResult, setTestResult] = useState<{ isValid: boolean; feedTitle?: string; itemsFound?: number; errorDetails?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Multi-select & Bulk Action State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkToggling, setIsBulkToggling] = useState(false);
  const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Inline Quick Editing State
  const [editingSourceId, setEditingSourceId] = useState<number | null>(null);
  const [editScrapeLimit, setEditScrapeLimit] = useState<number>(10);
  const [editCategory, setEditCategory] = useState<string>('general');
  const [editSelector, setEditSelector] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Test RSS feed connection
  const handleTestFeedClick = async () => {
    if (!url.trim()) {
      setErrorMsg('ابتدا آدرس فید RSS را وارد کنید.');
      return;
    }
    setIsTestingFeed(true);
    setTestResult(null);
    setErrorMsg(null);

    const result = await onTestFeed(url.trim());
    setIsTestingFeed(false);
    if (result) {
      setTestResult(result);
      if (result.isValid && result.feedTitle && !name) {
        setName(result.feedTitle);
      }
    }
  };

  // Standard Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setErrorMsg('نام منبع و آدرس RSS الزامی است.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await onAddSource(
      name.trim(),
      url.trim(),
      language,
      category,
      selector.trim() || undefined,
      scrapeLimit,
      isActiveForm
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`منبع "${name}" با موفقیت ذخیره و استانداردسازی شد.`);
      setName('');
      setUrl('');
      setSelector('');
      setTestResult(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'خطا در ثبت منبع جدید.');
    }
  };

  // Presets State & Categorized List
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('all');
  const [presetSearch, setPresetSearch] = useState<string>('');
  const [addingPresetUrl, setAddingPresetUrl] = useState<string | null>(null);

  const presetSources = [
    // AI & Science
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', lang: 'en', category: 'ai', label: 'هوش مصنوعی', limit: 10, selector: '.articleBody' },
    { name: 'OpenAI Newsroom', url: 'https://openai.com/news/rss.xml', lang: 'en', category: 'ai', label: 'هوش مصنوعی', limit: 10, selector: 'main' },
    { name: 'ArXiv AI Papers', url: 'https://rss.arxiv.org/rss/cs.AI', lang: 'en', category: 'ai', label: 'هوش مصنوعی', limit: 15, selector: '.mathjax' },
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', lang: 'en', category: 'ai', label: 'هوش مصنوعی', limit: 10, selector: '.article-content' },
    { name: 'Ars Technica Science', url: 'https://feeds.arstechnica.com/arstechnica/science', lang: 'en', category: 'ai', label: 'دانش و نوآوری', limit: 10, selector: '.article-content' },
    { name: 'ScienceDaily Headline News', url: 'https://www.sciencedaily.com/rss/all.xml', lang: 'en', category: 'ai', label: 'دانش و نوآوری', limit: 15, selector: '#story_text' },

    // Tech & Startups
    { name: 'TechCrunch Main', url: 'https://techcrunch.com/feed/', lang: 'en', category: 'tech', label: 'فناوری', limit: 15, selector: '.article-content' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', lang: 'en', category: 'tech', label: 'فناوری', limit: 10, selector: '.c-entry-content' },
    { name: 'Wired Top Stories', url: 'https://www.wired.com/feed/rss', lang: 'en', category: 'tech', label: 'فناوری', limit: 10, selector: '.body__container' },
    { name: 'Hacker News Frontpage', url: 'https://news.ycombinator.com/rss', lang: 'en', category: 'tech', label: 'فناوری', limit: 20, selector: '' },
    { name: 'Engadget', url: 'https://www.engadget.com/rss.xml', lang: 'en', category: 'tech', label: 'فناوری', limit: 10, selector: '.article-text' },
    { name: '9to5Mac', url: 'https://9to5mac.com/feed/', lang: 'en', category: 'tech', label: 'فناوری', limit: 10, selector: '.post-content' },

    // Crypto & Web3
    { name: 'CoinDesk Crypto News', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', lang: 'en', category: 'crypto', label: 'ارز دیجیتال', limit: 15, selector: '.article-body' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', lang: 'en', category: 'crypto', label: 'ارز دیجیتال', limit: 10, selector: '.post-content' },
    { name: 'Decrypt Media', url: 'https://decrypt.co/feed', lang: 'en', category: 'crypto', label: 'ارز دیجیتال', limit: 10, selector: '.post-content' },
    { name: 'Blockworks', url: 'https://blockworks.co/feed', lang: 'en', category: 'crypto', label: 'ارز دیجیتال', limit: 10, selector: '.content-body' },

    // World News & Politics
    { name: 'BBC World News', url: 'http://feeds.bbci.co.uk/news/rss.xml', lang: 'en', category: 'general', label: 'اخبار جهان', limit: 20, selector: '.story-body' },
    { name: 'Reuters Top News', url: 'https://www.reutersagency.com/feed/', lang: 'en', category: 'general', label: 'اخبار جهان', limit: 15, selector: '' },
    { name: 'CNN Edition World', url: 'http://rss.cnn.com/rss/edition_world.rss', lang: 'en', category: 'general', label: 'اخبار جهان', limit: 15, selector: '' },
    { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml', lang: 'en', category: 'general', label: 'اخبار جهان', limit: 15, selector: '.wysiwyg' },
    { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', lang: 'en', category: 'general', label: 'اخبار جهان', limit: 15, selector: '.content__article-body' },

    // Economy & Business
    { name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/technology/news.rss', lang: 'en', category: 'economy', label: 'اقتصاد', limit: 10, selector: '' },
    { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', lang: 'en', category: 'economy', label: 'اقتصاد', limit: 10, selector: '' },
    { name: 'CNBC Finance News', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', lang: 'en', category: 'economy', label: 'اقتصاد', limit: 15, selector: '' },
    { name: 'Forbes Innovation', url: 'https://www.forbes.com/innovation/feed/', lang: 'en', category: 'economy', label: 'اقتصاد', limit: 10, selector: '' },

    // Gaming
    { name: 'IGN Gaming News', url: 'https://feeds.feedburner.com/ign/news', lang: 'en', category: 'gaming', label: 'گیمینگ', limit: 10, selector: '.article-section' },
    { name: 'Polygon', url: 'https://www.polygon.com/rss/index.xml', lang: 'en', category: 'gaming', label: 'گیمینگ', limit: 10, selector: '.c-entry-content' },
    { name: 'Eurogamer', url: 'https://www.eurogamer.net/feed/news', lang: 'en', category: 'gaming', label: 'گیمینگ', limit: 10, selector: '.article-body' },
    { name: 'GameSpot', url: 'https://www.gamespot.com/feeds/news/', lang: 'en', category: 'gaming', label: 'گیمینگ', limit: 10, selector: '.js-content-entity-body' },
  ];

  const handleSelectPreset = (preset: typeof presetSources[0]) => {
    setName(preset.name);
    setUrl(preset.url);
    setLanguage(preset.lang);
    setCategory(preset.category);
    setScrapeLimit(preset.limit);
    setSelector(preset.selector || '');
    setTestResult(null);
  };

  const handleInstantAddPreset = async (preset: typeof presetSources[0]) => {
    setAddingPresetUrl(preset.url);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await onAddSource(
      preset.name,
      preset.url,
      preset.lang,
      preset.category,
      preset.selector || undefined,
      preset.limit,
      true
    );
    setAddingPresetUrl(null);

    if (res.success) {
      setSuccessMsg(`منبع "${preset.name}" فوراً اضافه و فعال گردید.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'خطا در ثبت منبع جدید.');
    }
  };

  const presetCategories = [
    { id: 'all', label: 'همه' },
    { id: 'ai', label: 'هوش مصنوعی' },
    { id: 'tech', label: 'فناوری' },
    { id: 'crypto', label: 'کریپتو' },
    { id: 'general', label: 'اخبار جهان' },
    { id: 'economy', label: 'اقتصاد' },
    { id: 'gaming', label: 'گیمینگ' },
  ];

  const filteredPresetSources = presetSources.filter((preset) => {
    const matchesCategory = presetCategoryFilter === 'all' || preset.category === presetCategoryFilter;
    const matchesSearch = preset.name.toLowerCase().includes(presetSearch.toLowerCase()) || preset.label.includes(presetSearch);
    return matchesCategory && matchesSearch;
  });

  // Toggle single item selection
  const handleToggleSelect = (id: number) => {
    const numId = Number(id);
    setSelectedIds((prev) =>
      prev.some((item) => Number(item) === numId)
        ? prev.filter((item) => Number(item) !== numId)
        : [...prev, numId]
    );
  };

  // Filtered Sources list based on search and status
  const filteredSources = sources.filter((src) => {
    const matchesSearch =
      src.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      src.url.toLowerCase().includes(searchQuery.toLowerCase());

    const isSrcActive = src.is_active === undefined || src.is_active === 1 || src.is_active === true;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isSrcActive) ||
      (statusFilter === 'inactive' && !isSrcActive);

    const matchesCategory =
      categoryFilter === 'all' || (src.category || 'general') === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Toggle select all
  const handleSelectAll = () => {
    if (selectedIds.length === filteredSources.length && filteredSources.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSources.map((s) => Number(s.id)));
    }
  };

  // Execute Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    const count = selectedIds.length;
    const ok = await onBulkDeleteSources(selectedIds);
    setIsBulkDeleting(false);
    setShowConfirmBulkDelete(false);
    if (ok) {
      setSelectedIds([]);
      setSuccessMsg(`تعداد ${count} منبع خبری با موفقیت حذف گردید.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('خطا در حذف گروهی منابع.');
    }
  };

  // Execute Bulk Toggle Status
  const handleBulkToggle = async (targetActiveStatus: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkToggling(true);
    const count = selectedIds.length;
    const ok = await onBulkToggleStatus(selectedIds, targetActiveStatus);
    setIsBulkToggling(false);
    if (ok) {
      setSelectedIds([]);
      setSuccessMsg(`وضعیت ${count} منبع با موفقیت به ${targetActiveStatus ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('خطا در بروزرسانی وضعیت گروهی منابع.');
    }
  };

  // Start Quick Editing
  const handleStartEdit = (src: SourceItem) => {
    setEditingSourceId(src.id);
    setEditScrapeLimit(src.scrape_limit || 10);
    setEditCategory(src.category || 'general');
    setEditSelector(src.selector || '');
  };

  // Save Quick Editing
  const handleSaveEdit = async (id: number) => {
    setIsSavingEdit(true);
    const ok = await onUpdateSource(id, {
      scrape_limit: editScrapeLimit,
      category: editCategory,
      selector: editSelector.trim() || undefined,
    });
    setIsSavingEdit(false);
    if (ok) {
      setEditingSourceId(null);
    } else {
      setErrorMsg('خطا در ویرایش اطلاعات منبع.');
    }
  };

  // Quick Toggle Active/Inactive single source
  const handleToggleSingleStatus = async (src: SourceItem) => {
    const currentActive = src.is_active === undefined || src.is_active === 1 || src.is_active === true;
    await onUpdateSource(src.id, { is_active: !currentActive });
  };

  const categoriesList = [
    { id: 'general', label: 'عمومی / بین‌الملل' },
    { id: 'tech', label: 'فناوری (Tech)' },
    { id: 'crypto', label: 'ارز دیجیتال (Crypto)' },
    { id: 'gaming', label: 'گیمینگ (Gaming)' },
    { id: 'ai', label: 'هوش مصنوعی (AI)' },
    { id: 'economy', label: 'اقتصاد و تجارت' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner - Responsive Padding & Layout */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-5 sm:p-7 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs shrink-0">
              <Globe className="w-6 h-6 text-orange-100" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
              مدیریت تخصصی و استاندارد منابع خبری
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-orange-100/90 leading-relaxed max-w-2xl">
            تنظیم آدرس‌های فید RSS، کنترل سقف استخراج اخبار، غیرفعال‌سازی موقت و مدیریت یک‌جای منابع خبری سیستم
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-xs shrink-0 font-medium self-start md:self-auto shadow-xs">
          <Rss className="w-4 h-4 text-amber-200 shrink-0" />
          <div className="flex items-center gap-2">
            <span>منابع کل: <strong>{sources.length}</strong></span>
            <span className="opacity-40">|</span>
            <span className="text-emerald-200 font-bold">
              فعال: {sources.filter((s) => s.is_active === undefined || s.is_active === 1 || s.is_active === true).length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Form Column: Add Standardized Source */}
        <div className="lg:col-span-1 bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs h-fit">
          <div className="flex items-center gap-2  border-b border-gray-100 pb-4">
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-orange-100/80 shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">افزودن منبع</h3>
              <p className="text-xs text-gray-500 mt-0.5">ثبت پارامترهای استخراج و تنظیمات فید</p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Source Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">نام منبع خبری</label>
              <input
                type="text"
                placeholder="مثال: TechCrunch یا BBC News"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-2.5 text-xs min-h-[44px] sm:min-h-[40px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            {/* RSS URL & Test Feed Button Group */}
            <div>
              <div className="flex items-center gap-2 justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">آدرس فید (RSS / Atom)</label>
                <button
                  type="button"
                  onClick={() => setUrl(url.trim().toLowerCase())}
                  className="text-[11px] font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  title="استانداردسازی و حذف فاصله‌های اضافی"
                >
                  حذف فاصله اضافی
                </button>
              </div>
              <div className="space-y-2.5">
                <input
                  type="url"
                  placeholder="https://example.com/rss.xml"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setTestResult(null);
                  }}
                  className="w-full bg-gray-50/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-2.5 text-xs min-h-[44px] sm:min-h-[40px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 ltr text-left transition-all"
                />

                <button
                  type="button"
                  onClick={handleTestFeedClick}
                  disabled={isTestingFeed || !url.trim()}
                  className="w-full bg-sky-50 hover:bg-sky-100/90 text-sky-700 border border-sky-200 text-xs py-2.5 px-3 rounded-xl font-medium transition-all flex items-center gap-2 justify-center gap-2 min-h-[44px] sm:min-h-[38px] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <SearchCheck className={`w-4 h-4 ${isTestingFeed ? 'animate-spin' : ''}`} />
                  <span>{isTestingFeed ? 'در حال بررسی اتصال فید...' : 'بررسی زنده سلامت فید RSS'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-2.5 p-3 rounded-xl text-xs border transition-all ${
                    testResult.isValid
                      ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50/90 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.isValid ? (
                    <div className="space-y-1">
                      <p className="font-bold flex items-center gap-2.5 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        فید معتبر و قابل اتصال است
                      </p>
                      <p className="text-[11px] text-emerald-800/90">عنوان شناسایی‌شده: {testResult.feedTitle}</p>
                      <p className="text-[11px] text-emerald-800/90">تعداد آیتم‌های فعال: {testResult.itemsFound} خبر</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold flex items-center gap-2.5 text-rose-700">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        اتصال به فید ناموفق بود
                      </p>
                      <p className="text-[11px] text-rose-800/90">{testResult.errorDetails}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language & Category Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">زبان منبع</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-50/80 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-xs min-h-[44px] sm:min-h-[40px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="en">English (انگلیسی)</option>
                  <option value="fa">Persian (فارسی)</option>
                  <option value="fr">French (فرانسوی)</option>
                  <option value="de">German (آلمانی)</option>
                  <option value="es">Spanish (اسپانیایی)</option>
                  <option value="ar">Arabic (عربی)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">دسته‌بندی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50/80 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-xs min-h-[44px] sm:min-h-[40px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrape Limit & Active Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2.5">
                  <ListOrdered className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  سقف اسکرپ (خبر)
                </label>
                <select
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(Number(e.target.value))}
                  className="w-full bg-gray-50/80 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 text-xs min-h-[44px] sm:min-h-[40px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value={5}>۵ خبر در هر پایش</option>
                  <option value={10}>۱۰ خبر (استاندارد)</option>
                  <option value={15}>۱۵ خبر</option>
                  <option value={20}>۲۰ خبر</option>
                  <option value={30}>۳۰ خبر</option>
                  <option value={50}>۵۰ خبر (حداکثر)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2.5">
                  <Power className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  وضعیت اولیه
                </label>
                <button
                  type="button"
                  onClick={() => setIsActiveForm(!isActiveForm)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center gap-2 justify-center gap-2 min-h-[44px] sm:min-h-[40px] transition-all active:scale-[0.99] ${
                    isActiveForm
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}
                >
                  {isActiveForm ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>فعال (پایش خودکار)</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>غیرفعال (مستثنی)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selector (Optional) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2.5">
                  <Code2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  سلکتور CSS استخراج
                </span>
                <span className="text-[10px] text-gray-400 font-normal">(اختیاری)</span>
              </label>
              <input
                type="text"
                placeholder="مثال: .article-content یا article p"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                className="w-full bg-gray-50/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-2.5 text-xs min-h-[44px] sm:min-h-[40px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono ltr text-left transition-all"
              />
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all flex items-center gap-2 justify-center  disabled:opacity-50 shadow-xs min-h-[44px] mt-2"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت و فعال‌سازی منبع خبری'}</span>
            </button>
          </form>

          {/* Preset Standard Sources (Enhanced Category Filter & Instant Add UI) */}
          <div className="pt-5 border-t border-gray-100 space-y-3.5">
            <div className="flex items-center gap-2 justify-between">
              <p className="text-xs font-bold text-gray-900 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                <span>فیدهای پیشنهادی آماده ({presetSources.length} منبع معتبر):</span>
              </p>
              <span className="text-[10px] text-gray-400 font-medium">پایگاه داده بین‌المللی</span>
            </div>

            {/* Category Pills Slider */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none text-[11px]">
              {presetCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPresetCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                    presetCategoryFilter === cat.id
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-gray-100/90 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset Search Filter Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در میان فیدهای پیشنهادی..."
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200/80 text-gray-900 placeholder-gray-400 rounded-xl px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-orange-500"
              />
              {presetSearch && (
                <button
                  type="button"
                  onClick={() => setPresetSearch('')}
                  className="absolute start-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Preset List Container */}
            <div className="space-y-2 max-h-64 overflow-y-auto pe-1">
              {filteredPresetSources.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  هیچ فید پیشنهادی با این مشخصات یافت نشد.
                </div>
              ) : (
                filteredPresetSources.map((preset, idx) => {
                  const normalizeUrl = (u: string) => u.trim().toLowerCase().replace(/\/+$/, '');
                  const isAlreadyAdded = sources.some(
                    (s) => normalizeUrl(s.url) === normalizeUrl(preset.url)
                  );
                  const isAddingThis = addingPresetUrl === preset.url;

                  return (
                    <div
                      key={idx}
                      className="bg-gray-50/90 hover:bg-white border border-gray-200/80 hover:border-orange-300 p-2.5 rounded-xl text-xs text-gray-800 space-y-2 transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-2 justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-bold text-gray-900 truncate">{preset.name}</span>
                          <span className="text-[9px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 shrink-0">
                            {preset.label}
                          </span>
                        </div>

                        {isAlreadyAdded && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 flex items-center gap-2">
                            <Check className="w-3 h-3 text-emerald-600" />
                            افزوده شده
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 justify-between gap-2 pt-1 border-t border-gray-100 text-[10px] text-gray-500 font-mono">
                        <span className="truncate ltr text-left max-w-[150px]">{preset.url}</span>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Populate Form Button */}
                          <button
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors font-sans font-bold"
                            title="قرار دادن اطلاعات در فرم ویرایش"
                          >
                            ویرایش در فرم
                          </button>

                          {/* Instant Add Button */}
                          <button
                            type="button"
                            disabled={isAlreadyAdded || isAddingThis}
                            onClick={() => handleInstantAddPreset(preset)}
                            className={`px-2.5 py-1 rounded-lg font-sans font-bold transition-all flex items-center gap-2 ${
                              isAlreadyAdded
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-2xs'
                            }`}
                          >
                            {isAddingThis ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>ثبت...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>{isAlreadyAdded ? 'موجود' : 'ثبت مستقیم'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* List Column: Manage Sources & Bulk Actions */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Controls Bar: Search, Status Filter, Select All */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-700 hover:text-gray-900 flex items-center gap-2 text-xs font-bold border border-gray-200/90 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 min-h-[40px] transition-all"
                  title="انتخاب یا لغو انتخاب تمام منابع"
                >
                  {selectedIds.length === filteredSources.length && filteredSources.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-orange-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span>
                    {selectedIds.length === filteredSources.length && filteredSources.length > 0
                      ? 'لغو انتخاب همه'
                      : 'انتخاب همه'}
                  </span>
                </button>

                <div className="text-xs text-gray-500 font-medium">
                  نمایش <strong className="text-gray-800">{filteredSources.length}</strong> از {sources.length} منبع
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] flex-1 sm:flex-none text-center ${
                    statusFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  همه ({sources.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] flex-1 sm:flex-none text-center ${
                    statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  فعال (
                  {sources.filter((s) => s.is_active === undefined || s.is_active === 1 || s.is_active === true).length})
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all min-h-[36px] flex-1 sm:flex-none text-center ${
                    statusFilter === 'inactive' ? 'bg-white text-amber-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  غیرفعال (
                  {sources.filter((s) => s.is_active === 0 || s.is_active === false).length})
                </button>
              </div>
            </div>

            {/* Search Input & Category Pills */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="جستجو در نام منبع یا آدرس URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-2.5 text-xs min-h-[42px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50/80 border border-gray-200 text-gray-700 font-medium rounded-xl px-3.5 py-2.5 text-xs min-h-[42px] focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shrink-0"
              >
                <option value="all">همه دسته‌بندی‌ها</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Action Toolbar Floating Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-orange-500 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-orange-600 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="bg-white text-orange-600 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                  {selectedIds.length} منبع انتخاب شد
                </span>
                <span className="text-xs text-orange-100 hidden sm:inline font-medium">عملیات گروهی:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Bulk Toggle Active */}
                <button
                  onClick={() => handleBulkToggle(true)}
                  disabled={isBulkToggling}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-2 justify-center gap-1.5 transition-all disabled:opacity-50 min-h-[38px] flex-1 sm:flex-none"
                  title="فعال‌سازی یک‌جای تمام منابع انتخاب‌شده"
                >
                  <PlayCircle className="w-4 h-4 shrink-0" />
                  <span>فعال‌سازی</span>
                </button>

                {/* Bulk Toggle Inactive */}
                <button
                  onClick={() => handleBulkToggle(false)}
                  disabled={isBulkToggling}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-2 justify-center gap-1.5 transition-all disabled:opacity-50 min-h-[38px] flex-1 sm:flex-none"
                  title="غیرفعال‌سازی موقت تمام منابع انتخاب‌شده"
                >
                  <PauseCircle className="w-4 h-4 shrink-0" />
                  <span>غیرفعال‌سازی</span>
                </button>

                {/* Bulk Delete Button */}
                <button
                  onClick={() => setShowConfirmBulkDelete(true)}
                  disabled={isBulkDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-2 justify-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 min-h-[38px] flex-1 sm:flex-none"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>حذف یک‌جا ({selectedIds.length})</span>
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-xl font-medium transition-all min-h-[38px]"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}

          {/* Confirm Bulk Delete Modal/Popup */}
          {showConfirmBulkDelete && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>تایید حذف یک‌جا ({selectedIds.length} منبع خبری)</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                آیا مطمئن هستید که می‌خواهید تمام <strong>{selectedIds.length} منبع انتخاب شده</strong> را به صورت دائم از دیتابیس D1 حذف کنید؟ این عملیات غیرقابل بازگشت است.
              </p>
              <div className="flex items-center gap-2 justify-end gap-2.5 pt-1">
                <button
                  onClick={() => setShowConfirmBulkDelete(false)}
                  className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 text-xs px-3.5 py-2 rounded-xl font-medium min-h-[38px]"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmBulkDelete}
                  disabled={isBulkDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2.5 min-h-[38px]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isBulkDeleting ? 'در حال حذف...' : 'تایید و حذف دائم یک‌جا'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sources Card List */}
          {error ? (
            <DatabaseErrorFallback
              message="دیتابیس در حال بازسازی است. لطفاً چند دقیقه دیگر تلاش کنید."
              onRetry={onRefresh}
              isRetrying={loading}
            />
          ) : loading ? (
            <div className="bg-white border border-gray-200/90 rounded-2xl p-12 text-center text-gray-500 text-xs font-medium">
              در حال دریافت و ساختاربندی لیست منابع از دیتابیس D1...
            </div>
          ) : sources.length === 0 ? (
            <EmptyState
              icon={Rss}
              title="هنوز منبع خبری ثبت نشده است"
              description="می‌توانید از فیدهای پیشنهادی آماده زیر استفاده کنید یا با استفاده از فرم ثبت منبع، آدرس RSS جدیدی اضافه نمایید."
            />
          ) : filteredSources.length === 0 ? (
            <div className="bg-white border border-gray-200/90 rounded-2xl p-12 text-center text-gray-500 text-xs space-y-2">
              <Rss className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-medium text-gray-600">هیچ منبعی با این فیلترها یا عبارت جستجو یافت نشد.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredSources.map((src) => {
                const isSelected = selectedIds.some((sId) => Number(sId) === Number(src.id));
                const isActive = src.is_active === undefined || src.is_active === 1 || src.is_active === true;
                const isEditing = editingSourceId === src.id;

                return (
                  <div
                    key={src.id}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all space-y-3.5 ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50/20 ring-2 ring-orange-400/30'
                        : isActive
                        ? 'border-gray-200/90 hover:border-gray-300 shadow-xs'
                        : 'border-amber-200/90 bg-amber-50/20 opacity-85'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                      <div className="flex items-start gap-2  min-w-0">
                        {/* Checkbox with Touch Padding */}
                        <button
                          onClick={() => handleToggleSelect(src.id)}
                          className="mt-0.5 text-gray-400 hover:text-orange-600 transition-colors shrink-0 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                          title="انتخاب منبع"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap gap-2">
                            <Rss className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-500' : 'text-amber-500'}`} />
                            <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">{src.name}</h4>

                            {/* Active/Inactive Badge Button */}
                            <button
                              onClick={() => handleToggleSingleStatus(src)}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-2.5 transition-colors ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                              }`}
                              title="برای تغییر وضعیت کلیک کنید"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                              <span>{isActive ? 'فعال' : 'غیرفعال (مستثنی)'}</span>
                            </button>

                            {/* Category Badge */}
                            <span className="text-[10px] bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-md border border-sky-100 font-medium">
                              {categoriesList.find((c) => c.id === (src.category || 'general'))?.label || src.category || 'عمومی'}
                            </span>

                            {/* Language Badge */}
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono uppercase">
                              {src.language || 'en'}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 font-mono ltr text-left break-all truncate max-w-full">
                            {src.url}
                          </p>
                        </div>
                      </div>

                      {/* Right Control Buttons */}
                      <div className="flex items-center gap-2  shrink-0 self-stretch sm:self-auto justify-end pt-1 sm:pt-0 border-t sm:border-0 border-gray-100">
                        {/* Quick Scrape Button */}
                        <button
                          onClick={() => onScrapeSource(src.id)}
                          disabled={!isActive}
                          title={isActive ? 'اسکرپ آنی این منبع' : 'منبع غیرفعال است'}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-2 justify-center gap-1.5 min-h-[38px] transition-all disabled:opacity-40"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>پایش آنی</span>
                        </button>

                        {/* Quick Edit Button */}
                        <button
                          onClick={() => (isEditing ? setEditingSourceId(null) : handleStartEdit(src))}
                          title="تنظیم سقف اسکرپ و پارامترها"
                          className={`text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-2 justify-center gap-1.5 border min-h-[38px] transition-all ${
                            isEditing
                              ? 'bg-orange-50 text-orange-700 border-orange-300'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                          <span>تنظیمات</span>
                        </button>

                        {/* External Link */}
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 p-2 rounded-xl text-xs flex items-center gap-2 justify-center min-h-[38px] min-w-[38px] transition-colors"
                          title="باز کردن مستقیم آدرس فید"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteSource(src.id)}
                          title="حذف این منبع"
                          className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl border border-transparent hover:border-rose-200 transition-colors min-h-[38px] min-w-[38px] flex items-center gap-2 justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges Footer */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 pt-2.5 border-t border-gray-100">
                      <span className="flex items-center gap-2.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/80">
                        <ListOrdered className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>سقف استخراج: <strong>{src.scrape_limit || 10} خبر</strong></span>
                      </span>

                      {src.selector && (
                        <span className="flex items-center gap-2.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/80 font-mono ltr">
                          <Code2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{src.selector}</span>
                        </span>
                      )}
                    </div>

                    {/* Inline Quick Edit Section */}
                    {isEditing && (
                      <div className="mt-3 p-3.5 sm:p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3 animate-in fade-in">
                        <div className="flex items-center gap-2 justify-between text-xs font-bold text-gray-900 border-b border-orange-200/80 pb-2">
                          <span>ویرایش سریع پارامترهای منبع #{src.id}</span>
                          <button
                            onClick={() => setEditingSourceId(null)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              سقف دریافت خبر
                            </label>
                            <select
                              value={editScrapeLimit}
                              onChange={(e) => setEditScrapeLimit(Number(e.target.value))}
                              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs min-h-[38px] focus:outline-none focus:border-orange-500"
                            >
                              <option value={5}>۵ خبر</option>
                              <option value={10}>۱۰ خبر</option>
                              <option value={15}>۱۵ خبر</option>
                              <option value={20}>۲۰ خبر</option>
                              <option value={30}>۳۰ خبر</option>
                              <option value={50}>۵۰ خبر</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              دسته‌بندی
                            </label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs min-h-[38px] focus:outline-none focus:border-orange-500"
                            >
                              {categoriesList.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              سلکتور CSS استخراج
                            </label>
                            <input
                              type="text"
                              value={editSelector}
                              onChange={(e) => setEditSelector(e.target.value)}
                              placeholder=".article-content"
                              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs font-mono ltr min-h-[38px] focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end gap-2 pt-1.5">
                          <button
                            onClick={() => setEditingSourceId(null)}
                            className="bg-white border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium min-h-[36px]"
                          >
                            انصراف
                          </button>
                          <button
                            onClick={() => handleSaveEdit(src.id)}
                            disabled={isSavingEdit}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2.5 min-h-[36px] disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSavingEdit ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

