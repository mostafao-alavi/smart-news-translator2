import React, { useState } from 'react';
import { Globe, Send, Key, Share2, Plus, CheckCircle2, RefreshCw, ExternalLink, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface DestinationsTabProps {
  onRefreshAll?: () => void;
  initialSubTab?: 'wordpress' | 'social' | 'api';
}

export const DestinationsTab: React.FC<DestinationsTabProps> = ({
  onRefreshAll,
  initialSubTab = 'wordpress',
}) => {
  const [subTab, setSubTab] = useState<'wordpress' | 'social' | 'api'>(initialSubTab);

  const [loading, setLoading] = useState(true);
  const [platformId, setPlatformId] = useState<number | null>(null);

  // WordPress Destination State
  const [wpUrl, setWpUrl] = useState('');
  const [wpApiEndpoint, setWpApiEndpoint] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  const [wpDefaultCategory, setWpDefaultCategory] = useState('1');
  const [autoPublishWp, setAutoPublishWp] = useState(true);

  React.useEffect(() => {
    fetch('/api/platforms')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          const wpPlatform = data.data.find((p: any) => p.platform_type === 'wordpress');
          if (wpPlatform) {
            setPlatformId(wpPlatform.id);
            setWpUrl(wpPlatform.api_url.replace('/wp-json/wp/v2', ''));
            setWpApiEndpoint(wpPlatform.api_url);
            setWpUsername(wpPlatform.auth_username || '');
            setWpAppPassword('••••••••••••••••'); // Hide password
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const [testingWp, setTestingWp] = useState(false);
  const [wpTestResult, setWpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // API Key state for external consumers
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Client App Mobile Key', key: 'hd_live_8f93a021b47c92e109', createdAt: '1403/05/01', permissions: 'Read-only (JSON Feed)' },
    { id: 2, name: 'Web Portal Integration', key: 'hd_live_72e103988b11c4021a', createdAt: '1403/05/10', permissions: 'Full Read (All Categories)' },
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  const handleTestWpConnection = async () => {
    setTestingWp(true);
    setWpTestResult(null);
    try {
      const res = await fetch('/api/wp-sync/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_url: wpApiEndpoint,
          username: wpUsername,
          app_password: wpAppPassword
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWpTestResult({
          success: true,
          message: `اتصال به سایت ${wpUrl} برقرار گردید. سرویس REST API آماده پذیرش پست است.`,
        });
      } else {
        setWpTestResult({
          success: false,
          message: `خطا در اتصال: ${data.error || 'پاسخی از سرور وردپرس دریافت نشد'}`,
        });
      }
    } catch (err: any) {
      setWpTestResult({
        success: false,
        message: `خطا در برقراری ارتباط: ${err.message}`,
      });
    } finally {
      setTestingWp(false);
    }
  };

  const handleGenerateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomKey = `hd_live_${Math.random().toString(36).substring(2, 11)}${Math.random().toString(36).substring(2, 11)}`;
    setApiKeys((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newKeyName.trim(),
        key: randomKey,
        createdAt: new Date().toLocaleDateString('fa-IR'),
        permissions: 'Read-only (JSON Feed)',
      },
    ]);
    setNewKeyName('');
  };

  const handleDeleteApiKey = (id: number) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          <button
            onClick={() => setSubTab('wordpress')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'wordpress'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>سایت‌های وردپرسی (WordPress)</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
              updaaate.ir
            </span>
          </button>

          <button
            onClick={() => setSubTab('social')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'social'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>کانال‌ها و شبکه‌های اجتماعی</span>
            <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold">
              آینده
            </span>
          </button>

          <button
            onClick={() => setSubTab('api')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'api'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>کلیدهای دسترسی API (Clients)</span>
            <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold">
              {apiKeys.length}
            </span>
          </button>
        </div>
      </div>

      {/* 1. WordPress Tab */}
      {subTab === 'wordpress' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 shadow-xs">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-3" />
              <p className="text-sm font-bold">در حال بارگذاری تنظیمات...</p>
            </div>
          ) : platformId ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl border border-purple-200">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">سایت هدف اصلی: {wpUrl.replace('https://', '').replace('http://', '')}</h3>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                        پلتفرم فعال
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 dir-ltr text-right font-mono">
                      {wpApiEndpoint}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={wpUrl || 'https://updaaate.ir'}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>بازکردن سایت</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleTestWpConnection}
                    disabled={testingWp}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingWp ? 'animate-spin' : ''}`} />
                    <span>تست اتصال REST API</span>
                  </button>
                </div>
              </div>

            {wpTestResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                wpTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {wpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{wpTestResult.message}</span>
              </div>
            )}

            {/* Configuration Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">آدرس دامنه سایت (URL)</label>
                <input
                  type="text"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اندرپوینت REST API وردپرس</label>
                <input
                  type="text"
                  value={wpApiEndpoint}
                  onChange={(e) => setWpApiEndpoint(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">نام کاربری وردپرس (Username)</label>
                <input
                  type="text"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رمز عبور اپلیکیشن (Application Password)</label>
                <input
                  type="password"
                  value={wpAppPassword}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">شناسه دسته‌بندی پیش‌فرض وردپرس (Category ID)</label>
                <input
                  type="text"
                  value={wpDefaultCategory}
                  onChange={(e) => setWpDefaultCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 w-full">
                  <input
                    type="checkbox"
                    checked={autoPublishWp}
                    onChange={(e) => setAutoPublishWp(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">انتشار خودکار پس از تایید (Auto Publish)</div>
                    <div className="text-[10px] text-gray-500">ارسال خودکار ترجمه‌های تاییدشده به updaaate.ir</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          ) : (
             <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 shadow-xs">
                <Globe className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold">پلتفرم وردپرسی یافت نشد</p>
             </div>
          )}
        </div>
      )}

      {/* 2. Social Media Tab */}
      {subTab === 'social' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-gray-900">کانال‌ها و شبکه‌های اجتماعی (Social Media Integrations)</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            امکان ارسال خودکار خلاصه‌ی اخبار تاییدشده به کانال‌های تلگرام، توییتر و لینکدین در زیرساخت آماده‌سازی شده است.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">ربات تلگرام (Telegram Channel)</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">آماده اتصال</span>
              </div>
              <p className="text-[11px] text-gray-500">ارسال عنوان + چکیده به کانال تلگرام</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">توییتر / X</span>
                <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">غیرفعال</span>
              </div>
              <p className="text-[11px] text-gray-500">انتشار رشته توییت خلاصه اخبار</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">لینکدین (LinkedIn Page)</span>
                <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">غیرفعال</span>
              </div>
              <p className="text-[11px] text-gray-500">انتشار پست تحلیلی AI در صفحه شرکت</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. API Keys Tab */}
      {subTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600" />
              <span>ایجاد کلید دسترسی جدید برای کلاینت‌ها (Client API Keys)</span>
            </h3>

            <form onSubmit={handleGenerateApiKey} className="flex gap-3">
              <input
                type="text"
                placeholder="نام کلاینت / اپلیکیشن (مثال: اپلیکیشن موبایل)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>تولید کلید</span>
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">کلیدهای فعال دسترسی به API</h3>

            <div className="space-y-3">
              {apiKeys.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-gray-900">{item.name}</div>
                    <div className="text-xs font-mono text-purple-700 dir-ltr text-right font-bold mt-1">
                      {item.key}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      ایجاد: {item.createdAt} • دسترسی: {item.permissions}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteApiKey(item.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer self-end sm:self-center"
                  >
                    ابطال کلید
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
