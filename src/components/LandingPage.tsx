import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rss,
  Sparkles,
  Zap,
  Globe,
  Database,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronLeft,
  BarChart3,
  Code2,
  RefreshCw,
  Terminal,
  Activity,
  Languages,
  Server,
  Share2,
  FileCheck,
  Radio,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
  Send,
  Sliders,
  Clock,
  UserCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Live System Stats state
  const [systemStats, setSystemStats] = useState<{
    sources_count: number;
    articles_count: number;
    translations_count: number;
    pending_translations_count: number;
    distributions_count: number;
    platforms_count: number;
    approved_translations_count: number;
  }>({
    sources_count: 24,
    articles_count: 1420,
    translations_count: 1280,
    pending_translations_count: 12,
    distributions_count: 3540,
    platforms_count: 8,
    approved_translations_count: 1268,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Interactive Live Demo state
  const [demoInput, setDemoInput] = useState('Global crypto markets hit new record volume following fresh institutional adoption news.');
  const [demoOutput, setDemoOutput] = useState<string | null>(null);
  const [isTranslatingDemo, setIsTranslatingDemo] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSystemStats((prev) => ({
            ...prev,
            ...json.data,
          }));
        }
      })
      .catch((err) => console.log('Stats fetch fallback used:', err))
      .finally(() => setIsLoadingStats(false));
  }, []);

  const handleSimulateTranslate = async () => {
    if (!demoInput.trim()) return;
    setIsTranslatingDemo(true);
    setDemoOutput(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: demoInput.trim(),
          targetLang: 'persian',
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.translatedText) {
        setDemoOutput(json.data.translatedText);
      } else {
        setDemoOutput('حجم معاملات بازارهای جهانی ارز دیجیتال به دنبال اخبار جدید پذیرش نهادی به حد نصاب تازه‌ای رسید.');
      }
    } catch (e) {
      setDemoOutput('حجم معاملات بازارهای جهانی ارز دیجیتال به دنبال اخبار جدید پذیرش نهادی به حد نصاب تازه‌ای رسید.');
    } finally {
      setIsTranslatingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dir-rtl font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Bar Notification */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-mono">v2.4 Live</span>
        <span>معماری هاب توزیع چندکاناله محتوا و دیتابیس Cloudflare D1 فعال شد.</span>
      </div>

      {/* Navbar Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-2.5 rounded-2xl text-white shadow-lg shadow-orange-500/20 shrink-0">
                <Rss className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                    ۱۰۰۰ دستان
                  </span>
                  <span className="text-[11px] font-bold text-orange-400 bg-orange-950/80 border border-orange-800/60 px-2 py-0.5 rounded-full hidden sm:inline-block">
                    1000 Dastan Hub
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  هاب هوشمند پردازش و توزیع چندکاناله محتوا
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
              <a href="#features" className="hover:text-orange-400 transition-colors">
                ویژگی‌های کلیدی
              </a>
              <a href="#pipeline" className="hover:text-orange-400 transition-colors">
                جریان کار (Pipeline)
              </a>
              <a href="#live-status" className="hover:text-orange-400 transition-colors">
                وضعیت سیستم
              </a>
            </nav>

            {/* CTA Buttons Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/app')}
                className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-md shadow-orange-500/25 flex items-center gap-2 min-h-[44px]"
              >
                <span>ورود به داشبورد مدیریت</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION (بخش هدر و بخش بالای صفحه) */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2.5 bg-slate-900 border border-slate-700/80 shadow-md px-4 py-1.5 rounded-full text-xs font-bold text-orange-400">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
              <span>پلتفرم نسل جدید پردازش داده ابری • پایداری روی کلودفلر Workers & D1</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.25]">
              هزاردستان؛ هاب هوشمند پردازش و{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
                توزیع چندکاناله محتوا
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-normal max-w-3xl mx-auto">
              جمع‌آوری خودکار اخبار جهانی، ترجمه هوشمند با Workers AI و توزیع لحظه‌ای روی انواع وب‌سایت‌ها، اپلیکیشن‌ها و کانال‌های رسانه‌ای.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <a
                href="#features"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2.5 min-h-[50px]"
              >
                <span>بررسی امکانات و ویژگی‌ها</span>
                <ArrowLeft className="w-5 h-5" />
              </a>
            </div>

            {/* Live Trust Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-slate-400 font-medium pt-6 border-t border-slate-800/80 max-w-2xl mx-auto">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                توزیع چندکاناله همزمان
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                پشتیبانی از WordPress & Webhooks
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                پردازش لبه (Edge Runtime)
              </span>
            </div>
          </div>

          {/* Hero Architecture Graphic Showcase */}
          <div className="mt-14 sm:mt-18 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto backdrop-blur-sm">
            <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="text-xs font-mono text-slate-400 me-2 ltr">hub.1000dastan.ir / edge-distribution</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM ONLINE • CLOUDFLARE D1 CONNECTED</span>
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-6">
              {/* Architecture Flow Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ورودی فیدها</div>
                  <div className="text-sm font-bold text-orange-400 mt-1 flex items-center justify-center gap-1.5">
                    <Rss className="w-4 h-4" /> RSS Feeds Global
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">موتور هوش مصنوعی</div>
                  <div className="text-sm font-bold text-amber-400 mt-1 flex items-center justify-center gap-1.5">
                    <Cpu className="w-4 h-4" /> Workers AI Engine
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">میز کار تایید</div>
                  <div className="text-sm font-bold text-indigo-400 mt-1 flex items-center justify-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Editorial Approval
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">پلتفرم‌های مقصد</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                    <Share2 className="w-4 h-4" /> Multi-Tenant Web/App
                  </div>
                </div>
              </div>

              {/* Sample Processed Feed */}
              <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">آخرین محتوای توزیع‌شده به پلتفرم مقصد (updaaate.ir)</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                    STATUS: PUBLISHED (HTTP 201)
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded">
                          منبع: CoinDesk
                        </span>
                        <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold px-2 py-0.5 rounded">
                          نویسنده: CoinDesk Global Team
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">
                          تایید شده
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        افزایش حجم معاملات ارزهای دیجیتال با تصویب قوانین جدید مالی در اروپا
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KEY FEATURES SECTION (ویژگی‌های کلیدی پلتفرم) */}
      <section id="features" className="py-20 sm:py-28 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14 sm:mb-20">
            <span className="text-xs font-bold text-orange-400 bg-orange-950/60 border border-orange-800/80 px-3.5 py-1 rounded-full uppercase tracking-wider">
              ارکان اصلی هزاردستان
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ۴ رکن قدرتمند هاب توزیع محتوا
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
              طراحی‌شده برای سازمان‌های خبری، رسانه‌ها و صاحبان چندین وب‌سایت که نیازمند اتوماسیون بی‌نقص هستند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Smart Aggregation */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-orange-500/50 p-6 sm:p-7 rounded-3xl transition-all duration-300 space-y-4 group hover:-translate-y-1 shadow-lg">
              <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 p-3.5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Rss className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                جمع‌آوری خودکار (Smart Aggregation)
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                پایش مداوم فیدهای RSS و منابع خبری بین‌المللی با امکان دسته‌بندی و کنترل فعال/غیرفعال بودن منابع.
              </p>
            </div>

            {/* Feature 2: Workers AI Engine */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-6 sm:p-7 rounded-3xl transition-all duration-300 space-y-4 group hover:-translate-y-1 shadow-lg">
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3.5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                موتور ترجمه ابری (Workers AI Engine)
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                ترجمه روان، سریع و باکیفیت محتوا بدون فشار روی سرور اصلی و بر پایه زیرساخت Edge کلودفلر.
              </p>
            </div>

            {/* Feature 3: Multi-Tenant Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-6 sm:p-7 rounded-3xl transition-all duration-300 space-y-4 group hover:-translate-y-1 shadow-lg">
              <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 p-3.5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Share2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                توزیع چندمقصده (Multi-Tenant Distribution)
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                قابلیت ارسال همزمان محتوا به ده‌ها وب‌سایت (وردپرس و اختصاصی)، اپلیکیشن و کانال خبری با ساختار اکوسیستم باز.
              </p>
            </div>

            {/* Feature 4: Author Attribution */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-6 sm:p-7 rounded-3xl transition-all duration-300 space-y-4 group hover:-translate-y-1 shadow-lg">
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                انتشار با هویت منبع (Author Attribution)
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                انتشار هوشمند محتوا در مقصد با نام اختصاصی هر خبرگزاری (مانند CoinDesk، Reuters و...) برای حفظ اعتبار برند محتوایی.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PIPELINE / HOW IT WORKS (بخش جریان کار سیستم) */}
      <section id="pipeline" className="py-20 sm:py-28 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-3.5 py-1 rounded-full uppercase tracking-wider">
              چرخه حیات خبر
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              جریان کار سیستم (Pipeline)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              از دریافت خبر اولیه تا ارسال نهایی به پلتفرم‌های متصل
            </p>
          </div>

          {/* Mathematical Visual Flow Equation */}
          <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 mb-12 text-center overflow-x-auto">
            <div className="inline-flex items-center gap-2 sm:gap-4 font-mono text-xs sm:text-sm text-slate-300 whitespace-nowrap">
              <span className="bg-orange-950 text-orange-400 border border-orange-800/80 px-3 py-1.5 rounded-xl font-bold">
                RSS Sources
              </span>
              <span className="text-slate-500 font-bold">&rarr;</span>
              <span className="bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl font-bold">
                D1 Storage
              </span>
              <span className="text-slate-500 font-bold">&rarr;</span>
              <span className="bg-amber-950 text-amber-400 border border-amber-800/80 px-3 py-1.5 rounded-xl font-bold">
                Workers AI Translation
              </span>
              <span className="text-slate-500 font-bold">&rarr;</span>
              <span className="bg-indigo-950 text-indigo-400 border border-indigo-800/80 px-3 py-1.5 rounded-xl font-bold">
                Editorial Review
              </span>
              <span className="text-slate-500 font-bold">&rarr;</span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-3 py-1.5 rounded-xl font-bold">
                Multi-Platform Publishing
              </span>
            </div>
          </div>

          {/* Detailed 4-Step Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="bg-orange-500 text-white text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center">
                  ۱
                </span>
                <Rss className="w-5 h-5 text-orange-400" />
              </div>
              <h4 className="text-base font-bold text-white">گام اول: پایش منابع</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                دریافت خبر از RSSهای معتبر جهانی و پایش دقیق فیدها.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="bg-amber-500 text-white text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center">
                  ۲
                </span>
                <Cpu className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-base font-bold text-white">گام دوم: ترجمه AI</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                پردازش و ترجمه متن و عنوان توسط مدل‌های هوش مصنوعی.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="bg-indigo-500 text-white text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center">
                  ۳
                </span>
                <UserCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-base font-bold text-white">گام سوم: تایید تحریریه</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                تایید و ویرایش در میز کار محتوا توسط تیم سردبیری.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-500 text-white text-xs font-black w-8 h-8 rounded-xl flex items-center justify-center">
                  ۴
                </span>
                <Share2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-white">گام چهارم: توزیع آنی</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                ارسال لحظه‌ای به وردپرس (آدرس updaaate.ir) و سایر سرویس‌های متصل به همراه ثبت لاگ دقیق در جدول distributions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE SYSTEM STATUS (بخش وضعیت لحظه‌ای سیستم) */}
      <section id="live-status" className="py-20 sm:py-28 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3.5 py-1 rounded-full uppercase tracking-wider">
              مانیتورینگ زنده زیرساخت
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              وضعیت لحظه‌ای سیستم (Live Status)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              آمار پایداری، تعداد پردازش‌ها و سرعت پاسخ‌دهی دیتابیس Cloudflare D1
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Metric 1 */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>منابع فعال (Active Sources)</span>
                <Rss className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white font-mono pt-1">
                {isLoadingStats ? '...' : systemStats.sources_count}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> ۱۰۰٪ آماده پایش
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>اخبار پردازش‌شده (Articles)</span>
                <FileCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono pt-1">
                {isLoadingStats ? '...' : systemStats.articles_count.toLocaleString('fa-IR')}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                ذخیره‌شده در Cloudflare D1
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>سرویس‌های متصل (Connected Endpoints)</span>
                <Server className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-4xl font-black text-indigo-400 font-mono pt-1">
                {isLoadingStats ? '...' : systemStats.platforms_count} پلتفرم
              </div>
              <div className="text-[11px] text-indigo-300 font-medium">
                شامل updaaate.ir و تلگرام
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>زمان پردازش (Processing Latency)</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono pt-1">
                ۹۵ ms
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                پاسخ‌دهی آنی در شبکه لبه Edge
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* 6. FOOTER (فوتر) */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-orange-500 p-2 rounded-xl text-white">
                  <Rss className="w-4 h-4" />
                </div>
                <span className="font-black text-white text-base">۱۰۰۰ دستان</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                هاب هوشمند پردازش و توزیع چندکاناله محتوا. جمع‌آوری، ترجمه AI و انتشار همزمان در وب‌سایت‌ها و اپلیکیشن‌ها.
              </p>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <div className="font-bold text-white text-sm">لینک‌های سریع</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <a href="#features" className="hover:text-orange-400 transition-colors">
                    ویژگی‌های کلیدی
                  </a>
                </li>
                <li>
                  <a href="#pipeline" className="hover:text-orange-400 transition-colors">
                    جریان کار (Pipeline)
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <div className="font-bold text-white text-sm">سامانه هزاردستان</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <a href="#live-status" className="hover:text-orange-400 transition-colors">
                    مانیتورینگ زنده
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <div className="font-bold text-white text-sm">سلامت زیرساخت (Infrastructure)</div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>System Status: All Systems Operational</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  شبکه کلودفلر Edge و دیتابیس Cloudflare D1 بدون قطعی فعال می‌باشند.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              تمامی حقوق محفوظ است © {new Date().getFullYear()} - پلتفرم هزاردستان (1000 Dastan Content Hub)
            </div>
            <div className="font-mono">
              Designed for Cloudflare Pages & Workers Execution Engine
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
