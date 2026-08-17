import React, { useState } from 'react';
import { SourceItem } from '../types/client';
import {
  Rss,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Globe,
  Radio,
  Sparkles,
  Zap,
  Plus,
  Trash2,
  Database,
  Power,
  ShieldCheck,
  Check,
  Layers,
  Settings2,
  Info,
  Server,
  Activity,
} from 'lucide-react';

interface InputSourcesTabProps {
  sources: SourceItem[];
  loading: boolean;
  error?: boolean;
  onAddSource?: (name: string, url: string, category?: string) => Promise<boolean>;
  onDeleteSource?: (id: number) => void;
  onUpdateSource?: (id: number, data: Partial<SourceItem>) => Promise<boolean>;
  onBulkDeleteSources?: (ids: number[]) => Promise<boolean>;
  onBulkToggleStatus?: (ids: number[], active: boolean) => Promise<boolean>;
  onScrapeSource?: (id: number) => void;
  onTestFeed?: (url: string) => Promise<any>;
  onRefresh?: () => void;
  initialSubTab?: string;
}

interface PresetSource {
  name: string;
  url: string;
  category: string;
  language: string;
  description: string;
  tag: string;
}

const PRESET_SOURCES: PresetSource[] = [
  {
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'crypto',
    language: 'en',
    description: 'پیشروترین پایگاه خبری حوزه ارزهای دیجیتال و وب ۳ در جهان',
    tag: 'کریپتو / بلاکچین',
  },
  {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    category: 'crypto',
    language: 'en',
    description: 'پوشش تخصصی اخبار بیت‌کوین، اتریوم، دیفای و هوش مصنوعی',
    tag: 'اخبار کریپتو و AI',
  },
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'crypto',
    language: 'en',
    description: 'مرجع تحلیل‌های اقتصادی و روندهای کلان بازار ارزهای دیجیتال',
    tag: 'تحلیل بازار کریپتو',
  },
];

