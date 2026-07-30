import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  Share2,
  Rss,
  Languages,
  FileText,
  Activity,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  Globe,
  Send,
  Eye,
  Check,
  Layers,
  Lock,
  Server,
  Filter,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { DistributionItem, SourceItem, JoinedArticleNews, StatsData, AuthStatusInfo, ExecutionLogItem, SystemEventItem, PlatformItem } from '../types/client';

interface D1ManagerTabProps {
  sources: SourceItem[];
  news: JoinedArticleNews[];
  stats: StatsData | null;
  onRefreshAll: () => void;
  onAddSource: (name: string, url: string, language?: string, category?: string, selector?: string, scrape_limit?: number, is_active?: boolean) => Promise<{ success: boolean; error?: string }>;
  onUpdateSource: (id: number, data: Partial<SourceItem>) => Promise<boolean>;
  onDeleteSource: (id: number) => Promise<void>;
  onDeleteArticle: (id: number) => Promise<void>;
}

export const D1ManagerTab: React.FC<D1ManagerTabProps> = ({
  sources,
  news,
  stats,
  onRefreshAll,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
  onDeleteArticle,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'endpoints' | 'translations' | 'sources' | 'distributions' | 'articles' | 'logs'>('endpoints');

  // Data states
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogItem[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEventItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Modals state
  const [showAddPlatformModal, setShowAddPlatformModal] = useState<boolean>(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformItem | null>(null);
  const [showAddDistModal, setShowAddDistModal] = useState<boolean>(false);
  const [editingDist, setEditingDist] = useState<DistributionItem | null>(null);
  const [editingTrans, setEditingTrans] = useState<any | null>(null);
  const [editingArticle, setEditingArticle] = useState<JoinedArticleNews | null>(null);
  const [previewContentModal, setPreviewContentModal] = useState<{ title: string; content: string; lang: 'fa' | 'en' } | null>(null);

  // Form state for Platform
  const [platformForm, setPlatformForm] = useState({
    name: '',
    slug: '',
    platform_type: 'wordpress' as PlatformItem['platform_type'],
    api_url: '',
    auth_username: '',
    auth_password_secret: '',
  });

  // Form states for Distribution
  const [distForm, setDistForm] = useState({
    translation_id: '',
    target_platform: 'updaaate_ir',
    author_name: 'هزاردستان ورکر',
    platform_post_id: '',
  });

  // Action feedback states
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch Platforms
  const fetchPlatforms = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/platforms');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPlatforms(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching platforms:', e);
    } fontally: {
      setLoadingData(false);
    }
  };

  // Fetch Distributions
  const fetchDistributions = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/distributions');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDistributions(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching distributions:', e);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch Translations
  const fetchTranslations = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/translations');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTranslations(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching translations:', e);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch Execution Logs & Events
  const fetchLogs = async () => {
    setLoadingData(true);
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
      setLoadingData(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchPlatforms();
    if (activeSubTab === 'distributions') fetchDistributions();
    if (activeSubTab === 'translations') fetchTranslations();
    if (activeSubTab === 'logs') fetchLogs();
  }, [activeSubTab]);

  // Handle Add/Edit Platform
  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformForm.name || !platformForm.api_url) return;

    setIsSubmitting(true);
    try {
      const url = editingPlatform ? `/api/platforms/${editingPlatform.id}` : '/api/platforms';
      const method = editingPlatform ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionStatus({ type: 'success', message: editingPlatform ? 'مشخصات پلتفرم مقصد بروز شد.' : 'پلتفرم مقصد جدید با موفقیت اضافه شد.' });
        setShowAddPlatformModal(false);
        setEditingPlatform(null);
        setPlatformForm({ name: '', slug: '', platform_type: 'wordpress', api_url: '', auth_username: '', auth_password_secret: '' });
        fetchPlatforms();
      } else {
        setActionStatus({ type: 'error', message: json.error || 'خطا در ثبت پلتفرم مقصد' });
      }
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'خطا در اتصال به سرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Platform Active State
  const handleTogglePlatform = async (id: number) => {
    try {
      const res = await fetch(`/api/platforms/${id}/toggle`, { method: 'PUT' });
      const json = await res.json();
      if (json.success) {
        fetchPlatforms();
        setActionStatus({ type: 'success', message: 'وضعیت پلتفرم تغییر کرد.' });
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    }
  };

  // Delete Platform
  const handleDeletePlatform = async (id: number) => {
    if (!window.confirm('آیا از حذف این پلتفرم مقصد اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/platforms/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActionStatus({ type: 'success', message: 'پلتفرم مقصد حذف شد.' });
        fetchPlatforms();
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    }
  };

  // Handle Approval Action for Translation
  const handleApproveTranslation = async (id: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/translations/${id}/approve`, { method: 'PUT' });
      const json = await res.json();
      if (json.success) {
        setActionStatus({ type: 'success', message: `ترجمه #${id} با موفقیت تایید شد و آماده ارسال به کل پلتفرم‌ها است.` });
        fetchTranslations();
      } else {
        setActionStatus({ type: 'error', message: json.error || 'خطا در تایید ترجمه' });
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject Action for Translation
  const handleRejectTranslation = async (id: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/translations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: 'rejected' }),
      });
      const json = await res.json();
      if (json.success) {
        setActionStatus({ type: 'success', message: `ترجمه #${id} رد شد.` });
        fetchTranslations();
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve & Distribute Immediately to All Active Platforms
  const handleApproveAndDistribute = async (id: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/translations/${id}/approve-and-distribute`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const count = json.data?.result?.successCount || 0;
        setActionStatus({ type: 'success', message: `ترجمه #${id} تایید گردید و بلافاصله به ${count} پلتفرم فعال ارسال شد!` });
        fetchTranslations();
        fetchDistributions();
      } else {
        setActionStatus({ type: 'error', message: json.error || 'خطا در ارسال پلتفرم‌ها' });
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Distribution
  const handleSaveDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distForm.translation_id || !distForm.target_platform) return;

    setIsSubmitting(true);
    try {
      const url = editingDist ? `/api/distributions/${editingDist.id}` : '/api/distributions';
      const method = editingDist ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translation_id: parseInt(distForm.translation_id, 10),
          target_platform: distForm.target_platform,
          author_name: distForm.author_name,
          platform_post_id: distForm.platform_post_id,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionStatus({ type: 'success', message: editingDist ? 'رکورد توزیع ویرایش شد.' : 'رکورد جدید توزیع با موفقیت ثبت گردید.' });
        setShowAddDistModal(false);
        setEditingDist(null);
        setDistForm({ translation_id: '', target_platform: 'updaaate_ir', author_name: 'هزاردستان ورکر', platform_post_id: '' });
        fetchDistributions();
        onRefreshAll();
      } else {
        setActionStatus({ type: 'error', message: json.error || 'خطا در ثبت توزیع محتوا' });
      }
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'خطا در اتصال به سرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Distribution
  const handleDeleteDistribution = async (id: number) => {
    if (!window.confirm('آیا از حذف این رکورد توزیع محتوا اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/distributions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActionStatus({ type: 'success', message: 'رکورد توزیع حذف شد.' });
        fetchDistributions();
        onRefreshAll();
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    }
  };

  // Handle Edit Translation
  const handleSaveTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrans) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/translations/${editingTrans.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translated_title: editingTrans.translated_title,
          translated_content: editingTrans.translated_content,
          target_language: editingTrans.target_language || 'persian',
          approval_status: editingTrans.approval_status || 'approved',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionStatus({ type: 'success', message: 'ترجمه مقاله با موفقیت بروزرسانی شد.' });
        setEditingTrans(null);
        fetchTranslations();
        onRefreshAll();
      } else {
        setActionStatus({ type: 'error', message: json.error || 'خطا در به روزرسانی ترجمه' });
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Translation
  const handleDeleteTranslation = async (id: number) => {
    if (!window.confirm('آیا از حذف این ترجمه مطمئن هستید؟ (رکوردهای توزیع وابسته نیز حذف خواهند شد)')) return;
    try {
      const res = await fetch(`/api/translations/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActionStatus({ type: 'success', message: 'ترجمه مقاله حذف گردید.' });
        fetchTranslations();
        onRefreshAll();
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: e.message });
    }
  };

  // Filtered Platforms
  const filteredPlatforms = platforms.filter((p) =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.api_url || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered Distributions
  const filteredDistributions = distributions.filter((d) => {
    const matchesSearch =
      (d.translated_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.platform_post_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.author_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || d.target_platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  // Filtered Translations
  const filteredTranslations = translations.filter((t) => {
    const matchesSearch =
      (t.translated_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.original_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.source_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = t.approval_status || 'approved';
    const matchesApproval = approvalFilter === 'all' || status === approvalFilter;
    return matchesSearch && matchesApproval;
  });

  // Filtered Articles
  const filteredArticles = news.filter((a) =>
    (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.source_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.original_url || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Helper
  const paginate = (items: any[]) => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Cloudflare D1 Status & Control Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30 text-orange-400 shrink-0 mt-0.5">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight text-white font-sans">
                  میز کار مدیریت «هزاردستان» و دیتابیس Cloudflare D1
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  معماری چندمقصده (Multi-Platform Hub)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                مدیریت پلتفرم‌های مقصد، بررسی و تایید ترجمه‌های هوش مصنوعی، و توزیع خودکار محتوا به چندین وب‌سایت و کانال.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                onRefreshAll();
                fetchPlatforms();
                if (activeSubTab === 'distributions') fetchDistributions();
                if (activeSubTab === 'translations') fetchTranslations();
                if (activeSubTab === 'logs') fetchLogs();
              }}
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-orange-600/20 flex items-center gap-1.5 min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span>بروزرسانی داده‌ها</span>
            </button>
          </div>
        </div>

        {/* Database Meta Stats Bar */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">ادمین سیستم:</span>
            <span className="font-mono text-emerald-400 font-semibold truncate block mt-0.5">
              paktia96@gmail.com
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">پلتفرم‌های فعال:</span>
            <span className="font-bold text-amber-300 block mt-0.5 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              {platforms.filter(p => p.is_active).length} پلتفرم مقصد
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">ترجمه‌های در انتظار تایید:</span>
            <span className="font-bold text-yellow-400 block mt-0.5">
              {translations.filter(t => t.approval_status === 'pending').length} خبر در صف
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">توزیع‌های ثبت‌شده (Distributions):</span>
            <span className="font-bold text-emerald-400 block mt-0.5">
              {stats?.distributions_count || distributions.length} مقاله منتشر شده
            </span>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">موتور دیتابیس:</span>
            <span className="font-semibold text-indigo-300 block mt-0.5 flex items-center gap-1">
              <Database className="w-3 h-3" /> Cloudflare D1
            </span>
          </div>
        </div>
      </div>

      {/* Action Status Feedback Alert */}
      {actionStatus && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            actionStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionStatus.message}</span>
          </div>
          <button onClick={() => setActionStatus(null)} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
      )}

      {/* Database Sub-Tab Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveSubTab('endpoints')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[42px] ${
              activeSubTab === 'endpoints'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>پلتفرم‌های مقصد (Endpoints)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-full text-[11px]">
              {platforms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('translations')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[42px] ${
              activeSubTab === 'translations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>میز کار بررسی و تایید ترجمه‌ها</span>
            {translations.filter(t => t.approval_status === 'pending').length > 0 && (
              <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {translations.filter(t => t.approval_status === 'pending').length} جدید
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('distributions')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[42px] ${
              activeSubTab === 'distributions'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>توزیع و انتشار (Distributions)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-full text-[11px]">
              {distributions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('sources')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[42px] ${
              activeSubTab === 'sources'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 font-bold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Rss className="w-4 h-4" />
            <span>منابع خبری (sources)</span>
            <span className="bg-black/20 text-white px-2 py-0.5 rounded-full text-[11px]">
              {sources.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('articles')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[42px] ${
              activeSubTab === 'articles'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>مقالات اصلی (articles)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 min-h-[42px] ${
              activeSubTab === 'logs'
                ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20 font-bold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>لاگ‌های اجرا (logs)</span>
          </button>
        </div>

        {/* Global Table Filter / Search */}
        <div className="relative min-w-[200px] sm:min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در داده‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
          />
        </div>
      </div>

      {/* SUB-TAB 1: ENDPOINTS / PLATFORMS (مدیریت چندمقصده) */}
      {activeSubTab === 'endpoints' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                مدیریت پلتفرم‌های مقصد (Multi-Platform Architecture)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                تعریف سایت‌های وردپرسی، وب‌هوک‌ها، اپلیکیشن‌ها و کانال‌های تلگرام جهت ارسال خودکار محتوا توسط ورکر «هزاردستان».
              </p>
            </div>

            <button
              onClick={() => {
                setEditingPlatform(null);
                setPlatformForm({ name: '', slug: '', platform_type: 'wordpress', api_url: '', auth_username: '', auth_password_secret: '' });
                setShowAddPlatformModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن پلتفرم مقصد جدید</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm text-gray-700">
              <thead className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">ID</th>
                  <th className="py-3.5 px-4">نام پلتفرم / شناسه</th>
                  <th className="py-3.5 px-4">نوع سرویس (Type)</th>
                  <th className="py-3.5 px-4">آدرس API / Webhook Endpoint</th>
                  <th className="py-3.5 px-4">نام کاربری اتصال</th>
                  <th className="py-3.5 px-4 text-center">وضعیت (Active)</th>
                  <th className="py-3.5 px-4 text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlatforms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      هیچ پلتفرم مقصدی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  filteredPlatforms.map((plat) => (
                    <tr key={plat.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-500 bg-gray-50/50">
                        #{plat.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{plat.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">slug: {plat.slug}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2.5 py-1 rounded-lg font-bold">
                          {plat.platform_type.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 dir-ltr text-left font-mono text-xs text-blue-600 max-w-xs truncate">
                        <a href={plat.api_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {plat.api_url}
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 font-mono">
                        {plat.auth_username || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleTogglePlatform(plat.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto ${
                            plat.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {plat.is_active ? (
                            <>
                              <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                              <span>فعال (Active)</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3 text-rose-600 fill-rose-600" />
                              <span>متوقف (Paused)</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPlatform(plat);
                              setPlatformForm({
                                name: plat.name,
                                slug: plat.slug,
                                platform_type: plat.platform_type,
                                api_url: plat.api_url,
                                auth_username: plat.auth_username || '',
                                auth_password_secret: plat.auth_password_secret || '',
                              });
                              setShowAddPlatformModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ویرایش پلتفرم"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeletePlatform(plat.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف پلتفرم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TRANSLATIONS WORKSPACE (میز کار بررسی و تایید ترجمه‌ها) */}
      {activeSubTab === 'translations' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Languages className="w-5 h-5 text-indigo-600" />
                میز کار بررسی، ویرایش و تایید ترجمه‌ها (Translation Approval Workspace)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                تیم محتوا در این بخش ترجمه‌های هوش مصنوعی را ویرایش، تایید یا رد می‌کند. ورکر توزیع فقط ترجمه‌های تاییدشده را ارسال می‌نماید.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">فیلتر وضعیت:</span>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار تایید تیم محتوا</option>
                <option value="approved">تایید شده (جاهای انتشار آماده)</option>
                <option value="rejected">رد شده</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm text-gray-700">
              <thead className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">ID</th>
                  <th className="py-3.5 px-4">عنوان ترجمه شده (فارسی)</th>
                  <th className="py-3.5 px-4">مدل AI</th>
                  <th className="py-3.5 px-4 text-center">وضعیت تایید (Status)</th>
                  <th className="py-3.5 px-4">زمان ترجمه</th>
                  <th className="py-3.5 px-4 text-center">عملیات تایید و انتشار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTranslations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      ترجمه‌ای با این مشخصات یافت نشد.
                    </td>
                  </tr>
                ) : (
                  paginate(filteredTranslations).map((t) => {
                    const status = t.approval_status || 'approved';
                    return (
                      <tr key={t.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-500">
                          #{t.id}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                          <div className="font-bold text-gray-900 leading-snug">{t.translated_title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            اصل: {t.original_title} (منبع: {t.source_name || 'خارجی'})
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-mono">
                            {t.model_used || 'Workers AI'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {status === 'approved' && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              تایید شده
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              در انتظار بررسی
                            </span>
                          )}
                          {status === 'rejected' && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              رد شده
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {t.translated_at ? new Date(t.translated_at).toLocaleString('fa-IR') : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() =>
                                setPreviewContentModal({
                                  title: t.translated_title,
                                  content: t.translated_content,
                                  lang: 'fa',
                                })
                              }
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="مشاهده متن کامل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditingTrans(t)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ویرایش عنوان و متن ترجمه"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {status !== 'approved' && (
                              <button
                                onClick={() => handleApproveTranslation(t.id)}
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg transition-all font-bold flex items-center gap-1 shadow-xs"
                                title="تایید جهت انتشار در سیستم"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>تایید</span>
                              </button>
                            )}

                            {status !== 'rejected' && (
                              <button
                                onClick={() => handleRejectTranslation(t.id)}
                                disabled={isSubmitting}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs px-2 py-1 rounded-lg transition-all font-bold"
                                title="رد ترجمه"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={() => handleApproveAndDistribute(t.id)}
                              disabled={isSubmitting}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-2.5 py-1 rounded-lg transition-all font-bold flex items-center gap-1 shadow-xs"
                              title="تایید و انتشار آنی به کل پلتفرم‌های مقصد"
                            >
                              <Send className="w-3 h-3" />
                              <span>تایید و ارسال آنی</span>
                            </button>

                            <button
                              onClick={() => handleDeleteTranslation(t.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="حذف رکورد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredTranslations.length > pageSize && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-600">
              <div>
                نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, filteredTranslations.length)} از {filteredTranslations.length} ترجمه
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold disabled:opacity-40"
                >
                  صفحه قبل
                </button>
                <span className="font-bold">{currentPage}</span>
                <button
                  disabled={currentPage * pageSize >= filteredTranslations.length}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold disabled:opacity-40"
                >
                  صفحه بعد
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: DISTRIBUTIONS (گزارش‌های توزیع) */}
      {activeSubTab === 'distributions' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-500" />
                گزارشات و تاریخچه توزیع محتوا (distributions)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                لاگ دقیق ارسال اخبار ترجمه‌شده به پلتفرم‌های مقصد همراه با فیلتر پلتفرم و شناسه پست.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">همه پلتفرم‌ها</option>
                <option value="updaaate_ir">updaaate.ir (WordPress)</option>
                <option value="site_b_tech">وب‌سایت خبری B</option>
                <option value="telegram_news">کانال تلگرام</option>
              </select>

              <button
                onClick={() => {
                  setEditingDist(null);
                  setDistForm({ translation_id: '', target_platform: 'updaaate_ir', author_name: 'هزاردستان ورکر', platform_post_id: '' });
                  setShowAddDistModal(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت دستی توزیع</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm text-gray-700">
              <thead className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">ID</th>
                  <th className="py-3.5 px-4">عنوان مقاله و ترجمه</th>
                  <th className="py-3.5 px-4">پلتفرم مقصد</th>
                  <th className="py-3.5 px-4">نویسنده / منبع</th>
                  <th className="py-3.5 px-4">شناسه پست (platform_post_id)</th>
                  <th className="py-3.5 px-4">تاریخ انتشار</th>
                  <th className="py-3.5 px-4 text-center">عملیات CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDistributions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      هیچ رکوردی در جدول distributions یافت نشد.
                    </td>
                  </tr>
                ) : (
                  paginate(filteredDistributions).map((dist) => (
                    <tr key={dist.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-500 bg-gray-50/50">
                        #{dist.id}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-gray-900 line-clamp-1">
                          {dist.translated_title || dist.original_title || `ترجمه #${dist.translation_id}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                          <Globe className="w-3 h-3 text-amber-600" />
                          {dist.target_platform}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {dist.author_name || 'ورکر هزاردستان'}
                      </td>

                      <td className="py-3.5 px-4">
                        {dist.platform_post_id ? (
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                              ID: {dist.platform_post_id}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">ثبت نشده</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        {dist.published_at ? new Date(dist.published_at).toLocaleString('fa-IR') : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDeleteDistribution(dist.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف رکورد توزیع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SOURCES (جدول منابع) */}
      {activeSubTab === 'sources' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Rss className="w-5 h-5 text-orange-600" />
                مدیریت مستقیم جدول منابع (sources)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                تعریف فیدهای RSS جدید، تغییر فعال/غیرفعال بودن، حد پایش خودکار و سسکتورهای CSS ویژه.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm text-gray-700">
              <thead className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">ID</th>
                  <th className="py-3.5 px-4">نام منبع</th>
                  <th className="py-3.5 px-4">آدرس فید RSS</th>
                  <th className="py-3.5 px-4">دسته‌بندی</th>
                  <th className="py-3.5 px-4">حد پایش (scrape_limit)</th>
                  <th className="py-3.5 px-4 text-center">وضعیت (is_active)</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sources.map((src) => (
                  <tr key={src.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-500">
                      #{src.id}
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900">
                      {src.name}
                    </td>

                    <td className="py-3 px-4 dir-ltr text-left font-mono text-xs text-blue-600 max-w-xs truncate">
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {src.url}
                      </a>
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-lg">
                        {src.category || 'عمومی'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-gray-700">
                      {src.scrape_limit || 10} خبر
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onUpdateSource(src.id, { is_active: !src.is_active })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          src.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {src.is_active ? 'فعال (Active)' : 'غیرفعال (Inactive)'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteSource(src.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف منبع از D1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: ARTICLES (جدول مقالات اصلی) */}
      {activeSubTab === 'articles' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                جدول مقالات پایش‌شده (articles)
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm text-gray-700">
              <thead className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">ID</th>
                  <th className="py-3.5 px-4">عنوان اصلی (انگلیسی)</th>
                  <th className="py-3.5 px-4">منبع خبر</th>
                  <th className="py-3.5 px-4 text-center">وضعیت ترجمه</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginate(filteredArticles).map((art) => (
                  <tr key={art.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-500">
                      #{art.id}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-bold text-gray-900 dir-ltr text-left leading-snug">
                        {art.title}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      {art.source_name}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          art.translation_status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {art.translation_status === 'completed' ? 'ترجمه شده' : 'در انتظار ترجمه'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onDeleteArticle(art.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف مقاله"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: LOGS & EVENTS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-slate-800" />
              لاگ‌های اجرای کارها در ورکر (execution_logs)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-right text-xs sm:text-sm text-gray-700">
                <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">نوع کار</th>
                    <th className="py-3 px-4 text-center">وضعیت</th>
                    <th className="py-3 px-4">تعداد پردازش</th>
                    <th className="py-3 px-4">تعداد موفق</th>
                    <th className="py-3 px-4">زمان اجرا (ms)</th>
                    <th className="py-3 px-4">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {executionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-gray-800 font-bold">{log.task_type}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{log.items_processed}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{log.items_success}</td>
                      <td className="py-3 px-4 font-mono">{log.duration_ms} ms</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(log.executed_at).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PLATFORM */}
      {showAddPlatformModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dir-rtl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-600" />
              {editingPlatform ? 'ویرایش مشخصات پلتفرم مقصد' : 'افزودن پلتفرم مقصد جدید (Endpoint)'}
            </h3>

            <form onSubmit={handleSavePlatform} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-gray-700 font-bold mb-1">نام پلتفرم *</label>
                <input
                  type="text"
                  required
                  value={platformForm.name}
                  onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
                  placeholder="مثلاً: وب‌سایت خبری B یا کانال تلگرام اصلی"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">شناسه اختصاصی (slug)</label>
                <input
                  type="text"
                  value={platformForm.slug}
                  onChange={(e) => setPlatformForm({ ...platformForm, slug: e.target.value })}
                  placeholder="مثلاً: site_b_tech"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">نوع پلتفرم (Platform Type) *</label>
                <select
                  value={platformForm.platform_type}
                  onChange={(e: any) => setPlatformForm({ ...platformForm, platform_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  <option value="wordpress">WordPress REST API</option>
                  <option value="webhook">Custom Webhook (POST JSON)</option>
                  <option value="rest_api">Standard REST Endpoint</option>
                  <option value="telegram">Telegram Bot API</option>
                  <option value="bale">Bale Messenger Bot API</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">آدرس endpoint / API URL *</label>
                <input
                  type="url"
                  required
                  value={platformForm.api_url}
                  onChange={(e) => setPlatformForm({ ...platformForm, api_url: e.target.value })}
                  placeholder="https://site-b.ir/wp-json/wp/v2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono dir-ltr text-left"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">نام کاربری احراز هویت (در صورت وجود)</label>
                <input
                  type="text"
                  value={platformForm.auth_username}
                  onChange={(e) => setPlatformForm({ ...platformForm, auth_username: e.target.value })}
                  placeholder="admin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono dir-ltr text-left"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">رمز عبور برنامه / کلید API (Application Password)</label>
                <input
                  type="password"
                  value={platformForm.auth_password_secret}
                  onChange={(e) => setPlatformForm({ ...platformForm, auth_password_secret: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono dir-ltr text-left"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPlatformModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20"
                >
                  {isSubmitting ? 'در حال ذخیره‌سازی...' : 'ذخیره پلتفرم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT DISTRIBUTION */}
      {showAddDistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dir-rtl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-500" />
              {editingDist ? 'ویرایش رکورد توزیع محتوا' : 'افزودن دستی رکورد توزیع محتوا (distributions)'}
            </h3>

            <form onSubmit={handleSaveDistribution} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-gray-700 font-bold mb-1">شناسه ترجمه (translation_id) *</label>
                <input
                  type="number"
                  required
                  value={distForm.translation_id}
                  onChange={(e) => setDistForm({ ...distForm, translation_id: e.target.value })}
                  placeholder="مثلاً: 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">پلتفرم مقصد (target_platform) *</label>
                <select
                  value={distForm.target_platform}
                  onChange={(e) => setDistForm({ ...distForm, target_platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                >
                  {platforms.map(p => (
                    <option key={p.id} value={p.slug}>{p.name} ({p.slug})</option>
                  ))}
                  <option value="updaaate_ir">updaaate.ir (WordPress)</option>
                  <option value="site_b_tech">وب‌سایت خبری B</option>
                  <option value="telegram_news">کانال تلگرام</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">نام نویسنده / ناشر (author_name)</label>
                <input
                  type="text"
                  value={distForm.author_name}
                  onChange={(e) => setDistForm({ ...distForm, author_name: e.target.value })}
                  placeholder="مثلاً: هزاردستان ورکر"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">شناسه پست در مقصد (platform_post_id)</label>
                <input
                  type="text"
                  value={distForm.platform_post_id}
                  onChange={(e) => setDistForm({ ...distForm, platform_post_id: e.target.value })}
                  placeholder="آیدی پست وردپرس (مثلاً: 10452)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddDistModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? 'در حال ذخیره‌سازی...' : 'ذخیره در D1'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT TRANSLATION */}
      {editingTrans && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dir-rtl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Languages className="w-5 h-5 text-indigo-600" />
              ویرایش عنوان، متن و وضعیت تایید ترجمه #{editingTrans.id}
            </h3>

            <form onSubmit={handleSaveTranslation} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-gray-700 font-bold mb-1">عنوان فارسی مقاله</label>
                <input
                  type="text"
                  required
                  value={editingTrans.translated_title || ''}
                  onChange={(e) => setEditingTrans({ ...editingTrans, translated_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">متن کامل ترجمه فارسی</label>
                <textarea
                  rows={8}
                  required
                  value={editingTrans.translated_content || ''}
                  onChange={(e) => setEditingTrans({ ...editingTrans, translated_content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-justify leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">وضعیت تایید انتشار (Approval Status)</label>
                <select
                  value={editingTrans.approval_status || 'approved'}
                  onChange={(e) => setEditingTrans({ ...editingTrans, approval_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="pending">در انتظار بررسی تیم محتوا (Pending)</option>
                  <option value="approved">تایید شده جهت انتشار در پلتفرم‌ها (Approved)</option>
                  <option value="rejected">رد شده (Rejected)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingTrans(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  ذخیره تغییرات ترجمه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PREVIEW CONTENT */}
      {previewContentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dir-rtl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {previewContentModal.title}
            </h3>
            <div className="text-xs text-gray-500 mb-4 pb-2 border-b border-gray-100">
              نمایش متن کامل ذخیره‌شده در دیتابیس D1
            </div>

            <div className="text-sm text-gray-800 leading-relaxed space-y-3 whitespace-pre-wrap text-justify bg-gray-50 p-4 rounded-xl border border-gray-200">
              {previewContentModal.content}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setPreviewContentModal(null)}
                className="px-5 py-2 bg-gray-900 text-white font-bold rounded-xl"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
