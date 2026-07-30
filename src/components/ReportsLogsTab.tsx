import React, { useState } from 'react';
import { 
  Bug, 
  Activity, 
  Users, 
  BarChart4, 
  Database, 
  BellRing
} from 'lucide-react';
import { SettingsTab } from './SettingsTab';
import { 
  DeepErrorTracingTab, 
  ResourceBillingTab, 
  AuditTrailsTab, 
  DistributionAnalyticsTab, 
  DataRetentionTab, 
  AutomatedAlertsTab 
} from './ReportsLogsSubTabs';

interface ReportsLogsTabProps {
  onTriggerScraper: () => void;
  onTriggerTranslator: () => void;
  onResetDatabase: (options: any) => Promise<any>;
  isTriggeringScraper: boolean;
  isTriggeringTranslator: boolean;
  workerFiles: any[];
  initialSubTab?: 'tracing' | 'billing' | 'audit' | 'analytics' | 'retention' | 'alerts';
}

export const ReportsLogsTab: React.FC<ReportsLogsTabProps> = ({
  onTriggerScraper,
  onTriggerTranslator,
  onResetDatabase,
  isTriggeringScraper,
  isTriggeringTranslator,
  workerFiles,
  initialSubTab = 'tracing',
}) => {
  const [subTab, setSubTab] = useState<'tracing' | 'billing' | 'audit' | 'analytics' | 'retention' | 'alerts'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Top Sub-Menu Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={() => setSubTab('tracing')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'tracing'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>ردیابی عمیق خطاها</span>
          </button>

          <button
            onClick={() => setSubTab('billing')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'billing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>مصرف منابع و هزینه‌ها</span>
          </button>

          <button
            onClick={() => setSubTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'audit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ردپای حسابرسی</span>
          </button>

          <button
            onClick={() => setSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart4 className="w-4 h-4" />
            <span>تحلیلگر جامع توزیع</span>
          </button>

          <button
            onClick={() => setSubTab('retention')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'retention'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>چرخه حیات داده‌ها</span>
          </button>

          <button
            onClick={() => setSubTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'alerts'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>سیستم هشدار خودکار</span>
          </button>
        </div>
      </div>

      {subTab === 'tracing' && <DeepErrorTracingTab />}
      {subTab === 'billing' && <ResourceBillingTab />}
      {subTab === 'audit' && <AuditTrailsTab />}
      {subTab === 'analytics' && <DistributionAnalyticsTab />}
      {subTab === 'retention' && <DataRetentionTab />}
      {subTab === 'alerts' && <AutomatedAlertsTab />}
    </div>
  );
};

