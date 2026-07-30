import React, { useState } from 'react';
import { Send, Terminal, Clock, CheckCircle2, AlertTriangle, FileSpreadsheet, ExternalLink, RefreshCw } from 'lucide-react';
import { SettingsTab } from './SettingsTab';

interface ReportsLogsTabProps {
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onResetDatabase: (options: any) => Promise<any>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  workerFiles: any[];
  initialSubTab?: 'distributions' | 'system-logs';
}

export const ReportsLogsTab: React.FC<ReportsLogsTabProps> = ({
  onTriggerScraper,
  onTriggerTranslator,
  onResetDatabase,
  isTriggeringScraper,
  isTriggeringTranslator,
  workerFiles,
  initialSubTab = 'distributions',
}) => {
  const [subTab, setSubTab] = useState<'distributions' | 'system-logs'>(initialSubTab);

  // Mock Distribution History List
  const [distributions] = useState([
    {
      id: 101,
      title: 'رونمایی از جدیدترین مدل هوش مصنوعی گوگل با قابلیت استدلال پیشرفته',
      targetSite: 'updaaate.ir',
      publishedAt: new Date().toLocaleTimeString('fa-IR'),
      status: 'success',
      responseCode: 201,
      wpPostId: 4892,
      wpUrl: 'https://updaaate.ir/?p=4892',
    },
    {
      id: 102,
      title: 'تحلیل امنیت سایبری زیرساخت‌های ابری در سال ۲۰۲۶',
      targetSite: 'updaaate.ir',
      publishedAt: new Date(Date.now() - 3600000).toLocaleTimeString('fa-IR'),
      status: 'success',
      responseCode: 201,
      wpPostId: 4891,
      wpUrl: 'https://updaaate.ir/?p=4891',
    },
    {
      id: 103,
      title: 'گزارش بازار پردازنده‌های کوانتومی و تراشه‌های نیمه‌هادی',
      targetSite: 'updaaate.ir',
      publishedAt: new Date(Date.now() - 7200000).toLocaleTimeString('fa-IR'),
      status: 'success',
      responseCode: 200,
      wpPostId: 4890,
      wpUrl: 'https://updaaate.ir/?p=4890',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          <button
            onClick={() => setSubTab('distributions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'distributions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>تاریخچه توزیع و انتشار اخبار (Distributions)</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
              {distributions.length} انتشار
            </span>
          </button>

          <button
            onClick={() => setSubTab('system-logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'system-logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>لاگ‌های سیستم و کنسول دیباگ (System Error Logs)</span>
          </button>
        </div>
      </div>

      {/* 1. Distributions Tab */}
      {subTab === 'distributions' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">تاریخچه انتشار اخبار روی مقاصد (Distributions History)</h3>
              <p className="text-xs text-gray-500 mt-0.5">ثبت دقیق اخبار ارسال‌شده به سایت‌های وردپرسی و کانال‌ها به همراه کد وضعیت HTTP</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
              ۱۰۰٪ موفق
            </span>
          </div>

          <div className="space-y-3">
            {distributions.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                    <span className="font-semibold text-purple-700">مقصد: {item.targetSite}</span>
                    <span>•</span>
                    <span>ساعت انتشار: {item.publishedAt}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-600 font-bold">HTTP {item.responseCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.wpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>مشاهده خبر در سایت</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. System Error Logs Tab */}
      {subTab === 'system-logs' && (
        <SettingsTab
          onTriggerScraper={onTriggerScraper}
          onTriggerTranslator={onTriggerTranslator}
          onResetDatabase={onResetDatabase}
          isTriggeringScraper={isTriggeringScraper}
          isTriggeringTranslator={isTriggeringTranslator}
          workerFiles={workerFiles}
        />
      )}
    </div>
  );
};
