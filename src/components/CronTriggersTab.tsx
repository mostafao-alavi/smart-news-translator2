import React, { useState } from 'react';
import {
  Play,
  Terminal,
  RefreshCw,
  Sparkles,
  Clock,
  Database,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';

interface CronTriggersTabProps {
  onTriggerScraper: () => Promise<any>;
  onTriggerTranslator: () => Promise<any>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
}

export const CronTriggersTab: React.FC<CronTriggersTabProps> = ({
  onTriggerScraper,
  onTriggerTranslator,
  isTriggeringScraper,
  isTriggeringTranslator,
}) => {
  const [logs, setLogs] = useState<string[]>([
    `[System] Cloudflare Worker Cron Trigger initialized with schedule: "0 * * * *" (Every 1 hour).`,
    `[Ready] Ready to execute scraper() and translator() functions. Click below to trigger manually.`,
  ]);

  const [lastScraperResult, setLastScraperResult] = useState<any>(null);
  const [lastTranslatorResult, setLastTranslatorResult] = useState<any>(null);

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
      if (res?.logs && Array.isArray(res.logs)) {
        res.logs.forEach((l: string) => addLog(l));
      }
    } catch (err: any) {
      addLog(`❌ Scraper execution failed: ${err.message}`);
    }
  };

  const handleRunTranslator = async () => {
    addLog('🤖 Starting manual execution of translator(env) via Cloudflare Workers AI (@cf/meta/m2m100-1.2b)...');
    try {
      const res = await onTriggerTranslator();
      setLastTranslatorResult(res);
      addLog(`✅ Translator execution finished successfully.`);
      addLog(`📊 Articles Processed: ${res?.processed ?? 0}, Successfully Translated: ${res?.successCount ?? 0}`);
      if (res?.logs && Array.isArray(res.logs)) {
        res.logs.forEach((l: string) => addLog(l));
      }
    } catch (err: any) {
      addLog(`❌ Translator execution failed: ${err.message}`);
    }
  };

  const handleRunPipelineSequence = async () => {
    addLog('🔄 Triggering Full Scheduled Cron Sequence (1. Scraper -> 2. Translator)...');
    await handleRunScraper();
    await handleRunTranslator();
  };

  return (
    <div className="space-y-6">
      {/* Cloudflare Worker Cron Overview Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-orange-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Cloudflare Worker Scheduled Cron Trigger</span>
                <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded font-mono border border-orange-200">
                  crons = ["0 * * * *"]
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                توابع زیر در بستر اصلی Cloudflare Worker هر یک ساعت یکبار به صورت خودکار و بدون نیاز به سرور اجرا می‌شوند.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunPipelineSequence}
            disabled={isTriggeringScraper || isTriggeringTranslator}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 space-x-reverse shrink-0 disabled:opacity-50 shadow-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>اجرای کامل چرخه اسکرپ و ترجمه</span>
          </button>
        </div>

        {/* Individual Action Trigger Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Card 1: Scraper Routine */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                ۱. تابع دریافت اخبار (src/cron/scraper.ts)
              </span>
              <span className="text-[10px] text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                RSS/Atom Parser
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              دریافت تمام فیدهای RSS از جدول <code className="text-gray-900 font-bold">sources</code>، استخراج تگ‌های XML با Regex سبک و ثبت اخبار جدید در <code className="text-gray-900 font-bold">articles</code> با وضعیت pending.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleRunScraper}
                disabled={isTriggeringScraper}
                className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 space-x-reverse disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isTriggeringScraper ? 'animate-spin' : ''}`} />
                <span>{isTriggeringScraper ? 'در حال اجرا...' : 'اجرای دستی scraper()'}</span>
              </button>

              {lastScraperResult && (
                <span className="text-[11px] text-emerald-700 font-mono font-semibold">
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
                ۲. تابع ترجمه هوشمند (src/cron/translator.ts)
              </span>
              <span className="text-[10px] text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded border border-orange-200 font-mono">
                Workers AI (@cf/meta/m2m100-1.2b & @cf/ai4bharat/indictrans2-en-indic-1B)
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              خوانش حداکثر ۵ خبر pending از جدول <code className="text-gray-900 font-bold">articles</code>، ارسال به مدل Workers AI برای ترجمه به فارسی و ذخیره در <code className="text-gray-900 font-bold">translations</code>.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={handleRunTranslator}
                disabled={isTriggeringTranslator}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-1.5 space-x-reverse disabled:opacity-50 shadow-2xs"
              >
                <Sparkles className={`w-3.5 h-3.5 text-orange-600 ${isTriggeringTranslator ? 'animate-pulse' : ''}`} />
                <span>{isTriggeringTranslator ? 'در حال ترجمه...' : 'اجرای دستی translator()'}</span>
              </button>

              {lastTranslatorResult && (
                <span className="text-[11px] text-emerald-700 font-mono font-semibold">
                  {lastTranslatorResult.successCount ?? 0} ترجمه موفق
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Output Logs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-md">
        <div className="bg-gray-800/90 px-4 py-2.5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-gray-200 font-mono">
              Cloudflare Worker Execution Logs
            </span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-[11px] text-gray-400 hover:text-gray-200 underline"
          >
            پاکسازی کنسول
          </button>
        </div>

        <div className="p-4 font-mono text-xs text-gray-300 space-y-1.5 max-h-80 overflow-y-auto ltr text-left bg-gray-950">
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
  );
};
