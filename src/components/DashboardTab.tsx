import React, { useEffect, useState } from 'react';
import { JoinedArticleNews, SourceItem, StatsData } from '../types/client';
import {
  Rss,
  Languages,
  Send,
  Zap,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowLeft,
  Globe,
  Database,
  Sliders,
  BarChart3,
  ExternalLink,
  Activity,
  Check
} from 'lucide-react';
import { StatsOverview } from './StatsOverview';
import { DatabaseErrorFallback } from './DatabaseErrorFallback';

interface DashboardTabProps {
  stats: StatsData | null;
  loadingStats: boolean;
  statsError?: boolean;
  onRetryStats?: () => void;
  onRefreshAll?: () => void;
  news: JoinedArticleNews[];
  sources: SourceItem[];
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onNavigateTab: (tab: 'dashboard' | 'sources' | 'content-desk' | 'destinations' | 'settings', subTab?: string) => void;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  onTranslateArticle: (id: number) => Promise<any>;
}

interface SystemEventLog {
  id: number;
  event_type: string;
  description: string;
  created_at: string;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  loadingStats,
  statsError = false,
  onRetryStats,
  onRefreshAll,
  news,
  sources,
  onTriggerScraper,
  onTriggerTranslator,
  onNavigateTab,
  isTriggeringScraper,
  isTriggeringTranslator,
  onTranslateArticle,
}) => {
  const [distributingId, setDistributingId] = useState<number | null>(null);
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [distributedIds, setDistributedIds] = useState<number[]>([]);
  const [recentLogs, setRecentLogs] = useState<SystemEventLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Fetch real system events for live audit widget
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const events = json.data.system_events || [];
          setRecentLogs(events.slice(0, 5));
        }
      }
    } catch (e) {
      console.warn('Could not fetch logs for dashboard:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [news.length, stats?.articles_count]);

  const handleInstantDistribute = async (articleId: number) => {
    setDistributingId(articleId);
    try {
      const res = await fetch(`/api/news/${articleId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: ['telegram', 'wordpress'] }),
      });
      const data = await res.json();
      if (data.success) {
        setDistributedIds((prev) => [...prev, articleId]);
        if (onRefreshAll) {
          onRefreshAll();
        } else if (onRetryStats) {
          onRetryStats();
        }
        fetchLogs();
      }
    } catch (err) {
      console.error('Instant distribute failed:', err);
    } finally {
      setDistributingId(null);
    }
  };

  const handleSingleTranslate = async (articleId: number) => {
    setTranslatingId(articleId);
    try {
      await onTranslateArticle(articleId);
      if (onRefreshAll) {
        onRefreshAll();
      } else if (onRetryStats) {
        onRetryStats();
      }
      fetchLogs();
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslatingId(null);
    }
  };

  const pendingNews = news.filter((n) => !n.translated_title && n.translation_status !== 'completed' && n.translation_status !== 'translated');
  const reviewNews = news.filter((n) => (!!n.translated_title || n.translation_status === 'completed' || n.translation_status === 'translated') && (n.wp_sync_status !== 'published' || n.telegram_sync_status !== 'published'));
  const publishedNews = news.filter((n) => n.wp_sync_status === 'published' || n.telegram_sync_status === 'published');

  const activeSourcesCount = sources.filter(s => s.is_active !== 0 && s.is_active !== false).length;

  return (
    <div className="space-y-6">
      {/* Database Error Fallback if stats fail to load */}
      {statsError ? (
        <DatabaseErrorFallback
          message="دیتابیس در حال بازسازی است. لطفاً چند دقیقه دیگر تلاش کنید."
          onRetry={onRetryStats}
          isRetrying={loadingStats}
        />
      ) : (
        /* Top Live Statistics Summary */
        <StatsOverview stats={stats} loading={loadingStats} />
      )}

      {/* Quick Action Shortcuts Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-100 text-orange-700 p-2 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">میانبرها و عملیات سریع (Quick Actions)</h2>
            <p className="text-xs text-gray-500">دسترسی سریع به کلیدی‌ترین عملیات‌های پایش، ترجمه و انتشار</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Quick Action 1: Scrape RSS */}
          <button
            onClick={onTriggerScraper}
            disabled={isTriggeringScraper}
            className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100/80 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <RefreshCw className={`w-4 h-4 ${isTriggeringScraper ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">پایش دستی RSS</div>
              <div className="text-[10px] text-gray-500 mt-0.5">دریافت اخبار تازه</div>
            </div>
          </button>

          {/* Quick Action 2: Trigger AI Translator */}
          <button
            onClick={onTriggerTranslator}
            disabled={isTriggeringTranslator}
            className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/80 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className={`w-4 h-4 ${isTriggeringTranslator ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">ترجمه دسته‌ای AI</div>
              <div className="text-[10px] text-gray-500 mt-0.5">پردازش صف با AI</div>
            </div>
          </button>

          {/* Quick Action 3: Go to Content Desk */}
          <button
            onClick={() => onNavigateTab('content-desk')}
            className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/80 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-blue-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">میز تحریریه</div>
              <div className="text-[10px] text-gray-500 mt-0.5">بازبینی و ویرایش</div>
            </div>
          </button>

          {/* Quick Action 4: Sources Management */}
          <button
            onClick={() => onNavigateTab('sources')}
            className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Rss className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">مدیریت منابع</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{activeSourcesCount} منبع فعال</div>
            </div>
          </button>

          {/* Quick Action 5: Destination Settings */}
          <button
            onClick={() => onNavigateTab('destinations')}
            className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/80 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="p-2.5 rounded-xl bg-purple-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">مقاصد انتشار</div>
              <div className="text-[10px] text-gray-500 mt-0.5">سایت و تلگرام</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Status & Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Actionable Queues & Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Recent Pending News in Queue */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">آخرین اخبار در صف ترجمه (Pending Queue)</h3>
                <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {pendingNews.length} خبر
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('content-desk', 'pending')}
                className="text-xs text-orange-600 hover:text-orange-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>مشاهده همه در میز کار</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingNews.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-gray-700">تمام اخبار دریافت‌شده ترجمه شده‌اند!</p>
                <p className="text-[11px] text-gray-500 mt-1">صف ترجمه در حال حاضر خالی است.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingNews.slice(0, 5).map((item) => {
                  const isTranslating = translatingId === item.id;
                  const itemTime = item.published_at || item.scraped_at || item.created_at;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate dir-ltr text-right">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                          <span className="font-semibold text-orange-600">{item.source_name || 'RSS Feed'}</span>
                          <span>•</span>
                          <span>{itemTime ? new Date(itemTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : 'امروز'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSingleTranslate(item.id)}
                        disabled={isTranslating}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isTranslating ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{isTranslating ? 'در حال ترجمه...' : 'ترجمه AI'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Recent Approved News Ready for Review */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">آخرین ترجمه‌های آماده بررسی و انتشار</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {reviewNews.length} خبر
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('content-desk', 'review')}
                className="text-xs text-orange-600 hover:text-orange-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>مشاهده و بررسی</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {reviewNews.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-gray-600">خبر جدیدی در صف بررسی وجود ندارد.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviewNews.slice(0, 4).map((item) => {
                  const isDistributing = distributingId === item.id;
                  const isDistributed = distributedIds.includes(item.id) || (item.wp_sync_status === 'published' && item.telegram_sync_status === 'published');
                  const isWpPublished = item.wp_sync_status === 'published';
                  const isTelegramPublished = item.telegram_sync_status === 'published';

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl border border-emerald-100 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.translated_title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-gray-500 truncate font-mono dir-ltr text-right">{item.title}</p>
                          {isWpPublished && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                              سایت ✓
                            </span>
                          )}
                          {isTelegramPublished && (
                            <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                              تلگرام ✓
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDistributed ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>منتشر شد</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInstantDistribute(item.id)}
                            disabled={isDistributing}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {isDistributing ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>{isDistributing ? 'در حال ارسال...' : '🚀 ارسال به هر دو'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Recently Published News */}
          {publishedNews.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-gray-900">آخرین اخبار منتشر شده در مقاصد</h3>
                  <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {publishedNews.length} خبر منتشر شده
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab('content-desk', 'published')}
                  className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>مشاهده همه منتشر شده‌ها</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {publishedNews.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.translated_title || item.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {item.wp_sync_status === 'published' && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>سایت #{item.wp_post_id || 'OK'}</span>
                          </span>
                        )}
                        {item.telegram_sync_status === 'published' && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            <span>تلگرام #{item.telegram_message_id || 'OK'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab('content-desk')}
                      className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="مشاهده در میز تحریریه"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Live System Status & Audit Events */}
        <div className="space-y-6">
          {/* System Services Live Status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100 mb-3 flex items-center justify-between">
              <span>وضعیت سرویس‌های زنده</span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>آنلاین</span>
              </span>
            </h3>

            <div className="space-y-2.5">
              {/* RSS Scraper */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-gray-800">پایشگر RSS</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-800 rounded">
                  {activeSourcesCount} منبع فعال
                </span>
              </div>

              {/* AI Translator */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-gray-800">مترجم هوش مصنوعی</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                  Workers AI / Gemini
                </span>
              </div>

              {/* Cloudflare D1 */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-800">دیتابیس D1</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">
                  {stats?.articles_count ?? news.length} مقاله ثبت‌شده
                </span>
              </div>

              {/* WordPress */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-800">سایت وردپرس</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">
                  {stats?.wp_published_count ?? publishedNews.filter(n => n.wp_sync_status === 'published').length} منتشر شده
                </span>
              </div>

              {/* Telegram */}
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" />
                  <span className="font-semibold text-gray-800">کانال تلگرام</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded">
                  @updaaate_crypto
                </span>
              </div>
            </div>
          </div>

          {/* Live System Events & Audit Log Widget */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">رویدادهای زنده سیستم</h3>
              </div>
              <button
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>بروزرسانی</span>
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs">
                رویدادی برای نمایش ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-gray-50 rounded-lg text-right">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                      <span className="font-bold text-gray-700">{log.event_type}</span>
                      <span>{new Date(log.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-tight">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Info Banner */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold">سامانه پایش هوشمند هزاردستان</h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              معماری لبه (Edge) مبتنی بر Cloudflare Workers و دیتابیس D1. تمام اخبار در سرفصل‌های اختصاصی ترجمه و روی مقاصد وردپرسی و تلگرام منتشر می‌شوند.
            </p>
            <div className="mt-4 pt-3 border-t border-gray-700/80 flex items-center justify-between text-[11px] text-gray-400">
              <span>نسخه سامانه: ۱.۰.۱</span>
              <a
                href="https://updaaate.ir"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
              >
                <span>مشاهده وب‌سایت</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
