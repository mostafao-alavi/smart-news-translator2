import { Hono } from 'hono';
import apiRoutes from './api/routes';
import { scraper } from './cron/scraper';
import { translator } from './cron/translator';
import { Env, ApiResponse, ScheduledEvent, ExecutionContext } from './types';

const app = new Hono<{ Bindings: Env }>();

// Global Error Handler
app.onError((err, c) => {
  console.error('Cloudflare Worker Global Error:', err);
  
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: err.message || 'Internal Server Error',
  };

  return c.json(response, 500);
});

// Mount API routes under /api prefix and root
app.route('/api', apiRoutes);
app.route('/', apiRoutes);

// Serve HTML Web Dashboard on Root (/), /news, /sources, /cron, /code
const renderDashboardHtml = (c: any) => {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ربات اسکرپر و ترجمه هوشمند اخبار - Cloudflare Worker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <style>
    body { font-family: Vazirmatn, sans-serif; background-color: #0f172a; color: #f8fafc; }
    .dir-ltr { direction: ltr; text-align: left; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  </style>
</head>
<body class="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-20">

  <!-- Header -->
  <header class="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center space-x-3 space-x-reverse">
      <div class="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl shadow-lg">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
      </div>
      <div>
        <h1 class="text-xl font-bold text-white">سامانه هوشمند دریافت و ترجمه اخبار (Cloudflare Worker)</h1>
        <p class="text-xs text-slate-400 mt-0.5">مبتنی بر Cloudflare D1 و Workers AI / Gemini API</p>
      </div>
    </div>
    <div class="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-2 rounded-full font-medium shadow-inner">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
      <span id="dbStatusBadge">اتصال زنده دیتابیس D1 برقرار است ( latency ~ 5ms )</span>
    </div>
  </header>

  <!-- Route Navigation Bar -->
  <nav class="bg-slate-800/70 border border-slate-700/80 p-2.5 rounded-xl flex flex-wrap items-center gap-2 shadow-md">
    <a href="/news" onclick="navigateToRoute(event, '/news')" id="navNews" class="px-4 py-2 rounded-lg text-xs font-bold transition-all bg-orange-500/20 text-orange-400 border border-orange-500/30">
      📰 اخبار ترجمه‌شده (/news)
    </a>
    <a href="/sources" onclick="navigateToRoute(event, '/sources')" id="navSources" class="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/50">
      ⚙️ منابع RSS (/sources)
    </a>
    <a href="/cron" onclick="navigateToRoute(event, '/cron')" id="navCron" class="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/50">
      ⚡ تست کرون و اجرا (/cron)
    </a>
    <a href="/code" onclick="navigateToRoute(event, '/code')" id="navCode" class="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/50">
      💻 سورس کدها (/code)
    </a>
  </nav>

  <!-- Quick Stats & Source Controls -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-center relative overflow-hidden group">
      <span class="block text-2xl font-bold text-orange-400" id="statSources">...</span>
      <span class="text-xs text-slate-400">منابع RSS فعال</span>
      <button onclick="openSourcesModal()" class="mt-2 text-[11px] text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 px-2 py-1 rounded-md transition-colors w-full font-medium">
        ⚙️ مدیریت منابع RSS
      </button>
    </div>
    <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-center">
      <span class="block text-2xl font-bold text-sky-400" id="statArticles">...</span>
      <span class="text-xs text-slate-400">اخبار دریافت شده</span>
      <button onclick="openAddArticleModal()" class="mt-2 text-[11px] text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 px-2 py-1 rounded-md transition-colors w-full font-medium">
        ✏️ ثبت خبر دستی
      </button>
    </div>
    <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-center">
      <span class="block text-2xl font-bold text-emerald-400" id="statTranslations">...</span>
      <span class="text-xs text-slate-400">ترجمه شده به فارسی</span>
      <div class="mt-2 text-[11px] text-emerald-400 font-mono py-1">Workers AI / Gemini API</div>
    </div>
    <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-center">
      <span class="block text-2xl font-bold text-amber-400" id="statPending">...</span>
      <span class="text-xs text-slate-400">در انتظار ترجمه</span>
      <button onclick="triggerTranslator()" class="mt-2 text-[11px] text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-1 rounded-md transition-colors w-full font-medium">
        ⚡ ترجمه همه
      </button>
    </div>
  </div>

  <!-- Actions Bar -->
  <div class="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-lg">
    <div class="flex flex-wrap gap-2.5">
      <button onclick="triggerScraper()" id="btnScraper" class="bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2">
        <svg id="spinScraper" class="hidden w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        <span>⚡ اجرای اسکرپر (دریافت اخبار جدید)</span>
      </button>
      <button onclick="triggerTranslator()" id="btnTranslator" class="bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2">
        <svg id="spinTranslator" class="hidden w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
        <span>✨ اجرای مترجم AI (ترجمه اخبار به فارسی)</span>
      </button>
      <button onclick="openAddSourceModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5">
        ➕ افزودن منبع RSS جدید
      </button>
    </div>
    <div class="text-xs text-slate-400">
      تایمر خودکار کِرون: <span class="text-emerald-400 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-700">0 * * * * (هر ۱ ساعت)</span>
    </div>
  </div>

  <!-- News Stream -->
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-bold text-slate-200 flex items-center gap-2">
        <span>آخرین اخبار ذخیره شده در D1</span>
        <span class="text-xs font-normal text-slate-400">(۱۰ مورد اخیر)</span>
      </h2>
      <button onclick="loadNews()" class="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1">
        🔄 بروزرسانی لیست
      </button>
    </div>
    <div id="newsList" class="space-y-3">
      <div class="bg-slate-800/50 p-8 rounded-xl text-center text-slate-400 text-sm">در حال دریافت اخبار از دیتابیس D1...</div>
    </div>
  </section>

  <!-- Live Terminal Logs Monitor -->
  <section class="space-y-2">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>مانیتورینگ و لاگ‌های زنده سیستم (Terminal Output)</span>
      </h3>
      <button onclick="clearTerminal()" class="text-[11px] text-slate-500 hover:text-slate-300">پاکسازی لاگ‌ها</button>
    </div>
    <div id="terminal" class="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-300 h-36 overflow-y-auto space-y-1.5 dir-ltr text-left custom-scrollbar shadow-inner">
      <div class="text-slate-500">[System Ready] Cloudflare Worker News Translator Engine Initialized.</div>
    </div>
  </section>

  <!-- Modal: Manage Sources -->
  <div id="sourcesModal" class="hidden fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-700 pb-3">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          ⚙️ مدیریت منابع خبر (RSS Sources)
        </h3>
        <button onclick="closeSourcesModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      
      <div class="flex gap-2">
        <button onclick="openAddSourceModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg">
          ➕ افزودن منبع جدید
        </button>
        <button onclick="loadSourcesModalList()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-2 rounded-lg">
          🔄 بازخوانی لیست
        </button>
      </div>

      <div id="modalSourcesList" class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
        <div class="text-center text-slate-400 text-xs py-4">در حال دریافت لیست منابع...</div>
      </div>
    </div>
  </div>

  <!-- Modal: Add Source -->
  <div id="addSourceModal" class="hidden fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-700 pb-3">
        <h3 class="text-base font-bold text-white">➕ افزودن منبع RSS جدید</h3>
        <button onclick="closeAddSourceModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-300 font-medium mb-1">پیش‌فرض‌های سریع:</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button onclick="fillSourcePreset('TechCrunch', 'https://techcrunch.com/feed/')" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-slate-200 text-right">🚀 TechCrunch</button>
            <button onclick="fillSourcePreset('BBC Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml')" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-slate-200 text-right">🌐 BBC Tech</button>
            <button onclick="fillSourcePreset('Hacker News', 'https://news.ycombinator.com/rss')" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-slate-200 text-right">🔥 Hacker News</button>
            <button onclick="fillSourcePreset('Reuters World', 'https://www.reutersagency.com/feed/')" class="bg-slate-700 hover:bg-slate-600 p-2 rounded text-slate-200 text-right">📰 Reuters</button>
          </div>
        </div>

        <div>
          <label class="block text-slate-300 font-medium mb-1">نام سایت خبری:</label>
          <input type="text" id="newSrcName" placeholder="مثلاً: TechCrunch" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
        </div>

        <div>
          <label class="block text-slate-300 font-medium mb-1">آدرس فید RSS / Atom:</label>
          <input type="url" id="newSrcUrl" placeholder="https://example.com/rss.xml" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white dir-ltr focus:outline-none focus:border-orange-500">
        </div>

        <button onclick="submitAddSource()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors">
          ذخیره در دیتابیس D1
        </button>
      </div>
    </div>
  </div>

  <!-- Modal: View Full Article -->
  <div id="articleModal" class="hidden fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between border-b border-slate-700 pb-3">
        <span class="bg-orange-500/20 text-orange-400 text-xs px-2.5 py-1 rounded-md font-medium" id="modalArticleSource">Source</span>
        <button onclick="closeArticleModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>

      <div class="space-y-4">
        <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60">
          <span class="text-xs text-slate-400 font-bold block mb-1">متن اصلی انگلیسی (Original):</span>
          <h2 class="text-base font-bold text-slate-200 dir-ltr mb-2" id="modalArticleTitleEn">...</h2>
          <p class="text-xs text-slate-300 dir-ltr leading-relaxed" id="modalArticleContentEn">...</p>
        </div>

        <div class="bg-slate-900/80 p-4 rounded-xl border border-orange-500/30">
          <span class="text-xs text-orange-400 font-bold block mb-1">ترجمه هوشمند فارسی (Persian Translation):</span>
          <h2 class="text-base font-bold text-amber-300 mb-2" id="modalArticleTitleFa">در انتظار ترجمه...</h2>
          <p class="text-xs text-slate-200 leading-relaxed" id="modalArticleContentFa">...</p>
        </div>

        <div class="flex justify-between items-center pt-2">
          <a id="modalArticleUrl" href="#" target="_blank" class="text-xs text-sky-400 hover:underline">مشاهده در سایت مبدأ ↗</a>
          <button onclick="closeArticleModal()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-4 py-2 rounded-lg">بستن</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Add Custom Article -->
  <div id="addArticleModal" class="hidden fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
    <div class="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-700 pb-3">
        <h3 class="text-base font-bold text-white">✏️ ثبت خبر انگلیسی دستی جهت ترجمه</h3>
        <button onclick="closeAddArticleModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-300 font-medium mb-1">عنوان خبر (English Title):</label>
          <input type="text" id="customArtTitle" placeholder="e.g. Breakthrough in Edge AI Announced" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white dir-ltr focus:outline-none focus:border-sky-500">
        </div>

        <div>
          <label class="block text-slate-300 font-medium mb-1">متن خبر (English Content):</label>
          <textarea id="customArtContent" rows="3" placeholder="e.g. Researchers have achieved fast multi-language processing..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white dir-ltr focus:outline-none focus:border-sky-500"></textarea>
        </div>

        <button onclick="submitCustomArticle()" class="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg transition-colors">
          ذخیره در D1 و ترجمه هوشمند خودکار
        </button>
      </div>
    </div>
  </div>

  <!-- Script for Dashboard Logic -->
  <script>
    let currentNews = [];

    function logTerminal(msg, type = 'info') {
      const term = document.getElementById('terminal');
      const time = new Date().toLocaleTimeString('fa-IR');
      let colorClass = 'text-slate-300';
      if (type === 'success') colorClass = 'text-emerald-400 font-bold';
      if (type === 'error') colorClass = 'text-rose-400 font-bold';
      if (type === 'warning') colorClass = 'text-amber-400';
      
      const el = document.createElement('div');
      el.className = colorClass;
      el.innerText = '[' + time + '] ' + msg;
      term.appendChild(el);
      term.scrollTop = term.scrollHeight;
    }

    function clearTerminal() {
      document.getElementById('terminal').innerHTML = '<div class="text-slate-500">[System Cleared] Monitoring logs.</div>';
    }

    async function checkDbStatus() {
      try {
        const res = await fetch('/api/db-status');
        const json = await res.json();
        if (json.success) {
          document.getElementById('dbStatusBadge').innerText = 'اتصال زنده D1 برقرار است (' + json.data.ping_ms + 'ms)';
        }
      } catch(e) {}
    }

    async function loadStats() {
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        if (json.success) {
          document.getElementById('statSources').innerText = json.data.sources_count;
          document.getElementById('statArticles').innerText = json.data.articles_count;
          document.getElementById('statTranslations').innerText = json.data.translations_count;
          document.getElementById('statPending').innerText = json.data.pending_translations_count;
        }
      } catch(e) {}
    }

    async function loadNews() {
      const container = document.getElementById('newsList');
      try {
        const res = await fetch('/api/news');
        const json = await res.json();
        if (json.success) {
          currentNews = json.data || [];
          if (currentNews.length > 0) {
            container.innerHTML = currentNews.map(function(item) {
              var isCompleted = item.translation_status === 'completed' && item.translated_title;
              var statusBadge = isCompleted
                ? '<span class="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">✓ ترجمه شده</span>'
                : '<span class="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium">⏳ در انتظار ترجمه</span>';

              var trTitleHtml = item.translated_title
                ? '<h4 class="text-sm font-bold text-amber-300 mt-2 flex items-center gap-1"><span>✨</span> <span>' + item.translated_title + '</span></h4>'
                : '<div class="text-xs text-slate-500 mt-1 italic">هنوز ترجمه فارسی برای این خبر انجام نشده است.</div>';

              return '<div class="bg-slate-800/90 border border-slate-700/80 p-5 rounded-xl space-y-3 shadow-lg transition-all hover:border-slate-600">' +
                '<div class="flex items-center justify-between">' +
                  '<span class="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium">' + (item.source_name || 'RSS Feed') + '</span>' +
                  '<div class="flex items-center gap-2">' +
                    statusBadge +
                    '<button onclick="deleteArticle(' + item.id + ')" title="حذف" class="text-slate-500 hover:text-rose-400 p-1">🗑️</button>' +
                  '</div>' +
                '</div>' +
                '<div>' +
                  '<h3 class="text-sm font-bold text-slate-200 dir-ltr text-left mb-1">' + item.title + '</h3>' +
                  trTitleHtml +
                '</div>' +
                '<div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/50 pt-3 text-xs">' +
                  '<div class="flex gap-2">' +
                    '<button onclick="openArticleModal(' + item.id + ')" class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg font-medium">📖 مطالعه کامل</button>' +
                    (!isCompleted ? '<button onclick="translateSingleArticle(' + item.id + ')" class="bg-orange-600/80 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium">✨ ترجمه تکی AI</button>' : '') +
                  '</div>' +
                  '<a href="' + item.original_url + '" target="_blank" class="text-sky-400 hover:underline flex items-center gap-1">مشاهده در منبع اصلی ↗</a>' +
                '</div>' +
              '</div>';
            }).join('');
          } else {
            container.innerHTML = '<div class="bg-slate-800/50 p-8 rounded-xl text-center text-slate-400 text-sm">هیچ خبری در D1 یافت نشد. دکمه "افزودن منبع" یا "اجرای اسکرپر" را بزنید.</div>';
          }
        }
      } catch(e) {
        container.innerHTML = '<div class="bg-slate-800/50 p-8 rounded-xl text-center text-rose-400 text-sm">خطا در دریافت لیست اخبار از ورکر.</div>';
      }
    }

    async function triggerScraper() {
      const btn = document.getElementById('btnScraper');
      const spinner = document.getElementById('spinScraper');
      btn.disabled = true;
      spinner.classList.remove('hidden');
      logTerminal('⚡ شروع فرایند اسکرپ فیدهای RSS...', 'warning');

      try {
        const res = await fetch('/api/trigger-scraper', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          logTerminal('✓ اسکرپ موفقیت‌آمیز انجام شد. ' + (json.data.insertedArticles || 0) + ' خبر جدید دریافت گردید.', 'success');
        } else {
          logTerminal('❌ خطا در اسکرپر: ' + json.error, 'error');
        }
      } catch(e) {
        logTerminal('❌ عدم پاسخگویی سرور هنگام اسکرپ', 'error');
      }

      spinner.classList.add('hidden');
      btn.disabled = false;
      await loadStats();
      await loadNews();
    }

    async function triggerTranslator() {
      const btn = document.getElementById('btnTranslator');
      const spinner = document.getElementById('spinTranslator');
      btn.disabled = true;
      spinner.classList.remove('hidden');
      logTerminal('✨ شروع فرایند ترجمه هوشمند اخبار به فارسی با AI...', 'warning');

      try {
        const res = await fetch('/api/trigger-translator', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          logTerminal('✓ ترجمه اخبار با موفقیت به پایان رسید.', 'success');
        } else {
          logTerminal('❌ خطا در ترجمه: ' + json.error, 'error');
        }
      } catch(e) {
        logTerminal('❌ عدم پاسخگویی سرور هنگام ترجمه', 'error');
      }

      spinner.classList.add('hidden');
      btn.disabled = false;
      await loadStats();
      await loadNews();
    }

    async function translateSingleArticle(id) {
      logTerminal('✨ ترجمه اختصاصی خبر کد #' + id + ' در حال انجام است...', 'warning');
      try {
        const res = await fetch('/api/news/' + id + '/translate', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          logTerminal('✓ خبر کد #' + id + ' با موفقیت به فارسی ترجمه شد.', 'success');
          await loadStats();
          await loadNews();
        }
      } catch(e) {
        logTerminal('❌ خطا در ترجمه تکی خبر', 'error');
      }
    }

    async function deleteArticle(id) {
      if (!confirm('آیا از حذف این خبر اطمینان دارید؟')) return;
      try {
        const res = await fetch('/api/news/' + id, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          logTerminal('🗑️ خبر کد #' + id + ' از D1 حذف گردید.', 'info');
          await loadStats();
          await loadNews();
        }
      } catch(e) {}
    }

    // Sources Modal Functions
    function openSourcesModal() {
      document.getElementById('sourcesModal').classList.remove('hidden');
      loadSourcesModalList();
    }
    function closeSourcesModal() {
      document.getElementById('sourcesModal').classList.add('hidden');
    }

    async function loadSourcesModalList() {
      const container = document.getElementById('modalSourcesList');
      try {
        const res = await fetch('/api/sources');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          container.innerHTML = json.data.map(function(s) {
            return '<div class="bg-slate-900 border border-slate-700/70 p-3 rounded-lg flex items-center justify-between text-xs">' +
              '<div>' +
                '<span class="font-bold text-slate-200 block">' + s.name + '</span>' +
                '<span class="text-slate-400 dir-ltr block text-[11px]">' + s.url + '</span>' +
              '</div>' +
              '<div class="flex gap-1.5">' +
                '<button onclick="scrapeSingleSource(' + s.id + ')" class="bg-sky-600/80 hover:bg-sky-500 text-white px-2.5 py-1 rounded">⚡ اسکرپ</button>' +
                '<button onclick="deleteSource(' + s.id + ')" class="bg-rose-600/80 hover:bg-rose-500 text-white px-2.5 py-1 rounded">🗑️ حذف</button>' +
              '</div>' +
            '</div>';
          }).join('');
        } else {
          container.innerHTML = '<div class="text-center text-slate-400 text-xs py-4">هیچ منبعی ثبت نشده است.</div>';
        }
      } catch(e) {}
    }

    async function scrapeSingleSource(id) {
      logTerminal('⚡ شروع اسکرپ منبع #' + id + '...', 'warning');
      try {
        const res = await fetch('/api/sources/' + id + '/scrape', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          logTerminal('✓ اسکرپ منبع انجام شد. ' + (json.data.newlyInserted || 0) + ' مطلب جدید ثبت گردید.', 'success');
          await loadStats();
          await loadNews();
        }
      } catch(e) {}
    }

    async function deleteSource(id) {
      if (!confirm('آیا از حذف این منبع RSS و تمامی اخبارهای مرتبط اطمینان دارید؟')) return;
      try {
        const res = await fetch('/api/sources/' + id, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
          logTerminal('🗑️ منبع #' + id + ' حذف شد.', 'info');
          loadSourcesModalList();
          await loadStats();
          await loadNews();
        }
      } catch(e) {}
    }

    // Add Source Modal
    function openAddSourceModal() {
      document.getElementById('addSourceModal').classList.remove('hidden');
    }
    function closeAddSourceModal() {
      document.getElementById('addSourceModal').classList.add('hidden');
    }
    function fillSourcePreset(name, url) {
      document.getElementById('newSrcName').value = name;
      document.getElementById('newSrcUrl').value = url;
    }

    async function submitAddSource() {
      const name = document.getElementById('newSrcName').value.trim();
      const url = document.getElementById('newSrcUrl').value.trim();
      if (!name || !url) return alert('نام و آدرس فید الزامی است');

      try {
        const res = await fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url, language: 'en' })
        });
        const json = await res.json();
        if (json.success) {
          logTerminal('➕ منبع جدید "' + name + '" در D1 ثبت گردید.', 'success');
          closeAddSourceModal();
          document.getElementById('newSrcName').value = '';
          document.getElementById('newSrcUrl').value = '';
          await loadStats();
          await loadNews();
        } else {
          alert(json.error);
        }
      } catch(e) {}
    }

    // Article Modal
    function openArticleModal(id) {
      const item = currentNews.find(function(a) { return a.id === id; });
      if (!item) return;
      document.getElementById('modalArticleSource').innerText = item.source_name || 'RSS';
      document.getElementById('modalArticleTitleEn').innerText = item.title || '';
      document.getElementById('modalArticleContentEn').innerText = item.content || item.title || '';
      document.getElementById('modalArticleTitleFa').innerText = item.translated_title || 'هنوز ترجمه نشده است';
      document.getElementById('modalArticleContentFa').innerText = item.translated_content || 'در انتظار اجرای مترجم هوشمند...';
      document.getElementById('modalArticleUrl').href = item.original_url || '#';
      document.getElementById('articleModal').classList.remove('hidden');
    }
    function closeArticleModal() {
      document.getElementById('articleModal').classList.add('hidden');
    }

    // Custom Article Modal
    function openAddArticleModal() {
      document.getElementById('addArticleModal').classList.remove('hidden');
    }
    function closeAddArticleModal() {
      document.getElementById('addArticleModal').classList.add('hidden');
    }
    async function submitCustomArticle() {
      const title = document.getElementById('customArtTitle').value.trim();
      const content = document.getElementById('customArtContent').value.trim();
      if (!title) return alert('عنوان خبر الزامی است');

      try {
        const res = await fetch('/api/news/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });
        const json = await res.json();
        if (json.success) {
          logTerminal('✏️ خبر دستی ثبت و ترجمه گردید.', 'success');
          closeAddArticleModal();
          document.getElementById('customArtTitle').value = '';
          document.getElementById('customArtContent').value = '';
          await loadStats();
          await loadNews();
        }
      } catch(e) {}
    }

    function navigateToRoute(e, path) {
      if (e) e.preventDefault();
      window.history.pushState({}, '', path);
      updateActiveRouteTab();
    }

    function updateActiveRouteTab() {
      const path = window.location.pathname.toLowerCase();
      ['navNews', 'navSources', 'navCron', 'navCode'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
          el.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/50";
        }
      });

      let activeId = 'navNews';
      if (path.includes('sources')) { activeId = 'navSources'; openSourcesModal(); }
      else if (path.includes('cron')) { activeId = 'navCron'; }
      else if (path.includes('code')) { activeId = 'navCode'; }

      const activeEl = document.getElementById(activeId);
      if (activeEl) {
        activeEl.className = "px-4 py-2 rounded-lg text-xs font-bold transition-all bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md";
      }
    }

    window.addEventListener('popstate', updateActiveRouteTab);

    // Initial Load
    checkDbStatus();
    loadStats();
    loadNews();
    updateActiveRouteTab();
  </script>
