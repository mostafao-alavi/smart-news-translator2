import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Terminal,
  RefreshCw,
  Sparkles,
  Clock,
  Database,
  Cpu,
  Code2,
  Copy,
  Check,
  Eye,
  Server,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Bot,
  Activity,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  FileSpreadsheet,
  Search,
  Download,
  Filter,
  Radio,
  Layers
} from 'lucide-react';
import { WorkerFileInfo, ExecutionLogItem, SystemEventItem } from '../types/client';

export const AI_MODELS = [
  {
    id: '@cf/meta/m2m100-1.2b',
    name: 'M2M100 1.2B',
    provider: 'Cloudflare Workers AI',
    desc: 'مدل تخصصی ترجمه چندزبانه (سریع و بهینه)',
    badge: 'پیش‌فرض',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'Meta / Workers AI',
    desc: 'مدل زبان قدرتمند (لحن ادبی، روان و ترجمه مفهومی)',
    badge: 'کیفیت بالا',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google AI API',
    desc: 'موتور هوش مصنوعی گوگل (ترجمه هوشمند و فوق سریع)',
    badge: 'گوگل AI',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    id: '@cf/meta/llama-3-8b-instruct',
    name: 'Llama 3 8B Instruct',
    provider: 'Meta / Workers AI',
    desc: 'نسخه استاندارد مدل Llama 3',
    badge: 'استاندارد',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.1',
    name: 'Mistral 7B Instruct',
    provider: 'Mistral AI',
    desc: 'مدل ترجمه هوشمند اروپایی',
    badge: 'پیشرفته',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: '@cf/qwen/qwen1.5-7b-chat',
    name: 'Qwen 1.5 7B Chat',
    provider: 'Alibaba AI',
    desc: 'مدل زبان قدرتمند با پشتیبانی گسترده زبان‌های شرقی',
    badge: 'چندزبانه',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
];

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/news', title: 'اخبار و ترجمه‌ها', desc: 'دریافت لیست ۵۰ خبر اخیر به همراه وضعیت ترجمه D1' },
  { method: 'GET', path: '/api/sources', title: 'فهرست منابع RSS', desc: 'دریافت منابع ثبت شده در جدول sources' },
  { method: 'GET', path: '/api/stats', title: 'آمار کلی دیتابیس D1', desc: 'تعداد اخبار، ترجمه‌ها و وضعیت اتصال سرور' },
  { method: 'GET', path: '/api/logs', title: 'تاریخچه لاگ‌ها و رویدادهای D1', desc: 'دریافت لاگ‌های اجرای چرخه‌ها و Audit events' },
  { method: 'GET', path: '/api/health', title: 'بررسی سلامت سرور', desc: 'تست اتصال Cloudflare Worker و D1 Engine' },
  { method: 'POST', path: '/api/trigger-scraper', title: 'اجرای خودکار Scraper', desc: 'اسکرپ فیدها و افزودن اخبار جدید به D1' },
  { method: 'POST', path: '/api/trigger-translator', title: 'اجرای خودکار Translator', desc: 'ترجمه اخبار pending با Workers AI' },
  { method: 'POST', path: '/api/trigger-wp-sync', title: 'انتشار در وردپرس (WP Publisher)', desc: 'انتشار مقالات ترجمه‌شده در سایت وردپرسی updaaate.ir' },
  { method: 'POST', path: '/api/wp-sync/test-connection', title: 'تست اتصال به وردپرس', desc: 'بررسی نام کاربری و Application Password وردپرس' },
  { method: 'POST', path: '/api/prune-d1', title: 'پاکسازی D1 (Garbage Collection)', desc: 'حذف متن سنگین اخبار قدیمی‌تر از ۷ روز جهت نگهداری زیر ۵۰۰MB' },
  { method: 'POST', path: '/api/database/reset', title: 'پاکسازی کلی دیتابیس (Full Database Purge)', desc: 'حذف منابع خبری، اخبار، ترجمه‌ها و لاگ‌های ثبت‌شده در D1' },
  { method: 'POST', path: '/api/clear-cache', title: 'پاکسازی کش سیستم (Clear Cache)', desc: 'پاکسازی کش هدرها، پاسخ‌های HTTP سرور و تنظیم مجدد حافظه موقت' },
];

