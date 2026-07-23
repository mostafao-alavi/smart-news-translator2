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
  Filter,
  SlidersHorizontal,
  Edit2,
  X,
  Check,
  Tag,
  Code2,
  ListOrdered,
  Eye,
  EyeOff,
  Power,
} from 'lucide-react';

interface SourcesTabProps {
  sources: SourceItem[];
  loading: boolean;
  onAddSource: (
    name: string,
    url: string,
    language?: string,
    category?: string,
    selector?: string,
    scrape_limit?: number,
    is_active?: boolean
  ) => Promise<boolean>;
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

    const success = await onAddSource(
      name.trim(),
      url.trim(),
      language,
      category,
      selector.trim() || undefined,
      scrapeLimit,
      isActiveForm
    );
    setIsSubmitting(false);

    if (success) {
      setSuccessMsg(`منبع "${name}" با موفقیت ذخیره و استانداردسازی شد.`);
      setName('');
      setUrl('');
      setSelector('');
      setTestResult(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('خطا در ثبت منبع جدید (احتمالاً آدرس تکراری است یا فیلدها معتبر نیستند).');
    }
  };

  // Presets
  const presetSources = [
    { name: 'CoinDesk Crypto News', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', lang: 'en', category: 'crypto', label: 'ارز دیجیتال', limit: 15, selector: '.article-body' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', lang: 'en', category: 'crypto', label: 'ارز دیجیتال', limit: 10, selector: '.post-content' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', lang: 'en', category: 'tech', label: 'فناوری', limit: 15, selector: '.article-content' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', lang: 'en', category: 'tech', label: 'فناوری', limit: 10, selector: '.c-entry-content' },
    { name: 'IGN Gaming News', url: 'https://feeds.feedburner.com/ign/news', lang: 'en', category: 'gaming', label: 'گیمینگ', limit: 10, selector: '.article-section' },
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', lang: 'en', category: 'ai', label: 'هوش مصنوعی', limit: 10, selector: '.articleBody' },
    { name: 'BBC World News', url: 'http://feeds.bbci.co.uk/news/rss.xml', lang: 'en', category: 'general', label: 'اخبار جهان', limit: 20, selector: '.story-body' },
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

  // Toggle single item selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
      setSelectedIds(filteredSources.map((s) => s.id));
    }
  };

  // Execute Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    const ok = await onBulkDeleteSources(selectedIds);
    setIsBulkDeleting(false);
    setShowConfirmBulkDelete(false);
    if (ok) {
      setSelectedIds([]);
      setSuccessMsg(`تعداد ${selectedIds.length} منبع خبری با موفقیت حذف گردید.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('خطا در حذف گروهی منابع.');
    }
  };

  // Execute Bulk Toggle Status
  const handleBulkToggle = async (targetActiveStatus: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkToggling(true);
    const ok = await onBulkToggleStatus(selectedIds, targetActiveStatus);
    setIsBulkToggling(false);
    if (ok) {
      setSuccessMsg(`وضعیت ${selectedIds.length} منبع با موفقیت به ${targetActiveStatus ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-6 h-6 text-orange-100" />
            <h2 className="text-xl font-black">مدیریت تخصصی و استاندارد منابع خبری</h2>
          </div>
          <p className="text-xs text-orange-100/90 leading-relaxed">
            تنظیم آدرس‌های فید RSS، کنترل سقف استخراج اخبار، غیرفعال‌سازی موقت و مدیریت یک‌جای منابع
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs shrink-0 font-medium">
          <Rss className="w-4 h-4 text-amber-200" />
          <span>منابع کل: {sources.length} منبع</span>
          <span className="opacity-40">|</span>
          <span className="text-emerald-200 font-bold">
            فعال: {sources.filter((s) => s.is_active === undefined || s.is_active === 1 || s.is_active === true).length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column: Add Standardized Source */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs h-fit">
          <div className="flex items-center space-x-2 space-x-reverse border-b border-gray-100 pb-3">
            <div className="bg-orange-50 text-orange-600 p-2 rounded-lg border border-orange-100">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">افزودن منبع خبری استاندارد</h3>
              <p className="text-xs text-gray-500">ثبت کامل پارامترها و تنظیمات فید</p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Source Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">نام منبع خبری</label>
              <input
                type="text"
                placeholder="مثال: TechCrunch یا BBC News"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* RSS URL & Test Feed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">آدرس فید (RSS / Atom)</label>
                <button
                  type="button"
                  onClick={() => setUrl(url.trim().toLowerCase())}
                  className="text-[10px] text-orange-600 hover:underline"
                  title="استانداردسازی و حذف فاصله‌های اضافی"
                >
                  فرمت خودکار
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="https://example.com/rss.xml"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setTestResult(null);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-orange-500 ltr text-left"
                />

                <button
                  type="button"
                  onClick={handleTestFeedClick}
                  disabled={isTestingFeed || !url.trim()}
                  className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <SearchCheck className={`w-3.5 h-3.5 ${isTestingFeed ? 'animate-spin' : ''}`} />
                  <span>{isTestingFeed ? 'تست اتصال فید...' : 'بررسی زنده سلامت فید RSS'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-2 p-2.5 rounded-lg text-xs border ${
                    testResult.isValid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.isValid ? (
                    <div className="space-y-1">
                      <p className="font-bold flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        فید معتبر است
                      </p>
                      <p className="text-[11px]">عنوان: {testResult.feedTitle}</p>
                      <p className="text-[11px]">آیتم‌های موجود: {testResult.itemsFound} خبر</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold flex items-center gap-1 text-rose-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        اتصال به فید ناموفق
                      </p>
                      <p className="text-[11px]">{testResult.errorDetails}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language & Category Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">زبان منبع</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-orange-500"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">دسته‌بندی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-orange-500"
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
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <ListOrdered className="w-3.5 h-3.5 text-orange-500" />
                  سقف اسکرپ (خبر)
                </label>
                <select
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-orange-500"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Power className="w-3.5 h-3.5 text-emerald-600" />
                  وضعیت اولیه
                </label>
                <button
                  type="button"
                  onClick={() => setIsActiveForm(!isActiveForm)}
                  className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    isActiveForm
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}
                >
                  {isActiveForm ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>فعال (پایش خودکار)</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>غیرفعال (مستثنی)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selector (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-gray-500" />
                  سلکتور CSS اختصاصی استخراج
                </span>
                <span className="text-[10px] text-gray-400 font-normal">(اختیاری)</span>
              </label>
              <input
                type="text"
                placeholder="مثال: .article-content یا article p"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-orange-500 font-mono ltr text-left"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 space-x-reverse disabled:opacity-50 shadow-xs mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت و فعال‌سازی منبع'}</span>
            </button>
          </form>

          {/* Preset Standard Sources */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              فیدهای پیشنهادی استاندارد:
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {presetSources.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-right bg-gray-50 hover:bg-orange-50/60 border border-gray-200 hover:border-orange-200 p-2 rounded-lg text-xs text-gray-700 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-gray-800 truncate">{preset.name}</span>
                    <span className="text-[9px] text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-100 shrink-0">
                      {preset.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-orange-700 bg-orange-100/70 px-1.5 py-0.5 rounded border border-orange-200 shrink-0">
                    انتخاب
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List Column: Manage Sources & Bulk Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar: Search & Status Filter */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-xs font-medium border border-gray-200 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  title="انتخاب یا لغو انتخاب تمام منابع"
                >
                  {selectedIds.length === filteredSources.length && filteredSources.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span>
                    {selectedIds.length === filteredSources.length && filteredSources.length > 0
                      ? 'لغو انتخاب همه'
                      : 'انتخاب همه'}
                  </span>
                </button>

                <div className="text-xs text-gray-500 font-medium">
                  نمایش {filteredSources.length} از {sources.length} منبع
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    statusFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  همه ({sources.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  فعال (
                  {sources.filter((s) => s.is_active === undefined || s.is_active === 1 || s.is_active === true).length})
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    statusFilter === 'inactive' ? 'bg-white text-amber-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  غیرفعال (
                  {sources.filter((s) => s.is_active === 0 || s.is_active === false).length})
                </button>
              </div>
            </div>

            {/* Search Input & Category Pills */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-gray-100">
              <input
                type="text"
                placeholder="جستجو در نام منبع یا آدرس URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-orange-500"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-orange-500 shrink-0"
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
            <div className="bg-orange-500 text-white rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 border border-orange-600 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="bg-white text-orange-600 font-bold text-xs px-2.5 py-1 rounded-lg">
                  {selectedIds.length} منبع انتخاب شده
                </span>
                <span className="text-xs text-orange-100 hidden sm:inline">عملیات دسته‌جمعی و یک‌جا:</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Bulk Toggle Active */}
                <button
                  onClick={() => handleBulkToggle(true)}
                  disabled={isBulkToggling}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="فعال‌سازی یک‌جای تمام منابع انتخاب‌شده"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>فعال‌سازی گروهی</span>
                </button>

                {/* Bulk Toggle Inactive */}
                <button
                  onClick={() => handleBulkToggle(false)}
                  disabled={isBulkToggling}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="غیرفعال‌سازی موقت تمام منابع انتخاب‌شده"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>غیرفعال‌سازی گروهی</span>
                </button>

                {/* Bulk Delete Button */}
                <button
                  onClick={() => setShowConfirmBulkDelete(true)}
                  disabled={isBulkDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف یک‌جا ({selectedIds.length})</span>
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1.5 rounded-lg transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}

          {/* Confirm Bulk Delete Modal/Popup */}
          {showConfirmBulkDelete && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>تایید حذف یک‌جا ({selectedIds.length} منبع)</span>
              </div>
              <p className="text-xs text-rose-700">
                آیا مطمئن هستید که می‌خواهید تمام <strong>{selectedIds.length} منبع انتخاب شده</strong> را به صورت دائم از دیتابیس D1 حذف کنید؟
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowConfirmBulkDelete(false)}
                  className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 text-xs px-3 py-1.5 rounded-lg font-medium"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmBulkDelete}
                  disabled={isBulkDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBulkDeleting ? 'در حال حذف...' : 'تایید و حذف دائم یک‌جا'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sources Card List */}
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 text-xs">
              در حال دریافت و ساختاربندی لیست منابع از دیتابیس D1...
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 text-xs space-y-2">
              <Rss className="w-8 h-8 text-gray-300 mx-auto" />
              <p>هیچ منبعی با این فیلترها یا عبارت جستجو یافت نشد.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSources.map((src) => {
                const isSelected = selectedIds.includes(src.id);
                const isActive = src.is_active === undefined || src.is_active === 1 || src.is_active === true;
                const isEditing = editingSourceId === src.id;

                return (
                  <div
                    key={src.id}
                    className={`bg-white border rounded-xl p-4 transition-all space-y-3 ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50/20 ring-1 ring-orange-400'
                        : isActive
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-amber-200 bg-amber-50/20 opacity-80'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-2.5 space-x-reverse min-w-0">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleSelect(src.id)}
                          className="mt-0.5 text-gray-400 hover:text-orange-600 transition-colors shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <Rss className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-amber-500'}`} />
                            <h4 className="text-sm font-bold text-gray-900">{src.name}</h4>

                            {/* Active/Inactive Badge */}
                            <button
                              onClick={() => handleToggleSingleStatus(src)}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-colors ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                              }`}
                              title="برای غیرفعال/فعال‌سازی موقت کلیک کنید"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                              <span>{isActive ? 'فعال' : 'غیرفعال (مستثنی)'}</span>
                            </button>

                            {/* Category Badge */}
                            <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100">
                              {categoriesList.find((c) => c.id === (src.category || 'general'))?.label || src.category || 'عمومی'}
                            </span>

                            {/* Language Badge */}
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">
                              {src.language || 'en'}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 font-mono ltr text-left break-all truncate">
                            {src.url}
                          </p>
                        </div>
                      </div>

                      {/* Right Control Buttons */}
                      <div className="flex items-center space-x-2 space-x-reverse shrink-0 self-end sm:self-center">
                        {/* Quick Scrape Button */}
                        <button
                          onClick={() => onScrapeSource(src.id)}
                          disabled={!isActive}
                          title={isActive ? 'اسکرپ آنی این منبع' : 'منبع غیرفعال است'}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 shadow-2xs disabled:opacity-40"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                          <span>پایش آنی</span>
                        </button>

                        {/* Quick Edit Button */}
                        <button
                          onClick={() => (isEditing ? setEditingSourceId(null) : handleStartEdit(src))}
                          title="تنظیم سقف اسکرپ و پارامترها"
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 border transition-colors ${
                            isEditing
                              ? 'bg-orange-50 text-orange-700 border-orange-300'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>تنظیمات</span>
                        </button>

                        {/* Test Link External */}
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 p-1.5 rounded-lg text-xs"
                          title="باز کردن مستقیم آدرس فید"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteSource(src.id)}
                          title="حذف این منبع"
                          className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges Footer */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 pt-2 border-t border-gray-100/80">
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        <ListOrdered className="w-3 h-3 text-orange-500" />
                        <span>سقف اسکرپ: <strong>{src.scrape_limit || 10} خبر</strong></span>
                      </span>

                      {src.selector && (
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 font-mono ltr">
                          <Code2 className="w-3 h-3 text-gray-400" />
                          <span>{src.selector}</span>
                        </span>
                      )}
                    </div>

                    {/* Inline Quick Edit Section */}
                    {isEditing && (
                      <div className="mt-2 p-3 bg-orange-50/50 border border-orange-200 rounded-lg space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-orange-100 pb-1.5">
                          <span>ویرایش سریع پارامترهای منبع #{src.id}</span>
                          <button
                            onClick={() => setEditingSourceId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                              سقف دریافت خبر
                            </label>
                            <select
                              value={editScrapeLimit}
                              onChange={(e) => setEditScrapeLimit(Number(e.target.value))}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
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
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                              دسته‌بندی
                            </label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                            >
                              {categoriesList.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                              سلکتور CSS استخراج
                            </label>
                            <input
                              type="text"
                              value={editSelector}
                              onChange={(e) => setEditSelector(e.target.value)}
                              placeholder=".article-content"
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs font-mono ltr"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingSourceId(null)}
                            className="bg-white border border-gray-300 text-gray-700 text-xs px-2.5 py-1 rounded font-medium"
                          >
                            انصراف
                          </button>
                          <button
                            onClick={() => handleSaveEdit(src.id)}
                            disabled={isSavingEdit}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
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
