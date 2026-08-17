import React, { useState } from 'react';
import { SourceItem } from '../types/client';
import {
  Rss,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Globe,
  Radio,
  Sparkles,
  Zap,
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

export const InputSourcesTab: React.FC<InputSourcesTabProps> = ({
  sources,
  loading,
  onScrapeSource,
  onRefresh,
}) => {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);

  // Find Cointelegraph source or fallback to default representation
  const cointelegraph = sources.find(
    (s) =>
      s.name?.toLowerCase().includes('cointelegraph') ||
      s.url?.toLowerCase().includes('cointelegraph')
  ) || {
    id: 1,
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    language: 'en',
    category: 'crypto',
    is_active: 1,
    scrape_limit: 10,
    last_scraped_at: new Date().toISOString(),
  };

  const handleTriggerScrape = async () => {
    setIsScraping(true);
    setScrapeSuccess(false);

    try {
      if (onScrapeSource && cointelegraph.id) {
        onScrapeSource(cointelegraph.id);
      } else {
        await fetch('/api/trigger-scraper', { method: 'POST' });
      }

      setScrapeSuccess(true);
      if (onRefresh) onRefresh();
      setTimeout(() => setScrapeSuccess(false), 3000);
    } catch (e) {
      console.error('Error triggering scrape:', e);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Rss className="w-5 h-5 text-orange-500" />
            منبع خبری فعال
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            فید اصلی پایش و دریافت لحظه‌ای اخبار برای سامانه ۱۰۰۰ دستان
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          ۱ منبع فعال
        </span>
      </div>

      {/* Main Single Clean Source Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:border-orange-200 transition-all space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 font-black text-xl">
              CT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">Cointelegraph</h3>
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md font-bold">
                  کریپتو / بلاکچین
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                  EN
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                پیشروترین پایگاه خبری حوزه ارزهای دیجیتال و وب ۳ در جهان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://cointelegraph.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="مشاهده وب‌سایت اصلی"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* RSS URL Display */}
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-xs font-mono text-gray-700 truncate ltr">
              https://cointelegraph.com/rss
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              فید فعال و متصل
            </span>
          </div>
        </div>

        {/* Action and Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>پایش خودکار: فعال (هر ۱۰ دقیقه)</span>
          </div>

          <button
            onClick={handleTriggerScrape}
            disabled={isScraping || loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
            <span>
              {isScraping
                ? 'در حال پایش و دریافت...'
                : scrapeSuccess
                ? '✅ اخبار با موفقیت دریافت شد'
                : 'پایش دستی و دریافت اخبار جدید'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
