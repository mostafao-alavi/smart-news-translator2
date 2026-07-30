import React, { useState } from 'react';
import { Sparkles, Users, Database, Clock } from 'lucide-react';
import { 
  AIEngineConfigTab, 
  IdentityRbactab, 
  D1StorageManagerTab, 
  SystemCronSettingsTab 
} from './SystemAISettingsSubTabs';

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
  initialSubTab?: 'engine' | 'rbac' | 'storage' | 'cron';
}

export const SystemAISettingsTab: React.FC<SystemAISettingsTabProps> = ({
  initialSubTab = 'engine',
}) => {
  const [subTab, setSubTab] = useState<'engine' | 'rbac' | 'storage' | 'cron'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={() => setSubTab('engine')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'engine'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>مرکز فرماندهی هوش مصنوعی</span>
          </button>

          <button
            onClick={() => setSubTab('rbac')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'rbac'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>مدیریت هویت و دسترسی‌ها</span>
          </button>

          <button
            onClick={() => setSubTab('storage')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'storage'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>مدیریت پایگاه داده ابری</span>
          </button>

          <button
            onClick={() => setSubTab('cron')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'cron'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>تنظیمات هسته و زمان‌بندی</span>
          </button>
        </div>
      </div>

      {subTab === 'engine' && <AIEngineConfigTab />}
      {subTab === 'rbac' && <IdentityRbactab />}
      {subTab === 'storage' && <D1StorageManagerTab />}
      {subTab === 'cron' && <SystemCronSettingsTab />}
    </div>
  );
};

