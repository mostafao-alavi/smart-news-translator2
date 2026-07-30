import React, { useState } from 'react';
import { SourceItem } from '../types/client';
import { FolderTree, Trash2, Plus, Code2, Shield, Activity, RefreshCw, Save, AlertCircle, Globe, Filter, Search, StopCircle, PlayCircle, Settings, X, Check } from 'lucide-react';

export const ScrapingRulesTab: React.FC<{ sources: SourceItem[] }> = ({ sources }) => {
  const [selectedSource, setSelectedSource] = useState<number | ''>('');
  
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 space-y-4 border-l border-gray-100 pl-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-orange-600" />
              قوانین استخراج (Scraping Rules)
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              با تنظیم سلکتورهای CSS، متن کامل اخبار را از صفحات وب استخراج کنید و از ورود محتوای ناقص و بی‌ارزش (نظیر تصاویر تبلیغاتی) جلوگیری کنید.
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">انتخاب منبع</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">یک منبع انتخاب کنید...</option>
              {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="w-full md:w-2/3 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">سلکتور محتوای اصلی (Article Body)</label>
                <input
                  type="text"
                  placeholder="مثال: .post-content یا article"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={!selectedSource}
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">سلکتور نویسنده (اختیاری)</label>
                <input
                  type="text"
                  placeholder="مثال: .author-name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono ltr focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={!selectedSource}
                />
             </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-800">قوانین پاکسازی خودکار (Auto-Sanitize)</h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" disabled={!selectedSource} defaultChecked />
                حذف خودکار تصاویر تبلیغاتی و بنرها
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" disabled={!selectedSource} defaultChecked />
                حذف لینک‌های داخلی به سایر اخبار سایت مبدأ
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" disabled={!selectedSource} />
                نادیده گرفتن ویدیوهای امبد شده (Embeds)
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
             <button disabled={!selectedSource} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2">
                <Save className="w-4 h-4" />
                ذخیره قوانین منبع
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContentFilteringTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
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
                  <input type="range" min="500" max="5000" defaultValue="2000" step="100" className="flex-1 accent-orange-500" />
                  <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">2000 کلمه</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">متون طولانی‌تر برای جلوگیری از مصرف زیاد توکن‌های AI نادیده گرفته می‌شوند.</p>
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
    <div className="space-y-6 animate-in fade-in">
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
                    <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono text-gray-500">{cat.slug}</span>
                 </div>
                 <div className="text-xs text-gray-600 space-y-1.5">
                    <p className="flex justify-between">
                       <span>تعداد فید متصل:</span>
                       <span className="font-bold">{cat.count}</span>
                    </p>
                    <p className="flex flex-col gap-1 mt-2">
                       <span className="text-[10px] text-gray-400">لحن ترجمه اختصاصی:</span>
                       <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-[11px] font-bold text-center border border-orange-100">{cat.tone}</span>
                    </p>
                 </div>
                 <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/60">
                    <button className="text-gray-400 hover:text-orange-600"><Settings className="w-4 h-4" /></button>
                    <button className="text-gray-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
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
    <div className="space-y-6 animate-in fade-in">
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
                     const isError = idx === 2; // Mocking an error for demonstration
                     const isWarning = idx === 4;
                     return (
                        <tr key={s.id} className="hover:bg-gray-50/50">
                           <td className="py-3 px-4">
                              <span className="font-bold text-gray-900">{s.name}</span>
                              <div className="text-[10px] text-gray-400 font-mono ltr text-left max-w-[150px] truncate">{s.url}</div>
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
                           <td className="py-3 px-4 text-gray-500">
                              {isError ? '۲ ساعت پیش' : '۵ دقیقه پیش'}
                           </td>
                           <td className="py-3 px-4">
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full ${isError ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                    style={{ width: isError ? '45%' : isWarning ? '80%' : '99%' }}
                                 ></div>
                              </div>
                              <span className="text-[10px] text-gray-500 mt-1 block">{isError ? '45%' : isWarning ? '80%' : '99.9%'} Uptime</span>
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
