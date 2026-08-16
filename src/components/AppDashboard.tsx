import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, MainAppTab } from './Navbar';
import { DashboardTab } from './DashboardTab';
import { InputSourcesTab } from './InputSourcesTab';
import { ContentDeskTab } from './ContentDeskTab';
import { DestinationsTab } from './DestinationsTab';
import { ReportsLogsTab } from './ReportsLogsTab';
import { SystemAISettingsTab } from './SystemAISettingsTab';
import { JoinedArticleNews, SourceItem, StatsData, WorkerFileInfo } from '../types/client';

export const AppDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = (): MainAppTab => {
    const path = location.pathname.toLowerCase();
    if (path.includes('sources') || path.includes('rss') || path.includes('categories')) return 'sources';
    if (path.includes('content') || path.includes('news') || path.includes('desk') || path.includes('pending') || path.includes('review') || path.includes('archive')) return 'content-desk';
    if (path.includes('destinations') || path.includes('wordpress') || path.includes('wp') || path.includes('social') || path.includes('api')) return 'destinations';
    if (path.includes('reports') || path.includes('logs') || path.includes('distributions')) return 'reports';
    if (path.includes('settings') || path.includes('d1') || path.includes('database') || path.includes('users') || path.includes('prompts')) return 'settings';
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<MainAppTab>(getTabFromPath);
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    setActiveTabState(getTabFromPath());
  }, [location.pathname]);

  const handleNavigateTab = (tab: MainAppTab, subTab?: string) => {
    setActiveTabState(tab);
    if (subTab) setActiveSubTab(subTab);
    navigate(`/app/${tab}`);
  };

  const [news, setNews] = useState<JoinedArticleNews[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);

  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [loadingSources, setLoadingSources] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  const [newsError, setNewsError] = useState<boolean>(false);
  const [sourcesError, setSourcesError] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<boolean>(false);

  const [isTriggeringScraper, setIsTriggeringScraper] = useState<boolean>(false);
  const [isTriggeringTranslator, setIsTriggeringTranslator] = useState<boolean>(false);

  const [workerFiles] = useState<WorkerFileInfo[]>([
    { filename: 'wrangler.toml', language: 'toml', path: '/wrangler.toml' },
    { filename: 'src/types.ts', language: 'typescript', path: '/src/types.ts' },
    { filename: 'src/api/routes.ts', language: 'typescript', path: '/src/api/routes.ts' },
    { filename: 'src/cron/scraper.ts', language: 'typescript', path: '/src/cron/scraper.ts' },
    { filename: 'src/cron/translator.ts', language: 'typescript', path: '/src/cron/translator.ts' },
    { filename: 'src/index.ts', language: 'typescript', path: '/src/index.ts' },
  ]);

  // Fetch News from GET /api/news
  const fetchNews = async () => {
    setLoadingNews(true);
    setNewsError(false);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNews(json.data);
          setNewsError(false);
        } else {
          setNewsError(true);
        }
      } else {
        setNewsError(true);
      }
    } catch (e) {
      console.error('Error fetching news:', e);
      setNewsError(true);
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch Sources from GET /api/sources
  const fetchSources = async () => {
    setLoadingSources(true);
    setSourcesError(false);
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSources(json.data);
          setSourcesError(false);
        } else {
          setSourcesError(true);
        }
      } else {
        setSourcesError(true);
      }
    } catch (e) {
      console.error('Error fetching sources:', e);
      setSourcesError(true);
    } finally {
      setLoadingSources(false);
    }
  };

  // Fetch Stats from GET /api/stats
  const fetchStats = async (isPoll: boolean = false) => {
    if (!isPoll) setLoadingStats(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
          setStatsError(false);
        } else {
          if (!isPoll) setStatsError(true);
        }
      } else {
        if (!isPoll) setStatsError(true);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
      if (!isPoll) setStatsError(true);
    } finally {
      if (!isPoll) setLoadingStats(false);
    }
  };

  const refreshAllData = () => {
    fetchNews();
    fetchSources();
    fetchStats();
  };

  useEffect(() => {
    refreshAllData();
    
    // Live polling for stats
    const statsInterval = setInterval(() => {
      fetchStats(true);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(statsInterval);
  }, []);

  // Handlers
  const handleTriggerScraper = async () => {
    setIsTriggeringScraper(true);
    try {
      const res = await fetch('/api/trigger-scraper', { method: 'POST' });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error('Error triggering scraper:', e);
    } finally {
      setIsTriggeringScraper(false);
    }
  };

  const handleTriggerTranslator = async () => {
    setIsTriggeringTranslator(true);
    try {
      const res = await fetch('/api/trigger-translator', { method: 'POST' });
      if (res.ok) {
        refreshAllData();
      }
    } catch (e) {
      console.error('Error triggering translator:', e);
    } finally {
      setIsTriggeringTranslator(false);
    }
  };

  const handleTranslateArticle = async (id: number, model?: string) => {
    try {
      const res = await fetch(`/api/news/${id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNews();
        fetchStats();
        return data.data;
      }
    } catch (e) {
      console.error(`Error translating article ${id}:`, e);
    }
    return null;
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('آیا از حذف این خبر اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNews((prev) => prev.filter((n) => n.id !== id));
        fetchStats();
      }
    } catch (e) {
      console.error(`Error deleting article ${id}:`, e);
    }
  };

  const handleCreateCustomArticle = async (title: string, content: string, model?: string) => {
    try {
      const res = await fetch('/api/news/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, model }),
      });
      const data = await res.json();
      if (data.success) {
        refreshAllData();
        return true;
      }
    } catch (e) {
      console.error('Error creating custom article:', e);
    }
    return false;
  };

  const handleAddSource = async (name: string, url: string, category?: string) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, category }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSources();
        fetchStats();
        return true;
      }
    } catch (e) {
      console.error('Error adding source:', e);
    }
    return false;
  };

  const handleDeleteSource = async (id: number) => {
    if (!window.confirm('آیا از حذف این منبع خبری اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id));
        fetchStats();
      }
    } catch (e) {
      console.error(`Error deleting source ${id}:`, e);
    }
  };

  const handleUpdateSource = async (id: number, data: Partial<SourceItem>) => {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchSources();
        return true;
      }
    } catch (e) {
      console.error(`Error updating source ${id}:`, e);
    }
    return false;
  };

  const handleBulkDeleteSources = async (ids: number[]) => {
    if (!window.confirm(`آیا از حذف گروهی ${ids.length} منبع خبر اطمینان دارید؟`)) return false;
    try {
      const res = await fetch('/api/sources/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (json.success) {
        fetchSources();
        fetchStats();
        return true;
      }
    } catch (e) {
      console.error('Error bulk deleting sources:', e);
    }
    return false;
  };

  const handleBulkToggleStatus = async (ids: number[], active: boolean) => {
    try {
      const res = await fetch('/api/sources/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, is_active: active }),
      });
      const json = await res.json();
      if (json.success) {
        fetchSources();
        return true;
      }
    } catch (e) {
      console.error('Error bulk toggling status:', e);
    }
    return false;
  };

  const handleScrapeSource = async (id: number) => {
    try {
      const res = await fetch(`/api/sources/${id}/scrape`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
      }
    } catch (e) {
      console.error(`Error scraping source ${id}:`, e);
    }
  };

  const handleTestFeed = async (url: string) => {
    try {
      const res = await fetch('/api/sources/test-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return { isValid: false, errorDetails: json.error || 'خطا در بررسی فید' };
    } catch (e) {
      console.error('Error testing feed:', e);
      return { isValid: false, errorDetails: 'خطا در ارتباط با سرور' };
    }
  };

  const handleResetDatabase = async (options: {
    clearSources?: boolean;
    clearArticles?: boolean;
    clearTranslations?: boolean;
    clearApprovedTranslations?: boolean;
    clearPendingTranslations?: boolean;
    clearLogs?: boolean;
    target?: string;
    reseed?: boolean;
  }) => {
    try {
      const res = await fetch('/api/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
        return json.data;
      }
    } catch (e) {
      console.error('Error resetting database:', e);
    }
    return null;
  };

  const pendingCount = news.filter((n) => n.translation_status === 'pending' || !n.translated_title).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dir-rtl font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Main Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => handleNavigateTab(t)}
        onRefreshAll={refreshAllData}
        isRefreshing={loadingNews || loadingSources || loadingStats}
        onGoHome={() => navigate('/')}
        pendingCount={pendingCount}
      />

      {/* Main App Canvas */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: 🏠 Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            loadingStats={loadingStats}
            statsError={statsError}
            onRetryStats={() => fetchStats(false)}
            onRefreshAll={refreshAllData}
            news={news}
            sources={sources}
            onTriggerScraper={handleTriggerScraper}
            onTriggerTranslator={handleTriggerTranslator}
            onNavigateTab={handleNavigateTab}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
            onTranslateArticle={handleTranslateArticle}
          />
        )}

        {/* Tab 2: 📥 Input Sources */}
        {activeTab === 'sources' && (
          <InputSourcesTab
            sources={sources}
            loading={loadingSources}
            error={sourcesError}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onUpdateSource={handleUpdateSource}
            onBulkDeleteSources={handleBulkDeleteSources}
            onBulkToggleStatus={handleBulkToggleStatus}
            onScrapeSource={handleScrapeSource}
            onTestFeed={handleTestFeed}
            onRefresh={fetchSources}
            initialSubTab={(activeSubTab as any) || 'connectors'}
          />
        )}

        {/* Tab 3: 📝 Content Desk */}
        {activeTab === 'content-desk' && (
          <ContentDeskTab
            news={news}
            loading={loadingNews}
            error={newsError}
            onRefresh={fetchNews}
            onTriggerScraper={handleTriggerScraper}
            onTriggerTranslator={handleTriggerTranslator}
            onTranslateArticle={handleTranslateArticle}
            onDeleteArticle={handleDeleteArticle}
            onCreateCustomArticle={handleCreateCustomArticle}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
            onNavigateTab={handleNavigateTab}
            initialSubTab={(activeSubTab as any) || 'queue'}
          />
        )}

        {/* Tab 4: 📤 Destinations & Distribution */}
        {activeTab === 'destinations' && (
          <DestinationsTab
            onRefreshAll={refreshAllData}
            initialSubTab={(activeSubTab as any) || 'wordpress'}
          />
        )}

        {/* Tab 5: 📊 Reports & System Logs */}
        {activeTab === 'reports' && (
          <ReportsLogsTab
            onTriggerScraper={handleTriggerScraper}
            onTriggerTranslator={handleTriggerTranslator}
            onResetDatabase={handleResetDatabase}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
            workerFiles={workerFiles}
            initialSubTab={(activeSubTab as any) || 'tracing'}
          />
        )}

        {/* Tab 6: ⚙️ System & AI Settings */}
        {activeTab === 'settings' && (
          <SystemAISettingsTab
            onTriggerScraper={handleTriggerScraper}
            onTriggerTranslator={handleTriggerTranslator}
            onResetDatabase={handleResetDatabase}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
            workerFiles={workerFiles}
            sources={sources}
            news={news}
            stats={stats}
            onRefreshAll={refreshAllData}
            onAddSource={handleAddSource}
            onUpdateSource={handleUpdateSource}
            onDeleteSource={handleDeleteSource}
            onDeleteArticle={handleDeleteArticle}
            initialSubTab={(activeSubTab as any) || 'engine'}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <p>
          ۱۰۰۰ دستان (1000 Dastan) • سامانه هوشمند پایش اخبار و ترجمه AI • Cloudflare Workers & D1
        </p>
      </footer>
    </div>
  );
};
