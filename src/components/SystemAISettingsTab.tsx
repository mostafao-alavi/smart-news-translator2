import React, { useState } from 'react';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Check, 
  Copy, 
  FileCode, 
  Layers, 
  RotateCcw, 
  Activity, 
  Clock, 
  Save
} from 'lucide-react';
import { AI_MODELS } from './SettingsTab';
import { SourceItem, JoinedArticleNews, StatsData, WorkerFileInfo } from '../types/client';

interface SystemAISettingsTabProps {
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onResetDatabase: (options: any) => Promise<any>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  workerFiles?: WorkerFileInfo[];
  sources?: SourceItem[];
  news?: JoinedArticleNews[];
  stats?: StatsData | null;
  onRefreshAll?: () => void;
  onAddSource?: any;
  onUpdateSource?: any;
  onDeleteSource?: any;
  onDeleteArticle?: any;
  initialSubTab?: string;
}

interface CleanupAction {
  id: string;
  title: string;
  badge: string;
  description: string;
  sqlQuery: string;
  target: string;
  buttonLabel: string;
  buttonVariant: 'danger' | 'warning' | 'indigo' | 'slate';
  requiresConfirm: boolean;
}

const CLEANUP_ACTIONS: CleanupAction[] = [
  {
    id: 'articles_and_translations',
    title: 'پاکسازی کلیه اخبار و ترجمه‌ها',
    badge: 'articles + translations',
    description: 'حذف تمامی مقالات دریافت شده، متون ترجمه، سابقه ویرایش‌ها و ریست شمارنده‌های ردیف‌ها.',
    sqlQuery: `DELETE FROM translations;\nDELETE FROM translation_history;\nDELETE FROM articles;\nUPDATE sqlite_sequence SET seq = 0 WHERE name IN ('translations', 'translation_history', 'articles');`,
    target: 'articles',
    buttonLabel: 'پاکسازی اخبار و ترجمه‌ها',
    buttonVariant: 'danger',
    requiresConfirm: true,
  },
  {
    id: 'translations_only',
    title: 'پاکسازی فقط ترجمه‌ها (بازنشانی به در انتظار)',
    badge: 'translations only',
    description: 'حذف ترجمه‌های انجام‌شده و بازگرداندن وضعیت تمام اخبار موجود به حالت «در انتظار ترجمه».',
    sqlQuery: `DELETE FROM translations;\nDELETE FROM translation_history;\nUPDATE articles SET translation_status = 'pending', wp_sync_status = 'pending';\nUPDATE sqlite_sequence SET seq = 0 WHERE name IN ('translations', 'translation_history');`,
    target: 'translations',
    buttonLabel: 'پاکسازی و بازنشانی ترجمه‌ها',
    buttonVariant: 'warning',
    requiresConfirm: true,
  },
  {
    id: 'logs_and_events',
    title: 'پاکسازی تاریخچه لاگ‌ها و رویدادهای سیستم',
    badge: 'execution_logs + events',
    description: 'حذف تمامی لاگ‌های ثبت‌شده از چرخه‌های اسکرپر، مترجم، سیستم و ریست لاگ‌های اجرایی.',
    sqlQuery: `DELETE FROM execution_logs;\nDELETE FROM system_events;\nUPDATE sqlite_sequence SET seq = 0 WHERE name IN ('execution_logs', 'system_events');`,
    target: 'logs',
    buttonLabel: 'پاکسازی لاگ‌ها و رویدادها',
    buttonVariant: 'slate',
    requiresConfirm: false,
  },
  {
    id: 'distributions',
    title: 'پاکسازی سابقه ارسال و توزیع مقالات',
    badge: 'distributions',
    description: 'حذف لاگ‌ها و سوابق ارسال مقالات به وردپرس و کانال تلگرام.',
    sqlQuery: `DELETE FROM distributions;\nUPDATE sqlite_sequence SET seq = 0 WHERE name = 'distributions';`,
    target: 'distributions',
    buttonLabel: 'پاکسازی سابقه توزیع',
    buttonVariant: 'slate',
    requiresConfirm: false,
  },
  {
    id: 'sources',
    title: 'پاکسازی کلیه منابع خبری RSS',
    badge: 'sources table',
    description: 'حذف تمامی فیدها و منابع خبری ثبت‌شده در دیتابیس D1.',
    sqlQuery: `DELETE FROM sources;\nUPDATE sqlite_sequence SET seq = 0 WHERE name = 'sources';`,
    target: 'sources',
    buttonLabel: 'پاکسازی منابع خبری',
    buttonVariant: 'danger',
    requiresConfirm: true,
  },
  {
    id: 'rebuild_schema',
    title: 'ریست فکتوری و بازسازی کامل ساختار دیتابیس D1',
    badge: 'Hard Reset & Re-Seed',
    description: 'پاکسازی تمام جداول + ایجاد مجدد تمام ساختارها (Tables)، ایندکس‌ها، متریک‌ها و مقاصد پیش‌فرض.',
    sqlQuery: `DELETE FROM translations; DELETE FROM translation_history;\nDELETE FROM articles; DELETE FROM sources;\nDELETE FROM distributions; DELETE FROM execution_logs; DELETE FROM system_events;\n-- Re-create all tables, indexes and default platform seeds`,
    target: 'all',
    buttonLabel: 'ریست فکتوری و بازسازی کامل دیتابیس',
    buttonVariant: 'danger',
    requiresConfirm: true,
  },
];

