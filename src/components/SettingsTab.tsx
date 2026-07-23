import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet
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
  { method: 'GET', path: '/api/news', title: 'فهرست اخبار و ترجمه‌ها', desc: 'دریافت لیست ۵۰ خبر اخیر به همراه وضعیت ترجمه D1' },
  { method: 'GET', path: '/api/sources', title: 'فهرست منابع RSS', desc: 'دریافت منابع ثبت شده در جدول sources' },
  { method: 'GET', path: '/api/stats', title: 'آمار کلی دیتابیس D1', desc: 'تعداد اخبار، ترجمه‌ها و وضعیت اتصال سرور' },
  { method: 'GET', path: '/api/logs', title: 'تاریخچه لاگ‌ها و رویدادهای D1', desc: 'دریافت لاگ‌های اجرای چرخه‌ها و Audit events' },
  { method: 'GET', path: '/api/health', title: 'بررسی سلامت سرور', desc: 'تست اتصال Cloudflare Worker و D1 Engine' },
  { method: 'POST', path: '/api/trigger-scraper', title: 'اجرای خودکار Scraper', desc: 'اسکرپ فیدها و افزودن اخبار جدید به D1' },
  { method: 'POST', path: '/api/trigger-translator', title: 'اجرای خودکار Translator', desc: 'ترجمه اخبار pending با Workers AI' },
];

interface SettingsTabProps {
  onTriggerScraper: () => Promise<any>;
  onTriggerTranslator: () => Promise<any>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  workerFiles: WorkerFileInfo[];
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onTriggerScraper,
  onTriggerTranslator,
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

  const fetchD1Logs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setExecutionLogs(json.data.execution_logs || []);
          setSystemEvents(json.data.system_events || []);
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
          <div className="flex items-center space-x-3 space-x-reverse">
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
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 space-x-reverse shrink-0 disabled:opacity-50 shadow-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>اجرای کامل چرخه دریافت و ترجمه</span>
          </button>
        </div>

        {/* Action Trigger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card 1: Scraper Routine */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
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

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleRunScraper}
                disabled={isTriggeringScraper}
                className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 space-x-reverse disabled:opacity-50 shadow-2xs"
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-700 flex items-center gap-1.5">
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

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleRunTranslator}
                disabled={isTriggeringTranslator}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 space-x-reverse disabled:opacity-50 shadow-2xs"
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
        </div>

        {/* Console Logs Output */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mt-4">
          <div className="bg-gray-800/90 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-gray-200 font-mono">
                کنسول لاگ‌های زنده سیستم (System Console Output)
              </span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-gray-400 hover:text-gray-200 underline"
            >
              پاکسازی
            </button>
          </div>

          <div className="p-4 font-mono text-xs text-gray-300 space-y-1.5 max-h-52 overflow-y-auto ltr text-left bg-gray-950">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`leading-relaxed border-b border-gray-900/50 pb-1 ${
                  log.includes('❌')
                    ? 'text-rose-400'
                    : log.includes('✅')
                    ? 'text-emerald-400'
                    : log.includes('🚀') || log.includes('🤖')
                    ? 'text-amber-300'
                    : 'text-gray-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. System Execution Logs & History Inspector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-3 space-x-reverse">
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
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>به‌روزرسانی لاگ‌ها</span>
            </button>
            {executionLogs.length > 0 && (
              <button
                onClick={handleClearD1Logs}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی لاگ‌ها</span>
              </button>
            )}
          </div>
        </div>

        {/* Execution Logs Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
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
              <table className="w-full text-right text-xs">
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            موفق
                          </span>
                        ) : log.status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            جزئی
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
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
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" />
              <span>رویدادهای سیستم (System Audit Events)</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {systemEvents.length === 0 ? (
                <p className="text-[11px] text-gray-400 italic">رویدادی ثبت نشده است.</p>
              ) : (
                systemEvents.map((evt) => (
                  <div key={evt.id} className="bg-white border border-gray-200/80 rounded-lg p-2 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-purple-700 text-[10px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 ml-2">
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
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
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
        <div className="flex items-center space-x-3 space-x-reverse border-b border-gray-100 pb-3">
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
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900">{m.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${m.color}`}>
                  {m.badge}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{m.desc}</p>
              <div className="text-[10px] text-gray-400 font-mono border-t border-gray-200/60 pt-1.5 flex items-center justify-between">
                <span>{m.provider}</span>
                <span className="text-gray-500 font-semibold">{m.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Safe Interactive API Inspector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-3 space-x-reverse">
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
              <div className="flex items-center justify-between">
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
                  className="bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-200 hover:border-emerald-300 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>تست پیش‌نمایش JSON</span>
                </button>

                <button
                  onClick={() => handleCopyUrl(ep.path)}
                  className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 shadow-2xs"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden space-y-0">
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
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
                <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>در حال دریافت پاسخ از Cloudflare Worker API...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{apiResponseJson}</pre>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
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
          className="w-full p-4 bg-gray-50 hover:bg-gray-100/80 flex items-center justify-between transition-colors text-right"
        >
          <div className="flex items-center gap-3">
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
    </div>
  );
};
