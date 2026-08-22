import React, { useState, useEffect } from 'react';
import { SourceItem } from '../types/client';
import {
  FolderTree,
  Trash2,
  Plus,
  Code2,
  Shield,
  Activity,
  RefreshCw,
  Save,
  AlertCircle,
  Globe,
  Filter,
  Search,
  StopCircle,
  PlayCircle,
  Settings,
  X,
  Check,
  CheckCircle2,
  Sparkles,
  Zap,
  Layers,
  FileText,
  Eye,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { BUILTIN_PROFILES, SourceExtractionProfile } from '../cron/htmlRewriterExtractor';

export const ScrapingRulesTab: React.FC<{ sources: SourceItem[] }> = ({ sources }) => {
  const [profiles, setProfiles] = useState<SourceExtractionProfile[]>(Object.values(BUILTIN_PROFILES));
  const [selectedProfileId, setSelectedProfileId] = useState<string>('cointelegraph');
  const [activeProfile, setActiveProfile] = useState<SourceExtractionProfile>(BUILTIN_PROFILES.cointelegraph);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Test State
  const [testUrl, setTestUrl] = useState<string>('https://cointelegraph.com/news/bitcoin-surges-past-100k');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/extraction-profiles');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProfiles(data.data);
      }
    } catch {
      // Fallback to built-in profiles
      setProfiles(Object.values(BUILTIN_PROFILES));
    }
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    const found = profiles.find(p => p.id === profileId) || BUILTIN_PROFILES[profileId] || BUILTIN_PROFILES.generic;
    setActiveProfile(JSON.parse(JSON.stringify(found)));
    setTestResult(null);
    setTestError(null);
    
    // Set appropriate sample URL for the source
    if (profileId === 'cointelegraph') setTestUrl('https://cointelegraph.com/news/bitcoin-surges-past-100k');
    else if (profileId === 'coindesk') setTestUrl('https://www.coindesk.com/markets/2026/08/20/bitcoin-rally-continues');
    else if (profileId === 'decrypt') setTestUrl('https://decrypt.co/news/crypto-market-update');
    else if (profileId === 'theblock') setTestUrl('https://www.theblock.co/post/bitcoin-ethereum-record');
    else if (profileId === 'bitcoinmagazine') setTestUrl('https://bitcoinmagazine.com/markets/bitcoin-strategic-reserve');
    else if (profileId === 'beincrypto') setTestUrl('https://beincrypto.com/crypto-price-analysis');
    else setTestUrl('https://example.com/news/article');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/extraction-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeProfile),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        fetchProfiles();
      } else {
        alert(data.error || 'خطا در ذخیره پروفایل استخراج');
      }
    } catch (err: any) {
      alert(`خطا در برقراری ارتباط: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    const builtin = BUILTIN_PROFILES[selectedProfileId] || BUILTIN_PROFILES.generic;
    setActiveProfile(JSON.parse(JSON.stringify(builtin)));
  };

  const handleRunLiveTest = async () => {
    if (!testUrl || !testUrl.startsWith('http')) {
      setTestError('لطفاً یک آدرس URL معتبر وارد کنید.');
      return;
    }
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/extract-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: testUrl,
          customRules: activeProfile,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.data);
      } else {
        setTestError(data.error || 'خطا در تست استخراج آنلاین');
      }
    } catch (err: any) {
      setTestError(err.message || 'خطا در شبکه');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in" dir="rtl">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-orange-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              مدیریت پروفایل‌های اختصاصی استخراج منابع (Source Extraction Profiles)
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              هر خبرگزاری ساختار HTML منحصر‌به‌فردی دارد. قوانین Cointelegraph با ۱۰۰٪ دقت ذخیره شده و برای سایر خبرگزاری‌ها نیز پروفایل‌های اختصاصی و هوشمند تعبیه شده است.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Cointelegraph: تأییدشده و فعال
          </span>
        </div>
      </div>

      {/* Main Grid: Sources List on Right, Config on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Selector Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-500" />
              خبرگزاری‌ها و منابع پشتیبانی‌شده
            </h4>

            <div className="space-y-2">
              {profiles.map((p) => {
                const isSelected = p.id === selectedProfileId;
                const isCT = p.id === 'cointelegraph';
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProfile(p.id)}
                    className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-500/20 shadow-xs'
                        : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                        style={{ backgroundColor: p.badgeColor || '#F7931A' }}
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          {p.name}
                          {isCT && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                              تأییدشده ✓
                            </span>
                          )}
                          {p.isVerified && !isCT && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded border border-blue-200">
                              اختصاصی
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5" dir="ltr">
                          {p.domains[0]}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: activeProfile.badgeColor || '#F7931A' }}
                  />
                  <h3 className="text-sm font-bold text-gray-900">
                    تنظیمات استخراج: {activeProfile.name}
                  </h3>
                  {activeProfile.isVerified && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      پروفایل اختصاصی
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{activeProfile.description || 'قوانین و سلکتورهای استخراج محتوا'}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5"
                  title="بازنشانی به مقادیر پیش‌فرض"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  بازنشانی
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  ذخیره قوانین
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                تنظیمات اختصاصی استخراج برای منبع <b>{activeProfile.name}</b> با موفقیت ذخیره شد.
              </div>
            )}

            {/* Selectors Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-600" />
                سلکتورهای اصلی المان‌های خبر (CSS Selectors)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    سلکتور کانتینر بدنه خبر (Body Container)
                  </label>
                  <input
                    type="text"
                    value={activeProfile.selectors.bodyContainer}
                    onChange={(e) =>
                      setActiveProfile({
                        ...activeProfile,
                        selectors: { ...activeProfile.selectors, bodyContainer: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="[data-testid='post__body'], .ct-prose"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">کانتینر اصلی شامل پاراگراف‌ها و تصاویر متن خبر.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    سلکتور لید / خلاصه خبر (Lead Text)
                  </label>
                  <input
                    type="text"
                    value={activeProfile.selectors.lead}
                    onChange={(e) =>
                      setActiveProfile({
                        ...activeProfile,
                        selectors: { ...activeProfile.selectors, lead: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="[data-testid='post__description'], .lead"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">پاراگراف برجسته ابتدای خبر (خلاصه مهم).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    سلکتور تیتر خبر (Title)
                  </label>
                  <input
                    type="text"
                    value={activeProfile.selectors.title}
                    onChange={(e) =>
                      setActiveProfile({
                        ...activeProfile,
                        selectors: { ...activeProfile.selectors, title: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="h1, [data-testid='post__title']"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    سلکتور نام نویسنده (Author)
                  </label>
                  <input
                    type="text"
                    value={activeProfile.selectors.author}
                    onChange={(e) =>
                      setActiveProfile({
                        ...activeProfile,
                        selectors: { ...activeProfile.selectors, author: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="[data-testid='post-byline-text__name'], .author"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    سلکتور تصویر شاخص خبر (Featured Cover Image)
                  </label>
                  <input
                    type="text"
                    value={activeProfile.selectors.featuredImage}
                    onChange={(e) =>
                      setActiveProfile({
                        ...activeProfile,
                        selectors: { ...activeProfile.selectors, featuredImage: e.target.value },
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="[data-testid='post-cover__image'], meta[property='og:image']"
                  />
                </div>
              </div>
            </div>

            {/* Remove Selectors & Noise Cleaners */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-rose-800 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                سلکتورهای المان‌های حذفی و تبلیغاتی (Remove Selectors)
              </h4>
              <p className="text-[11px] text-gray-500">
                المان‌هایی که باید قبل از شروع استخراج به صورت خودکار از DOM صفحه حذف شوند (تبلیغات، دیسکلیمر، خبرهای مرتبط و...). با کاما (,) یا خط جدید جدا کنید:
              </p>

              <textarea
                rows={3}
                value={activeProfile.removeSelectors.join(',\n')}
                onChange={(e) =>
                  setActiveProfile({
                    ...activeProfile,
                    removeSelectors: e.target.value
                      .split(/[\n,]+/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-xs font-mono ltr focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            {/* Cut-off Markers & Noise Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نشانگرهای پایان متن اصلی (Cut-Off Markers)
                </label>
                <textarea
                  rows={3}
                  value={(activeProfile.cutOffMarkers || []).join('\n')}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      cutOffMarkers: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Cointelegraph is committed to&#10;Editorial Policy&#10;Disclaimer:"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">با رسیدن به این عبارات، مابقی متن نادیده گرفته می‌شود.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  عبارات و خطوط نویز (Noise Text Patterns)
                </label>
                <textarea
                  rows={3}
                  value={activeProfile.noiseTextPatterns.join('\n')}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      noiseTextPatterns: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="magazine:&#10;related:&#10;read more:&#10;disclaimer:"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">خطوطی که این عبارت را دربردارند حذف خواهند شد.</p>
              </div>
            </div>
          </div>

          {/* Live Extractor Test for This Profile */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                تست زنده استخراج با قوانین اختصاصی «{activeProfile.name}»
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">Live Extractor Sandbox</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="آدرس خبر برای تست..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRunLiveTest}
                disabled={isTesting}
                className="bg-gray-900 hover:bg-black text-white text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                    در حال واکشی و استخراج...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-orange-400" />
                    اجرای استخراج زنده
                  </>
                )}
              </button>
            </div>

            {testError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {testError}
              </div>
            )}

            {testResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-gray-900">
                      استخراج موفق: {testResult.paragraphs_count || 0} پاراگراف (
                      {testResult.text_length || 0} کاراکتر)
                    </span>
                  </div>
                  <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-bold">
                    پروفایل اعمال‌شده: {testResult.applied_profile?.name || activeProfile.name}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 font-bold">تیتر: </span>
                    <span className="text-gray-900 font-bold">{testResult.title || 'یافت نشد'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold">نویسنده: </span>
                    <span className="text-gray-800">{testResult.author || 'ناشناس'}</span>
                  </div>
                  {testResult.lead_text && (
                    <div className="bg-orange-50/60 p-2.5 rounded-lg border border-orange-100 text-orange-950">
                      <span className="font-bold text-orange-800">لید استخراج‌شده: </span>
                      {testResult.lead_text}
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 font-bold">پیش‌نمایش بدنه متن: </span>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto text-gray-700 leading-relaxed font-sans text-xs mt-1">
                      {testResult.full_text}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContentFilteringTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blacklist / Whitelist */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-600" />
            فیلترینگ کلمات کلیدی (Blacklist / Whitelist)
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            اخباری که شامل کلمات بلک‌لیست باشند، وارد چرخه ترجمه نخواهند شد. کلمات با کاما (,) جدا شوند.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1">لیست سیاه کلمات (عدم دریافت خبر)</label>
              <textarea
                rows={3}
                defaultValue="sponsored, advertisement, promo, giveaway, تبلیغات, رپرتاژ"
                className="w-full bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-700 mb-1">لیست سفید (اولویت بالا)</label>
              <textarea
                rows={2}
                placeholder="مثال: breaking news, exclusive, فوری"
                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              ></textarea>
            </div>
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2">
            <Save className="w-4 h-4" /> ذخیره فیلترها
          </button>
        </div>

        {/* Thresholds */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-600" />
            محدودیت‌های محتوایی (Thresholds)
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            فیلتر کردن اخباری که به دلیل کوتاه بودن یا نداشتن محتوای کافی ارزش ترجمه ندارند.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">حداقل طول متن خبر (تعداد کلمات)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="50" max="500" defaultValue="150" className="flex-1 accent-orange-500" />
                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">150 کلمه</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">حداکثر طول متن خبر (تعداد کلمات)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="500"
                  max="5000"
                  defaultValue="2000"
                  step="100"
                  className="flex-1 accent-orange-500"
                />
                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">2000 کلمه</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                متون طولانی‌تر برای جلوگیری از مصرف زیاد توکن‌های AI نادیده گرفته می‌شوند.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SourceProfilingTab: React.FC = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'هوش مصنوعی و AI', slug: 'ai', count: 12, tone: 'تخصصی و علمی' },
    { id: 2, name: 'فناوری و نرم‌افزار', slug: 'tech', count: 18, tone: 'ژورنالیستی و جذاب' },
    { id: 3, name: 'امنیت سایبری', slug: 'security', count: 8, tone: 'رسمی و هشداردهنده' },
    { id: 4, name: 'اقتصاد و بلاکچین', slug: 'crypto', count: 6, tone: 'تحلیلی و اقتصادی' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-orange-600" />
              دسته‌بندی و پروفایل منابع (Source Profiling)
            </h3>
            <p className="text-xs text-gray-500 mt-1">تعیین لحن ترجمه و نگاشت دسته‌ها برای منابع ورودی.</p>
          </div>
          <button className="bg-orange-100 text-orange-700 hover:bg-orange-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> افزودن پروفایل جدید
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-500">
                  {cat.slug}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1.5">
                <p className="flex justify-between">
                  <span>تعداد فید متصل:</span>
                  <span className="font-bold">{cat.count}</span>
                </p>
                <p className="flex flex-col gap-1 mt-2">
                  <span className="text-[10px] text-gray-400">لحن ترجمه اختصاصی:</span>
                  <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-[11px] font-bold text-center border border-orange-100">
                    {cat.tone}
                  </span>
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/60">
                <button className="text-gray-400 hover:text-orange-600">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SourceHealthTab: React.FC<{ sources: SourceItem[] }> = ({ sources }) => {
  return (
    <div className="space-y-6 animate-in fade-in" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              سلامت‌سنجی منابع (Health & Diagnostics)
            </h3>
            <p className="text-xs text-gray-500 mt-1">مانیتورینگ زنده فیدها و توقف خودکار منابع دارای خطا.</p>
          </div>
          <button className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> بررسی مجدد سلامت همه
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-bold rounded-tr-lg">نام منبع</th>
                <th className="py-3 px-4 font-bold">وضعیت فعلی</th>
                <th className="py-3 px-4 font-bold">آخرین بررسی</th>
                <th className="py-3 px-4 font-bold">میزان خطا (Uptime)</th>
                <th className="py-3 px-4 font-bold rounded-tl-lg">عملیات خودکار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sources.slice(0, 5).map((s, idx) => {
                const isError = idx === 2;
                const isWarning = idx === 4;
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900">{s.name}</span>
                      <div className="text-[10px] text-gray-400 font-mono ltr text-left max-w-[150px] truncate">
                        {s.url}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isError ? (
                        <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded w-fit border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> خطای 404
                        </span>
                      ) : isWarning ? (
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
                          <Activity className="w-3 h-3" /> کندی پاسخ
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit border border-emerald-200">
                          <Check className="w-3 h-3" /> آنلاین
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{isError ? '۲ ساعت پیش' : '۵ دقیقه پیش'}</td>
                    <td className="py-3 px-4">
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isError ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: isError ? '45%' : isWarning ? '80%' : '99%' }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        {isError ? '45%' : isWarning ? '80%' : '99.9%'} Uptime
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isError ? (
                        <button className="text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                          <StopCircle className="w-3 h-3" /> توقف خودکار اعمال شد
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">در حال مانیتورینگ</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
