import React, { useState, useEffect } from 'react';
import {
  Zap,
  Power,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  FileText,
  Languages,
  Send,
  Camera,
  ExternalLink,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

export interface PipelineStepStatus {
  step: 'scrape' | 'extract' | 'translate' | 'wordpress' | 'telegram' | 'instagram';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  itemsProcessed: number;
  details?: string;
  error?: string;
}

export interface PipelineExecutionResult {
  success: boolean;
  startTime: string;
  endTime: string;
  durationMs: number;
  stats: {
    scrapedArticles: number;
    translatedArticles: number;
    wpPublishedArticles: number;
    telegramPublishedArticles: number;
    instagramPublishedArticles: number;
  };
  steps: PipelineStepStatus[];
  processedArticles: Array<{
    id: number;
    title: string;
    originalUrl: string;
    wpUrl?: string;
    wpPostId?: string;
    telegramMessageId?: string;
    instagramPostId?: string;
    featuredImage?: string;
  }>;
  error: string | null;
}

interface AutopilotMasterSwitchProps {
  onRefreshAll?: () => void;
}

export const AutopilotMasterSwitch: React.FC<AutopilotMasterSwitchProps> = ({ onRefreshAll }) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [latestRun, setLatestRun] = useState<PipelineExecutionResult | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Autopilot Status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/autopilot/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setIsActive(json.data.isActive);
          setIsRunning(json.data.isRunning);
          if (json.data.latestRun) {
            setLatestRun(json.data.latestRun);
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching autopilot status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 8000);
    return () => clearInterval(timer);
  }, []);

  // Handle Master ON/OFF Toggle
  const handleToggle = async () => {
    setIsToggling(true);
    const targetState = !isActive;
    try {
      const res = await fetch('/api/autopilot/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: targetState }),
      });
      const json = await res.json();
      if (json.success) {
        setIsActive(targetState);
        setActionFeedback({
          type: 'success',
          text: targetState
            ? 'سیستم اتوپایلوت فعال شد: پایش، دریافت متن کامل، ترجمه و توزیع خودکار روشن است.'
            : 'سیستم اتوپایلوت خاموش شد: پایش خودکار موقتاً متوقف گردید.',
        });
      } else {
        setActionFeedback({ type: 'error', text: json.error || 'خطا در تغییر وضعیت اتوپایلوت' });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', text: e.message });
    } finally {
      setIsToggling(false);
    }
  };

  // Handle Run Pipeline Right Now
  const handleRunNow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActionFeedback({
      type: 'success',
      text: 'در حال اجرای کامل چرخه: دریافت RSS، استخراج متن کامل، ترجمه هوش مصنوعی، انتشار در وردپرس، ارسال به تلگرام با تصویر و پست اینستاگرام...',
    });

    try {
      const res = await fetch('/api/autopilot/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLatestRun(json.data);
        setActionFeedback({
          type: 'success',
          text: `چرخه خودکار با موفقیت انجام شد: ${json.data.stats.scrapedArticles} دریافت | ${json.data.stats.translatedArticles} ترجمه | ${json.data.stats.wpPublishedArticles} وردپرس | ${json.data.stats.telegramPublishedArticles} تلگرام (با عکس شاخص) | ${json.data.stats.instagramPublishedArticles} اینستاگرام`,
        });
        if (onRefreshAll) onRefreshAll();
      } else {
        setActionFeedback({ type: 'error', text: json.error || 'خطا در اجرای چرخه خودکار' });
      }
    } catch (e: any) {
      setActionFeedback({ type: 'error', text: e.message || 'خطا در ارتباط با سرور' });
    } finally {
      setIsRunning(false);
      fetchStatus();
    }
  };

  return (
    <div id="autopilot-master-panel" className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-2xl border border-indigo-500/30 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
        isActive ? 'bg-emerald-500/15' : 'bg-rose-500/10'
      }`} />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header and Controls Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left info box */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`p-3 rounded-2xl border transition-all ${
              isActive 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Zap className={`w-7 h-7 ${isActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  اتوپایلوت هوشمند «هزاردستان»
                </h2>
                <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  {isActive ? 'سیستم خودکار روشن است (ACTIVE)' : 'سیستم خاموش (OFF)'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                چرخه کامل خودکار: پایش و استخراج متن کامل اخبار جدید ➔ ترجمه و سئو با AI ➔ انتشار در وب‌سایت وردپرس ➔ انتشار در تلگرام همراه با تصویر شاخص و لینک سایت ➔ آماده‌سازی و ارسال به اینستاگرام.
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Switchers */}
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap shrink-0">
          {/* Big Interactive Toggle Switch */}
          <div className="flex items-center gap-3 bg-slate-850/90 p-2 pl-3 rounded-2xl border border-slate-700/80 shadow-inner">
            <span className="text-xs font-bold text-slate-300 hidden sm:inline">
              {isActive ? 'وضعیت: روشن' : 'وضعیت: خاموش'}
            </span>
            <button
              id="autopilot-toggle-switch"
              onClick={handleToggle}
              disabled={isToggling}
              type="button"
              className={`relative inline-flex h-12 w-24 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isActive ? 'bg-emerald-600' : 'bg-slate-700'
              } disabled:opacity-50`}
              aria-label="تغییر وضعیت اتوپایلوت"
            >
              <span
                className={`pointer-events-none inline-block h-11 w-11 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                  isActive ? '-translate-x-12 text-emerald-600' : 'translate-x-0 text-slate-500'
                }`}
              >
                <Power className="w-5 h-5" />
              </span>
            </button>
          </div>

          {/* Big Run Now Button */}
          <button
            id="autopilot-run-now-btn"
            onClick={handleRunNow}
            disabled={isRunning}
            className={`px-5 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2.5 transition-all shadow-xl min-h-[50px] cursor-pointer ${
              isRunning
                ? 'bg-amber-600 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>در حال اجرای چرخه کامل...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>اجرای چرخه کامل همین الان</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Feedback Notification */}
      {actionFeedback && (
        <div className={`mt-5 p-4 rounded-2xl text-xs sm:text-sm flex items-start justify-between border transition-all ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-950/70 text-emerald-200 border-emerald-500/40'
            : 'bg-rose-950/70 text-rose-200 border-rose-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="font-medium leading-relaxed">{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white px-2 text-lg">
            &times;
          </button>
        </div>
      )}

      {/* 5-Step Pipeline Visualizer */}
      <div className="mt-6 pt-5 border-t border-slate-700/60">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">
              مراحل ۵ گانه فرآیند خودکار (Auto Pipeline Steps):
            </span>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
          >
            <span>{showDetails ? 'بستن جزئیات آخرین اجرا' : 'نمایش جزئیات آخرین اجرا'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Pipeline Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Step 1: Discover & Scrape */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                گام ۱: پایش RSS
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">بررسی اخبار جدید</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              پایش لحظه‌ای منابع (Cointelegraph و ...) و کشف جدیدترین مقالات.
            </p>
          </div>

          {/* Step 2: Full Content & Media Extract */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                گام ۲: متن و عکس
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">استخراج متن کامل</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              دریافت بدنه کامل صفحه وب و ذخیره تصاویر شاخص در D1 Primary.
            </p>
          </div>

          {/* Step 3: Sequential AI Translation */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Languages className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                گام ۳: ترجمه سئو
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">ترجمه هوش مصنوعی</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              ترجمه تخصصی و روان به فارسی + برچسب‌ها و متادیسکریپشن به ترتیب.
            </p>
          </div>

          {/* Step 4: WordPress Site Publish */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                گام ۴: سایت وردپرس
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">انتشار روی وب‌سایت</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              آپلود تصویر شاخص در رسانه وردپرس و انتشار با دسته‌بندی و سئو.
            </p>
          </div>

          {/* Step 5: Telegram & Instagram Distribution */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 space-y-1.5 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-pink-500/20 text-pink-400 rounded-xl">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                گام ۵: تلگرام و سوشال
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-100">تلگرام (با عکس) + اینستا</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              ارسال پست به کانال تلگرام همراه با عکس شاخص و لینک سایت + اینستاگرام.
            </p>
          </div>
        </div>
      </div>

      {/* Latest Execution Report Section */}
      {showDetails && latestRun && (
        <div className="mt-5 p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-bold">آخرین چرخه خودکار اجرا شده:</span>
              <span className="text-emerald-300 font-mono">
                {latestRun.durationMs ? `${(latestRun.durationMs / 1000).toFixed(1)} ثانیه` : 'موفق'}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="bg-blue-900/60 text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-700/50">
                دریافت: {latestRun.stats.scrapedArticles}
              </span>
              <span className="bg-indigo-900/60 text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-700/50">
                ترجمه: {latestRun.stats.translatedArticles}
              </span>
              <span className="bg-purple-900/60 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-700/50">
                سایت: {latestRun.stats.wpPublishedArticles}
              </span>
              <span className="bg-emerald-900/60 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-700/50">
                تلگرام (با عکس): {latestRun.stats.telegramPublishedArticles}
              </span>
              <span className="bg-pink-900/60 text-pink-300 px-2.5 py-0.5 rounded-md border border-pink-700/50">
                اینستاگرام: {latestRun.stats.instagramPublishedArticles}
              </span>
            </div>
          </div>

          {/* Processed Articles Table */}
          {latestRun.processedArticles && latestRun.processedArticles.length > 0 && (
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700 text-[11px]">
                    <th className="pb-2 font-medium">عنوان خبر ترجمه شده</th>
                    <th className="pb-2 font-medium">تصویر شاخص</th>
                    <th className="pb-2 font-medium">لینک وب‌سایت</th>
                    <th className="pb-2 font-medium">تلگرام</th>
                    <th className="pb-2 font-medium">اینستاگرام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {latestRun.processedArticles.map((art, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30">
                      <td className="py-2.5 font-bold text-slate-100 truncate max-w-xs">
                        {art.title}
                      </td>
                      <td className="py-2.5">
                        {art.featuredImage ? (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            شامل عکس شاخص ✓
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">متنی</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {art.wpUrl ? (
                          <a
                            href={art.wpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-300 hover:text-purple-200 flex items-center gap-1 font-mono text-[11px] underline"
                          >
                            <span>پست #{art.wpPostId || art.id}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {art.telegramMessageId ? `پیام #${art.telegramMessageId}` : 'ارسال شد'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-pink-400 font-bold flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          آماده / منتشر
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
