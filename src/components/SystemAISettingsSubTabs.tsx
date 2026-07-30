import React, { useState } from 'react';
import { 
  Sparkles, 
  Users, 
  Database, 
  Terminal, 
  Settings, 
  CheckCircle2, 
  Save, 
  Power,
  Clock,
  Shield,
  Activity,
  Trash2,
  RefreshCw,
  LogOut,
  Download
} from 'lucide-react';
import { AI_MODELS } from './SettingsTab';

// 1. AI Engine Configuration
export const AIEngineConfigTab: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState(
    `You are an expert tech news editor and professional translator. Translate the provided English tech news article into fluent, professional, and natural Persian (Farsi). Ensure technical terms (e.g. AI, Cloud, Microservices, API) are translated appropriately while maintaining accurate technical meaning.`
  );
  const [selectedModel, setSelectedModel] = useState<string>('@cf/meta/m2m100-1.2b');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <div>
               <h3 className="text-sm font-bold text-gray-900">مرکز فرماندهی هوش مصنوعی (AI Engine)</h3>
               <p className="text-[10px] text-gray-500 mt-1">کنترل کامل بر رفتار موتور ترجمه، پرامپت‌ها و پارامترهای پردازشی.</p>
            </div>
         </div>

         {savedSuccess && (
           <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
             <span>تنظیمات موتور هوش مصنوعی با موفقیت ذخیره گردید.</span>
           </div>
         )}

         <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5">انتخاب مدل زبانی (Model Selector)</label>
                     <select
                       value={selectedModel}
                       onChange={(e) => setSelectedModel(e.target.value)}
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono dir-ltr text-left"
                     >
                       {AI_MODELS.map((m) => (
                         <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                       ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">دقت / خلاقیت (Temperature)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={temperature}
                          onChange={(e) => setTemperature(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <p className="text-[9px] text-gray-400 mt-1">کمتر = دقیق‌تر، بیشتر = خلاقانه‌تر</p>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">حداکثر توکن (Max Tokens)</label>
                        <input
                          type="number"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1.5">
                       پرامپت داینامیک پیش‌فرض (System Prompt)
                     </label>
                     <textarea
                       rows={5}
                       value={systemPrompt}
                       onChange={(e) => setSystemPrompt(e.target.value)}
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none dir-ltr text-left resize-none"
                     />
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
               <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-800">واژه‌نامه اختصاصی (Custom Glossary)</h4>
                  <button type="button" className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold transition-colors">
                     + افزودن کلمه
                  </button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-gray-700 font-mono">Smart Contract</span>
                     <span className="text-[10px] text-gray-500">قرارداد هوشمند</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-gray-700 font-mono">Blockchain</span>
                     <span className="text-[10px] text-gray-500">بلاکچین</span>
                  </div>
               </div>
            </div>

            <div className="flex justify-end pt-4">
               <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2">
                  <Save className="w-4 h-4" /> ذخیره پیکربندی
               </button>
            </div>
         </form>
      </div>
    </div>
  );
};

// 2. Identity & RBAC
export const IdentityRbactab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
         <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                مدیریت هویت و دسترسی‌ها (RBAC)
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">تعریف سطوح دسترسی دانه‌ای و مدیریت نشست‌های فعال.</p>
            </div>
            <button className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors">
               + کاربر جدید
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
               <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                     <th className="py-3 px-4 font-bold rounded-tr-lg">کاربر</th>
                     <th className="py-3 px-4 font-bold">نقش (Role)</th>
                     <th className="py-3 px-4 font-bold">وضعیت نشست</th>
                     <th className="py-3 px-4 font-bold rounded-tl-lg">عملیات</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50">
                     <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">علی کریمی</div>
                        <div className="text-[10px] text-gray-500">ali@example.com</div>
                     </td>
                     <td className="py-3 px-4"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">مدیر کل (Admin)</span></td>
                     <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]"><Activity className="w-3 h-3" /> آنلاین</span>
                     </td>
                     <td className="py-3 px-4">
                        <button className="text-[10px] text-gray-400 hover:text-blue-600 font-bold transition-colors">ویرایش دسترسی</button>
                     </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                     <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">سارا احمدی</div>
                        <div className="text-[10px] text-gray-500">sara@example.com</div>
                     </td>
                     <td className="py-3 px-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">سردبیر (Editor)</span></td>
                     <td className="py-3 px-4">
                        <span className="text-gray-400 text-[10px]">آخرین بازدید: ۲ ساعت پیش</span>
                     </td>
                     <td className="py-3 px-4 flex gap-2">
                        <button className="text-[10px] text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded flex items-center gap-1 transition-colors"><LogOut className="w-3 h-3" /> خروج اجباری</button>
                     </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                     <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">تیم ترجمه</div>
                        <div className="text-[10px] text-gray-500">team@example.com</div>
                     </td>
                     <td className="py-3 px-4"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">مترجم (Translator)</span></td>
                     <td className="py-3 px-4">
                        <span className="text-gray-400 text-[10px]">آفلاین</span>
                     </td>
                     <td className="py-3 px-4">
                        <button className="text-[10px] text-gray-400 hover:text-blue-600 font-bold transition-colors">ویرایش دسترسی</button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

// 3. D1 Storage Manager
export const D1StorageManagerTab: React.FC = () => {
  const [sqlQuery, setSqlQuery] = useState("SELECT count(id) as total, translation_status FROM articles GROUP BY translation_status;");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;
    setIsQuerying(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/d1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const result = await res.json();
      if (result.success) {
        setQueryResult(result.data);
      } else {
        setQueryError(result.error || 'Failed to execute query');
      }
    } catch (err: any) {
      setQueryError(err.message);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleRunQuery();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
               <Database className="w-4 h-4 text-indigo-600" />
               مدیریت پایگاه داده ابری (D1 Manager)
            </h3>
            <div className="flex gap-2">
               <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> بکاپ‌گیری دستی (Snapshot)
               </button>
               <button className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> پاکسازی و بهینه‌سازی (Vacuum)
               </button>
            </div>
         </div>

         {/* Safe Query Console */}
         <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
               <Terminal className="w-4 h-4 text-slate-400" />
               <span className="text-xs font-bold text-slate-300 font-mono">D1 Safe Query Console</span>
            </div>
            <div className="p-4">
               <textarea 
                  rows={4}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-none dir-ltr text-left"
                  placeholder="SELECT * FROM articles WHERE translation_status = 'pending' LIMIT 10;"
               />
               <div className="flex justify-end mt-2">
                  <button 
                     onClick={handleRunQuery}
                     disabled={isQuerying || !sqlQuery.trim()}
                     className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors"
                  >
                     {isQuerying ? 'Executing...' : 'Run Query (Ctrl+Enter)'}
                  </button>
               </div>
            </div>
            
            {/* Query Result */}
            {(queryResult || queryError) && (
               <div className="bg-slate-950 p-4 border-t border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto">
                  {queryError ? (
                     <div className="text-rose-400">Error: {queryError}</div>
                  ) : (
                     <>
                        {queryResult?.results && queryResult.results.length > 0 ? (
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="border-b border-slate-800 text-slate-500">
                                    {Object.keys(queryResult.results[0]).map((key) => (
                                       <th key={key} className="p-2 whitespace-nowrap">{key}</th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody>
                                 {queryResult.results.map((row: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                       {Object.values(row).map((val: any, j: number) => (
                                          <td key={j} className="p-2 whitespace-nowrap text-emerald-400">
                                             {val === null ? 'NULL' : String(val)}
                                          </td>
                                       ))}
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        ) : (
                           <div className="text-slate-500 italic p-2">0 rows returned.</div>
                        )}
                        <div className="mt-4 text-slate-500 italic flex justify-between">
                           <span>Query executed successfully.</span>
                           <span>{queryResult?.duration}ms</span>
                        </div>
                     </>
                  )}
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

// 4. System & Cron Settings
export const SystemCronSettingsTab: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Cron Job Manager */}
         <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
               <Clock className="w-4 h-4 text-orange-600" />
               کنترل زمان‌بندی‌ها (Cron Jobs)
            </h3>
            <p className="text-[10px] text-gray-500 mb-5 leading-relaxed">فواصل زمانی اجرای خودکار ورکرها را بسته به ترافیک سایت تنظیم کنید.</p>
            
            <div className="space-y-4">
               <div>
                  <label className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                     <span>پایشگر منابع (Scraper)</span>
                     <span className="text-orange-600">هر ۱۵ دقیقه</span>
                  </label>
                  <input type="range" min="5" max="120" step="5" defaultValue="15" className="w-full accent-orange-500" />
                  <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-1"><span>۵ دقیقه</span><span>۲ ساعت</span></div>
               </div>
               <div>
                  <label className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                     <span>مترجم هوش مصنوعی (AI)</span>
                     <span className="text-orange-600">هر ۳۰ دقیقه</span>
                  </label>
                  <input type="range" min="10" max="180" step="10" defaultValue="30" className="w-full accent-orange-500" />
                  <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-1"><span>۱۰ دقیقه</span><span>۳ ساعت</span></div>
               </div>
               <div>
                  <label className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                     <span>توزیع‌کننده (Publisher)</span>
                     <span className="text-orange-600">هر ۱ ساعت</span>
                  </label>
                  <input type="range" min="15" max="360" step="15" defaultValue="60" className="w-full accent-orange-500" />
                  <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-1"><span>۱۵ دقیقه</span><span>۶ ساعت</span></div>
               </div>
            </div>
            <button className="mt-5 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 rounded-xl font-bold transition-colors">ذخیره زمان‌بندی‌ها</button>
         </div>

         {/* Maintenance Mode (Kill Switch) */}
         <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
               <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Power className="w-4 h-4 text-rose-600" />
                  حالت تعمیر و نگهداری (Kill Switch)
               </h3>
               <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                  با فعال کردن این حالت، تمام عملیات‌های خودکار (کرون‌جاب‌ها) متوقف شده و سیستم به حالت فقط خواندنی (Read-Only) می‌رود. این گزینه برای مواقع آپدیت وردپرس یا عیب‌یابی بحرانی مناسب است.
               </p>
               
               <div className={`p-4 rounded-xl border-2 transition-colors ${maintenanceMode ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                  <label className="flex items-center justify-between cursor-pointer">
                     <span className={`text-xs font-bold ${maintenanceMode ? 'text-rose-700' : 'text-gray-700'}`}>
                        {maintenanceMode ? 'سیستم در حالت تعمیر است' : 'حالت تعمیر غیرفعال است'}
                     </span>
                     <div className="relative">
                        <input type="checkbox" className="sr-only" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${maintenanceMode ? 'bg-rose-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${maintenanceMode ? 'translate-x-4' : ''}`}></div>
                     </div>
                  </label>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