export const InputSourcesTab: React.FC<InputSourcesTabProps> = ({
  sources = [],
  loading,
  error,
  onAddSource,
  onDeleteSource,
  onUpdateSource,
  onScrapeSource,
  onTestFeed,
  onRefresh,
}) => {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccessMsg, setScrapeSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Ping/Test Feed State for Cointelegraph
  const [isTestingFeed, setIsTestingFeed] = useState(false);
  const [feedTestResult, setFeedTestResult] = useState<{
    tested: boolean;
    valid?: boolean;
    feedTitle?: string;
    itemsFound?: number;
    errorDetails?: string;
    timestamp?: string;
  } | null>(null);

  // Custom Source Modal / Accordion State
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('crypto');
  const [customLimit, setCustomLimit] = useState(10);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Normalize URL helper
  const cleanUrl = (u: string) => (u || '').trim().toLowerCase().replace(/\/+$/, '');

  // Find if Cointelegraph is ACTUALLY in the D1 database
  const cointelegraphInDb = sources.find(
    (s) =>
      s.name?.toLowerCase().includes('cointelegraph') ||
      cleanUrl(s.url).includes('cointelegraph.com')
  );

  const isCointelegraphActive = Boolean(
    cointelegraphInDb && (cointelegraphInDb.is_active === 1 || cointelegraphInDb.is_active === true)
  );

  // Helper to show temporary feedback
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1. Toggle Active / Inactive for a source in D1
  const handleToggleStatus = async (source: SourceItem) => {
    const newStatus = source.is_active === 1 || source.is_active === true ? 0 : 1;
    setActionLoading(`toggle-${source.id}`);
    try {
      if (onUpdateSource) {
        const ok = await onUpdateSource(source.id, { is_active: newStatus });
        if (ok) {
          showFeedback('success', `وضعیت منبع "${source.name}" به ${newStatus === 1 ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
        } else {
          showFeedback('error', 'خطا در بروزرسانی وضعیت منبع در دیتابیس.');
        }
      } else {
        const res = await fetch(`/api/sources/${source.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: newStatus }),
        });
        if (res.ok) {
          if (onRefresh) onRefresh();
          showFeedback('success', `وضعیت منبع "${source.name}" به ${newStatus === 1 ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
        }
      }
    } catch (err: any) {
      showFeedback('error', `خطا: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Insert / Restore Cointelegraph or specific preset into D1
  const handleInsertPresetSource = async (preset: PresetSource) => {
    setActionLoading(`insert-${preset.name}`);
    try {
      if (onAddSource) {
        const ok = await onAddSource(preset.name, preset.url, preset.category);
        if (ok) {
          showFeedback('success', `منبع "${preset.name}" با موفقیت در دیتابیس D1 ثبت و فعال شد.`);
        } else {
          showFeedback('error', `خطا در ثبت منبع "${preset.name}".`);
        }
      } else {
        const res = await fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: preset.name,
            url: preset.url,
            category: preset.category,
            language: preset.language,
            scrape_limit: 10,
            is_active: 1,
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (onRefresh) onRefresh();
          showFeedback('success', `منبع "${preset.name}" با موفقیت در دیتابیس D1 ثبت و فعال شد.`);
        } else {
          showFeedback('error', data.error || 'خطا در ثبت منبع.');
        }
      }
    } catch (err: any) {
      showFeedback('error', `خطا: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Restore all default preset sources in D1 (Batch restore)
  const handleRestoreAllDefaults = async () => {
    setActionLoading('restore-all');
    try {
      const res = await fetch('/api/sources/restore-defaults', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
        showFeedback(
          'success',
          data.data?.message || 'منابع پیش‌فرض با موفقیت در پایگاه داده D1 بازیابی و ثبت شدند.'
        );
      } else {
        showFeedback('error', data.error || 'خطا در بازیابی منابع پیش‌فرض.');
      }
    } catch (err: any) {
      showFeedback('error', `خطا در برقراری ارتباط: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Test Live Feed Ping
  const handleTestFeedConnection = async (feedUrl: string) => {
    setIsTestingFeed(true);
    setFeedTestResult(null);
    try {
      let result;
      if (onTestFeed) {
        result = await onTestFeed(feedUrl);
      } else {
        const res = await fetch('/api/sources/test-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: feedUrl }),
        });
        const data = await res.json();
        result = data.data || { isValid: false, errorDetails: data.error };
      }

      setFeedTestResult({
        tested: true,
        valid: result?.isValid,
        feedTitle: result?.feedTitle || 'فید RSS',
        itemsFound: result?.itemsFound || 0,
        errorDetails: result?.errorDetails,
        timestamp: new Date().toLocaleTimeString('fa-IR'),
      });
    } catch (err: any) {
      setFeedTestResult({
        tested: true,
        valid: false,
        errorDetails: err.message || 'خطا در برقراری ارتباط با فید',
        timestamp: new Date().toLocaleTimeString('fa-IR'),
      });
    } finally {
      setIsTestingFeed(false);
    }
  };

  // 5. Trigger Scrape for Cointelegraph / Sources
  const handleTriggerScrape = async () => {
    setIsScraping(true);
    setScrapeSuccessMsg(null);

    try {
      if (cointelegraphInDb && onScrapeSource) {
        onScrapeSource(cointelegraphInDb.id);
        setScrapeSuccessMsg('درخواست پایش برای Cointelegraph با موفقیت ارسال شد.');
      } else {
        const res = await fetch('/api/trigger-scraper', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setScrapeSuccessMsg('عملیات پایش و دریافت اخبار جدید با موفقیت به اتمام رسید.');
        } else {
          setScrapeSuccessMsg('عملیات پایش اجرا شد.');
        }
      }

      if (onRefresh) onRefresh();
      setTimeout(() => setScrapeSuccessMsg(null), 5000);
    } catch (e: any) {
      console.error('Error triggering scrape:', e);
      showFeedback('error', `خطا در اجرای پایش: ${e.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  // 6. Add Custom Source Handler
  const handleAddCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customUrl.trim()) {
      showFeedback('error', 'نام و آدرس فید الزامی است.');
      return;
    }

    setIsAddingCustom(true);
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName.trim(),
          url: customUrl.trim(),
          category: customCategory,
          scrape_limit: customLimit,
          is_active: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `منبع "${customName}" با موفقیت در پایگاه داده ثبت شد.`);
        setCustomName('');
        setCustomUrl('');
        setShowAddForm(false);
        if (onRefresh) onRefresh();
      } else {
        showFeedback('error', data.error || 'خطا در ثبت منبع جدید.');
      }
    } catch (err: any) {
      showFeedback('error', `خطا: ${err.message}`);
    } finally {
      setIsAddingCustom(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Banner Alert Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between transition-all duration-300 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-gray-400 hover:text-gray-600 text-xs px-2 py-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Rss className="w-5 h-5 text-orange-500" />
            مدیریت و پایش منابع خبری (Sources Hub)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            وضعیت لحظه‌ای و زنده اتصال منابع به پایگاه داده Cloudflare D1 و فیدهای RSS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="بروزرسانی وضعیت"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن منبع دلخواه</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 1. COINTELEGRAPH LIVE DATABASE STATUS CARD */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:border-orange-200 transition-all space-y-6">
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 font-black text-xl shadow-2xs">
              CT
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">Cointelegraph</h3>
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md font-bold">
                  کریپتو / بلاکچین
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                  EN
                </span>

                {/* LIVE D1 DATABASE STATUS BADGE */}
                {cointelegraphInDb ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    <Database className="w-3 h-3 text-emerald-600" />
                    ثبت در دیتابیس D1 (شناسه: #{cointelegraphInDb.id})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    ❌ در دیتابیس D1 ثبت نشده است
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                پیشروترین پایگاه خبری حوزه ارزهای دیجیتال و وب ۳ در جهان
              </p>
            </div>
          </div>

          {/* Quick External Link & D1 Query Status */}
          <div className="flex items-center gap-2">
            <a
              href="https://cointelegraph.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              title="مشاهده وب‌سایت اصلی"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ⚠️ NOT REGISTERED WARNING & INSTANT 1-CLICK INSERT BUTTON */}
        {!cointelegraphInDb && (
          <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-rose-900">
                  منبع Cointelegraph در جدول sources پایگاه داده D1 وجود ندارد!
                </p>
                <p className="text-rose-700 leading-relaxed">
                  احتمالاً به دلیل اجرای پاکسازی کامل از صفحه تنظیمات، رکوردهای جدول منابع حذف شده‌اند. تا زمانی که این منبع در دیتابیس ثبت نباشد، اسکرپر خودکار خبر جدیدی دریافت نخواهد کرد.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  handleInsertPresetSource({
                    name: 'Cointelegraph',
                    url: 'https://cointelegraph.com/rss',
                    category: 'crypto',
                    language: 'en',
                    description: 'پیشروترین پایگاه خبری حوزه ارزهای دیجیتال و وب ۳ در جهان',
                    tag: 'کریپتو',
                  })
                }
                disabled={actionLoading === 'insert-Cointelegraph'}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading === 'insert-Cointelegraph' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>➕ ثبت و فعال‌سازی فوری Cointelegraph در دیتابیس D1</span>
              </button>

              <button
                onClick={handleRestoreAllDefaults}
                disabled={actionLoading === 'restore-all'}
                className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-medium px-3 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>بازیابی کلیه منابع پیش‌فرض در D1</span>
              </button>
            </div>
          </div>
        )}

        {/* RSS URL and Live Connection Details */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-xs font-mono text-gray-700 truncate ltr">
                https://cointelegraph.com/rss
              </span>
            </div>

            {/* LIVE FEED STATUS BADGE */}
            <div className="flex items-center gap-2 shrink-0">
              {cointelegraphInDb ? (
                isCointelegraphActive ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    وضعیت پایش: فعال (Active)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    وضعیت پایش: غیرفعال (Paused)
                  </span>
                )
              ) : (
                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  غیرفعال (ثبت‌نشده در DB)
                </span>
              )}

              {/* LIVE PING TEST BUTTON */}
              <button
                onClick={() => handleTestFeedConnection('https://cointelegraph.com/rss')}
                disabled={isTestingFeed}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="تست زنده اتصال به سرور Cointelegraph"
              >
                <Activity className={`w-3 h-3 text-sky-600 ${isTestingFeed ? 'animate-spin' : ''}`} />
                <span>{isTestingFeed ? 'در حال تست...' : 'تست زنده فید RSS'}</span>
              </button>
            </div>
          </div>

          {/* Real-time Feed Test Result Output */}
          {feedTestResult && feedTestResult.tested && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                feedTestResult.valid
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedTestResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {feedTestResult.valid
                    ? `ارتباط زنده با فید برقرار است. عنوان: "${feedTestResult.feedTitle}" | تعداد ${feedTestResult.itemsFound} مقاله در فید آنلاین در دسترس است.`
                    : `خطا در دریافت فید زنده: ${feedTestResult.errorDetails}`}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {feedTestResult.timestamp}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Real-time Toggle Status Button */}
            {cointelegraphInDb ? (
              <button
                onClick={() => handleToggleStatus(cointelegraphInDb)}
                disabled={actionLoading === `toggle-${cointelegraphInDb.id}`}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                  isCointelegraphActive
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {isCointelegraphActive ? 'توقف پایش (غیرفعال‌سازی)' : 'فعال‌سازی پایش در دیتابیس'}
                </span>
              </button>
            ) : (
              <button
                onClick={() =>
                  handleInsertPresetSource({
                    name: 'Cointelegraph',
                    url: 'https://cointelegraph.com/rss',
                    category: 'crypto',
                    language: 'en',
                    description: 'پیشروترین پایگاه خبری حوزه ارزهای دیجیتال و وب ۳ در جهان',
                    tag: 'کریپتو',
                  })
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن و فعال‌سازی در D1</span>
              </button>
            )}

            <div className="text-[11px] text-gray-500 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {cointelegraphInDb
                  ? `سقف پایش: ${cointelegraphInDb.scrape_limit || 10} مقاله در هر اجرا`
                  : 'پایش غیرفعال'}
              </span>
            </div>
          </div>

          {/* Trigger Manual Scrape */}
          <button
            onClick={handleTriggerScrape}
            disabled={isScraping || loading || !cointelegraphInDb}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
            <span>
              {isScraping
                ? 'در حال پایش و دریافت...'
                : scrapeSuccessMsg || 'پایش دستی و دریافت اخبار جدید'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2. PRESET SOURCES REGISTRY & QUICK RESTORE HUB */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              بسته منابع پیشنهادی و بازیابی سریع در دیتابیس D1
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              با ۱ کلیک می‌توانید منابع معتبر حوزه کریپتو و فناوری را در پایگاه داده ثبت و آماده پایش کنید
            </p>
          </div>

          <button
            onClick={handleRestoreAllDefaults}
            disabled={actionLoading === 'restore-all'}
            className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>بازیابی همه منابع در D1</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {PRESET_SOURCES.map((preset) => {
            const inDb = sources.find((s) => cleanUrl(s.url) === cleanUrl(preset.url));
            const isActive = inDb && (inDb.is_active === 1 || inDb.is_active === true);

            return (
              <div
                key={preset.url}
                className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                  inDb
                    ? 'bg-slate-50/50 border-gray-200 hover:border-purple-200'
                    : 'bg-amber-50/30 border-dashed border-amber-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-gray-900">{preset.name}</span>
                    <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                      {preset.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400 mt-1 truncate ltr">
                    {preset.url}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px]">
                    {inDb ? (
                      isActive ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          فعال در D1
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          غیرفعال در D1
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400 font-medium flex items-center gap-1">
                        <Database className="w-3 h-3 text-gray-400" />
                        در دیتابیس نیست
                      </span>
                    )}
                  </div>

                  {inDb ? (
                    <button
                      onClick={() => handleToggleStatus(inDb)}
                      disabled={actionLoading === `toggle-${inDb.id}`}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-white border border-purple-200 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer shadow-2xs"
                    >
                      {isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInsertPresetSource(preset)}
                      disabled={actionLoading === `insert-${preset.name}`}
                      className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ثبت در دیتابیس</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 3. ADD CUSTOM SOURCE FORM (COLLAPSIBLE) */}
      {/* ========================================================================= */}
      {showAddForm && (
        <form
          onSubmit={handleAddCustomSubmit}
          className="bg-white border border-purple-200 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              افزودن منبع خبری جدید (RSS / Atom Feed)
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              بستن
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">نام منبع</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="مثال: CoinDesk یا Decrypt"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                دسته‌بندی موضوعی
              </label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
              >
                <option value="crypto">ارزهای دیجیتال و بلاکچین (Crypto)</option>
                <option value="ai">هوش مصنوعی و نوآوری (AI & Tech)</option>
                <option value="economy">اقتصاد و بازارهای مالی</option>
                <option value="general">عمومی</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                آدرس فید RSS / Atom (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/rss"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => customUrl && handleTestFeedConnection(customUrl)}
                  disabled={!customUrl.trim() || isTestingFeed}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Activity className="w-3 h-3 text-sky-600" />
                  <span>تست آدرس</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                سقف دریافت در هر پایش
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={customLimit}
                onChange={(e) => setCustomLimit(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isAddingCustom}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {isAddingCustom ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>ذخیره در پایگاه داده D1</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 🌟 4. ALL REGISTERED SOURCES IN DATABASE TABLE / LIST */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">
              لیست کلیه منابع ثبت‌شده در دیتابیس D1 ({sources.length} منبع)
            </h3>
          </div>
          <span className="text-[11px] text-gray-500">
            {sources.filter((s) => s.is_active === 1 || s.is_active === true).length} فعال /{' '}
            {sources.filter((s) => s.is_active === 0 || s.is_active === false).length} غیرفعال
          </span>
        </div>

        {sources.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mx-auto">
              <Database className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-700">هیچ منبعی در پایگاه داده ثبت نشده است</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              جدول sources در دیتابیس D1 خالی است. برای شروع پایش می‌توانید از دکمه «بازیابی همه منابع در D1» در بالای صفحه استفاده کنید.
            </p>
            <button
              onClick={handleRestoreAllDefaults}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>درج و بازیابی فوری منابع پیش‌فرض در D1</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sources.map((src) => {
              const isActive = src.is_active === 1 || src.is_active === true;
              return (
                <div
                  key={src.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 p-2.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-xs shrink-0">
                      #{src.id}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {src.name}
                        </span>
                        <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100">
                          {src.category || 'عمومی'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-500 truncate dir-ltr text-left max-w-md">
                        {src.url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Toggle Switch */}
                    <button
                      onClick={() => handleToggleStatus(src)}
                      disabled={actionLoading === `toggle-${src.id}`}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{isActive ? 'فعال' : 'غیرفعال'}</span>
                    </button>

                    {/* Test Ping */}
                    <button
                      onClick={() => handleTestFeedConnection(src.url)}
                      disabled={isTestingFeed}
                      className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border border-transparent hover:border-sky-100"
                      title="تست ارتباط فید"
                    >
                      <Activity className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Source */}
                    {onDeleteSource && (
                      <button
                        onClick={() => onDeleteSource(src.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        title="حذف منبع از دیتابیس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
