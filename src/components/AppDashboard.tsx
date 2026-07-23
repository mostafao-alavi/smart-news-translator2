import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { StatsOverview } from './StatsOverview';
import { NewsFeedTab } from './NewsFeedTab';
import { SourcesTab } from './SourcesTab';
import { SettingsTab } from './SettingsTab';
import { JoinedArticleNews, SourceItem, StatsData, WorkerFileInfo } from '../types/client';

export const AppDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = (): 'news' | 'sources' | 'settings' => {
    const path = location.pathname.toLowerCase();
    if (path.includes('sources')) return 'sources';
    if (path.includes('settings') || path.includes('cron') || path.includes('code')) return 'settings';
    return 'news';
  };

  const [activeTab, setActiveTabState] = useState<'news' | 'sources' | 'settings'>(getTabFromPath);

  useEffect(() => {
    setActiveTabState(getTabFromPath());
  }, [location.pathname]);

  const setActiveTab = (tab: 'news' | 'sources' | 'settings') => {
    setActiveTabState(tab);
    navigate(`/app/${tab}`);
  };

  const [news, setNews] = useState<JoinedArticleNews[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);

  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [loadingSources, setLoadingSources] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

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
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setNews(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching news:', e);
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch Sources from GET /api/sources
  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSources(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching sources:', e);
    } finally {
      setLoadingSources(false);
    }
  };

  // Fetch Stats from GET /api/stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const refreshAllData = () => {
    fetchNews();
    fetchSources();
    fetchStats();
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Add Source via POST /api/sources
  const handleAddSource = async (
    name: string,
    url: string,
    language: string = 'en',
    category: string = 'general',
    selector?: string,
    scrape_limit: number = 10,
    is_active: boolean = true
  ) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, language, category, selector, scrape_limit, is_active }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        fetchSources();
        fetchStats();
        return true;
      }
    } catch (e) {
      console.error('Error adding source:', e);
    }
    return false;
  };

  // Update Source via PUT /api/sources/:id
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
      console.error('Error updating source:', e);
    }
    return false;
  };

  // Bulk Delete Sources via POST /api/sources/bulk-delete
  const handleBulkDeleteSources = async (ids: number[]) => {
    try {
      const res = await fetch('/api/sources/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
        return true;
      }
    } catch (e) {
      console.error('Error bulk deleting sources:', e);
    }
    return false;
  };

  // Bulk Status Toggle via POST /api/sources/bulk-status
  const handleBulkToggleStatus = async (ids: number[], is_active: boolean) => {
    try {
      const res = await fetch('/api/sources/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, is_active }),
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

  // Delete Single Source via DELETE /api/sources/:id
  const handleDeleteSource = async (id: number) => {
    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
      }
    } catch (e) {
      console.error('Error deleting source:', e);
    }
  };

  // Delete Article via DELETE /api/news/:id
  const handleDeleteArticle = async (id: number) => {
    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
      }
    } catch (e) {
      console.error('Error deleting article:', e);
    }
  };

  // Translate or Re-translate single article via POST /api/news/:id/translate
  const handleTranslateArticle = async (id: number, model?: string) => {
    try {
      const res = await fetch(`/api/news/${id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
        return json.data;
      }
    } catch (e) {
      console.error('Error translating single article:', e);
    }
    return null;
  };

  // Create custom article via POST /api/news/custom
  const handleCreateCustomArticle = async (title: string, content: string, model?: string) => {
    try {
      const res = await fetch('/api/news/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, model }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        refreshAllData();
        return true;
      }
    } catch (e) {
      console.error('Error creating custom article:', e);
    }
    return false;
  };

  // Scrape single source via POST /api/sources/:id/scrape
  const handleScrapeSource = async (id: number) => {
    try {
      const res = await fetch(`/api/sources/${id}/scrape`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
        return json.data;
      }
    } catch (e) {
      console.error('Error scraping source:', e);
    }
    return null;
  };

  // Test RSS feed connection via POST /api/sources/test-feed
  const handleTestFeed = async (url: string) => {
    try {
      const res = await fetch('/api/sources/test-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return json.data;
      }
    } catch (e) {
      console.error('Error testing RSS feed:', e);
    }
    return null;
  };

  // Trigger Scraper
  const handleTriggerScraper = async () => {
    setIsTriggeringScraper(true);
    try {
      const res = await fetch('/api/trigger-scraper', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
        return json.data;
      }
    } catch (e) {
      console.error('Error triggering scraper:', e);
    } finally {
      setIsTriggeringScraper(false);
    }
    return null;
  };

  // Trigger Translator
  const handleTriggerTranslator = async () => {
    setIsTriggeringTranslator(true);
    try {
      const res = await fetch('/api/trigger-translator', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        refreshAllData();
        return json.data;
      }
    } catch (e) {
      console.error('Error triggering translator:', e);
    } finally {
      setIsTriggeringTranslator(false);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dir-rtl font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefreshAll={refreshAllData}
        isRefreshing={loadingNews || loadingSources || loadingStats}
        onGoHome={() => navigate('/')}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top Summary Metrics */}
        <StatsOverview stats={stats} loading={loadingStats} />

        {/* Tab Content */}
        {activeTab === 'news' && (
          <NewsFeedTab
            news={news}
            loading={loadingNews}
            onRefresh={fetchNews}
            onTriggerScraper={handleTriggerScraper}
            onTriggerTranslator={handleTriggerTranslator}
            onTranslateArticle={handleTranslateArticle}
            onDeleteArticle={handleDeleteArticle}
            onCreateCustomArticle={handleCreateCustomArticle}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
          />
        )}

        {activeTab === 'sources' && (
          <SourcesTab
            sources={sources}
            loading={loadingSources}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onUpdateSource={handleUpdateSource}
            onBulkDeleteSources={handleBulkDeleteSources}
            onBulkToggleStatus={handleBulkToggleStatus}
            onScrapeSource={handleScrapeSource}
            onTestFeed={handleTestFeed}
            onRefresh={fetchSources}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            onTriggerScraper={handleTriggerScraper}
            onTriggerTranslator={handleTriggerTranslator}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
            workerFiles={workerFiles}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <p>
          پلتفرم ۱۰۰۰ دستان (1000 Dastan) • سامانه هوشمند پایش اخبار و ترجمه AI • Cloudflare Workers & D1
        </p>
      </footer>
    </div>
  );
};
