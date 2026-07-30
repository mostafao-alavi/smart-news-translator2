import React, { useState } from 'react';
import { 
  Bug, 
  Activity, 
  Users, 
  BarChart4, 
  Database, 
  BellRing,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TerminalSquare,
  FileText
} from 'lucide-react';

// 1. Deep Error Tracing
export const DeepErrorTracingTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-600" />
                ردیابی عمیق خطاها (Deep Error Tracing)
              </h3>
              <p className="text-xs text-gray-500 mt-1">مشاهده کدهای وضعیت HTTP و پاسخ خام مقاصد برای عیب‌یابی فوق‌سریع.</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="جستجو در لاگ خطاها..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none" />
               </div>
               <button className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-xl transition-colors">
                  <Filter className="w-4 h-4" />
               </button>
            </div>
         </div>

         <div className="space-y-4">
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex flex-col gap-3">
               <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                     </div>
                     <div>
                        <span className="text-[10px] text-rose-600 font-bold px-2 py-0.5 rounded bg-rose-100 border border-rose-200 inline-block mb-1">HTTP 401</span>
                        <h4 className="text-xs font-bold text-gray-900">خطای احراز هویت وردپرس (ارسال)</h4>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">POST https://updaaate.ir/wp-json/wp/v2/posts</p>
                     </div>
                  </div>
                  <span className="text-[10px] text-gray-400">۱۰ دقیقه پیش</span>
               </div>
               
               <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto relative group">
                  <button className="absolute top-2 left-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                     <TerminalSquare className="w-4 h-4" />
                  </button>
                  <pre className="text-[10px] text-emerald-400 font-mono ltr text-left m-0">
                     {`{
  "code": "rest_cannot_create",
  "message": "Sorry, you are not allowed to create posts as this user.",
  "data": { "status": 401 }
}`}
                  </pre>
               </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col gap-3">
               <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                     </div>
                     <div>
                        <span className="text-[10px] text-amber-600 font-bold px-2 py-0.5 rounded bg-amber-100 border border-amber-200 inline-block mb-1">FETCH ERROR</span>
                        <h4 className="text-xs font-bold text-gray-900">عدم دسترسی به فید RSS (دریافت)</h4>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">GET https://techcrunch.com/feed/</p>
                     </div>
                  </div>
                  <span className="text-[10px] text-gray-400">۱ ساعت پیش</span>
               </div>
               
               <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-[10px] text-amber-400 font-mono ltr text-left m-0">
                     {`TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11576:11)
    ... (ETIMEDOUT)`}
                  </pre>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// 2. Resource & Billing Metrics
export const ResourceBillingTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-indigo-600" />
            داشبورد مصرف منابع و هزینه‌ها (Resource & Billing Metrics)
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
               <p className="text-xs text-gray-600 mb-1">توکن‌های AI مصرف شده (امروز)</p>
               <h4 className="text-2xl font-bold text-indigo-700 font-mono">485,200</h4>
               <p className="text-[10px] text-indigo-500 mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> 12% افزایش نسبت به دیروز
               </p>
            </div>
            
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
               <p className="text-xs text-gray-600 mb-1">درخواست‌های دیتابیس (D1 Reads)</p>
               <h4 className="text-2xl font-bold text-emerald-700 font-mono">1.2M</h4>
               <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> در محدوده طرح رایگان
               </p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
               <p className="text-xs text-gray-600 mb-1">عملیات نوشتن (D1 Writes)</p>
               <h4 className="text-2xl font-bold text-emerald-700 font-mono">84,500</h4>
               <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> در محدوده طرح رایگان
               </p>
            </div>
         </div>

         <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold text-gray-800 mb-3">پیش‌بینی هزینه‌های پایان ماه (Cloudflare)</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
               <div>
                  <p className="text-sm font-bold text-gray-900">$0.00</p>
                  <p className="text-[10px] text-gray-500 mt-1">با روند فعلی، سیستم روی لایه رایگان باقی خواهد ماند.</p>
               </div>
               <button className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg">مشاهده ریزپرداخت‌ها</button>
            </div>
         </div>
      </div>
    </div>
  );
};

// 3. Audit Trails
export const AuditTrailsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Users className="w-4 h-4 text-blue-600" />
            ردپای حسابرسی و عملکرد تیم (Audit Trails)
         </h3>

         <div className="relative border-r-2 border-gray-100 pr-6 space-y-6">
            <div className="relative">
               <div className="absolute -right-[29px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xs"></div>
               <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs">
                  <div className="flex justify-between items-center mb-1">
                     <span className="font-bold text-gray-900">تایید نهایی و انتشار خبر</span>
                     <span className="text-[10px] text-gray-400">۱۰:۱۸ صبح</span>
                  </div>
                  <p className="text-gray-600"><span className="font-bold text-blue-700">کاربر ب (مدیر)</span> خبر «آپدیت جدید iOS» را تایید و برای انتشار ارسال کرد.</p>
               </div>
            </div>

            <div className="relative">
               <div className="absolute -right-[29px] top-1 w-3 h-3 bg-gray-300 rounded-full border-2 border-white"></div>
               <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs">
                  <div className="flex justify-between items-center mb-1">
                     <span className="font-bold text-gray-900">ویرایش متن و عنوان</span>
                     <span className="text-[10px] text-gray-400">۱۰:۱۵ صبح</span>
                  </div>
                  <p className="text-gray-600"><span className="font-bold text-blue-700">کاربر الف (سردبیر)</span> محتوای خبر «آپدیت جدید iOS» را ویرایش کرد و برچسب‌های سئو افزود.</p>
               </div>
            </div>

            <div className="relative">
               <div className="absolute -right-[29px] top-1 w-3 h-3 bg-purple-400 rounded-full border-2 border-white"></div>
               <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs">
                  <div className="flex justify-between items-center mb-1">
                     <span className="font-bold text-gray-900">ترجمه ماشینی (Workers AI)</span>
                     <span className="text-[10px] text-gray-400">۰۹:۴۵ صبح</span>
                  </div>
                  <p className="text-gray-600">هوش مصنوعی خبر را با ضریب اطمینان ۹۲٪ ترجمه کرد.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// 4. Distribution Analytics
