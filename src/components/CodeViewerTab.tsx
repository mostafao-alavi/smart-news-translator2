import React, { useState, useEffect } from 'react';
import { WorkerFileInfo } from '../types/client';
import {
  FileCode,
  Copy,
  Check,
  Terminal,
  Database,
  Code2,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface CodeViewerTabProps {
  files: WorkerFileInfo[];
}

export const CodeViewerTab: React.FC<CodeViewerTabProps> = ({ files }) => {
  const [selectedFilename, setSelectedFilename] = useState<string>('wrangler.toml');
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    'wrangler.toml': `name = "news-worker"
main = "src/index.ts"
compatibility_date = "2024-03-20"

# Cloudflare D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "news-db"
database_id = "2815bd80-f483-4f9b-872d-93047309ed13"

# Cloudflare Workers AI Binding
[ai]
binding = "AI"

# Cloudflare Workers Assets - Serve Vite React SPA from ./dist
[assets]
directory = "./dist"
not_found_handling = "single-page-application"

# Cron Triggers - Executed every hour
[triggers]
crons = ["0 * * * *"]`,
  });

  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'schema'>('code');

  const handleFetchCode = async (filename: string) => {
    setSelectedFilename(filename);
    if (fileContents[filename]) return;

    setIsLoadingFile(true);
    try {
      const response = await fetch(`/api/worker-file-content?path=${encodeURIComponent(filename)}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data?.content) {
          setFileContents((prev) => ({ ...prev, [filename]: json.data.content }));
        }
      }
    } catch (e) {
      console.error('Error fetching file content:', e);
    } finally {
      setIsLoadingFile(false);
    }
  };

  useEffect(() => {
    handleFetchCode('wrangler.toml');
  }, []);

  const handleCopyCode = (filename: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const d1SqlSchema = `-- Cloudflare D1 Database Schema Setup Commands
-- Run locally or deploy via Wrangler CLI:
-- npx wrangler d1 execute news-db --file=schema.sql

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  language TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  original_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  translation_status TEXT DEFAULT 'pending',
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL UNIQUE,
  target_language TEXT DEFAULT 'persian',
  translated_title TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  translated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- Seed initial sources
INSERT OR IGNORE INTO sources (name, url, language) VALUES 
('BBC World News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'en'),
('TechCrunch', 'https://techcrunch.com/feed/', 'en'),
('Hacker News', 'https://news.ycombinator.com/rss', 'en');`;

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-600" />
            <span>سورس‌کدهای کامل ورکر (Cloudflare Worker Codebase)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            تکتک خطوط کدهای تولید شده طبق استاندارد غیرقابل تغییر، آماده برای Deployment مستقیم در Cloudflare Workers
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Subtab Toggle */}
          <div className="flex items-center gap-2  bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveSubTab('code')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubTab === 'code'
                  ? 'bg-orange-500 text-white font-bold shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              کدهای TypeScript / TOML
            </button>
            <button
              onClick={() => setActiveSubTab('schema')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubTab === 'schema'
                  ? 'bg-orange-500 text-white font-bold shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              اسکیما D1 Database SQL
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'code' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* File Selection Sidebar */}
          <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl p-3 space-y-1 shadow-xs h-fit">
            <div className="text-xs font-semibold text-gray-500 px-3 py-2 border-b border-gray-100 mb-2 flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-orange-500" />
              <span>فایل‌های ورکر (۶ فایل):</span>
            </div>

            {[
              { name: 'wrangler.toml', label: '1. wrangler.toml' },
              { name: 'src/types.ts', label: '2. src/types.ts' },
              { name: 'src/api/routes.ts', label: '3. src/api/routes.ts' },
              { name: 'src/cron/scraper.ts', label: '4. src/cron/scraper.ts' },
              { name: 'src/cron/translator.ts', label: '5. src/cron/translator.ts' },
              { name: 'src/index.ts', label: '6. src/index.ts' },
            ].map((item) => {
              const isSelected = selectedFilename === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleFetchCode(item.name)}
                  className={`w-full text-start px-3 py-2.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 justify-between ${
                    isSelected
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {isSelected && <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="md:col-span-3 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-md flex flex-col">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 ">
                <FileCode className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-gray-200 font-mono">
                  {selectedFilename}
                </span>
              </div>

              <button
                onClick={() =>
                  handleCopyCode(
                    selectedFilename,
                    fileContents[selectedFilename] || '// Code loaded'
                  )
                }
                className="bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2.5 transition-colors"
              >
                {copiedFile === selectedFilename ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی کامل کد</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 overflow-x-auto font-mono text-xs text-gray-200 ltr text-left leading-relaxed bg-gray-950 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre">
                {fileContents[selectedFilename] ||
                  `// Full content of ${selectedFilename} is saved in workspace at /${selectedFilename}`}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* D1 SQL Schema & Deployment Commands */
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 ">
              <Database className="w-5 h-5 text-orange-500" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">اسکیمای جداول Cloudflare D1 (schema.sql)</h4>
                <p className="text-xs text-gray-500">جداول sources ، articles و translations</p>
              </div>
            </div>

            <button
              onClick={() => handleCopyCode('schema.sql', d1SqlSchema)}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-2.5"
            >
              {copiedFile === 'schema.sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">کپی کدهای SQL</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی کدهای SQL</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 font-mono text-xs text-gray-200 ltr text-left overflow-x-auto">
            <pre>{d1SqlSchema}</pre>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
            <span className="font-bold text-orange-600 flex items-center gap-2.5">
              <Terminal className="w-4 h-4" />
              دستور ایجاد دیتابیس D1 و دیپلوی در Cloudflare:
            </span>
            <div className="bg-gray-900 p-3 rounded-lg font-mono text-gray-200 ltr text-left border border-gray-800">
              # 1. Create D1 Database<br />
              npx wrangler d1 create news-db<br /><br />
              # 2. Execute SQL Schema<br />
              npx wrangler d1 execute news-db --file=schema.sql<br /><br />
              # 3. Deploy Worker to Cloudflare<br />
              npx wrangler deploy
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