</body>
</html>`;
  return c.html(html);
};

app.get('/', renderDashboardHtml);
app.get('/news', renderDashboardHtml);
app.get('/sources', renderDashboardHtml);
app.get('/cron', renderDashboardHtml);
app.get('/code', renderDashboardHtml);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'operational',
      worker: 'news-worker',
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
});

// Cloudflare Worker export with fetch and scheduled handlers
export default {
  // Fetch event handler for HTTP requests
  fetch: app.fetch,

  // Scheduled event handler for Cloudflare Cron Triggers (crons = ["0 * * * *"])
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger executed at ${new Date().toISOString()} (Cron: ${event.cron})`);

    // Use ctx.waitUntil to ensure background tasks complete fully before worker terminates
    ctx.waitUntil(
      (async () => {
        try {
          // 1. Run RSS Scraper
          console.log('Starting scheduled scraper step...');
          const scraperResult = await scraper(env);
          console.log('Scraper finished:', JSON.stringify(scraperResult));

          // 2. Run AI Translator
          console.log('Starting scheduled translator step...');
          const translatorResult = await translator(env);
          console.log('Translator finished:', JSON.stringify(translatorResult));
        } catch (err) {
          console.error('Fatal error during scheduled cron task execution:', err);
        }
      })()
    );
  },
};