export const DistributionAnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart4 className="w-4 h-4 text-emerald-600" />
                تحلیلگر جامع توزیع (Distribution Analytics)
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">مشاهده آمار موفقیت/شکست توزیع اخبار و میزان تاخیر شبکه‌ای.</p>
            </div>
            <div className="flex gap-2">
               <select className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
                  <option>همه مقاصد</option>
                  <option>سایت updaaate.ir</option>
                  <option>تلگرام</option>
               </select>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
               <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                     <th className="py-3 px-4 font-bold rounded-tr-lg">عنوان خبر</th>
                     <th className="py-3 px-4 font-bold">مقصد</th>
                     <th className="py-3 px-4 font-bold">وضعیت</th>
                     <th className="py-3 px-4 font-bold">میزان تاخیر (Latency)</th>
                     <th className="py-3 px-4 font-bold rounded-tl-lg">زمان تایید تا انتشار</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50">
                     <td className="py-3 px-4 text-gray-900 max-w-[200px] truncate">رونمایی از جدیدترین مدل هوش مصنوعی...</td>
                     <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">updaaate.ir</td>
                     <td className="py-3 px-4">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">موفقیت‌آمیز</span>
                     </td>
                     <td className="py-3 px-4 font-mono text-gray-500">450ms</td>
                     <td className="py-3 px-4 text-gray-500">۱۲ ثانیه</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                     <td className="py-3 px-4 text-gray-900 max-w-[200px] truncate">تحلیل امنیت سایبری زیرساخت‌های ابری...</td>
                     <td className="py-3 px-4 text-gray-500 font-mono text-[10px]">updaaate.ir</td>
                     <td className="py-3 px-4">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">موفقیت‌آمیز</span>
                     </td>
                     <td className="py-3 px-4 font-mono text-gray-500">320ms</td>
                     <td className="py-3 px-4 text-gray-500">۸ ثانیه</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

// 5. Data Retention & Export
export const DataRetentionTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-6">
         <div className="w-full md:w-1/2 space-y-4 pr-4 border-l border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
               <Database className="w-4 h-4 text-orange-600" />
               مدیریت چرخه حیات داده‌ها (Retention)
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
               برای جلوگیری از پر شدن فضای دیتابیس D1، لاگ‌ها و رکوردهای پردازشی قدیمی را به‌صورت خودکار پاکسازی کنید. اخبار منتشر شده در وردپرس حذف نمی‌شوند.
            </p>
            
            <div className="pt-2 space-y-3">
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">نگهداری لاگ‌های سیستم تا:</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                     <option>۳۰ روز پیش</option>
                     <option>۶۰ روز پیش</option>
                     <option>۹۰ روز پیش</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">نگهداری تاریخچه ترجمه (Archive) تا:</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none">
                     <option>۶ ماه پیش</option>
                     <option>۱ سال پیش</option>
                     <option>برای همیشه</option>
                  </select>
               </div>
            </div>
         </div>

         <div className="w-full md:w-1/2 flex flex-col justify-center bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-gray-500" /> خروجی‌گیری از لاگ‌ها (Export)</h4>
            <p className="text-[10px] text-gray-500 mb-4">می‌توانید از لاگ‌های توزیع و سیستم خروجی CSV بگیرید تا در اکسل تحلیل کنید.</p>
            <button className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs px-4 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-2">
               <Download className="w-4 h-4" /> Export to CSV (۳۰ روز اخیر)
            </button>
         </div>
      </div>
    </div>
  );
};

// 6. Automated Alerts
export const AutomatedAlertsTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-600" />
                سیستم هشدار خودکار (Automated Alerts)
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">تعریف قوانین برای اطلاع‌رسانی سریع در صورت بروز خطاهای بحرانی.</p>
            </div>
            <button className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors">
               + قانون جدید
            </button>
         </div>

         <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
               <div>
                  <h4 className="text-xs font-bold text-gray-900">هشدار خطای توزیع بالا</h4>
                  <p className="text-[10px] text-gray-500 mt-1">اگر در <span className="font-bold text-gray-700">۱ ساعت</span> بیش از <span className="font-bold text-gray-700">۵ خطای توزیع (ارسال)</span> رخ داد.</p>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded">ارسال ایمیل</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
               </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-xs opacity-60">
               <div>
                  <h4 className="text-xs font-bold text-gray-900">هشدار قطعی فید RSS مهم</h4>
                  <p className="text-[10px] text-gray-500 mt-1">اگر دریافت از <span className="font-bold text-gray-700">رویترز</span> بیش از <span className="font-bold text-gray-700">۴ بار پیاپی</span> ناموفق بود.</p>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded">تلگرام مدیر فنی</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