interface SettingsTabProps {
  onTriggerScraper: () => Promise<any>;
  onTriggerTranslator: () => Promise<any>;
  onResetDatabase?: (options: any) => Promise<any>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  workerFiles: WorkerFileInfo[];
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onTriggerScraper,
  onTriggerTranslator,
  onResetDatabase,
  isTriggeringScraper,
  isTriggeringTranslator,
  workerFiles,
}) => {
  const [logs, setLogs] = useState<string[]>([
    `[System] Cloudflare Worker Cron Engine initialized with schedule: "0 * * * *" (Every 1 hour).`,
    `[Ready] Workers AI bindings & D1 connection verified. Ready for manual triggers.`,
  ]);

  const [lastScraperResult, setLastScraperResult] = useState<any>(null);
  const [lastTranslatorResult, setLastTranslatorResult] = useState<any>(null);
  const [isPruning, setIsPruning] = useState<boolean>(false);

  // Full & Granular Database Reset State
  const [resetOptions, setResetOptions] = useState({
    clearSources: false,
    clearArticles: false,
    clearApprovedTranslations: false,
    clearPendingTranslations: false,
    clearLogs: false,
  });
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Console Log Debugging & Optimization State
  const [logFilter, setLogFilter] = useState<'all' | 'errors' | 'success' | 'routines'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [copiedConsoleLogs, setCopiedConsoleLogs] = useState<boolean>(false);
  const [autoScrollLogs, setAutoScrollLogs] = useState<boolean>(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Execution Logs and System Events from D1
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogItem[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEventItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // API Tester Modal State
  const [activeApiModal, setActiveApiModal] = useState<string | null>(null);
  const [apiResponseJson, setApiResponseJson] = useState<string | null>(null);
  const [loadingApi, setLoadingApi] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Code Viewer State inside Settings
  const [showCodeViewer, setShowCodeViewer] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<string>('src/api/routes.ts');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState<boolean>(false);

  useEffect(() => {
    if (autoScrollLogs && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScrollLogs]);

  const fetchD1Logs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success && json.data) {
            setExecutionLogs(json.data.execution_logs || []);
            setSystemEvents(json.data.system_events || []);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchD1Logs();
  }, []);

  const handleClearD1Logs = async () => {
    if (!confirm('آیا از پاکسازی تمامی لاگ‌ها و رویدادهای ثبت‌شده در دیتابیس D1 اطمینان دارید؟')) return;
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        fetchD1Logs();
      }
    } catch (e) {
      console.error('Error clearing logs:', e);
    }
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString('fa-IR')}] ${msg}`, ...prev]);
  };

  const handleCopyConsoleLogs = () => {
    const text = logs.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedConsoleLogs(true);
    setTimeout(() => setCopiedConsoleLogs(false), 2000);
  };

  const handleDownloadConsoleLogs = () => {
    const text = logs.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-console-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = logSearchQuery ? log.toLowerCase().includes(logSearchQuery.toLowerCase()) : true;
    if (!matchesSearch) return false;

    if (logFilter === 'errors') return log.includes('❌') || log.toLowerCase().includes('error') || log.toLowerCase().includes('fail');
    if (logFilter === 'success') return log.includes('✅') || log.toLowerCase().includes('success');
    if (logFilter === 'routines') return log.includes('🚀') || log.includes('🤖') || log.includes('🧹') || log.includes('⚠️');
    return true;
  });

  const handleRunScraper = async () => {
    addLog('🚀 Starting manual execution of scraper(env)...');
    try {
      const res = await onTriggerScraper();
      setLastScraperResult(res);
      addLog(`✅ Scraper execution finished successfully.`);
      addLog(`📊 Scraped Sources: ${res?.scrapedSources ?? 0}, New Articles Inserted: ${res?.insertedArticles ?? 0}`);
      fetchD1Logs();
    } catch (err: any) {
      addLog(`❌ Scraper execution failed: ${err.message}`);
    }
  };

  const handleRunTranslator = async () => {
    addLog('🤖 Starting manual execution of translator(env)...');
    try {
      const res = await onTriggerTranslator();
      setLastTranslatorResult(res);
      addLog(`✅ Translator execution finished successfully.`);
      addLog(`📊 Articles Processed: ${res?.processed ?? 0}, Successfully Translated: ${res?.successCount ?? 0}`);
      fetchD1Logs();
    } catch (err: any) {
      addLog(`❌ Translator execution failed: ${err.message}`);
    }
  };

  const handleRunD1Prune = async () => {
    addLog('🧹 Starting D1 Garbage Collection (Prune articles older than 7 days)...');
    setIsPruning(true);
    try {
      const res = await fetch('/api/prune-d1', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        addLog(`✅ D1 Garbage collection completed.`);
        addLog(`📊 ${json.data?.message || 'پایان پاکسازی داده‌های D1'}`);
      } else {
        addLog(`❌ D1 Pruning failed: ${json.error}`);
      }
      fetchD1Logs();
    } catch (err: any) {
      addLog(`❌ D1 Pruning error: ${err.message}`);
    } finally {
      setIsPruning(false);
    }
  };

  // Direct single reset for one specific category
  const handleSingleQuickReset = async (
    key: 'clearSources' | 'clearArticles' | 'clearApprovedTranslations' | 'clearPendingTranslations' | 'clearLogs',
    title: string
  ) => {
    if (!confirm(`آیا از پاکسازی مستقیم داده‌های "${title}" اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`)) return;
    setIsResetting(true);
    setResetSuccessMessage(null);
    addLog(`⚠️ Performing quick purge for: ${title}...`);

    const options = {
      clearSources: key === 'clearSources',
      clearArticles: key === 'clearArticles',
      clearApprovedTranslations: key === 'clearApprovedTranslations',
      clearPendingTranslations: key === 'clearPendingTranslations',
      clearLogs: key === 'clearLogs',
    };

    try {
      let res;
      if (onResetDatabase) {
        res = await onResetDatabase(options);
      } else {
        const response = await fetch('/api/database/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        });
        const json = await response.json();
        if (json.success) res = json.data;
      }

      if (res) {
        addLog(`✅ Quick purge completed for "${title}".`);
        setResetSuccessMessage(`بخش "${title}" با موفقیت از دیتابیس پاکسازی گردید.`);
        fetchD1Logs();
      } else {
        addLog(`❌ Quick purge failed for "${title}".`);
      }
    } catch (err: any) {
      addLog(`❌ Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteReset = async (reseed: boolean = false) => {
    setIsResetting(true);
    setResetSuccessMessage(null);
    addLog(`⚠️ Performing Database Purge... (Sources: ${resetOptions.clearSources}, Articles: ${resetOptions.clearArticles}, Approved: ${resetOptions.clearApprovedTranslations}, Pending: ${resetOptions.clearPendingTranslations}, Logs: ${resetOptions.clearLogs}, Reseed: ${reseed})`);

    try {
      let res;
      if (onResetDatabase) {
        res = await onResetDatabase({
          clearSources: resetOptions.clearSources,
          clearArticles: resetOptions.clearArticles,
          clearApprovedTranslations: resetOptions.clearApprovedTranslations,
          clearPendingTranslations: resetOptions.clearPendingTranslations,
          clearLogs: resetOptions.clearLogs,
          reseed,
        });
      } else {
        const response = await fetch('/api/database/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clearSources: resetOptions.clearSources,
            clearArticles: resetOptions.clearArticles,
            clearApprovedTranslations: resetOptions.clearApprovedTranslations,
            clearPendingTranslations: resetOptions.clearPendingTranslations,
            clearLogs: resetOptions.clearLogs,
            reseed,
          }),
        });
        const json = await response.json();
        if (json.success) res = json.data;
      }

      if (res) {
        addLog(`✅ Database purge completed successfully.`);
        setResetSuccessMessage('حذف و پاکسازی بخش‌های انتخاب‌شده از دیتابیس D1 با موفقیت انجام شد.');
        fetchD1Logs();
      } else {
        addLog(`❌ Database purge failed.`);
      }
    } catch (err: any) {
      addLog(`❌ Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
      setShowResetConfirmModal(false);
    }
  };

  const handleTestEndpointInModal = async (path: string, method: string) => {
    setActiveApiModal(path);
    setApiResponseJson(null);
    setLoadingApi(true);

    try {
      const res = await fetch(path, { method });
      const json = await res.json();
      setApiResponseJson(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiResponseJson(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoadingApi(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const loadWorkerFile = async (filename: string) => {
    setSelectedFile(filename);
    setLoadingCode(true);
    try {
      const response = await fetch(`/api/worker-file-content?path=${encodeURIComponent(filename)}`);
      const data = await response.json();
      if (data.success) {
        setFileContent(data.data.content);
      } else {
        setFileContent('// خطا در دریافت محتوای فایل');
      }
    } catch (e) {
      setFileContent('// خطا در ارتباط با سرور');
    } finally {
      setLoadingCode(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Scheduled Pipeline Trigger Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 ">
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-orange-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>کنترل و اجرای چرخه‌های خودکار</span>
                <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded font-medium border border-orange-200">
                  چرخه منظم: هر ۱ ساعت
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                توابع پایش و ترجمه به صورت خودکار و ساعتی فعال هستند. جهت تست فوری می‌توانید چرخه‌ها را به‌صورت دستی اجرا نمایید.
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await handleRunScraper();
              await handleRunTranslator();
            }}
            disabled={isTriggeringScraper || isTriggeringTranslator}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 justify-center  shrink-0 disabled:opacity-50 shadow-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>اجرای کامل چرخه دریافت و ترجمه</span>
          </button>
        </div>

        {/* Action Trigger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Scraper Routine */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-xs font-bold text-sky-700 flex items-center gap-2.5">
                <Database className="w-4 h-4" />
                ۱. دریافت اخبار جدید
              </span>
              <span className="text-[10px] text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                پایشگر فیدها
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              استخراج اخبار جدید از منابع ثبت‌شده و افزودن به صف پردازش.
            </p>

            <div className="pt-2 flex items-center gap-2 justify-between">
              <button
                onClick={handleRunScraper}
                disabled={isTriggeringScraper}
                className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2  disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isTriggeringScraper ? 'animate-spin' : ''}`} />
                <span>{isTriggeringScraper ? 'در حال پایش...' : 'اجرای دستی پایش'}</span>
              </button>

              {lastScraperResult && (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  +{lastScraperResult.insertedArticles ?? 0} خبر جدید
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Translator Routine */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-xs font-bold text-orange-700 flex items-center gap-2.5">
                <Cpu className="w-4 h-4" />
                ۲. ترجمه هوشمند اخبار
              </span>
              <span className="text-[10px] text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded border border-orange-200 font-medium">
                موتور هوش مصنوعی
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              پردازش متون خبری موجود در صف و ترجمه به زبان فارسی.
            </p>

            <div className="pt-2 flex items-center gap-2 justify-between">
              <button
                onClick={handleRunTranslator}
                disabled={isTriggeringTranslator}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2  disabled:opacity-50 shadow-2xs"
              >
                <Sparkles className={`w-3.5 h-3.5 text-orange-600 ${isTriggeringTranslator ? 'animate-pulse' : ''}`} />
                <span>{isTriggeringTranslator ? 'در حال ترجمه...' : 'اجرای دستی ترجمه'}</span>
              </button>

              {lastTranslatorResult && (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {lastTranslatorResult.successCount ?? 0} ترجمه موفق
                </span>
              )}
            </div>
          </div>

          {/* Card 3: D1 Garbage Collection (Prune old text > 7 days) */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                ۳. نگهداری هوشمند D1
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                نگهداشت حافظه &lt;500MB
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              حذف متن سنگین اخبار قدیمی‌تر از ۷ روز جهت جلوگیری از پر شدن دیتابیس D1.
            </p>

            <div className="pt-2 flex items-center gap-2 justify-between">
              <button
                onClick={handleRunD1Prune}
                disabled={isPruning}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-2  disabled:opacity-50 shadow-2xs"
              >
                <Trash2 className={`w-3.5 h-3.5 text-emerald-600 ${isPruning ? 'animate-spin' : ''}`} />
                <span>{isPruning ? 'در حال پاکسازی...' : 'اجرای پاکسازی D1'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Database Purge & Complete Reset Panel */}
        <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-5 shadow-xs space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>پاکسازی و بازنشانی دیتابیس D1</span>
                  <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded font-medium border border-rose-200">
                    کلیدهای تفکیک‌شده
                  </span>
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  امکان پاکسازی جداگانه و مستقیم هر یک از داده‌ها شامل منابع خبری، کل اخبار، ترجمه‌های موفق و در صف پردازش
                </p>
              </div>
            </div>
          </div>

          {resetSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
              <button
                onClick={() => setResetSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Granular Cards with Direct Reset Buttons & Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Sources */}
            <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              resetOptions.clearSources ? 'bg-white border-rose-300 shadow-2xs ring-1 ring-rose-200' : 'bg-white/80 border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetOptions.clearSources}
                    onChange={(e) => setResetOptions({ ...resetOptions, clearSources: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">منابع خبری</div>
                    <div className="text-[10px] text-gray-500">جدول sources (RSS)</div>
                  </div>
                </label>
                <Radio className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              </div>
              <button
                onClick={() => handleSingleQuickReset('clearSources', 'منابع خبری')}
                disabled={isResetting}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف منابع خبری</span>
              </button>
            </div>

            {/* 2. All News / Articles */}
            <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              resetOptions.clearArticles ? 'bg-white border-rose-300 shadow-2xs ring-1 ring-rose-200' : 'bg-white/80 border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetOptions.clearArticles}
                    onChange={(e) => setResetOptions({ ...resetOptions, clearArticles: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">کل اخبار</div>
                    <div className="text-[10px] text-gray-500">جدول articles</div>
                  </div>
                </label>
                <FileSpreadsheet className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              </div>
              <button
                onClick={() => handleSingleQuickReset('clearArticles', 'کل اخبار')}
                disabled={isResetting}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف کل اخبار</span>
              </button>
            </div>

            {/* 3. Approved Translations */}
            <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              resetOptions.clearApprovedTranslations ? 'bg-white border-rose-300 shadow-2xs ring-1 ring-rose-200' : 'bg-white/80 border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetOptions.clearApprovedTranslations}
                    onChange={(e) => setResetOptions({ ...resetOptions, clearApprovedTranslations: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-800">ترجمه‌های موفق</div>
                    <div className="text-[10px] text-emerald-600">approved translations</div>
                  </div>
                </label>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              </div>
              <button
                onClick={() => handleSingleQuickReset('clearApprovedTranslations', 'ترجمه‌های موفق')}
                disabled={isResetting}
                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3 text-emerald-600" />
                <span>حذف ترجمه‌های موفق</span>
              </button>
            </div>

            {/* 4. Pending Queue */}
            <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              resetOptions.clearPendingTranslations ? 'bg-white border-rose-300 shadow-2xs ring-1 ring-rose-200' : 'bg-white/80 border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetOptions.clearPendingTranslations}
                    onChange={(e) => setResetOptions({ ...resetOptions, clearPendingTranslations: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-amber-800">در صف پردازش</div>
                    <div className="text-[10px] text-amber-600">pending translations</div>
                  </div>
                </label>
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              </div>
              <button
                onClick={() => handleSingleQuickReset('clearPendingTranslations', 'در صف پردازش')}
                disabled={isResetting}
                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3 text-amber-600" />
                <span>حذف صف پردازش</span>
              </button>
            </div>

            {/* 5. Logs & System Events */}
            <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
              resetOptions.clearLogs ? 'bg-white border-rose-300 shadow-2xs ring-1 ring-rose-200' : 'bg-white/80 border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetOptions.clearLogs}
                    onChange={(e) => setResetOptions({ ...resetOptions, clearLogs: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">لاگ‌ها و رویدادها</div>
                    <div className="text-[10px] text-gray-500">execution_logs</div>
                  </div>
                </label>
                <History className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              </div>
              <button
                onClick={() => handleSingleQuickReset('clearLogs', 'لاگ‌ها و رویدادهای سیستم')}
                disabled={isResetting}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف لاگ‌های سیستم</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-rose-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>انتخاب سریع:</span>
              <button
                onClick={() => setResetOptions({ clearSources: true, clearArticles: true, clearApprovedTranslations: true, clearPendingTranslations: true, clearLogs: true })}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium underline cursor-pointer"
              >
                انتخاب همه ۵ مورد
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => setResetOptions({ clearSources: false, clearArticles: false, clearApprovedTranslations: true, clearPendingTranslations: true, clearLogs: false })}
                className="text-[11px] text-gray-600 hover:text-gray-900 underline cursor-pointer"
              >
                فقط ترجمه‌ها (موفق + صف)
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => setResetOptions({ clearSources: false, clearArticles: false, clearApprovedTranslations: false, clearPendingTranslations: false, clearLogs: false })}
                className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
              >
                لغو همه انتخاب‌ها
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExecuteReset(true)}
                disabled={isResetting}
                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs px-3.5 py-2 rounded-xl font-medium transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${isResetting ? 'animate-spin' : ''}`} />
                <span>پاکسازی و بازنشانی نمونه اولیه</span>
              </button>

              <button
                onClick={() => setShowResetConfirmModal(true)}
                disabled={isResetting || (!resetOptions.clearSources && !resetOptions.clearArticles && !resetOptions.clearApprovedTranslations && !resetOptions.clearPendingTranslations && !resetOptions.clearLogs)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>پاکسازی گروهی موارد انتخاب شده</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced & Optimized Live Console Output Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mt-5 shadow-lg">
          <div className="bg-gray-800/95 px-4 py-3 border-b border-gray-700/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Terminal className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-100 font-mono">
                    کنسول لاگ‌های زنده سیستم (System Console Debugger)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    زنده - فعال
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                  {logs.length} رویداد ثبت شده در حافظه | نمایش: {filteredLogs.length} لاگ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در لاگ‌ها..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="bg-gray-950 border border-gray-700 text-gray-200 text-xs pr-8 pl-3 py-1 rounded-lg w-36 sm:w-48 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
                {logSearchQuery && (
                  <button
                    onClick={() => setLogSearchQuery('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleCopyConsoleLogs}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="کپی لاگ‌ها در حافظه"
              >
                {copiedConsoleLogs ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>کپی</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadConsoleLogs}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="دانلود فایل log"
              >
                <Download className="w-3 h-3" />
                <span>دانلود</span>
              </button>

              <button
                onClick={() => setLogs([])}
                className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="پاکسازی کنسول"
              >
                <X className="w-3 h-3" />
                <span>پاکسازی</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-gray-950/80 px-4 py-1.5 border-b border-gray-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-gray-500 text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3" /> فیلتر:
            </span>
            <button
              onClick={() => setLogFilter('all')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                logFilter === 'all' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              همه ({logs.length})
            </button>
            <button
              onClick={() => setLogFilter('errors')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                logFilter === 'errors' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              خطاها ❌ ({logs.filter(l => l.includes('❌') || l.toLowerCase().includes('error')).length})
            </button>
            <button
              onClick={() => setLogFilter('success')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                logFilter === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              موفق ✅ ({logs.filter(l => l.includes('✅')).length})
            </button>
            <button
              onClick={() => setLogFilter('routines')}
              className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                logFilter === 'routines' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              عملیات 🚀 ({logs.filter(l => l.includes('🚀') || l.includes('🤖') || l.includes('🧹') || l.includes('⚠️')).length})
            </button>

            <div className="mr-auto flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoScrollLogs}
                  onChange={(e) => setAutoScrollLogs(e.target.checked)}
                  className="w-3 h-3 text-emerald-500 rounded border-gray-700 bg-gray-900 focus:ring-emerald-500"
                />
                <span>اسکرول خودکار</span>
              </label>
            </div>
          </div>

          {/* Console Output Area */}
          <div className="p-4 font-mono text-xs text-gray-300 space-y-1 max-h-64 overflow-y-auto ltr text-left bg-gray-950/90 leading-relaxed selection:bg-emerald-900 selection:text-emerald-100">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-600 italic py-6 text-center text-xs">
                {logSearchQuery ? 'هیچ لاگی منطبق با واژه جستجو یافته نشد.' : 'هیچ رویدادی در این فیلتر ثبت نشده است.'}
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 py-0.5 px-1.5 rounded transition-colors hover:bg-gray-800/40 ${
                    log.includes('❌')
                      ? 'text-rose-400 bg-rose-950/20 border-l-2 border-rose-500 pl-2'
                      : log.includes('✅')
                      ? 'text-emerald-400'
                      : log.includes('🚀') || log.includes('🤖') || log.includes('🧹')
                      ? 'text-amber-300 font-semibold'
                      : log.includes('⚠️')
                      ? 'text-amber-400'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-gray-600 text-[10px] select-none w-6 shrink-0 text-right font-mono opacity-60">
                    {index + 1}
                  </span>
                  <span className="break-all whitespace-pre-wrap flex-1">{log}</span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>

      {/* 2. System Execution Logs & History Inspector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 ">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>پایش لاگ‌های اجرایی و رویدادهای سیستم</span>
                <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded font-medium border border-indigo-200">
                  گزارش عملکرد و پایش
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                گزارش متمرکز چرخه‌های پردازش، اجراهای دستی، زمان اجرا و رویدادهای ثبت‌شده در دیتابیس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchD1Logs}
              disabled={loadingLogs}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>به‌روزرسانی لاگ‌ها</span>
            </button>
            {executionLogs.length > 0 && (
              <button
                onClick={handleClearD1Logs}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی لاگ‌ها</span>
              </button>
            )}
          </div>
        </div>

        {/* Execution Logs Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-between">
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>آخرین لاگ‌های اجرایی سیستم</span>
            </h4>
            <span className="text-[11px] text-gray-500 font-mono">
              تعداد: {executionLogs.length} رکورد
            </span>
          </div>

          {executionLogs.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-500">
              هنوز لاگ اجرایی ثبت نشده است. با اجرای دستی اسکرپ یا ترجمه، لاگ‌های لایو در اینجا ظاهر می‌شوند.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs">
              <table className="w-full text-start text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5">نوع عملیات</th>
                    <th className="px-3.5 py-2.5">وضعیت</th>
                    <th className="px-3.5 py-2.5">موفق / پردازش</th>
                    <th className="px-3.5 py-2.5">مدت زمان</th>
                    <th className="px-3.5 py-2.5">تاریخ و زمان</th>
                    <th className="px-3.5 py-2.5">توضیحات و خطا</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {executionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-3.5 py-2 font-mono font-bold text-gray-900 text-[11px]">
                        {log.task_type}
                      </td>
                      <td className="px-3.5 py-2">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            موفق
                          </span>
                        ) : log.status === 'partial' ? (
                          <span className="inline-flex items-center gap-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            جزئی
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            ناموفق
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-gray-700">
                        {log.items_success} از {log.items_processed}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-gray-500 text-[11px]">
                        {log.duration_ms} ms
                      </td>
                      <td className="px-3.5 py-2 font-mono text-gray-500 text-[11px]">
                        {log.executed_at ? new Date(log.executed_at).toLocaleString('fa-IR') : '-'}
                      </td>
                      <td className="px-3.5 py-2 text-gray-600 text-[11px] max-w-xs truncate">
                        {log.error_message ? (
                          <span className="text-rose-600 font-mono" title={log.error_message}>
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">بدون خطا</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Events & Schema Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Audit Events */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2.5">
              <History className="w-4 h-4 text-purple-600" />
              <span>رویدادهای سیستم (System Audit Events)</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {systemEvents.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">رویدادی ثبت نشده است.</p>
              ) : (
                systemEvents.map((evt) => (
                  <div key={evt.id} className="bg-white border border-gray-200/80 rounded-lg p-2 text-xs flex items-center gap-2 justify-between">
                    <div>
                      <span className="font-bold text-purple-700 text-[10px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 ms-2">
                        {evt.event_type}
                      </span>
                      <span className="text-gray-700 text-[11px]">{evt.description}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                      {evt.created_at ? new Date(evt.created_at).toLocaleTimeString('fa-IR') : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Database Auto-Optimization Guidance */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
            <h4 className="font-bold text-amber-900 flex items-center gap-2.5">
              <Database className="w-4 h-4 text-amber-700" />
              <span>راهنمای ساختار و بهینه‌سازی دیتابیس</span>
            </h4>
            <p className="leading-relaxed text-[11px] text-amber-800">
              سیستم مجهز به **مکانیزم خودکار به‌روزرسانی دیتابیس** است. با هر بار به‌روزرسانی کدها یا انتشار روی بستر ابری ورکر، ساختار جداول و ایندکس‌ها به صورت هوشمند و بدون بروز خطا به‌روز می‌گردند.
            </p>
            <div className="bg-white/80 p-2 rounded-lg border border-amber-200 font-mono text-[10px] text-amber-950 ltr text-left">
              npx wrangler d1 execute news-db --file=schema.sql
            </div>
            <p className="text-[10px] text-amber-700">
              * تمام تغییرات دیتابیس به طور خودکار اعمال می‌شوند و نیاز به اقدام دستی ندارد.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Available AI Models Showcase */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2  border-b border-gray-100 pb-3">
          <div className="bg-purple-50 text-purple-600 p-2 rounded-xl border border-purple-100">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              موتورها و مدل‌های هوش مصنوعی فعال برای ترجمه
            </h3>
            <p className="text-xs text-gray-500">
              می‌توانید موقع ترجمه تکی هر خبر یا ثبت خبر دستی، مدل دلخواه را انتخاب کنید:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {AI_MODELS.map((m) => (
            <div key={m.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-2 justify-between">
                <span className="font-bold text-xs text-gray-900">{m.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${m.color}`}>
                  {m.badge}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{m.desc}</p>
              <div className="text-[10px] text-gray-400 font-mono border-t border-gray-200/60 pt-1.5 flex items-center gap-2 justify-between">
                <span>{m.provider}</span>
                <span className="text-gray-500 font-semibold">{m.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Safe Interactive API Inspector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 ">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                ابزار تست تعاملی APIها (بدون خروج از صفحه)
              </h3>
              <p className="text-xs text-gray-500">
                برای جلوگیری از مواجهه با صفحات سیاه متنی، تمام اندپوئنت‌ها را در همین صفحه تست و مشاهده کنید:
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {API_ENDPOINTS.map((ep) => (
            <div key={ep.path} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    ep.method === 'GET' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-800">{ep.path}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 font-medium">{ep.title}</p>
              <p className="text-[11px] text-gray-500">{ep.desc}</p>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60">
                <button
                  onClick={() => handleTestEndpointInModal(ep.path, ep.method)}
                  className="bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-200 hover:border-emerald-300 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2.5 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>تست پیش‌نمایش JSON</span>
                </button>

                <button
                  onClick={() => handleCopyUrl(ep.path)}
                  className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-2xs"
                >
                  {copiedUrl === ep.path ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedUrl === ep.path ? 'کپی شد' : 'کپی آدرس'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API JSON Preview Modal */}
      {activeApiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center gap-2 justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden space-y-0">
            <div className="bg-gray-900 text-white p-4 flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-sm font-bold">{activeApiModal}</span>
              </div>
              <button
                onClick={() => setActiveApiModal(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-gray-950 font-mono text-xs text-emerald-400 max-h-96 overflow-y-auto ltr text-left">
              {loadingApi ? (
                <div className="py-8 text-center text-gray-400 flex items-center gap-2 justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>در حال دریافت پاسخ از Cloudflare Worker API...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{apiResponseJson}</pre>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2 justify-between text-xs text-gray-600">
              <span>پاسخ با موفقیت در همین مدال نمایش داده شد.</span>
              <button
                onClick={() => setActiveApiModal(null)}
                className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Optional Developer Code Viewer (Accordion) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <button
          onClick={() => {
            setShowCodeViewer(!showCodeViewer);
            if (!showCodeViewer) {
              loadWorkerFile('src/api/routes.ts');
            }
          }}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100/80 flex items-center gap-2 justify-between transition-colors text-start"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-600" />
            <div>
              <h4 className="text-sm font-bold text-gray-900">سورس کدهای زیرساخت Cloudflare Worker</h4>
              <p className="text-xs text-gray-500">مشاهده معماری کدهای backend و توابع اسکرپر و ترنسلیتر</p>
            </div>
          </div>
          {showCodeViewer ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showCodeViewer && (
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {workerFiles.map((f) => (
                <button
                  key={f.filename}
                  onClick={() => loadWorkerFile(f.filename)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-all ${
                    selectedFile === f.filename
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.filename}
                </button>
              ))}
            </div>

            <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-200 max-h-96 overflow-y-auto ltr text-left">
              {loadingCode ? (
                <p className="text-gray-400 italic">در حال دریافت کد فایل...</p>
              ) : (
                <pre>{fileContent}</pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Resetting Database */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center gap-2 justify-center p-4 bg-gray-900/60 backdrop-blur-xs dir-rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>تایید نهایی پاکسازی دیتابیس D1</span>
              </div>
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              آیا مطمئن هستید که می‌خواهید بخش‌های زیر را از دیتابیس به‌طور کامل و غیرقابل بازگشت پاک کنید؟
            </p>

            <ul className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 space-y-2 text-xs text-rose-900">
              {resetOptions.clearSources && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span><strong>منابع خبری:</strong> تمام فیدهای RSS ثبت شده</span>
                </li>
              )}
              {resetOptions.clearArticles && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span><strong>کل اخبار:</strong> تمامی عناوین و محتوای اخبار پایش شده</span>
                </li>
              )}
              {resetOptions.clearApprovedTranslations && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>ترجمه‌های موفق:</strong> ترجمه‌های تاییدشده و ثبت‌شده در دیتابیس</span>
                </li>
              )}
              {resetOptions.clearPendingTranslations && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span><strong>در صف پردازش:</strong> ترجمه‌ها و اخبار معلق در انتظار پردازش</span>
                </li>
              )}
              {resetOptions.clearLogs && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span><strong>لاگ‌های سیستم:</strong> کلیه لاگ‌های اجرای چرخه‌ها و رویدادها</span>
                </li>
              )}
            </ul>

            <div className="flex items-center gap-2 justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => handleExecuteReset(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2.5 disabled:opacity-50 cursor-pointer"
              >
                {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isResetting ? 'در حال پاکسازی...' : 'تایید و پاکسازی نهایی'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
