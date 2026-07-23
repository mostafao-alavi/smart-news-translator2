import React, { useState } from 'react';
import { SourceItem } from '../types/client';
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Rss,
  Sparkles,
  Trash2,
  RefreshCw,
  SearchCheck,
} from 'lucide-react';

interface SourcesTabProps {
  sources: SourceItem[];
  loading: boolean;
  onAddSource: (name: string, url: string, language?: string) => Promise<boolean>;
  onDeleteSource: (id: number) => void;
  onScrapeSource: (id: number) => void;
  onTestFeed: (url: string) => Promise<{ isValid: boolean; feedTitle?: string; itemsFound?: number; errorDetails?: string } | null>;
  onRefresh: () => void;
}

export const SourcesTab: React.FC<SourcesTabProps> = ({
  sources,
  loading,
  onAddSource,
  onDeleteSource,
  onScrapeSource,
  onTestFeed,
  onRefresh,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingFeed, setIsTestingFeed] = useState(false);
  const [testResult, setTestResult] = useState<{ isValid: boolean; feedTitle?: string; itemsFound?: number; errorDetails?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTestFeedClick = async () => {
    if (!url.trim()) {
      setErrorMsg('ابتدا آدرس فید RSS را وارد کنید.');
      return;
    }
    setIsTestingFeed(true);
    setTestResult(null);
    setErrorMsg(null);

    const result = await onTestFeed(url.trim());
    setIsTestingFeed(false);
    if (result) {
      setTestResult(result);
      if (result.isValid && result.feedTitle && !name) {
        setName(result.feedTitle);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setErrorMsg('نام منبع و آدرس RSS الزامی است.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const success = await onAddSource(name.trim(), url.trim(), language);
    setIsSubmitting(false);

    if (success) {
      setSuccessMsg(`منبع "${name}" با موفقیت در دیتابیس Cloudflare D1 ذخیره شد.`);
      setName('');
      setUrl('');
      setTestResult(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg('خطا در ثبت منبع جدید (احتمالاً آدرس تکراری است یا فیلدها معتبر نیستند).');
    }
  };

  const presetSources = [
    // Crypto
    { name: 'CoinDesk Crypto News', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', lang: 'en', category: 'crypto', label: 'ارز دیجیتال' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', lang: 'en', category: 'crypto', label: 'ارز دیجیتال' },
    { name: 'Decrypt Crypto', url: 'https://decrypt.co/feed', lang: 'en', category: 'crypto', label: 'ارز دیجیتال' },
    
    // Gaming
    { name: 'IGN Gaming News', url: 'https://feeds.feedburner.com/ign/news', lang: 'en', category: 'gaming', label: 'گیمینگ' },
    { name: 'GameSpot News', url: 'https://www.gamespot.com/feeds/news/', lang: 'en', category: 'gaming', label: 'گیمینگ' },
    { name: 'Polygon', url: 'https://www.polygon.com/rss/index.xml', lang: 'en', category: 'gaming', label: 'گیمینگ' },
    
    // Tech
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', lang: 'en', category: 'tech', label: 'فناوری' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', lang: 'en', category: 'tech', label: 'فناوری' },
    { name: 'Wired Tech News', url: 'https://www.wired.com/feed/category/gear/latest/rss', lang: 'en', category: 'tech', label: 'فناوری' },
    { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', lang: 'en', category: 'tech', label: 'فناوری' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', lang: 'en', category: 'tech', label: 'فناوری' },
  ];

  const [activeCategory, setActiveCategory] = useState<'all' | 'crypto' | 'gaming' | 'tech'>('all');

  const filteredPresets = activeCategory === 'all'
    ? presetSources
    : presetSources.filter((p) => p.category === activeCategory);

  const handleSelectPreset = (preset: { name: string; url: string; lang: string }) => {
    setName(preset.name);
    setUrl(preset.url);
    setLanguage(preset.lang);
    setTestResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form: Add New Source */}
      <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs h-fit">
        <div className="flex items-center space-x-2 space-x-reverse border-b border-gray-100 pb-3">
          <div className="bg-orange-50 text-orange-600 p-2 rounded-lg border border-orange-100">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">افزودن منبع خبری جدید</h3>
            <p className="text-xs text-gray-500">ذخیره در جدول sources در Cloudflare D1</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">نام منبع خبری</label>
            <input
              type="text"
              placeholder="مثال: BBC News یا TechCrunch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">آدرس RSS / Atom Feed</label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="https://example.com/rss.xml"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:border-orange-500 ltr text-left"
              />

              <button
                type="button"
                onClick={handleTestFeedClick}
                disabled={isTestingFeed || !url.trim()}
                className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <SearchCheck className={`w-3.5 h-3.5 ${isTestingFeed ? 'animate-spin' : ''}`} />
                <span>{isTestingFeed ? 'در حال بررسی زنده لینک فید...' : 'بررسی زنده و تست اتصال فید'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`mt-2 p-2.5 rounded-lg text-xs border ${
                testResult.isValid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {testResult.isValid ? (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      فید کاملاً معتبر است!
                    </p>
                    <p>عنوان فید: {testResult.feedTitle}</p>
                    <p>تعداد آیتم‌های موجود: {testResult.itemsFound} مطلب</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      اتصال ناموفق به فید
                    </p>
                    <p>{testResult.errorDetails}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">زبان منبع اصلی</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm focus:bg-white focus:outline-none focus:border-orange-500"
            >
              <option value="en">انگلیسی (English)</option>
              <option value="fr">فرانسوی (French)</option>
              <option value="de">آلمانی (German)</option>
              <option value="es">اسپانیایی (Spanish)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5 space-x-reverse disabled:opacity-50 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ثبت در D1...' : 'ثبت منبع در دیتابیس D1'}</span>
          </button>
        </form>

        {/* Presets */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            پیشنهادهای آماده برای تست سریع:
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', name: 'همه' },
              { id: 'crypto', name: '🪙 ارز دیجیتال' },
              { id: 'gaming', name: '🎮 گیمینگ' },
              { id: 'tech', name: '💻 فناوری' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`text-[11px] px-2 py-1 rounded-md transition-all font-medium ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="w-full text-right bg-gray-50 hover:bg-orange-50/60 border border-gray-200 hover:border-orange-200 p-2 rounded-lg text-xs text-gray-700 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-gray-800 truncate">{preset.name}</span>
                  <span className="text-[9px] text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-100 shrink-0">
                    {preset.label}
                  </span>
                </div>
                <span className="text-[10px] text-orange-700 bg-orange-100/70 px-1.5 py-0.5 rounded border border-orange-200 shrink-0">انتخاب</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List: Existing Sources */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="bg-sky-50 text-sky-600 p-2 rounded-lg border border-sky-100">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">فهرست منابع ثبت‌شده (جدول sources)</h3>
              <p className="text-xs text-gray-500">تعداد کل: {sources.length} منبع فعال</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-xs">در حال بارگذاری لیست منابع...</div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">هیچ منبعی ثبت نشده است.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Rss className="w-4 h-4 text-orange-500" />
                    <h4 className="text-sm font-bold text-gray-900">{src.name}</h4>
                    <span className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200 uppercase">
                      ID: #{src.id} • {src.language || 'en'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono ltr text-left break-all">
                    {src.url}
                  </p>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                  <button
                    onClick={() => onScrapeSource(src.id)}
                    title="اسکرپ آنی این منبع"
                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                    <span>اسکرپ منبع</span>
                  </button>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center justify-center space-x-1 space-x-reverse shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>تست فید</span>
                  </a>

                  <button
                    onClick={() => onDeleteSource(src.id)}
                    title="حذف منبع از D1"
                    className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