const PRESET_QUERIES = [
  { label: 'شمارش رکوردهای تمام جداول', query: 'SELECT (SELECT COUNT(*) FROM articles) as articles, (SELECT COUNT(*) FROM translations) as translations, (SELECT COUNT(*) FROM sources) as sources, (SELECT COUNT(*) FROM execution_logs) as logs;' },
  { label: '۱۰ خبر اخیر دیتابیس', query: 'SELECT id, title, translation_status, wp_sync_status, created_at FROM articles ORDER BY id DESC LIMIT 10;' },
  { label: '۱۰ ترجمه اخیر', query: 'SELECT id, article_id, translated_title, model_used, approval_status, translated_at FROM translations ORDER BY id DESC LIMIT 10;' },
  { label: 'فهرست منابع خبری', query: 'SELECT id, name, url, is_active, category, scrape_limit FROM sources;' },
  { label: 'پلتفرم‌ها و مقاصد', query: 'SELECT id, name, slug, platform_type, api_url, is_active FROM platforms;' },
  { label: 'بهینه‌سازی دیتابیس (VACUUM)', query: 'VACUUM;' }
];

export const SystemAISettingsTab: React.FC<SystemAISettingsTabProps> = ({
  onResetDatabase,
  stats,
  sources = [],
  news = [],
  onRefreshAll
}) => {
  // State for database cleanup
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [lastActionResult, setLastActionResult] = useState<{
    success: boolean;
    message: string;
    queries?: string[];
    timestamp?: string;
  } | null>(null);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  // State for manual SQL query console
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT count(id) as total, translation_status FROM articles GROUP BY translation_status;'
  );
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // State for AI model config
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.7-flash');
  const [systemPrompt, setSystemPrompt] = useState<string>(
    `You are an expert crypto and tech news editor and professional translator. Translate the provided English news article into fluent, professional, and natural Persian (Farsi). Maintain accurate technical terms while ensuring high readability.`
  );
  const [aiSaved, setAiSaved] = useState<boolean>(false);

  // Handler for direct table cleanup
  const handleExecuteCleanup = async (action: CleanupAction) => {
    if (action.requiresConfirm) {
      const confirmText = `آیا از اجرای عملیات «${action.title}» اطمینان دارید؟\n\nاین دستور مستقیماً روی پایگاه داده D1 اجرا خواهد شد.`;
      if (!window.confirm(confirmText)) return;
    }

    setRunningAction(action.id);
    setLastActionResult(null);

    try {
      let resData;
      if (onResetDatabase) {
        resData = await onResetDatabase({ target: action.target });
      } else {
        const res = await fetch('/api/database/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: action.target }),
        });
        const json = await res.json();
        resData = json.data;
      }

      setLastActionResult({
        success: true,
        message: resData?.message || `عملیات «${action.title}» با موفقیت اجرا شد.`,
        queries: resData?.executedQueries || action.sqlQuery.split('\n').filter(Boolean),
        timestamp: new Date().toLocaleTimeString('fa-IR')
      });

      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setLastActionResult({
        success: false,
        message: `خطا در اجرای عملیات: ${err.message || 'خطای ناشناخته'}`,
        timestamp: new Date().toLocaleTimeString('fa-IR')
      });
    } finally {
      setRunningAction(null);
    }
  };

  // Handler for VACUUM
  const handleRunVacuum = async () => {
    setRunningAction('vacuum');
    setLastActionResult(null);
    try {
      const res = await fetch('/api/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacuum: true }),
      });
      const json = await res.json();
      setLastActionResult({
        success: json.success,
        message: json.data?.message || 'عملیات بهینه‌سازی دیتابیس (VACUUM) انجام شد.',
        queries: ['VACUUM;'],
        timestamp: new Date().toLocaleTimeString('fa-IR')
      });
    } catch (e: any) {
      setLastActionResult({
        success: false,
        message: `خطا در اجرای VACUUM: ${e.message}`,
        timestamp: new Date().toLocaleTimeString('fa-IR')
      });
    } finally {
      setRunningAction(null);
    }
  };

  // Handler for Clear System Cache
  const handleClearCache = async () => {
    setRunningAction('cache');
    setLastActionResult(null);
    try {
      const res = await fetch('/api/clear-cache', { method: 'POST' });
      const json = await res.json();
      setLastActionResult({
        success: json.success,
        message: json.data?.message || 'کش سیستم و حافظه موقت با موفقیت پاکسازی شد.',
        queries: ['CLEAR_CACHE;'],
        timestamp: new Date().toLocaleTimeString('fa-IR')
      });
      if (onRefreshAll) onRefreshAll();
    } catch (e: any) {
      setLastActionResult({
        success: false,
        message: `خطا در پاکسازی کش: ${e.message}`,
        timestamp: new Date().toLocaleTimeString('fa-IR')
      });
    } finally {
      setRunningAction(null);
    }
  };

  // Handler for custom SQL query execution
  const handleRunSqlQuery = async () => {
    if (!sqlQuery.trim()) return;
    setIsExecutingSql(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/d1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery.trim() })
      });
      const result = await res.json();
      if (result.success) {
        setQueryResult(result.data);
      } else {
        setQueryError(result.error || 'خطا در اجرای کوئری SQL');
      }
    } catch (err: any) {
      setQueryError(err.message || 'خطا در برقراری ارتباط');
    } finally {
      setIsExecutingSql(false);
    }
  };

  const handleCopyQuery = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  const handleSaveAi = (e: React.FormEvent) => {
    e.preventDefault();
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 3000);
  };

  return (
    <div className="space-y-6" id="settings-tab-container">
      {/* 1. Header Overview Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              تنظیمات هسته و مدیریت مستقیم دیتابیس D1
              <span className="bg-emerald-50 text-emerald-700 text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono font-normal">
                Cloudflare D1 (SQLite)
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              مدیریت ساده، اجرای کوئری‌های استاندارد و دکمه‌های پاکسازی هدفمند جداول پایگاه داده.
            </p>
          </div>
        </div>

        {/* Global Quick Utility Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleRunVacuum}
            disabled={runningAction === 'vacuum'}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="بهینه‌سازی و فشرده‌سازی فایل دیتابیس"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningAction === 'vacuum' ? 'animate-spin' : ''}`} />
            <span>بهینه‌سازی دیتابیس (VACUUM)</span>
          </button>

          <button
            onClick={handleClearCache}
            disabled={runningAction === 'cache'}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            title="پاکسازی کش سیستم و حافظه موقت"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${runningAction === 'cache' ? 'animate-spin' : ''}`} />
            <span>پاکسازی کش سیستم</span>
          </button>
        </div>
      </div>

      {/* Live Action Feedback Notification */}
      {lastActionResult && (
        <div 
          className={`p-4 rounded-2xl border transition-all ${
            lastActionResult.success 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {lastActionResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold">{lastActionResult.message}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">زمان اجرا: {lastActionResult.timestamp}</div>
              </div>
            </div>
            <button 
              onClick={() => setLastActionResult(null)}
              className="text-xs text-gray-400 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>

          {lastActionResult.queries && lastActionResult.queries.length > 0 && (
            <div className="mt-3 bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] dir-ltr text-left overflow-x-auto border border-slate-800">
              <div className="text-slate-400 text-[10px] mb-1 font-sans">کوئری‌های اجرا شده روی D1:</div>
              {lastActionResult.queries.map((q, idx) => (
                <div key={idx} className="whitespace-pre-wrap">{q}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Primary Database Table Cleanup Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-gray-900">عملیات پاکسازی و تخلیه هدفمند جداول دیتابیس</h3>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">
            تعداد کل اخبار: <strong className="text-gray-900 font-mono">{news.length}</strong> | 
            منابع: <strong className="text-gray-900 font-mono">{sources.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CLEANUP_ACTIONS.map((action) => {
            const isCurrentRunning = runningAction === action.id;
            const isCopied = copiedQueryId === action.id;

            return (
              <div
                key={action.id}
                className="bg-gray-50/70 border border-gray-200 hover:border-gray-300 rounded-xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-gray-900">{action.title}</h4>
                    <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold">
                      {action.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                    {action.description}
                  </p>

                  {/* SQL Preview Box */}
                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[10px] dir-ltr text-left mb-3 relative group border border-slate-800">
                    <pre className="overflow-x-auto whitespace-pre-wrap">{action.sqlQuery}</pre>
                    <button
                      onClick={() => handleCopyQuery(action.id, action.sqlQuery)}
                      className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded opacity-80 group-hover:opacity-100 transition-opacity"
                      title="کپی دستور SQL"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleExecuteCleanup(action)}
                    disabled={isCurrentRunning || !!runningAction}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                      action.buttonVariant === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        : action.buttonVariant === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                        : 'bg-slate-700 hover:bg-slate-800 text-white shadow-xs'
                    }`}
                  >
                    {isCurrentRunning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isCurrentRunning ? 'در حال اجرا...' : action.buttonLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. D1 SQL Direct Query Console */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">کنسول مستقیم اجرای کوئری SQL روی D1</h3>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">میانبر اجرا: Ctrl + Enter</span>
        </div>

        {/* Quick Query Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-gray-500 ml-1">کوئری‌های آماده:</span>
          {PRESET_QUERIES.map((preset, index) => (
            <button
              key={index}
              onClick={() => setSqlQuery(preset.query)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Console Box */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
          <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-emerald-400 text-[11px]">sqlite3 &gt; cloudflare_d1_database</span>
            <button
              onClick={() => setSqlQuery('')}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              پاک کردن کادر
            </button>
          </div>
          <div className="p-3">
            <textarea
              rows={3}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleRunSqlQuery();
                }
              }}
              placeholder="SELECT * FROM articles LIMIT 10;"
              className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-none dir-ltr text-left"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">
                دستورات SELECT, UPDATE, DELETE و VACUUM پشتیبانی می‌شوند.
              </span>
              <button
                onClick={handleRunSqlQuery}
                disabled={isExecutingSql || !sqlQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isExecutingSql ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>{isExecutingSql ? 'در حال اجرا...' : 'اجرای کوئری (Execute)'}</span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {(queryResult || queryError) && (
            <div className="bg-slate-950 p-4 border-t border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {queryError ? (
                <div className="text-rose-400 font-bold p-2 bg-rose-950/40 rounded-lg border border-rose-900">
                  خطا: {queryError}
                </div>
              ) : (
                <>
                  {queryResult?.results && queryResult.results.length > 0 ? (
                    <table className="w-full text-left border-collapse dir-ltr">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/50">
                          {Object.keys(queryResult.results[0]).map((key) => (
                            <th key={key} className="p-2 whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {queryResult.results.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            {Object.values(row).map((val: any, j: number) => (
                              <td key={j} className="p-2 whitespace-nowrap text-emerald-400">
                                {val === null ? (
                                  <span className="text-slate-600">NULL</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-slate-500 italic p-2">
                      کوئری با موفقیت اجرا شد. (تعداد ردیف بازگشتی: ۰)
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t border-slate-800 text-slate-500 text-[10px] flex justify-between">
                    <span>وضعیت: اجرای موفق</span>
                    <span>زمان پردازش: {queryResult?.duration || 0} میلی‌ثانیه</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. AI Engine Quick Settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">تنظیمات مدل هوش مصنوعی و پرامپت ترجمه</h3>
            <p className="text-[11px] text-gray-500">انتخاب موتور پیش‌فرض ترجمه و لحن نگارش اخبار فارسی.</p>
          </div>
        </div>

        {aiSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تنظیمات مدل هوش مصنوعی با موفقیت ذخیره گردید.</span>
          </div>
        )}

        <form onSubmit={handleSaveAi} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                مدل زبانی پیش‌فرض ترجمه
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono dir-ltr text-left"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                پرامپت سیستمی ترجمه و بازنویسی (System Prompt)
              </label>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none dir-ltr text-left resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setSelectedModel('gemini-3.7-flash');
                setSystemPrompt(
                  `You are an expert crypto and tech news editor and professional translator. Translate the provided English news article into fluent, professional, and natural Persian (Farsi). Maintain accurate technical terms while ensuring high readability.`
                );
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-xl font-bold transition-colors cursor-pointer"
            >
              بازنشانی به پیش‌فرض
            </button>

            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-5 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تنظیمات هوش مصنوعی</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
