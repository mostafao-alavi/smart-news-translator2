import React, { useState, useEffect } from 'react';
import {
  Globe,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Zap,
  Save,
  Check,
  Radio,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface DestinationsTabProps {
  onRefreshAll?: () => void;
  initialSubTab?: string;
}

interface DistributionLog {
  id: number;
  translation_id: number;
  target_platform: string;
  author_name: string;
  platform_post_id: string | null;
  published_at: string;
  translated_title?: string;
  source_name?: string;
}

export const DestinationsTab: React.FC<DestinationsTabProps> = ({
  onRefreshAll,
}) => {
  const [loading, setLoading] = useState(true);

  // WordPress Destination State
  const [wpPlatformId, setWpPlatformId] = useState<number | null>(null);
  const [wpUrl, setWpUrl] = useState('https://updaaate.ir');
  const [wpApiEndpoint, setWpApiEndpoint] = useState('https://updaaate.ir/wp-json/wp/v2');
  const [wpUsername, setWpUsername] = useState('1000dastan');
  const [wpAppPassword, setWpAppPassword] = useState('••••••••••••••••');
  const [wpDefaultCategory, setWpDefaultCategory] = useState('3');
  const [autoPublishWp, setAutoPublishWp] = useState(true);
  const [savingWp, setSavingWp] = useState(false);
  const [wpSavedSuccess, setWpSavedSuccess] = useState(false);

  // Telegram Destination State
  const [tgPlatformId, setTgPlatformId] = useState<number | null>(null);
  const [tgChatId, setTgChatId] = useState('@updaaate_crypto');
  const [tgBotToken, setTgBotToken] = useState('');
  const [autoPublishTg, setAutoPublishTg] = useState(true);
  const [savingTg, setSavingTg] = useState(false);
  const [tgSavedSuccess, setTgSavedSuccess] = useState(false);

  // Test Actions
  const [testingWp, setTestingWp] = useState(false);
  const [wpTestResult, setWpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingTg, setTestingTg] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Instant WP Sync trigger
  const [syncingWp, setSyncingWp] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test message for Telegram
  const [customTgMsg, setCustomTgMsg] = useState('');
  const [sendingCustomTg, setSendingCustomTg] = useState(false);

  // Recent distributions log
  const [distributions, setDistributions] = useState<DistributionLog[]>([]);

  // Load platforms and recent distributions
  const loadPlatformsAndLogs = async () => {
    try {
      setLoading(true);
      const [platRes, distRes] = await Promise.all([
        fetch('/api/platforms').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/distributions').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (platRes.success && Array.isArray(platRes.data)) {
        const wp = platRes.data.find((p: any) => p.platform_type === 'wordpress' || p.slug === 'updaaate_ir');
        if (wp) {
          setWpPlatformId(wp.id);
          if (wp.api_url) {
            setWpApiEndpoint(wp.api_url);
            setWpUrl(wp.api_url.replace('/wp-json/wp/v2', '').replace(/\/$/, ''));
          }
          if (wp.auth_username) setWpUsername(wp.auth_username);
          setAutoPublishWp(wp.is_active === 1);
        }

        const tg = platRes.data.find((p: any) => p.platform_type === 'telegram' || p.slug === 'telegram_news');
        if (tg) {
          setTgPlatformId(tg.id);
          if (tg.auth_username) setTgChatId(tg.auth_username);
          setAutoPublishTg(tg.is_active === 1);
        }
      }

      if (distRes.success && Array.isArray(distRes.data)) {
        setDistributions(distRes.data.slice(0, 10));
      }
    } catch (err) {
      console.error('Failed to load destinations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformsAndLogs();
  }, []);

  // Save WordPress Settings
  const handleSaveWp = async () => {
    setSavingWp(true);
    setWpSavedSuccess(false);
    try {
      if (wpPlatformId) {
        await fetch(`/api/platforms/${wpPlatformId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'updaaate.ir (سایت وردپرس اصلی)',
            platform_type: 'wordpress',
            api_url: wpApiEndpoint,
            auth_username: wpUsername,
            auth_password_secret: wpAppPassword !== '••••••••••••••••' ? wpAppPassword : undefined,
            is_active: autoPublishWp ? 1 : 0,
          }),
        });
      } else {
        const res = await fetch('/api/platforms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'updaaate.ir (سایت وردپرس اصلی)',
            slug: 'updaaate_ir',
            platform_type: 'wordpress',
            api_url: wpApiEndpoint,
            auth_username: wpUsername,
            auth_password_secret: wpAppPassword,
          }),
        });
        const json = await res.json();
        if (json.data?.id) setWpPlatformId(json.data.id);
      }
      setWpSavedSuccess(true);
      setTimeout(() => setWpSavedSuccess(false), 3000);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert('خطا در ذخیره تنظیمات وردپرس: ' + err.message);
    } finally {
      setSavingWp(false);
    }
  };

  // Save Telegram Settings
  const handleSaveTg = async () => {
    setSavingTg(true);
    setTgSavedSuccess(false);
    try {
      if (tgPlatformId) {
        await fetch(`/api/platforms/${tgPlatformId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'کانال تلگرام آپدیت (@updaaate_crypto)',
            platform_type: 'telegram',
            api_url: 'https://api.telegram.org/bot/sendMessage',
            auth_username: tgChatId,
            auth_password_secret: tgBotToken || undefined,
            is_active: autoPublishTg ? 1 : 0,
          }),
        });
      } else {
        const res = await fetch('/api/platforms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'کانال تلگرام آپدیت (@updaaate_crypto)',
            slug: 'telegram_news',
            platform_type: 'telegram',
            api_url: 'https://api.telegram.org/bot/sendMessage',
            auth_username: tgChatId,
            auth_password_secret: tgBotToken,
          }),
        });
        const json = await res.json();
        if (json.data?.id) setTgPlatformId(json.data.id);
      }
      setTgSavedSuccess(true);
      setTimeout(() => setTgSavedSuccess(false), 3000);
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      alert('خطا در ذخیره تنظیمات تلگرام: ' + err.message);
    } finally {
      setSavingTg(false);
    }
  };

  // Test WordPress REST API Connection
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
          app_password: wpAppPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWpTestResult({
          success: true,
          message: `ارتباط با وردپرس (${wpUrl}) با موفقیت تایید شد. دسترسی REST API فعال است.`,
        });
      } else {
        setWpTestResult({
          success: false,
          message: data.error || 'خطا در ارتباط با سرور وردپرس.',
        });
      }
    } catch (err: any) {
      setWpTestResult({
        success: false,
        message: `خطای شبکه: ${err.message}`,
      });
    } finally {
      setTestingWp(false);
    }
  };

  // Test Telegram Bot Connection
  const handleTestTgConnection = async () => {
    setTestingTg(true);
    setTgTestResult(null);
    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: tgBotToken || undefined,
          chat_id: tgChatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTgTestResult({
          success: true,
          message: `پیام تست با موفقیت به کانال ${tgChatId} ارسال شد! ارتباط ربات برقرار است.`,
        });
      } else {
        setTgTestResult({
          success: false,
          message: data.error || 'ارسال پیام به کانال با خطا مواجه شد. لطفاً توکن ربات یا دسترسی ادمین کانال را بررسی کنید.',
        });
      }
    } catch (err: any) {
      setTgTestResult({
        success: false,
        message: `خطای اتصال به تلگرام: ${err.message}`,
      });
    } finally {
      setTestingTg(false);
    }
  };

  // Instant Sync to WordPress
  const handleInstantSyncWp = async () => {
    setSyncingWp(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/wp-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult({
          success: true,
          message: `همگام‌سازی کامل شد: ${data.data?.successCount || 0} خبر ترجمه‌شده با موفقیت در updaaate.ir منتشر شد.`,
        });
        loadPlatformsAndLogs();
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'خطا در اجرای همگام‌سازی با وردپرس',
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: `خطای همگام‌سازی: ${err.message}`,
      });
    } finally {
      setSyncingWp(false);
    }
  };

  // Send Custom Message to Telegram
  const handleSendCustomTg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTgMsg.trim()) return;

    setSendingCustomTg(true);
    try {
      const res = await fetch('/api/telegram/send-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'پیام فوری و آزمایشی از پنل هزاردستان',
          content: customTgMsg.trim(),
          chat_id: tgChatId,
          bot_token: tgBotToken || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`پیام با موفقیت در کانال ${tgChatId} منتشر شد.`);
        setCustomTgMsg('');
      } else {
        alert(`خطا در ارسال: ${data.error || 'نامشخص'}`);
      }
    } catch (err: any) {
      alert(`خطا در اتصال: ${err.message}`);
    } finally {
      setSendingCustomTg(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-xs">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
        <p className="text-sm font-bold text-gray-700">در حال بارگذاری مقاصد انتشار...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 animate-pulse text-amber-200" />
            <h2 className="text-base sm:text-lg font-black">مقاصد انتشار و توزیع خودکار محتوا</h2>
          </div>
          <p className="text-xs text-orange-100 mt-1 leading-relaxed">
            مدیریت ساده و مستقیم اتصال به وب‌سایت <b>updaaate.ir</b> و کانال تلگرام <b>آپدیت</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPlatformsAndLogs}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بروزرسانی وضعیت</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid: WordPress & Telegram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* CARD 1: WordPress (updaaate.ir) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">سایت وردپرس (updaaate.ir)</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      فعال
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono dir-ltr text-right">
                    {wpUrl}
                  </p>
                </div>
              </div>

              <a
                href={wpUrl || 'https://updaaate.ir'}
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-purple-600 p-2 hover:bg-purple-50 rounded-xl transition-colors"
                title="بازکردن سایت در تب جدید"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Test Feedback */}
            {wpTestResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  wpTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {wpTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 font-medium leading-relaxed">
                    {wpTestResult.message}
                  </div>
                </div>

                {!wpTestResult.success && (
                  <div className="mt-2 pt-2 border-t border-rose-200/70 text-[11px] text-rose-900 bg-white/70 p-3 rounded-lg space-y-1.5 leading-relaxed">
                    <div className="font-bold flex items-center gap-1 text-rose-950">
                      💡 راهنمای رفع خطای اتصال و تنظیمات امنیتی وردپرس:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>
                        <strong>تولید Application Password جدید:</strong> در پیشخوان وردپرس به مسیر <em>کاربران &gt; شناسنامه شما &gt; رمزهای عبور برنامه</em> بروید و یک نام (مثل hazardastan) وارد کرده و دکمه افزودن رمز عبور را بزنید. سپس رمز تولیدشده (مثال: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[10px]">abcd efgh ijkl mnop</code>) را در کادر زیر وارد کنید.
                      </li>
                      <li>
                        <strong>رفع مسدودی هدر Authorization در .htaccess:</strong> اگر سرور یا افزونه‌های امنیتی هدر احراز هویت را حذف می‌کنند، کدهای زیر را به بالای فایل <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[10px]">.htaccess</code> وردپرس اضافه کنید:
                        <pre className="bg-slate-900 text-emerald-400 p-2 rounded mt-1 font-mono text-[10px] dir-ltr text-left overflow-x-auto">
                          {`RewriteEngine On\nRewriteCond %{HTTP:Authorization} ^(.*)\nRewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]`}
                        </pre>
                      </li>
                      <li>
                        <strong>افزونه‌های امنیتی (Wordfence / iThemes):</strong> اطمینان حاصل کنید دسترسی REST API به اندپوینت‌های <code className="font-mono text-[10px]">/wp-json/wp/v2/users/me</code> و <code className="font-mono text-[10px]">/wp-json/wp/v2/posts</code> مسدود نشده باشد.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Sync Feedback */}
            {syncResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  syncResult.success
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{syncResult.message}</span>
              </div>
            )}

            {/* Settings Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  آدرس REST API وردپرس
                </label>
                <input
                  type="text"
                  value={wpApiEndpoint || ''}
                  onChange={(e) => setWpApiEndpoint(e.target.value)}
                  placeholder="https://updaaate.ir/wp-json/wp/v2"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    نام کاربری وردپرس
                  </label>
                  <input
                    type="text"
                    value={wpUsername || ''}
                    onChange={(e) => setWpUsername(e.target.value)}
                    placeholder="1000dastan"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    شناسه دسته‌بندی
                  </label>
                  <input
                    type="text"
                    value={wpDefaultCategory || ''}
                    onChange={(e) => setWpDefaultCategory(e.target.value)}
                    placeholder="3"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  رمز عبور برنامه (Application Password)
                </label>
                <input
                  type="password"
                  value={wpAppPassword || ''}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                  placeholder="مثال: abcd efgh ijkl mnop"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:bg-white focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  برای تغییر رمز، رمز جدید تولید شده در وردپرس را در کادر بالا وارد کرده و دکمه «ذخیره تنظیمات» یا «تست اتصال» را بزنید.
                </p>
              </div>

              {/* Auto Publish Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPublishWp}
                  onChange={(e) => setAutoPublishWp(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-purple-950">ارسال خودکار پس از تایید ترجمه</div>
                  <div className="text-[10px] text-purple-700">ترجمه‌های تاییدشده بلافاصله به عنوان پیش‌نویس/پست در سایت درج شوند.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleSaveWp}
              disabled={savingWp}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3.5 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingWp ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : wpSavedSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{wpSavedSuccess ? 'ذخیره شد' : 'ذخیره تنظیمات'}</span>
            </button>

            <button
              onClick={handleTestWpConnection}
              disabled={testingWp}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingWp ? 'animate-spin' : ''}`} />
              <span>تست اتصال</span>
            </button>

            <button
              onClick={handleInstantSyncWp}
              disabled={syncingWp}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="همگام‌سازی دستی ۵ خبر اخیر با سایت"
            >
              <Zap className={`w-3.5 h-3.5 ${syncingWp ? 'animate-bounce' : ''}`} />
              <span>انتشار فوری</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: Telegram Channel & Connected Bot */}
        {/* ========================================================================= */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">کانال تلگرام آپدیت</h3>
                    <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      ربات متصل
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono dir-ltr text-right">
                    {tgChatId}
                  </p>
                </div>
              </div>

              <a
                href={`https://t.me/${tgChatId.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-sky-600 p-2 hover:bg-sky-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                title="بازکردن کانال تلگرام"
              >
                <span>مشاهده کانال</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Test Feedback */}
            {tgTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  tgTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {tgTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{tgTestResult.message}</span>
              </div>
            )}

            {/* Settings Form */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  شناسه کانال تلگرام (Chat ID / Username)
                </label>
                <input
                  type="text"
                  value={tgChatId || ''}
                  onChange={(e) => setTgChatId(e.target.value)}
                  placeholder="@updaaate_crypto"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  توکن ربات تلگرام (TELEGRAM_BOT_TOKEN)
                </label>
                <input
                  type="password"
                  value={tgBotToken || ''}
                  onChange={(e) => setTgBotToken(e.target.value)}
                  placeholder="تنظیم شده در Secrets یا وارد کردن توکن جدید..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left focus:bg-white focus:outline-none focus:border-sky-500 transition-colors"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  در صورت خالی بودن، از متغیر محیطی سرور استفاده خواهد شد.
                </p>
              </div>

              {/* Auto Publish Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-50/70 border border-sky-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPublishTg}
                  onChange={(e) => setAutoPublishTg(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-sky-950">ارسال خودکار خلاصه اخبار به کانال</div>
                  <div className="text-[10px] text-sky-700">پس از ترجمه و تایید خبر، کارت محتوای تلگرامی فوراً ارسال شود.</div>
                </div>
              </label>

              {/* Quick Send Test Box */}
              <form onSubmit={handleSendCustomTg} className="pt-2">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  ارسال سریع پیام تستی به کانال
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTgMsg}
                    onChange={(e) => setCustomTgMsg(e.target.value)}
                    placeholder="متن پیام تستی جهت ارسال به تلگرام..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingCustomTg || !customTgMsg.trim()}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleSaveTg}
              disabled={savingTg}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs px-3.5 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingTg ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : tgSavedSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{tgSavedSuccess ? 'ذخیره شد' : 'ذخیره تنظیمات'}</span>
            </button>

            <button
              onClick={handleTestTgConnection}
              disabled={testingTg}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingTg ? 'animate-spin' : ''}`} />
              <span>تست پینگ ربات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Distributions History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-gray-900">آخرین ارسال‌های انجام شده به مقاصد</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            تعداد کل رکوردها: {distributions.length}
          </span>
        </div>

        {distributions.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            هنوز رکوردی در جدول توزیع ثبت نشده است. با تایید یا همگام‌سازی اخبار، اطلاعات در اینجا نمایش می‌یابد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-bold">شناسه</th>
                  <th className="py-2.5 px-3 font-bold">پلتفرم مقصد</th>
                  <th className="py-2.5 px-3 font-bold">عنوان خبر</th>
                  <th className="py-2.5 px-3 font-bold">شناسه پست در مقصد</th>
                  <th className="py-2.5 px-3 font-bold">زمان انتشار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {distributions.map((item) => {
                  const isWp = item.target_platform.includes('wp') || item.target_platform.includes('updaaate');
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-gray-500">#{item.id}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isWp
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {isWp ? <Globe className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                          {isWp ? 'وردپرس (updaaate.ir)' : 'تلگرام (@updaaate_crypto)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-800 max-w-xs truncate">
                        {item.translated_title || `ترجمه شماره #${item.translation_id}`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-600 dir-ltr text-right">
                        {item.platform_post_id ? `#${item.platform_post_id}` : 'موفق'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 font-mono dir-ltr text-right text-[11px]">
                        {item.published_at || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
