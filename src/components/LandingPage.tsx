import React, { useState } from 'react';
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
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTabDemo, setActiveTabDemo] = useState<'translate' | 'scrape'>('translate');
  const [demoInput, setDemoInput] = useState('');
  const [demoOutput, setDemoOutput] = useState<string | null>(null);
  const [isTranslatingDemo, setIsTranslatingDemo] = useState(false);

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
        setDemoOutput('خطا در دریافت پاسخ از سرویس ترجمه.');
      }
    } catch (e) {
      console.error('Translation error:', e);
      setDemoOutput('خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsTranslatingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dir-rtl font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Navbar Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/90 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-2.5 sm:p-3 rounded-2xl text-white shadow-md shadow-orange-500/20 shrink-0">
                <Rss className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-sans">
                    ۱۰۰۰ دستان
                  </span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                    1000 Dastan
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                  پلتفرم هوشمند پایش اخبار و ترجمه AI
                </p>
              </div>
            </div>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-600">
              <a href="#features" className="hover:text-orange-600 transition-colors">
                امکانات
              </a>
              <a href="#how-it-works" className="hover:text-orange-600 transition-colors">
                نحوه کارکرد
              </a>
              <a href="#demo" className="hover:text-orange-600 transition-colors">
                پیش‌نمایش زنده
              </a>
              <a href="#architecture" className="hover:text-orange-600 transition-colors">
                معماری فنی
              </a>
            </nav>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/app')}
              className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 min-h-[44px]"
            >
              <span>ورود به سامانه</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 border-b border-gray-200/60 bg-gradient-to-b from-orange-50/40 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200/90 shadow-2xs px-4 py-1.5 rounded-full text-xs font-bold text-orange-700 animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>۱۰۰۰ دستان • موتور هوشمند پایش و ترجمه اخبار</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-[1.25] sm:leading-[1.3]">
              پایش و ترجمه هوشمند با{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500">
                «۱۰۰۰ دستان»
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg text-gray-600 leading-relaxed font-normal max-w-2xl mx-auto">
              ۱۰۰۰ دستان اخبار فناوری، علمی و جهانی را از منابع مختلف جمع‌آوری کرده و با قدرت هوش مصنوعی به صورت روان به زبان فارسی ترجمه می‌کند.
            </p>

            {/* Hero Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/app')}
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 justify-center min-h-[48px]"
              >
                <span>ورود به داشبورد مدیریت</span>
                <ArrowLeft className="w-5 h-5" />
              </button>

              <a
                href="#demo"
                className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-800 border border-gray-200/90 font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2 justify-center min-h-[48px]"
              >
                <Activity className="w-4 h-4 text-orange-500" />
                <span>تست زنده ترجمه AI</span>
              </a>
            </div>

            {/* Trust Tags */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-500 font-medium pt-4">
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                پشتیبانی از ۱۰۰+ منبع خبری
              </span>
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ترجمه زبانی با AI و Cloudflare Workers
              </span>
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                سازگار کامل با Edge & D1 Database
              </span>
            </div>
          </div>

          {/* Hero Dashboard Showcase Mockup */}
          <div className="mt-12 sm:mt-16 bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden max-w-5xl mx-auto">
            <div className="bg-gray-100/80 border-b border-gray-200 px-4 py-3 flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-mono text-gray-500 me-2 ltr">1000dastan.ir/app</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>سیستم فعال • اتصال D1</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50/50 space-y-4">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[11px] text-gray-500 font-medium">منابع خبری</div>
                  <div className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">۲۴ منبع فعال</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[11px] text-gray-500 font-medium">اخبار</div>
                  <div className="text-lg sm:text-xl font-black text-orange-600 mt-0.5">۱,۴۵۰+ خبر</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[11px] text-gray-500 font-medium">ترجمه هوش مصنوعی</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5">۹۸.۵٪ موفق</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[11px] text-gray-500 font-medium">زمان پاسخ</div>
                  <div className="text-lg sm:text-xl font-black text-sky-600 mt-0.5">۴۵ میلی‌ثانیه</div>
                </div>
              </div>

              {/* Sample Feed Cards */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/90 space-y-3">
                <div className="flex items-center gap-2 justify-between text-xs font-bold text-gray-700 border-b pb-2">
                  <span className="flex items-center gap-2.5 text-orange-600">
                    <Rss className="w-4 h-4" />
                    جدیدترین اخبار ترجمه‌شده
                  </span>
                  <span className="text-gray-400 font-normal">بروزرسانی زنده</span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded border border-sky-100">
                          TechCrunch
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                          ترجمه‌شده به فارسی
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        تراشه‌های جدید هوش مصنوعی معرفی شدند
                      </h4>
                    </div>
                    <button
                      onClick={() => navigate('/app')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-2 self-end sm:self-auto shrink-0"
                    >
                      <span>مشاهده متن کامل</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-100">
                          BBC World
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                          ترجمه‌شده به فارسی
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                        تحولات بازار انرژی بین‌الملل
                      </h4>
                    </div>
                    <button
                      onClick={() => navigate('/app')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-2 self-end sm:self-auto shrink-0"
                    >
                      <span>مشاهده متن کامل</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
              رویکرد ۱۰۰۰ دستان
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
              چرا ۱۰۰۰ دستان؟
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              طراحی شده برای کسانی که می‌خواهند اخبار جهان را بدون محدودیت زبانی دنبال کنند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-50/80 hover:bg-orange-50/30 border border-gray-200/90 hover:border-orange-300 p-6 rounded-2xl transition-all space-y-3 group">
              <div className="bg-orange-500 text-white p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Rss className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">پایش مستمر منابع خبری</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                صدها منبع خبری معتبر جهانی به صورت خودکار پایش و جمع‌آوری می‌شوند.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50/80 hover:bg-orange-50/30 border border-gray-200/90 hover:border-orange-300 p-6 rounded-2xl transition-all space-y-3 group">
              <div className="bg-amber-500 text-white p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Languages className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">ترجمه اصیل و وفادار به مفهوم</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                هوش مصنوعی در ۱۰۰۰ دستان کلمات را صرفاً جایگزین نمی‌کند، بلکه روح متن و ظرایف معنایی آن را به فارسی شیق و خوانا برمی‌گرداند.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50/80 hover:bg-orange-50/30 border border-gray-200/90 hover:border-orange-300 p-6 rounded-2xl transition-all space-y-3 group">
              <div className="bg-sky-500 text-white p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">دسترسی سریع و همیشگی</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                استفاده از فناوری‌های ابری برای دسترسی بدون وقفه و سریع به مطالب.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50/80 hover:bg-orange-50/30 border border-gray-200/90 hover:border-orange-300 p-6 rounded-2xl transition-all space-y-3 group">
              <div className="bg-emerald-500 text-white p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">انتخاب دلخواه منابع</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                شما می‌توانید کانال‌های خبری دلخواه خود را اضافه کنید.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50/80 hover:bg-orange-50/30 border border-gray-200/90 hover:border-orange-300 p-6 rounded-2xl transition-all space-y-3 group">
              <div className="bg-indigo-500 text-white p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">قابلیت خروجی گرفتن</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                خروجی متن برای استفاده در پژوهش‌ها و شبکه‌های اجتماعی.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50/80 hover:bg-orange-50/30 border border-gray-200/90 hover:border-orange-300 p-6 rounded-2xl transition-all space-y-3 group">
              <div className="bg-rose-500 text-white p-3 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">بهینه و پرسرعت</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                طراحی مدرن و سبک بدون تحمیل بار اضافی به سرور و مرورگر.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Demo Section */}
      <section id="demo" className="py-16 sm:py-24 bg-gray-50 border-b border-gray-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
              آزمایش آنلاین
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              تست ترجمه زنده
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              متن را وارد کنید و خروجی را بررسی کنید:
            </p>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-7 shadow-lg space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">متن ورودی (انگلیسی):</label>
              <textarea
                rows={3}
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 ltr text-left focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <button
              onClick={handleSimulateTranslate}
              disabled={isTranslatingDemo || !demoInput.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center gap-2 justify-center min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${isTranslatingDemo ? 'animate-spin' : ''}`} />
              <span>{isTranslatingDemo ? 'در حال ترجمه...' : 'ترجمه'}</span>
            </button>

            {demoOutput && (
              <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5 animate-in fade-in">
                <div className="font-bold flex items-center gap-2.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  خروجی ترجمه:
                </div>
                <p className="leading-relaxed font-medium">{demoOutput}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works Timeline Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              فرآیند کار
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              نحوه کارکرد سامانه
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-gray-50 border border-gray-200/90 p-5 rounded-2xl space-y-2 relative">
              <span className="bg-orange-500 text-white text-xs font-black w-7 h-7 rounded-lg flex items-center gap-2 justify-center">
                ۱
              </span>
              <h4 className="text-sm font-bold text-gray-900">استخراج خبر</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                فراخوانی خودکار فیدها و ذخیره خبرها.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 border border-gray-200/90 p-5 rounded-2xl space-y-2 relative">
              <span className="bg-amber-500 text-white text-xs font-black w-7 h-7 rounded-lg flex items-center gap-2 justify-center">
                ۲
              </span>
              <h4 className="text-sm font-bold text-gray-900">پاکسازی متن</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                حذف تگ‌های HTML و استخراج متن خالص.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 border border-gray-200/90 p-5 rounded-2xl space-y-2 relative">
              <span className="bg-emerald-500 text-white text-xs font-black w-7 h-7 rounded-lg flex items-center gap-2 justify-center">
                ۳
              </span>
              <h4 className="text-sm font-bold text-gray-900">ترجمه با هوش مصنوعی</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                تولید خلاصه و ترجمه روان فارسی.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-50 border border-gray-200/90 p-5 rounded-2xl space-y-2 relative">
              <span className="bg-sky-500 text-white text-xs font-black w-7 h-7 rounded-lg flex items-center gap-2 justify-center">
                ۴
              </span>
              <h4 className="text-sm font-bold text-gray-900">نمایش و API</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                نمایش در داشبورد و دسترسی از طریق API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black leading-snug">
            پلتفرم پایش اخبار
          </h2>
          <p className="text-xs sm:text-sm text-orange-100 max-w-xl mx-auto leading-relaxed">
            اخبار جهان را مستقیماً دریافت کرده و با هوش مصنوعی به زبان فارسی مطالعه کنید.
          </p>
          <button
            onClick={() => navigate('/app')}
            className="bg-white hover:bg-orange-50 text-orange-600 font-black text-sm sm:text-base px-8 py-3.5 rounded-2xl shadow-lg transition-all inline-flex items-center gap-2 min-h-[48px]"
          >
            <span>ورود به سامانه</span>
            <ArrowLeft className="w-5 h-5 text-orange-600" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center gap-2 justify-center">
            <div className="bg-orange-500 p-1.5 rounded-lg text-white">
              <Rss className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-900 text-sm">۱۰۰۰ دستان</span>
          </div>
          <p>
            پلتفرم پیشرفته پایش اخبار بین‌الملل و ترجمه خودکار با هوش مصنوعی • سازگار با Cloudflare Workers & D1
          </p>
          <p className="text-[11px] text-gray-400">
            تمامی حقوق محفوظ است © {new Date().getFullYear()} - سامانه ۱۰۰۰ دستان
          </p>
        </div>
      </footer>
    </div>
  );
};
