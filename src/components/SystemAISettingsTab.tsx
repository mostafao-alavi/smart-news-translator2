import React, { useState } from 'react';
import { Sliders, Users, Database, Sparkles, MessageSquare, Shield, CheckCircle2, Save, Trash2, RefreshCw } from 'lucide-react';
import { SettingsTab, AI_MODELS } from './SettingsTab';
import { D1ManagerTab } from './D1ManagerTab';

interface SystemAISettingsTabProps {
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onResetDatabase: (options: any) => Promise<any>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  workerFiles: any[];
  sources: any[];
  news: any[];
  stats: any;
  onRefreshAll: () => void;
  onAddSource: any;
  onUpdateSource: any;
  onDeleteSource: any;
  onDeleteArticle: any;
  initialSubTab?: 'prompts' | 'users' | 'd1';
}

export const SystemAISettingsTab: React.FC<SystemAISettingsTabProps> = ({
  onTriggerScraper,
  onTriggerTranslator,
  onResetDatabase,
  isTriggeringScraper,
  isTriggeringTranslator,
  workerFiles,
  sources,
  news,
  stats,
  onRefreshAll,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
  onDeleteArticle,
  initialSubTab = 'prompts',
}) => {
  const [subTab, setSubTab] = useState<'prompts' | 'users' | 'd1'>(initialSubTab);

  // AI Prompt & Tone State
  const [systemPrompt, setSystemPrompt] = useState(
    `You are an expert tech news editor and professional translator. Translate the provided English tech news article into fluent, professional, and natural Persian (Farsi). Ensure technical terms (e.g. AI, Cloud, Microservices, API) are translated appropriately while maintaining accurate technical meaning.`
  );
  const [translationTone, setTranslationTone] = useState<'formal' | 'journalistic' | 'casual'>('journalistic');
  const [selectedModel, setSelectedModel] = useState<string>('@cf/meta/m2m100-1.2b');
  const [maxSummaryLength, setMaxSummaryLength] = useState<number>(300);
  const [savedPromptSuccess, setSavedPromptSuccess] = useState(false);

  // Users & Roles State
  const [users] = useState([
    { id: 1, name: 'سردبیر ارشد', email: 'editor@1000dastan.ir', role: 'سردبیر (Editor-in-Chief)', access: 'تایید و انتشار، ویرایش اخبار، مدیریت فیدها' },
    { id: 2, name: 'مدیر فنی سیستم', email: 'tech@1000dastan.ir', role: 'مدیر فنی (Tech Lead)', access: 'دسترس کامل سیستم، D1، پرامپت‌ها و ورکرها' },
    { id: 3, name: 'مترجم آنلاین AI', email: 'workers-ai@system.local', role: 'سرویس هوشمند', access: 'ترجمه خودکار پیش‌فرض' },
  ]);

  const handleSavePromptSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedPromptSuccess(true);
    setTimeout(() => setSavedPromptSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          <button
            onClick={() => setSubTab('prompts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'prompts'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>تنظیمات پرامپت‌ها و لحن ترجمه AI</span>
          </button>

          <button
            onClick={() => setSubTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'users'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>مدیریت کاربران و سطح دسترسی</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('d1')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'd1'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>مدیریت دیتابیس D1 و پاکسازی</span>
          </button>
        </div>
      </div>

      {/* 1. AI Prompts & Tone SubTab */}
      {subTab === 'prompts' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">تنظیمات هوش مصنوعی و پرامپت سیستم (AI Brain Config)</h3>
                <p className="text-xs text-gray-500 mt-0.5">تنظیم دستورالعمل‌های ترجمه، مدل پیش‌فرض و لحن نگارش بدون دستکاری کدها</p>
              </div>
            </div>

            {savedPromptSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تنظیمات پرامپت و لحن نگارش با موفقیت ذخیره گردید.</span>
              </div>
            )}

            <form onSubmit={handleSavePromptSettings} className="space-y-4">
              {/* System Prompt Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  دستورالعمل پایه هوش مصنوعی (System Prompt)
                </label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none dir-ltr text-left"
                />
              </div>

              {/* Translation Tone & Model Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">لحن ترجمه و نگارش</label>
                  <select
                    value={translationTone}
                    onChange={(e: any) => setTranslationTone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="journalistic">خبری و روان (پیش‌فرض رسانه‌ای)</option>
                    <option value="formal">رسمی و آکادمیک / تخصصی</option>
                    <option value="casual">جذاب، روان و عمومی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">مدل پیش‌فرض Workers AI</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono dir-ltr text-left"
                  >
                    {AI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">حداکثر طول چکیده ترجمه (کاراکتر)</label>
                  <input
                    type="number"
                    value={maxSummaryLength}
                    onChange={(e) => setMaxSummaryLength(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تنظیمات پرامپت</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. User Roles SubTab */}
      {subTab === 'users' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Users className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-gray-900">مدیریت کاربران و سطح دسترسی داشبورد</h3>
          </div>

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{u.name}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                      {u.role}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{u.email}</div>
                  <div className="text-[11px] text-gray-600 mt-1">دسترسی: {u.access}</div>
                </div>

                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg shrink-0">
                  فعال
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. D1 Database SubTab */}
      {subTab === 'd1' && (
        <div className="space-y-6">
          <D1ManagerTab
            sources={sources}
            news={news}
            stats={stats}
            onRefreshAll={onRefreshAll}
            onAddSource={onAddSource}
            onUpdateSource={onUpdateSource}
            onDeleteSource={onDeleteSource}
            onDeleteArticle={onDeleteArticle}
          />

          <SettingsTab
            onTriggerScraper={onTriggerScraper}
            onTriggerTranslator={onTriggerTranslator}
            onResetDatabase={onResetDatabase}
            isTriggeringScraper={isTriggeringScraper}
            isTriggeringTranslator={isTriggeringTranslator}
            workerFiles={workerFiles}
          />
        </div>
      )}
    </div>
  );
};
