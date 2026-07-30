import React, { useState } from 'react';
import { SourceItem } from '../types/client';
import { SourcesTab } from './SourcesTab';
import { Rss, FolderTree, Plus, Sparkles, Layers, Tag, CheckCircle2, Edit2, Trash2 } from 'lucide-react';

interface InputSourcesTabProps {
  sources: SourceItem[];
  loading: boolean;
  onAddSource: (name: string, url: string, category?: string) => Promise<boolean>;
  onDeleteSource: (id: number) => void;
  onUpdateSource: (id: number, data: Partial<SourceItem>) => Promise<boolean>;
  onBulkDeleteSources: (ids: number[]) => Promise<boolean>;
  onBulkToggleStatus: (ids: number[], active: boolean) => Promise<boolean>;
  onScrapeSource: (id: number) => void;
  onTestFeed: (url: string) => Promise<any>;
  onRefresh: () => void;
  initialSubTab?: 'rss' | 'categories';
}

export const InputSourcesTab: React.FC<InputSourcesTabProps> = ({
  sources,
  loading,
  onAddSource,
  onDeleteSource,
  onUpdateSource,
  onBulkDeleteSources,
  onBulkToggleStatus,
  onScrapeSource,
  onTestFeed,
  onRefresh,
  initialSubTab = 'rss',
}) => {
  const [subTab, setSubTab] = useState<'rss' | 'categories'>(initialSubTab);

  // Default Categories Preset
  const [categories, setCategories] = useState([
    { id: 1, name: 'هوش مصنوعی و AI', slug: 'ai', count: 12, description: 'فیدها و وب‌سایت‌های تخصصی مدل‌های زبان و تکنولوژی AI' },
    { id: 2, name: 'فناوری و نرم‌افزار', slug: 'tech', count: 18, description: 'اخبار سخت‌افزار، برنامه‌نویسی و پلتفرم‌های ابری' },
    { id: 3, name: 'امنیت سایبری', slug: 'security', count: 8, description: 'گزارش‌های آسیب‌پذیری و بدافزارها' },
    { id: 4, name: 'اقتصاد و بلاکچین', slug: 'crypto', count: 6, description: 'رمزارزها و بازارهای مالی بین‌المللی' },
    { id: 5, name: 'بین‌الملل و عمومی', slug: 'world', count: 15, description: 'خبرگزاری‌های معتبر جهانی' },
  ]);

  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCategories((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newCatName.trim(),
        slug: newCatSlug.trim() || newCatName.toLowerCase().replace(/\s+/g, '-'),
        count: 0,
        description: newCatDesc.trim() || 'دسته‌بندی سفارشی ورودی',
      },
    ]);

    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          <button
            onClick={() => setSubTab('rss')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'rss'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Rss className="w-4 h-4" />
            <span>فیدهای RSS و منابع خبری</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'rss' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {sources.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'categories'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>مدیریت دسته‌بندی‌های ورودی</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              subTab === 'categories' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              {categories.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content Rendering Based on SubTab */}
      {subTab === 'rss' && (
        <SourcesTab
          sources={sources}
          loading={loading}
          onAddSource={onAddSource}
          onDeleteSource={onDeleteSource}
          onUpdateSource={onUpdateSource}
          onBulkDeleteSources={onBulkDeleteSources}
          onBulkToggleStatus={onBulkToggleStatus}
          onScrapeSource={onScrapeSource}
          onTestFeed={onTestFeed}
          onRefresh={onRefresh}
        />
      )}

      {subTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-orange-600" />
              <span>افزودن دسته‌بندی ورودی جدید</span>
            </h3>

            <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نام دسته‌بندی</label>
                <input
                  type="text"
                  placeholder="مثال: امنیت سایبری"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">شناسه یکتا (Slug)</label>
                <input
                  type="text"
                  placeholder="مثال: security"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none dir-ltr text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">توضیحات کوتاه</label>
                <input
                  type="text"
                  placeholder="توضیحات مربوط به دسته‌بندی..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت دسته‌بندی</span>
                </button>
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4">دسته‌بندی‌های ورودی ثبت‌شده</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl border border-gray-200 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-mono font-bold">
                        {cat.slug}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{cat.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200/80 text-xs">
                    <span className="text-gray-500 text-[11px]">{cat.count} فید فعال متصل</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف دسته‌بندی"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
