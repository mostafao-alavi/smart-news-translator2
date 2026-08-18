// In-memory fallback tables & execution engine for local dev and testing
const memoryTables: Record<string, any[]> = {
  sources: [
    { id: 1, name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', rss_url: 'https://cointelegraph.com/rss', base_url: 'https://cointelegraph.com', language: 'en', category: 'crypto', selector: '', is_active: 1, scrape_limit: 10, created_at: new Date().toISOString() },
    { id: 2, name: 'Decrypt', url: 'https://decrypt.co/feed', rss_url: 'https://decrypt.co/feed', base_url: 'https://decrypt.co', language: 'en', category: 'crypto', selector: '', is_active: 1, scrape_limit: 10, created_at: new Date().toISOString() },
    { id: 3, name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', rss_url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', base_url: 'https://www.coindesk.com', language: 'en', category: 'crypto', selector: '', is_active: 1, scrape_limit: 10, created_at: new Date().toISOString() }
  ],
  articles: [
    {
      id: 1,
      source_id: 1,
      external_id: 'ct-sample-1',
      title: 'Bitcoin Surges Past $100K as Institutional Inflows Accelerate',
      link: 'https://cointelegraph.com/news/bitcoin-surges-past-100k',
      original_url: 'https://cointelegraph.com/news/bitcoin-surges-past-100k',
      content: 'Bitcoin reached a new all-time high today amid strong institutional demand and ETF inflows.',
      summary: 'Bitcoin hits new record high as market sentiment remains strongly bullish.',
      featured_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      published_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: 'translated',
      translation_status: 'completed',
      wp_sync_status: 'published',
      wp_post_id: 1042,
      wp_published_at: new Date().toISOString(),
      wp_error: null,
      telegram_sync_status: 'published',
      telegram_message_id: '984',
      telegram_published_at: new Date().toISOString(),
      telegram_error: null
    }
  ],
  article_contents: [],
  article_images: [],
  translations: [
    {
      id: 1,
      article_id: 1,
      target_language: 'persian',
      translated_title: 'جهش تاریخی بیت‌کوین به بالای ۱۰۰ هزار دلار با ورود پرقدرت سرمایه‌گذاران نهادی',
      translated_content: 'بیت‌کوین در پی افزایش بی‌سابقه جریان ورودی سرمایه به صندوق‌های ETF و تقاضای سنگین نهادی، رکورد تاریخی جدیدی را به ثبت رساند.',
      translated_at: new Date().toISOString(),
      model_used: 'workers-ai-llama-3.3-70b',
      ai_model: 'workers-ai-llama-3.3-70b',
      approval_status: 'approved',
      suggested_titles: '["بیت‌کوین از مرز ۱۰۰ هزار دلار عبور کرد","رکوردشکنی تاریخی قیمت پادشاه ارزهای دیجیتال"]',
      tags: 'بیت کوین, کریپتو, ارز دیجیتال, ETF',
      meta_description: 'گزارش کامل از رکورد تاریخی بیت‌کوین و تحلیل جریان ورودی سرمایه‌های نهادی به بازار کریپتو.'
    }
  ],
  distributions: [
    {
      id: 1,
      translation_id: 1,
      article_id: 1,
      platform: 'wordpress',
      target_platform: 'wordpress',
      status: 'published',
      external_id: '1042',
      distributed_at: new Date().toISOString()
    },
    {
      id: 2,
      translation_id: 1,
      article_id: 1,
      platform: 'telegram',
      target_platform: 'telegram',
      status: 'published',
      external_id: '984',
      distributed_at: new Date().toISOString()
    }
  ],
  platforms: [
    { id: 1, name: 'updaaate.ir (سایت اصلی)', slug: 'updaaate_ir', platform_type: 'wordpress', api_url: 'https://updaaate.ir/wp-json/wp/v2', is_active: 1 },
    { id: 2, name: 'کانال تلگرام آپدیت (@updaaate_crypto)', slug: 'telegram_news', platform_type: 'telegram', api_url: 'https://api.telegram.org/bot/sendMessage', is_active: 1 }
  ],
  execution_logs: [],
  system_events: [
    { id: 1, event_type: 'SYSTEM_START', description: 'سامانه هزاردستان با موفقیت راه‌اندازی شد', created_at: new Date().toISOString() }
  ],
  translation_history: [],
  system_metrics: [],
  source_configs: [],
  crawl_jobs: [],
  crawl_checkpoints: [],
  sitemap_entries: [],
  crawl_errors: [],
  article_blocks: [],
  tags: [],
  article_tags: [],
  backup_destinations: [],
  backup_runs: []
};

let autoIncrementIds: Record<string, number> = {
  sources: 4,
  articles: 2,
  article_contents: 1,
  article_images: 1,
  translations: 2,
  distributions: 3,
  platforms: 3,
  execution_logs: 1,
  system_events: 2,
  translation_history: 1,
  source_configs: 1,
  crawl_jobs: 1,
  crawl_checkpoints: 1,
  sitemap_entries: 1,
  crawl_errors: 1,
  article_blocks: 1,
  tags: 1,
  article_tags: 1,
  backup_destinations: 1,
  backup_runs: 1
};

function executeMemoryQuery(query: string, params: any[] = []): { results?: any[]; meta?: any } {
  const q = query.trim();
  const qLower = q.toLowerCase();

  // 1. COUNT queries
  if (qLower.includes('count(')) {
    let tableName = 'articles';
    for (const tbl of Object.keys(memoryTables)) {
      if (qLower.includes(`from ${tbl}`)) {
        tableName = tbl;
        break;
      }
    }
    const rows = memoryTables[tableName] || [];
    let count = rows.length;

    if (qLower.includes('is_active = 1')) {
      count = rows.filter((r: any) => r.is_active === 1 || r.is_active === true || r.is_active === undefined).length;
    } else if (qLower.includes("translation_status = 'pending'")) {
      count = rows.filter((r: any) => r.translation_status === 'pending').length;
    } else if (qLower.includes("translation_status = 'completed'") || qLower.includes("status = 'translated'")) {
      count = rows.filter((r: any) => r.translation_status === 'completed' || r.status === 'translated').length;
    } else if (qLower.includes("wp_sync_status = 'published'")) {
      count = rows.filter((r: any) => r.wp_sync_status === 'published').length;
    }

    return { results: [{ count }] };
  }

  // 2. SELECT queries
  if (qLower.startsWith('select')) {
    let tableName = 'articles';
    for (const tbl of Object.keys(memoryTables)) {
      if (qLower.includes(`from ${tbl}`)) {
        tableName = tbl;
        break;
      }
    }
    let rows = [...(memoryTables[tableName] || [])];

    // Check specific conditions
    if (qLower.includes('where id = ?') && params.length > 0) {
      const idToFind = Number(params[0]);
      rows = rows.filter(r => r.id === idToFind);
    } else if (qLower.includes('where article_id = ?') && params.length > 0) {
      const artIdToFind = Number(params[0]);
      rows = rows.filter(r => r.article_id === artIdToFind);
    }

    // Sorting
    if (qLower.includes('order by')) {
      if (qLower.includes('created_at desc') || qLower.includes('id desc')) {
        rows.sort((a, b) => (b.id || 0) - (a.id || 0));
      } else if (qLower.includes('id asc')) {
        rows.sort((a, b) => (a.id || 0) - (b.id || 0));
      }
    }

    // Limit
    if (qLower.includes('limit ?') && params.length > 0) {
      const limitVal = Number(params[params.length - 1]);
      if (!isNaN(limitVal)) {
        rows = rows.slice(0, limitVal);
      }
    } else if (qLower.includes('limit 50')) {
      rows = rows.slice(0, 50);
    } else if (qLower.includes('limit 30')) {
      rows = rows.slice(0, 30);
    }

    return { results: rows };
  }

  // 3. INSERT queries
  if (qLower.startsWith('insert into')) {
    let tableName = 'articles';
    for (const tbl of Object.keys(memoryTables)) {
      if (qLower.includes(`insert into ${tbl}`)) {
        tableName = tbl;
        break;
      }
    }
    const newId = autoIncrementIds[tableName] ? autoIncrementIds[tableName]++ : Date.now();
    const newRow: any = { id: newId, created_at: new Date().toISOString() };

    if (tableName === 'sources') {
      newRow.name = params[0] || 'منبع جدید';
      newRow.url = params[1] || '';
      newRow.base_url = params[2] || '';
      newRow.language = params[3] || 'en';
      newRow.category = params[4] || 'crypto';
      newRow.selector = params[5] || '';
      newRow.scrape_limit = params[6] || 10;
      newRow.is_active = params[7] ?? 1;
    } else if (tableName === 'articles') {
      newRow.source_id = params[0] || 1;
      newRow.title = params[1] || '';
      newRow.link = params[2] || '';
      newRow.original_url = params[2] || '';
      newRow.content = params[3] || '';
      newRow.summary = params[3] || '';
      newRow.featured_image = params[4] || '';
      newRow.published_at = params[5] || new Date().toISOString();
      newRow.translation_status = 'pending';
      newRow.wp_sync_status = 'pending';
    } else if (tableName === 'execution_logs') {
      newRow.task_type = params[0] || '';
      newRow.status = params[1] || '';
      newRow.items_processed = params[2] || 0;
      newRow.items_success = params[3] || 0;
      newRow.error_message = params[4] || null;
      newRow.duration_ms = params[5] || 0;
      newRow.executed_at = new Date().toISOString();
    } else if (tableName === 'system_events') {
      newRow.event_type = params[0] || '';
      newRow.description = params[1] || '';
    }

    if (memoryTables[tableName]) {
      memoryTables[tableName].push(newRow);
    }

    return { meta: { changes: 1, last_row_id: newId, lastInsertRowid: newId } };
  }

  // 4. UPDATE queries
  if (qLower.startsWith('update')) {
    let tableName = 'articles';
    for (const tbl of Object.keys(memoryTables)) {
      if (qLower.includes(`update ${tbl}`)) {
        tableName = tbl;
        break;
      }
    }
    return { meta: { changes: 1 } };
  }

  // 5. DELETE queries
  if (qLower.startsWith('delete from')) {
    let tableName = 'articles';
    for (const tbl of Object.keys(memoryTables)) {
      if (qLower.includes(`delete from ${tbl}`)) {
        tableName = tbl;
        break;
      }
    }
    if (qLower.includes('where id = ?') && params.length > 0) {
      const idToDel = Number(params[0]);
      if (memoryTables[tableName]) {
        memoryTables[tableName] = memoryTables[tableName].filter(r => r.id !== idToDel);
      }
    }
    return { meta: { changes: 1 } };
  }

  return { results: [], meta: { changes: 0 } };
}

export const mockD1 = {
  prepare: (query: string) => {
    return {
      bind: (...params: any[]) => {
        return {
          all: async <T = any>() => {
            const res = executeMemoryQuery(query, params);
            return { success: true, results: (res.results || []) as T[] };
          },
          run: async () => {
            const res = executeMemoryQuery(query, params);
            return { success: true, meta: res.meta || { changes: 1, last_row_id: 1 } };
          },
          first: async <T = any>() => {
            const res = executeMemoryQuery(query, params);
            return (res.results && res.results.length > 0 ? res.results[0] : null) as T;
          }
        };
      },
      all: async <T = any>() => {
        const res = executeMemoryQuery(query, []);
        return { success: true, results: (res.results || []) as T[] };
      },
      run: async () => {
        const res = executeMemoryQuery(query, []);
        return { success: true, meta: res.meta || { changes: 1, last_row_id: 1 } };
      },
      first: async <T = any>() => {
        const res = executeMemoryQuery(query, []);
        return (res.results && res.results.length > 0 ? res.results[0] : null) as T;
      }
    };
  },
  batch: async (statements: any[]) => {
    const results = [];
    for (const stmt of statements) {
      try {
        const r = await stmt.all();
        results.push(r);
      } catch {
        try {
          const r2 = await stmt.run();
          results.push(r2);
        } catch {
          results.push({ results: [{ count: 0 }] });
        }
      }
    }
    return results;
  },
  exec: async (query: string) => ({ success: true })
};

const localKvMap = new Map<string, string>();
export const mockKV = {
  get: async (key: string) => localKvMap.get(key) || null,
  put: async (key: string, value: string) => { localKvMap.set(key, String(value)); },
  delete: async (key: string) => { localKvMap.delete(key); },
  list: async () => ({ keys: Array.from(localKvMap.keys()).map(k => ({ name: k })), list_complete: true }),
};
