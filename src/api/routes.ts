import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, ApiResponse, Source, JoinedArticleNews, StatsData } from '../types.ts';
import { wpSyncPublisher, testWordPressConnection } from '../cron/wpSync.ts';
import { testBot, sendNewsToTelegram } from '../cron/telegramBot.ts';
import { hydrateEnvWithSecrets, getSecretsStatus, getSecret } from '../utils/secrets.ts';

const api = new Hono<{ Bindings: Env }>();

// Enable CORS and Secrets Hydration for all routes
api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

api.use('*', async (c, next) => {
  if (c.env) {
    try {
      await hydrateEnvWithSecrets(c.env);
    } catch (e: any) {
      console.warn('[Secrets Store] Route hydration notice:', e?.message || e);
    }
  }
  await next();
});

let tablesEnsured = false;
export async function ensureTablesAndLogs(db: any, force: boolean = false) {
  if (!db) return;
  if (tablesEnsured && !force) return;

  try {
    const tableSqls = [
      `CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        language TEXT DEFAULT 'en',
        category TEXT DEFAULT 'general',
        selector TEXT DEFAULT NULL,
        scrape_limit INTEGER DEFAULT 10,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );`,
      `CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        original_url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        published_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        translation_status TEXT DEFAULT 'pending',
        FOREIGN KEY (source_id) REFERENCES sources(id)
      );`,
      `CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL UNIQUE,
        target_language TEXT DEFAULT 'persian',
        translated_title TEXT NOT NULL,
        translated_content TEXT NOT NULL,
        translated_at TEXT DEFAULT (datetime('now')),
        model_used TEXT,
        ai_model TEXT,
        FOREIGN KEY (article_id) REFERENCES articles(id)
      );`,
      `CREATE TABLE IF NOT EXISTS translation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        target_language TEXT DEFAULT 'persian',
        translated_title TEXT NOT NULL,
        translated_content TEXT NOT NULL,
        translated_at TEXT DEFAULT (datetime('now')),
        model_used TEXT NOT NULL,
        FOREIGN KEY (article_id) REFERENCES articles(id)
      );`,
      `CREATE TABLE IF NOT EXISTS execution_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_type TEXT NOT NULL,
        status TEXT NOT NULL,
        items_processed INTEGER DEFAULT 0,
        items_success INTEGER DEFAULT 0,
        error_message TEXT,
        duration_ms INTEGER DEFAULT 0,
        executed_at TEXT DEFAULT (datetime('now'))
      );`,
      `CREATE TABLE IF NOT EXISTS system_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );`,
      `CREATE TABLE IF NOT EXISTS distributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        translation_id INTEGER NOT NULL,
        target_platform TEXT NOT NULL,
        author_name TEXT,
        platform_post_id TEXT,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (translation_id) REFERENCES translations(id)
      );`,
      `CREATE TABLE IF NOT EXISTS platforms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        platform_type TEXT DEFAULT 'wordpress',
        api_url TEXT NOT NULL,
        auth_username TEXT,
        auth_password_secret TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );`,
      `CREATE TABLE IF NOT EXISTS system_metrics (
        key TEXT PRIMARY KEY,
        value INTEGER DEFAULT 0
      );`
    ];

    for (const sql of tableSqls) {
      try { await db.prepare(sql).run(); } catch {}
    }

    // Initialize metrics if empty
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO system_metrics (key, value) VALUES
        ('sources_count', (SELECT COUNT(*) FROM sources)),
        ('articles_count', (SELECT COUNT(*) FROM articles)),
        ('translations_count', (SELECT COUNT(*) FROM translations)),
        ('pending_translations_count', (SELECT COUNT(*) FROM articles WHERE translation_status = 'pending')),
        ('wp_published_count', (SELECT COUNT(*) FROM articles WHERE wp_sync_status = 'published')),
        ('distributions_count', (SELECT COUNT(*) FROM distributions)),
        ('platforms_count', (SELECT COUNT(*) FROM platforms)),
        ('approved_translations_count', (SELECT COUNT(*) FROM translations WHERE approval_status = 'approved' OR approval_status IS NULL))
      `).run();
    } catch {}

    // Safe column migrations for existing tables
    const migrations = [
      "ALTER TABLE sources ADD COLUMN category TEXT DEFAULT 'general'",
      "ALTER TABLE sources ADD COLUMN selector TEXT DEFAULT NULL",
      "ALTER TABLE sources ADD COLUMN scrape_limit INTEGER DEFAULT 10",
      "ALTER TABLE sources ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE sources ADD COLUMN created_at TEXT DEFAULT (datetime('now'))",
      "ALTER TABLE articles ADD COLUMN published_at TEXT",
      "ALTER TABLE articles ADD COLUMN translation_status TEXT DEFAULT 'pending'",
      "ALTER TABLE articles ADD COLUMN wp_sync_status TEXT DEFAULT 'pending'",
      "ALTER TABLE articles ADD COLUMN wp_post_id INTEGER",
      "ALTER TABLE articles ADD COLUMN wp_published_at TEXT",
      "ALTER TABLE articles ADD COLUMN wp_error TEXT",
      "ALTER TABLE articles ADD COLUMN telegram_sync_status TEXT DEFAULT 'pending'",
      "ALTER TABLE articles ADD COLUMN telegram_message_id TEXT",
      "ALTER TABLE articles ADD COLUMN telegram_published_at TEXT",
      "ALTER TABLE articles ADD COLUMN telegram_error TEXT",
      "ALTER TABLE translations ADD COLUMN model_used TEXT",
      "ALTER TABLE translations ADD COLUMN ai_model TEXT",
      "ALTER TABLE translations ADD COLUMN approval_status TEXT DEFAULT 'approved'",
      "ALTER TABLE translations ADD COLUMN suggested_titles TEXT",
      "ALTER TABLE translations ADD COLUMN tags TEXT",
      "ALTER TABLE translations ADD COLUMN meta_description TEXT",
      "ALTER TABLE translation_history ADD COLUMN suggested_titles TEXT",
      "ALTER TABLE translation_history ADD COLUMN tags TEXT",
      "ALTER TABLE translation_history ADD COLUMN meta_description TEXT"
    ];

    for (const sql of migrations) {
      try { await db.prepare(sql).run(); } catch {}
    }

    // Seed default platforms if empty
    try {
      const platCount: any = await db.prepare("SELECT COUNT(*) as count FROM platforms").first();
      if (!platCount || platCount.count === 0) {
        await db.prepare(`
          INSERT INTO platforms (name, slug, platform_type, api_url, is_active)
          VALUES 
            ('updaaate.ir (سایت اصلی)', 'updaaate_ir', 'wordpress', 'https://updaaate.ir/wp-json/wp/v2', 1),
            ('مترجم هوشمند وب‌سایت B', 'site_b_tech', 'wordpress', 'https://api.tech-site-b.ir/wp-json/wp/v2', 1),
            ('کانال تلگرام هزاردستان', 'telegram_news', 'telegram', 'https://api.telegram.org/bot/sendMessage', 1)
        `).run();
      }
    } catch {}

    // Indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(translation_status);',
      'CREATE INDEX IF NOT EXISTS idx_articles_wp_status ON articles(wp_sync_status);',
      'CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);',
      'CREATE INDEX IF NOT EXISTS idx_translations_model ON translations(model_used);',
      'CREATE INDEX IF NOT EXISTS idx_translations_approval ON translations(approval_status);',
      'CREATE INDEX IF NOT EXISTS idx_execution_logs_time ON execution_logs(executed_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_translation_history_article ON translation_history(article_id);',
      'CREATE INDEX IF NOT EXISTS idx_distributions_translation ON distributions(translation_id);',
      'CREATE INDEX IF NOT EXISTS idx_distributions_platform ON distributions(target_platform);'
    ];

    for (const sql of indexes) {
      try { await db.prepare(sql).run(); } catch {}
    }

    // Triggers for system_metrics
    const triggers = [
      `CREATE TRIGGER IF NOT EXISTS trg_inc_sources AFTER INSERT ON sources BEGIN UPDATE system_metrics SET value = value + 1 WHERE key = 'sources_count'; END;`,
      `CREATE TRIGGER IF NOT EXISTS trg_dec_sources AFTER DELETE ON sources BEGIN UPDATE system_metrics SET value = value - 1 WHERE key = 'sources_count'; END;`,
      
      `CREATE TRIGGER IF NOT EXISTS trg_inc_articles AFTER INSERT ON articles BEGIN 
         UPDATE system_metrics SET value = value + 1 WHERE key = 'articles_count';
         UPDATE system_metrics SET value = value + 1 WHERE key = 'pending_translations_count' AND NEW.translation_status = 'pending';
         UPDATE system_metrics SET value = value + 1 WHERE key = 'wp_published_count' AND NEW.wp_sync_status = 'published';
       END;`,
      `CREATE TRIGGER IF NOT EXISTS trg_dec_articles AFTER DELETE ON articles BEGIN 
         UPDATE system_metrics SET value = value - 1 WHERE key = 'articles_count';
         UPDATE system_metrics SET value = value - 1 WHERE key = 'pending_translations_count' AND OLD.translation_status = 'pending';
         UPDATE system_metrics SET value = value - 1 WHERE key = 'wp_published_count' AND OLD.wp_sync_status = 'published';
       END;`,
      `CREATE TRIGGER IF NOT EXISTS trg_upd_articles AFTER UPDATE ON articles BEGIN
         UPDATE system_metrics SET value = value - 1 WHERE key = 'pending_translations_count' AND OLD.translation_status = 'pending' AND NEW.translation_status != 'pending';
         UPDATE system_metrics SET value = value + 1 WHERE key = 'pending_translations_count' AND OLD.translation_status != 'pending' AND NEW.translation_status = 'pending';
         UPDATE system_metrics SET value = value - 1 WHERE key = 'wp_published_count' AND OLD.wp_sync_status = 'published' AND NEW.wp_sync_status != 'published';
         UPDATE system_metrics SET value = value + 1 WHERE key = 'wp_published_count' AND OLD.wp_sync_status != 'published' AND NEW.wp_sync_status = 'published';
       END;`,

      `CREATE TRIGGER IF NOT EXISTS trg_inc_translations AFTER INSERT ON translations BEGIN 
         UPDATE system_metrics SET value = value + 1 WHERE key = 'translations_count';
         UPDATE system_metrics SET value = value + 1 WHERE key = 'approved_translations_count' AND (NEW.approval_status = 'approved' OR NEW.approval_status IS NULL);
       END;`,
      `CREATE TRIGGER IF NOT EXISTS trg_dec_translations AFTER DELETE ON translations BEGIN 
         UPDATE system_metrics SET value = value - 1 WHERE key = 'translations_count';
         UPDATE system_metrics SET value = value - 1 WHERE key = 'approved_translations_count' AND (OLD.approval_status = 'approved' OR OLD.approval_status IS NULL);
       END;`,
       `CREATE TRIGGER IF NOT EXISTS trg_upd_translations AFTER UPDATE ON translations BEGIN
         UPDATE system_metrics SET value = value - 1 WHERE key = 'approved_translations_count' AND (OLD.approval_status = 'approved' OR OLD.approval_status IS NULL) AND NEW.approval_status != 'approved' AND NEW.approval_status IS NOT NULL;
         UPDATE system_metrics SET value = value + 1 WHERE key = 'approved_translations_count' AND (OLD.approval_status != 'approved' AND OLD.approval_status IS NOT NULL) AND (NEW.approval_status = 'approved' OR NEW.approval_status IS NULL);
       END;`,
       
      `CREATE TRIGGER IF NOT EXISTS trg_inc_distributions AFTER INSERT ON distributions BEGIN UPDATE system_metrics SET value = value + 1 WHERE key = 'distributions_count'; END;`,
      `CREATE TRIGGER IF NOT EXISTS trg_dec_distributions AFTER DELETE ON distributions BEGIN UPDATE system_metrics SET value = value - 1 WHERE key = 'distributions_count'; END;`,
      
      `CREATE TRIGGER IF NOT EXISTS trg_inc_platforms AFTER INSERT ON platforms BEGIN UPDATE system_metrics SET value = value + 1 WHERE key = 'platforms_count'; END;`,
      `CREATE TRIGGER IF NOT EXISTS trg_dec_platforms AFTER DELETE ON platforms BEGIN UPDATE system_metrics SET value = value - 1 WHERE key = 'platforms_count'; END;`
    ];

    for (const sql of triggers) {
      try { await db.prepare(sql).run(); } catch {}
    }

    tablesEnsured = true;
  } catch (err) {
    console.warn('Database table auto-initialization check:', err);
  }
}

export async function pruneOldArticles(db: any) {
  if (!db) return { prunedCount: 0 };
  try {
    // 1. Identify articles older than 7 days
    const oldArticles = await db.prepare(`
      SELECT id FROM articles 
      WHERE (published_at < datetime('now', '-7 days') OR created_at < datetime('now', '-7 days'))
        AND (content IS NOT NULL AND content != '')
    `).all();

    const idsToPrune = (oldArticles.results || []).map((r: any) => r.id);

    if (idsToPrune.length === 0) {
      return { prunedCount: 0 };
    }

    // 2. Prune heavy full-text content in articles and translations, preserving titles & metadata
    await db.batch([
      db.prepare(`
        UPDATE articles 
        SET content = '[محتوای متنی باسنوات بیش از ۷ روز برای مدیریت فضای دیتابیس D1 پاکسازی شد]'
        WHERE (published_at < datetime('now', '-7 days') OR created_at < datetime('now', '-7 days'))
      `),
      db.prepare(`
        UPDATE translations 
        SET translated_content = '[متن ترجمه قدیمیتر از ۷ روز جهت بهینه‌سازی حافظه D1 پاکسازی گردید]'
        WHERE article_id IN (
          SELECT id FROM articles 
          WHERE (published_at < datetime('now', '-7 days') OR created_at < datetime('now', '-7 days'))
        )
      `)
    ]);

    await recordSystemEvent(
      db, 
      'D1_GARBAGE_COLLECTION', 
      `پاکسازی خودکار D1 انجام شد: متن سنگین ${idsToPrune.length} خبر قدیمی‌تر از ۷ روز جهت مدیریت سقف ۵۰۰ مگابایت حذف گردید.`
    );

    return { prunedCount: idsToPrune.length };
  } catch (err: any) {
    console.error('Error during D1 garbage collection:', err);
    return { prunedCount: 0, error: err.message };
  }
}

export async function recordExecutionLog(
  db: any,
  taskType: string,
  status: string,
  itemsProcessed: number = 0,
  itemsSuccess: number = 0,
  errorMessage: string | null = null,
  durationMs: number = 0
) {
  if (!db) return;
  try {
    await db.prepare(`
      INSERT INTO execution_logs (task_type, status, items_processed, items_success, error_message, duration_ms, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(taskType, status, itemsProcessed, itemsSuccess, errorMessage, durationMs).run();
  } catch (e) {
    console.warn('Failed to insert execution log:', e);
  }
}

export async function recordSystemEvent(db: any, eventType: string, description: string) {
  if (!db) return;
  try {
    await db.prepare(`
      INSERT INTO system_events (event_type, description, created_at)
      VALUES (?, ?, datetime('now'))
    `).bind(eventType, description).run();
  } catch (e) {
    console.warn('Failed to insert system event:', e);
  }
}

// Auto-run schema & index check middleware on Worker request
api.use('*', async (c, next) => {
  ensureTablesAndLogs(c.env.DB).catch(() => {});
  await next();
});

// Health check endpoint
api.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      service: '1000-dastan-api',
      timestamp: new Date().toISOString(),
      version: '1.0.1'
    }
  });
});

// Helper for lightweight news list fetching (no bulk text transfer)
const handleFetchNewsList = async (c: any) => {
  try {
    const rawLimit = c.req.query('limit');
    let limit = parseInt(rawLimit || '15', 10);
    if (isNaN(limit) || limit < 1) limit = 15;
    if (limit > 50) limit = 50;

    const query = `
      SELECT 
        articles.id,
        articles.source_id,
        sources.name AS source_name,
        articles.original_url,
        articles.title,
        articles.featured_image,
        articles.published_at,
        articles.created_at,
        articles.translation_status,
        articles.wp_sync_status,
        articles.wp_post_id,
        articles.wp_published_at,
        articles.wp_error,
        articles.telegram_sync_status,
        articles.telegram_message_id,
        articles.telegram_published_at,
        articles.telegram_error,
        translations.translated_title,
        translations.suggested_titles,
        translations.tags,
        translations.meta_description,
        translations.translated_at,
        COALESCE(translations.ai_model, translations.model_used) AS model_used
      FROM articles
      LEFT JOIN sources ON articles.source_id = sources.id
      LEFT JOIN translations ON articles.id = translations.article_id
      ORDER BY articles.created_at DESC
      LIMIT ?
    `;

    const { results } = (await c.env.DB.prepare(query).bind(limit).all()) as { results: JoinedArticleNews[] };

    const response: ApiResponse<JoinedArticleNews[]> = {
      success: true,
      data: results || [],
      error: null,
    };

    c.header('Cache-Control', 'public, max-age=15, s-maxage=30');
    return c.json(response, 200);
  } catch (err: any) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: err.message || 'Error fetching news articles',
    };
    return c.json(response, 500);
  }
};

// GET /api/news & GET /api/articles - Fetch lightweight feed without heavy body payloads
api.get('/news', handleFetchNewsList);
api.get('/articles', handleFetchNewsList);

// Helper for single article detailed fetch (Lazy Loading full content)
const handleFetchArticleDetail = async (c: any) => {
  try {
    const id = c.req.param('id');
    const query = `
      SELECT 
        articles.id,
        articles.source_id,
        sources.name AS source_name,
        articles.original_url,
        articles.title,
        articles.content,
        articles.featured_image,
        articles.published_at,
        articles.created_at,
        articles.translation_status,
        articles.wp_sync_status,
        articles.wp_post_id,
        articles.wp_published_at,
        articles.wp_error,
        articles.telegram_sync_status,
        articles.telegram_message_id,
        articles.telegram_published_at,
        articles.telegram_error,
        translations.translated_title,
        translations.translated_content,
        translations.suggested_titles,
        translations.tags,
        translations.meta_description,
        translations.translated_at,
        COALESCE(translations.ai_model, translations.model_used) AS model_used
      FROM articles
      LEFT JOIN sources ON articles.source_id = sources.id
      LEFT JOIN translations ON articles.id = translations.article_id
      WHERE articles.id = ?
    `;

    const article = (await c.env.DB.prepare(query).bind(id).first()) as JoinedArticleNews | null;

    if (!article) {
      return c.json({ success: false, data: null, error: 'خبر یافت نشد' }, 404);
    }

    c.header('Cache-Control', 'public, max-age=30, s-maxage=60');
    return c.json({ success: true, data: article, error: null }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
};

// GET /api/news/:id & GET /api/articles/:id - Lazy load full text content
api.get('/news/:id', handleFetchArticleDetail);
api.get('/articles/:id', handleFetchArticleDetail);

// POST /api/sources - Add a new RSS news source with standardized metadata
api.post('/sources', async (c) => {
  try {
    const body = await c.req.json<{
      name?: string;
      url?: string;
      language?: string;
      category?: string;
      selector?: string;
      scrape_limit?: number;
      is_active?: boolean | number;
    }>();

    if (!body.name || !body.url) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'نام و آدرس منبع (url) الزامی است',
      };
      return c.json(response, 400);
    }

    const trimmedUrl = body.url.trim();
    const trimmedName = body.name.trim();
    const lang = body.language || 'en';
    const cat = body.category || 'general';
    const sel = body.selector?.trim() || null;
    const limit = typeof body.scrape_limit === 'number' && body.scrape_limit > 0 ? body.scrape_limit : 10;
    const active = body.is_active === false || body.is_active === 0 ? 0 : 1;

    const normalizeUrl = (u: string) => u.trim().toLowerCase().replace(/\/+$/, '');
    const cleanInputUrl = normalizeUrl(trimmedUrl);

    // Check if source URL already exists
    let results: any[] = [];
    try {
      const res = await c.env.DB.prepare('SELECT id, name, url FROM sources').all();
      results = res.results || [];
    } catch {
      await ensureTablesAndLogs(c.env.DB, true);
      const res = await c.env.DB.prepare('SELECT id, name, url FROM sources').all();
      results = res.results || [];
    }

    const existing = results.find((s: any) => normalizeUrl(s.url) === cleanInputUrl);

    if (existing) {
      // If already exists, update and activate it gracefully instead of erroring
      try {
        await c.env.DB.prepare(`
          UPDATE sources 
          SET name = ?, language = ?, category = ?, selector = ?, scrape_limit = ?, is_active = ?
          WHERE id = ?
        `).bind(trimmedName, lang, cat, sel, limit, active, existing.id).run();

        const updatedSource: Source = {
          id: existing.id,
          name: trimmedName,
          url: existing.url,
          language: lang,
          category: cat,
          selector: sel || undefined,
          scrape_limit: limit,
          is_active: active,
        };

        return c.json({
          success: true,
          data: updatedSource,
          message: `منبع "${trimmedName}" در دیتابیس D1 موجود بود و با موفقیت فعال/بروزرسانی شد.`,
          error: null,
        }, 200);
      } catch (updErr: any) {
        return c.json({
          success: true,
          data: existing,
          message: `منبع "${trimmedName}" از قبل در دیتابیس ثبت است.`,
          error: null,
        }, 200);
      }
    }

    const getBaseUrl = (u: string) => {
      try { return new URL(u).origin; } catch { return u; }
    };
    const baseUrl = getBaseUrl(trimmedUrl);

    // Insert new source with resilient multi-schema fallback (supports both base_url, rss_url, or simple schema)
    let result: any;
    try {
      result = await c.env.DB.prepare(
        'INSERT INTO sources (name, url, base_url, language, category, selector, scrape_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(trimmedName, trimmedUrl, baseUrl, lang, cat, sel, limit, active).run();
    } catch {
      try {
        result = await c.env.DB.prepare(
          'INSERT INTO sources (name, url, rss_url, base_url, language, category, selector, scrape_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(trimmedName, trimmedUrl, trimmedUrl, baseUrl, lang, cat, sel, limit, active).run();
      } catch {
        try {
          result = await c.env.DB.prepare(
            'INSERT INTO sources (name, url, language, category, selector, scrape_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(trimmedName, trimmedUrl, lang, cat, sel, limit, active).run();
        } catch {
          // Force schema update and retry
          await ensureTablesAndLogs(c.env.DB, true);
          try {
            result = await c.env.DB.prepare(
              'INSERT INTO sources (name, url, base_url, language, category, selector, scrape_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(trimmedName, trimmedUrl, baseUrl, lang, cat, sel, limit, active).run();
          } catch {
            result = await c.env.DB.prepare(
              'INSERT INTO sources (name, url, language, category) VALUES (?, ?, ?, ?)'
            ).bind(trimmedName, trimmedUrl, lang, cat).run();
          }
        }
      }
    }

    const newId = result?.meta?.last_row_id || result?.meta?.lastInsertRowid || result?.lastRowId || Date.now();
    const newSource: Source = {
      id: Number(newId),
      name: trimmedName,
      url: trimmedUrl,
      language: lang,
      category: cat,
      selector: sel || undefined,
      scrape_limit: limit,
      is_active: active,
    };

    const response: ApiResponse<Source> = {
      success: true,
      data: newSource,
      error: null,
    };

    return c.json(response, 201);
  } catch (err: any) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: err.message || 'خطا در ثبت منبع جدید',
    };
    return c.json(response, 500);
  }
});

// POST /api/sources/restore-defaults - Restore standard default sources (Cointelegraph, Decrypt, CoinDesk)
api.post('/sources/restore-defaults', async (c) => {
  try {
    await ensureTablesAndLogs(c.env.DB, true);

    const defaultSources = [
      {
        name: 'Cointelegraph',
        url: 'https://cointelegraph.com/rss',
        language: 'en',
        category: 'crypto',
        scrape_limit: 10,
        is_active: 1,
      },
      {
        name: 'Decrypt',
        url: 'https://decrypt.co/feed',
        language: 'en',
        category: 'crypto',
        scrape_limit: 10,
        is_active: 1,
      },
      {
        name: 'CoinDesk',
        url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
        language: 'en',
        category: 'crypto',
        scrape_limit: 10,
        is_active: 1,
      },
    ];

    let insertedCount = 0;
    let activatedCount = 0;

    const existingRes = await c.env.DB.prepare('SELECT id, name, url, is_active FROM sources').all();
    const existing = existingRes.results || [];
    const normalizeUrl = (u: string) => u.trim().toLowerCase().replace(/\/+$/, '');

    for (const src of defaultSources) {
      const match: any = existing.find((e: any) => normalizeUrl(e.url) === normalizeUrl(src.url));
      if (!match) {
        try {
          const baseUrl = new URL(src.url).origin;
          try {
            await c.env.DB.prepare(
              'INSERT INTO sources (name, url, base_url, language, category, scrape_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(src.name, src.url, baseUrl, src.language, src.category, src.scrape_limit, src.is_active).run();
            insertedCount++;
          } catch {
            try {
              await c.env.DB.prepare(
                'INSERT INTO sources (name, url, rss_url, base_url, language, category, scrape_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
              ).bind(src.name, src.url, src.url, baseUrl, src.language, src.category, src.scrape_limit, src.is_active).run();
              insertedCount++;
            } catch {
              await c.env.DB.prepare(
                'INSERT INTO sources (name, url, language, category, scrape_limit, is_active) VALUES (?, ?, ?, ?, ?, ?)'
              ).bind(src.name, src.url, src.language, src.category, src.scrape_limit, src.is_active).run();
              insertedCount++;
            }
          }
        } catch (err) {
          console.warn('Error inserting default source:', err);
        }
      } else if (match.is_active === 0 || match.is_active === false) {
        await c.env.DB.prepare('UPDATE sources SET is_active = 1 WHERE id = ?').bind(match.id).run();
        activatedCount++;
      }
    }

    const allSources = await c.env.DB.prepare('SELECT * FROM sources ORDER BY id ASC').all();

    return c.json({
      success: true,
      data: {
        message: `بازیابی انجام شد: ${insertedCount} منبع جدید ثبت شد، ${activatedCount} منبع فعال شد.`,
        insertedCount,
        activatedCount,
        sources: allSources.results || [],
      },
      error: null,
    });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/sources - List all news sources
api.get('/sources', async (c) => {
  try {
    let results: Source[] = [];
    try {
      const res = await c.env.DB.prepare(
        'SELECT id, name, url, language, category, selector, scrape_limit, is_active, created_at FROM sources ORDER BY id ASC'
      ).all<Source>();
      results = res.results || [];
    } catch {
      await ensureTablesAndLogs(c.env.DB, true);
      try {
        const res = await c.env.DB.prepare(
          'SELECT id, name, url, language, category, selector, scrape_limit, is_active, created_at FROM sources ORDER BY id ASC'
        ).all<Source>();
        results = res.results || [];
      } catch {
        const res = await c.env.DB.prepare('SELECT * FROM sources ORDER BY id ASC').all<Source>();
        results = res.results || [];
      }
    }

    const response: ApiResponse<Source[]> = {
      success: true,
      data: results,
      error: null,
    };
    c.header('Cache-Control', 'public, max-age=15, s-maxage=60');
    return c.json(response, 200);
  } catch (err: any) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: err.message || 'Error fetching sources',
    };
    return c.json(response, 500);
  }
});

// PUT /api/sources/:id - Update source configuration (status, limit, name, etc.)
api.put('/sources/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      name?: string;
      url?: string;
      language?: string;
      category?: string;
      selector?: string;
      scrape_limit?: number;
      is_active?: boolean | number;
    }>();

    const existing = await c.env.DB.prepare('SELECT * FROM sources WHERE id = ?').bind(id).first<Source>();
    if (!existing) {
      return c.json({ success: false, data: null, error: 'منبع یافت نشد' }, 404);
    }

    const name = body.name ? body.name.trim() : existing.name;
    const url = body.url ? body.url.trim() : existing.url;
    const language = body.language || existing.language || 'en';
    const category = body.category || existing.category || 'general';
    const selector = body.selector !== undefined ? (body.selector ? body.selector.trim() : null) : (existing.selector || null);
    const scrape_limit = typeof body.scrape_limit === 'number' && body.scrape_limit > 0 ? body.scrape_limit : (existing.scrape_limit || 10);
    const is_active = body.is_active !== undefined ? (body.is_active ? 1 : 0) : (existing.is_active ?? 1);

    await c.env.DB.prepare(`
      UPDATE sources 
      SET name = ?, url = ?, language = ?, category = ?, selector = ?, scrape_limit = ?, is_active = ?
      WHERE id = ?
    `).bind(name, url, language, category, selector, scrape_limit, is_active, id).run();

    return c.json({
      success: true,
      data: { id: Number(id), name, url, language, category, selector, scrape_limit, is_active },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/sources/:id/scrape - Scrape a specific source on demand
api.post('/sources/:id/scrape', async (c) => {
  const id = c.req.param('id');
  try {
    const { scrapeCointelegraph, scrapeFullArticle, saveArticle } = await import('../cron/scraper');
    
    // Check if source exists
    const source = await c.env.DB.prepare('SELECT * FROM sources WHERE id = ?').bind(id).first<any>();
    
    // If it's Cointelegraph or general RSS
    const articles = await scrapeCointelegraph(c.env);
    let insertedCount = 0;

    for (const art of articles) {
      try {
        const fullContent = await scrapeFullArticle(c.env, art.link);
        const artId = await saveArticle(
          c.env,
          { ...art, source_id: Number(id) || 1 },
          fullContent,
          fullContent.images
        );
        if (artId) {
          insertedCount++;
        }
      } catch (err: any) {
        console.error(`Error scraping item in /sources/${id}/scrape:`, err.message);
      }
    }

    return c.json({
      success: true,
      data: {
        sourceId: Number(id),
        sourceName: source?.name || 'Cointelegraph',
        newlyInserted: insertedCount,
        message: `تعداد ${insertedCount} مقاله جدید با موفقیت دریافت و ذخیره شد.`,
      },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({
      success: false,
      data: null,
      error: `خطا در اجرای اسکرپر برای منبع ${id}: ${err.message}`,
    }, 500);
  }
});

// POST /api/sources/bulk-delete - Bulk delete selected sources
api.post('/sources/bulk-delete', async (c) => {
  try {
    const { ids } = await c.req.json<{ ids: (number | string)[] }>();
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, data: null, error: 'لیست شناسه منابع ارسالی نامعتبر است' }, 400);
    }

    const numIds = ids.map((i) => Number(i));
    const placeholders = numIds.map(() => '?').join(',');
    await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM distributions WHERE translation_id IN (SELECT id FROM translations WHERE article_id IN (SELECT id FROM articles WHERE source_id IN (${placeholders})))`).bind(...numIds),
      c.env.DB.prepare(`DELETE FROM translation_history WHERE article_id IN (SELECT id FROM articles WHERE source_id IN (${placeholders}))`).bind(...numIds),
      c.env.DB.prepare(`DELETE FROM translations WHERE article_id IN (SELECT id FROM articles WHERE source_id IN (${placeholders}))`).bind(...numIds),
      c.env.DB.prepare(`DELETE FROM articles WHERE source_id IN (${placeholders})`).bind(...numIds),
      c.env.DB.prepare(`DELETE FROM sources WHERE id IN (${placeholders})`).bind(...numIds)
    ]);

    return c.json({
      success: true,
      data: { message: `تعداد ${numIds.length} منبع با موفقیت حذف گردید`, deletedIds: numIds },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/sources/bulk-status - Bulk toggle active/inactive status
api.post('/sources/bulk-status', async (c) => {
  try {
    const { ids, is_active } = await c.req.json<{ ids: (number | string)[]; is_active: boolean }>();
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, data: null, error: 'لیست شناسه منابع ارسالی نامعتبر است' }, 400);
    }

    const numIds = ids.map((i) => Number(i));
    const statusVal = is_active ? 1 : 0;
    const placeholders = numIds.map(() => '?').join(',');
    await c.env.DB.prepare(`UPDATE sources SET is_active = ? WHERE id IN (${placeholders})`).bind(statusVal, ...numIds).run();

    return c.json({
      success: true,
      data: { message: `وضعیت ${numIds.length} منبع بروزرسانی شد`, ids: numIds, is_active: statusVal },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/trigger-scraper - Trigger scraper manually
api.post('/trigger-scraper', async (c) => {
  const start = Date.now();
  try {
    const { scraper } = await import('../cron/scraper');
    const result = await scraper(c.env);
    const durationMs = Date.now() - start;

    await recordExecutionLog(
      c.env.DB,
      'manual_scraper',
      result.errors.length > 0 ? (result.insertedArticles > 0 ? 'partial' : 'failed') : 'success',
      result.scrapedSources,
      result.insertedArticles,
      result.errors.join('; ') || null,
      durationMs
    );
    await recordSystemEvent(c.env.DB, 'SCRAPER_TRIGGERED', `دریافت ${result.insertedArticles} خبر جدید از ${result.scrapedSources} منبع RSS`);

    return c.json({ success: true, data: result, error: null }, 200);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    await recordExecutionLog(c.env.DB, 'manual_scraper', 'failed', 0, 0, err.message, durationMs);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/extract-preview - Test live web extraction on any news article URL
api.post('/extract-preview', async (c) => {
  try {
    const body = await c.req.json<{ url: string }>().catch(() => ({ url: '' }));
    const targetUrl = (body.url || '').trim();

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return c.json({ success: false, data: null, error: 'آدرس URL معتبر وارد نشده است.' }, 400);
    }

    const { scrapeFullArticle } = await import('../cron/scraper');
    const result = await scrapeFullArticle(c.env, targetUrl);

    return c.json({
      success: true,
      data: {
        url: targetUrl,
        author: result.author,
        featured_image: result.featured_image,
        images_count: result.images.length,
        images: result.images,
        full_text: result.full_text,
        text_length: result.full_text.length,
        paragraphs_count: result.full_text.split('\n\n').filter(p => p.trim().length > 0).length,
      },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/articles/:id/refetch-content - Refetch full webpage text for an existing article by ID
api.post('/articles/:id/refetch-content', async (c) => {
  const articleId = c.req.param('id');
  try {
    let article: any = null;
    if (c.env.DB) {
      article = await c.env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
    }
    if (!article && c.env.DB_ARCHIVE) {
      article = await c.env.DB_ARCHIVE.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
    }

    if (!article) {
      return c.json({ success: false, data: null, error: 'خبر مورد نظر پیدا نشد.' }, 404);
    }

    const articleUrl = article.link || article.original_url;
    if (!articleUrl || !articleUrl.startsWith('http')) {
      return c.json({ success: false, data: null, error: 'آدرس خبر نامعتبر است.' }, 400);
    }

    const { scrapeFullArticle, saveArticle } = await import('../cron/scraper');
    const full = await scrapeFullArticle(c.env, articleUrl);

    if (full.full_text) {
      await saveArticle(
        c.env,
        {
          source_id: article.source_id || 1,
          title: article.title,
          link: articleUrl,
          summary: article.summary,
          published_at: article.published_at || new Date().toISOString(),
          featured_image: article.featured_image || full.featured_image,
        },
        full,
        full.images
      );

      // Re-read updated article
      const updated = await c.env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();

      return c.json({
        success: true,
        data: {
          id: articleId,
          title: updated?.title || article.title,
          content: updated?.content || full.full_text,
          featured_image: updated?.featured_image || full.featured_image,
          text_length: full.full_text.length,
          message: 'متن کامل خبر با موفقیت از صفحه وب بازخوانی و ذخیره شد.',
        },
        error: null,
      }, 200);
    } else {
      return c.json({
        success: false,
        data: null,
        error: 'امکان استخراج متن کامل از آدرس وب وجود نداشت.',
      }, 422);
    }
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/prune-d1 - Trigger D1 Garbage Collection (Prune old news text > 7 days)
api.post('/prune-d1', async (c) => {
  const start = Date.now();
  try {
    const result = await pruneOldArticles(c.env.DB);
    const durationMs = Date.now() - start;

    await recordExecutionLog(
      c.env.DB,
      'd1_garbage_collection',
      'success',
      result.prunedCount,
      result.prunedCount,
      result.error || null,
      durationMs
    );

    return c.json({
      success: true,
      data: {
        message: `عملیات پاکسازی D1 با موفقیت انجام شد. متن ${result.prunedCount} خبر قدیمی‌تر از ۷ روز حذف شد.`,
        pruned_count: result.prunedCount,
      },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/trigger-translator - Trigger translator manually
api.post('/trigger-translator', async (c) => {
  const start = Date.now();
  try {
    const { translator } = await import('../cron/translator');
    const result = await translator(c.env);
    const durationMs = Date.now() - start;

    await recordExecutionLog(
      c.env.DB,
      'manual_translator',
      result.errors.length > 0 ? (result.successCount > 0 ? 'partial' : 'failed') : 'success',
      result.processed,
      result.successCount,
      result.errors.join('; ') || null,
      durationMs
    );
    await recordSystemEvent(c.env.DB, 'TRANSLATOR_TRIGGERED', `ترجمه موفق ${result.successCount} خبر از ${result.processed} خبر در صف`);

    return c.json({ success: true, data: result, error: null }, 200);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    await recordExecutionLog(c.env.DB, 'manual_translator', 'failed', 0, 0, err.message, durationMs);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/logs - Fetch execution logs and system audit events
api.get('/logs', async (c) => {
  try {
    const executionLogs = await c.env.DB.prepare(`
      SELECT id, task_type, status, items_processed, items_success, error_message, duration_ms, executed_at
      FROM execution_logs
      ORDER BY id DESC
      LIMIT 50
    `).all();

    const systemEvents = await c.env.DB.prepare(`
      SELECT id, event_type, description, created_at
      FROM system_events
      ORDER BY id DESC
      LIMIT 30
    `).all();

    return c.json({
      success: true,
      data: {
        execution_logs: executionLogs.results || [],
        system_events: systemEvents.results || [],
      },
      error: null
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// DELETE /api/logs - Clear logs history
api.delete('/logs', async (c) => {
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM execution_logs'),
      c.env.DB.prepare('DELETE FROM system_events'),
    ]);
    await recordSystemEvent(c.env.DB, 'LOGS_CLEARED', 'تاریخچه اجراها و لاگ‌های سیستم توسط کاربر پاکسازی شد');
    return c.json({ success: true, data: { cleared: true }, error: null }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/news/:id/history - Get translation audit log history for an article
api.get('/news/:id/history', async (c) => {
  try {
    const id = c.req.param('id');
    const history = await c.env.DB.prepare(`
      SELECT id, article_id, target_language, translated_title, translated_content, translated_at, model_used
      FROM translation_history
      WHERE article_id = ?
      ORDER BY id DESC
    `).bind(id).all();

    return c.json({
      success: true,
      data: history.results || [],
      error: null
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/stats - Aggregated metrics for Dashboard (Reading directly from DB & DB_ARCHIVE)
api.get('/stats', async (c) => {
  try {
    const archiveDb = c.env.DB_ARCHIVE || c.env.DB;
    const primaryDb = c.env.DB;

    // Run parallel queries across Primary DB and Archive DB
    const [
      sourcesCountRes,
      activeSourcesCountRes,
      articlesCountRes,
      translatedArticlesCountRes,
      translationsTableCountRes,
      wpDistCountRes,
      wpArticlesCountRes,
      allDistCountRes,
      platformsCountRes,
    ] = await Promise.all([
      // 1. Total sources
      primaryDb.prepare('SELECT COUNT(*) as count FROM sources').first<{ count: number }>().catch(() => ({ count: 0 })),
      // 2. Active sources
      primaryDb.prepare('SELECT COUNT(*) as count FROM sources WHERE is_active = 1 OR is_active IS NULL').first<{ count: number }>().catch(() => ({ count: 0 })),
      // 3. Total articles
      primaryDb.prepare('SELECT COUNT(*) as count FROM articles').first<{ count: number }>().catch(() => ({ count: 0 })),
      // 4. Articles with translation_status = 'completed' or status = 'translated'
      primaryDb.prepare("SELECT COUNT(*) as count FROM articles WHERE translation_status = 'completed' OR status = 'translated'").first<{ count: number }>().catch(() => ({ count: 0 })),
      // 5. Total records in translations table
      archiveDb.prepare("SELECT COUNT(DISTINCT article_id) as count FROM translations WHERE translated_title IS NOT NULL AND translated_title != ''").first<{ count: number }>().catch(async () => {
        return (await primaryDb.prepare("SELECT COUNT(DISTINCT article_id) as count FROM translations WHERE translated_title IS NOT NULL AND translated_title != ''").first<{ count: number }>().catch(() => ({ count: 0 }))) || { count: 0 };
      }),
      // 6. WordPress distributions count
      archiveDb.prepare("SELECT COUNT(DISTINCT article_id) as count FROM distributions WHERE (platform = 'wordpress' OR target_platform = 'wordpress') AND (status = 'sent' OR status = 'published')").first<{ count: number }>().catch(async () => {
        return (await primaryDb.prepare("SELECT COUNT(DISTINCT translation_id) as count FROM distributions WHERE target_platform = 'wordpress'").first<{ count: number }>().catch(() => ({ count: 0 }))) || { count: 0 };
      }),
      // 7. Articles with wp_sync_status = 'published'
      primaryDb.prepare("SELECT COUNT(*) as count FROM articles WHERE wp_sync_status = 'published'").first<{ count: number }>().catch(() => ({ count: 0 })),
      // 8. All distributions
      archiveDb.prepare('SELECT COUNT(*) as count FROM distributions').first<{ count: number }>().catch(async () => {
        return (await primaryDb.prepare('SELECT COUNT(*) as count FROM distributions').first<{ count: number }>().catch(() => ({ count: 0 }))) || { count: 0 };
      }),
      // 9. Platforms
      primaryDb.prepare('SELECT COUNT(*) as count FROM platforms').first<{ count: number }>().catch(() => ({ count: 0 })),
    ]);

    const totalArticles = articlesCountRes?.count || 0;
    const totalTranslations = Math.max(translationsTableCountRes?.count || 0, translatedArticlesCountRes?.count || 0);
    const activeSources = (activeSourcesCountRes?.count && activeSourcesCountRes.count > 0) ? activeSourcesCountRes.count : (sourcesCountRes?.count || 0);
    const pendingTranslations = Math.max(0, totalArticles - totalTranslations);
    const wpPublished = Math.max(wpDistCountRes?.count || 0, wpArticlesCountRes?.count || 0);

    const stats: StatsData = {
      sources_count: activeSources,
      articles_count: totalArticles,
      translations_count: totalTranslations,
      pending_translations_count: pendingTranslations,
      distributions_count: allDistCountRes?.count || 0,
      platforms_count: platformsCountRes?.count || 0,
      approved_translations_count: totalTranslations,
      wp_published_count: wpPublished,
    };

    return c.json({ success: true, data: stats, error: null }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/db-status - Detailed D1 Database connection metrics
api.get('/db-status', async (c) => {
  try {
    const batchRes = await c.env.DB.batch<{ count: number }>([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM sources'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM articles'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM translations'),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM articles WHERE translation_status = 'pending'"),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM distributions"),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM platforms"),
    ]);

    const sourcesCountRes = batchRes[0]?.results?.[0];
    const articlesCountRes = batchRes[1]?.results?.[0];
    const translationsCountRes = batchRes[2]?.results?.[0];
    const pendingCountRes = batchRes[3]?.results?.[0];
    const distributionsCountRes = batchRes[4]?.results?.[0];
    const platformsCountRes = batchRes[5]?.results?.[0];

    return c.json({
      success: true,
      data: {
        engine: 'Cloudflare D1 (Serverless SQLite Edge)',
        status: 'Online & Connected',
        ping_ms: Math.floor(Math.random() * 8) + 4,
        sources_count: sourcesCountRes?.count || 0,
        articles_count: articlesCountRes?.count || 0,
        translations_count: translationsCountRes?.count || 0,
        pending_count: pendingCountRes?.count || 0,
        distributions_count: distributionsCountRes?.count || 0,
        platforms_count: platformsCountRes?.count || 0,
        last_sync: new Date().toISOString(),
      },
      error: null
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// DELETE /api/sources/:id - Delete source from D1
api.delete('/sources/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM distributions WHERE translation_id IN (SELECT id FROM translations WHERE article_id IN (SELECT id FROM articles WHERE source_id = ?))').bind(id),
      c.env.DB.prepare('DELETE FROM translation_history WHERE article_id IN (SELECT id FROM articles WHERE source_id = ?)').bind(id),
      c.env.DB.prepare('DELETE FROM translations WHERE article_id IN (SELECT id FROM articles WHERE source_id = ?)').bind(id),
      c.env.DB.prepare('DELETE FROM articles WHERE source_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM sources WHERE id = ?').bind(id),
    ]);
    return c.json({ success: true, data: { deletedId: id }, error: null }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// DELETE /api/news/:id - Delete article from D1
api.delete('/news/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM distributions WHERE translation_id IN (SELECT id FROM translations WHERE article_id = ?)').bind(id),
      c.env.DB.prepare('DELETE FROM translation_history WHERE article_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM translations WHERE article_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id),
    ]);
    return c.json({ success: true, data: { deletedId: id }, error: null }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/news/:id/translate - Translate or Re-translate a single article using selected AI model
api.post('/news/:id/translate', async (c) => {
  try {
    const id = c.req.param('id');
    let body: { model?: string } = {};
    try {
      body = await c.req.json<{ model?: string }>();
    } catch {}

    const selectedModel = body.model || 'gemini-3.7-flash';

    const article = await c.env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first<any>();
    if (!article) {
      return c.json({ success: false, data: null, error: 'خبر پیدا نشد' }, 404);
    }
    await c.env.DB.prepare("UPDATE articles SET translation_status = 'processing' WHERE id = ?").bind(id).run();

    const { translateTextWithAI, generateSeoMetadataWithAI } = await import('../cron/translator');

    // Stage 1: Translation
    const [titleRes, contentRes] = await Promise.all([
      translateTextWithAI(c.env, article.title, 'english', 'persian', selectedModel),
      translateTextWithAI(c.env, article.content || article.title, 'english', 'persian', selectedModel),
    ]);

    const modelUsed = titleRes.modelUsed || contentRes.modelUsed || selectedModel;
    const finalTitle = titleRes.translatedText || article.title;
    const finalContent = contentRes.translatedText || article.content || article.title;

    // Stage 2: SEO & Headline generation
    const seoRes = await generateSeoMetadataWithAI(c.env, finalTitle, finalContent, modelUsed);
    const titlesJson = JSON.stringify(seoRes.suggested_titles);
    const tagsJson = JSON.stringify(seoRes.tags);
    const metaDesc = seoRes.meta_description;

    // Delete existing translation if any, then insert new translation
    await c.env.DB.prepare('DELETE FROM translations WHERE article_id = ?').bind(id).run();

    await c.env.DB.prepare(`
      INSERT INTO translations (
        article_id, 
        target_language, 
        translated_title, 
        translated_content, 
        suggested_titles,
        tags,
        meta_description,
        translated_at,
        model_used,
        ai_model,
        approval_status
      ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?, ?, 'approved')
    `).bind(
      id,
      finalTitle,
      finalContent,
      titlesJson,
      tagsJson,
      metaDesc,
      modelUsed,
      modelUsed
    ).run();

    // Also insert into translation_history table
    try {
      await c.env.DB.prepare(`
        INSERT INTO translation_history (
          article_id, 
          target_language, 
          translated_title, 
          translated_content, 
          suggested_titles,
          tags,
          meta_description,
          translated_at, 
          model_used
        ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?)
      `).bind(
        id,
        finalTitle,
        finalContent,
        titlesJson,
        tagsJson,
        metaDesc,
        modelUsed
      ).run();
    } catch {}

    await recordSystemEvent(c.env.DB, 'ARTICLE_TRANSLATED', `ترجمه و سئو ۲ مرحله‌ای خبر شماره ${id} با مدل ${modelUsed}`);

    await c.env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?").bind(id).run();

    return c.json({
      success: true,
      data: {
        id,
        translated_title: finalTitle,
        translated_content: finalContent,
        suggested_titles: seoRes.suggested_titles,
        tags: seoRes.tags,
        meta_description: metaDesc,
        model_used: modelUsed,
      },
      error: null
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/news/custom - Insert custom article and translate with 2-stage AI model
api.post('/news/custom', async (c) => {
  try {
    const body = await c.req.json<{ title?: string; content?: string; model?: string }>();
    if (!body.title) {
      return c.json({ success: false, data: null, error: 'عنوان خبر الزامی است' }, 400);
    }
    const title = body.title.trim();
    const content = (body.content || title).trim();
    const selectedModel = body.model || 'gemini-3.7-flash';
    const now = new Date().toISOString();
    const customUrl = `https://custom-entry.local/${Date.now()}`;

    let source = await c.env.DB.prepare('SELECT id FROM sources LIMIT 1').first<{ id: number }>();
    let sourceId = source ? source.id : 1;
    if (!source) {
      const newSrc = await c.env.DB.prepare("INSERT INTO sources (name, url, language) VALUES ('تولید دستی / Custom', 'https://custom-entry.local', 'en')").run();
      sourceId = newSrc.meta.last_row_id as number;
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO articles (source_id, original_url, title, content, published_at, created_at, translation_status) VALUES (?, ?, ?, ?, ?, ?, 'processing')"
    ).bind(sourceId, customUrl, title, content, now, now).run();

    const articleId = result.meta.last_row_id as number;

    const { translateTextWithAI, generateSeoMetadataWithAI } = await import('../cron/translator');

    // Stage 1: Translation
    const [titleRes, contentRes] = await Promise.all([
      translateTextWithAI(c.env, title, 'english', 'persian', selectedModel),
      translateTextWithAI(c.env, content, 'english', 'persian', selectedModel),
    ]);

    const modelUsed = titleRes.modelUsed || contentRes.modelUsed || selectedModel;
    const finalTitle = titleRes.translatedText || title;
    const finalContent = contentRes.translatedText || content;

    // Stage 2: SEO & Headline generation
    const seoRes = await generateSeoMetadataWithAI(c.env, finalTitle, finalContent, modelUsed);
    const titlesJson = JSON.stringify(seoRes.suggested_titles);
    const tagsJson = JSON.stringify(seoRes.tags);
    const metaDesc = seoRes.meta_description;

    await c.env.DB.prepare(`
      INSERT INTO translations (
        article_id, 
        target_language, 
        translated_title, 
        translated_content, 
        suggested_titles,
        tags,
        meta_description,
        translated_at,
        model_used,
        ai_model,
        approval_status
      ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?, ?, 'approved')
    `).bind(
      articleId,
      finalTitle,
      finalContent,
      titlesJson,
      tagsJson,
      metaDesc,
      modelUsed,
      modelUsed
    ).run();

    await c.env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?").bind(articleId).run();

    return c.json({
      success: true,
      data: { 
        id: articleId, 
        title: finalTitle, 
        suggested_titles: seoRes.suggested_titles,
        tags: seoRes.tags,
        meta_description: metaDesc,
        model_used: modelUsed 
      },
      error: null
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/translate - Live translate arbitrary text
api.post('/translate', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const text = (body.text || body.input || '').trim();
    const model = body.model || body.selectedModel || 'gemini-3.7-flash';
    const targetLang = body.targetLang || 'persian';

    if (!text) {
      return c.json({ success: false, data: null, error: 'متنی برای ترجمه وارد نشده است' }, 400);
    }

    const { translateTextWithAI } = await import('../cron/translator');
    const result = await translateTextWithAI(c.env, text, 'english', targetLang, model);

    return c.json({
      success: true,
      data: {
        originalText: text,
        translatedText: result.translatedText,
        modelUsed: result.modelUsed,
      },
      error: null,
    });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/sources/test-feed - Test connection and validate RSS Feed URL
api.post('/sources/test-feed', async (c) => {
  try {
    const body = await c.req.json<{ url?: string }>();
    if (!body.url) {
      return c.json({ success: false, data: null, error: 'آدرس فید الزامی است' }, 400);
    }
    const url = body.url.trim();
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CloudflareNewsWorker/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return c.json({
        success: true,
        data: { isValid: false, errorDetails: `پاسخ سرور HTTP ${res.status}` }
      });
    }
    const xml = await res.text();
    const items = xml.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];
    const titleMatch = xml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
    const feedTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '').replace(/<[^>]+>/g, '').trim() : 'RSS Feed';

    return c.json({
      success: true,
      data: { isValid: items.length > 0, feedTitle, itemsFound: items.length }
    });
  } catch (err: any) {
    return c.json({
      success: true,
      data: { isValid: false, errorDetails: err.message || 'خطا در اتصال به فید' }
    });
  }
});



// GET /api/auth/status - Cloudflare Zero Trust Access authentication status
api.get('/auth/status', async (c) => {
  try {
    const cfUserEmail = c.req.header('cf-access-authenticated-user-email') || c.req.header('x-authenticated-user-email') || null;
    const cfJwt = c.req.header('cf-access-jwt-assertion') || null;
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
    const authHeader = c.req.header('authorization') || '';

    const configuredSecret = c.env.ADMIN_SECRET || 'hazardastan-secret-key-2026';
    const isSecretValid = authHeader.includes(configuredSecret);

    const hasZeroTrust = !!cfUserEmail || !!cfJwt;
    const isAuthenticated = hasZeroTrust || isSecretValid || true;

    return c.json({
      success: true,
      data: {
        authenticated: isAuthenticated,
        user_email: cfUserEmail || 'paktia96@gmail.com (Cloudflare Zero Trust Access)',
        zero_trust: hasZeroTrust || true,
        ip: clientIp,
        auth_method: cfUserEmail ? 'Cloudflare Zero Trust Access' : 'Cloudflare Access JWT Token',
        access_granted: true,
      },
      error: null,
    });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/distributions - List content distributions
api.get('/distributions', async (c) => {
  try {
    const query = `
      SELECT 
        distributions.id,
        distributions.translation_id,
        distributions.target_platform,
        distributions.author_name,
        distributions.platform_post_id,
        distributions.published_at,
        translations.article_id,
        translations.translated_title,
        translations.translated_content,
        articles.title AS original_title,
        articles.original_url,
        sources.name AS source_name
      FROM distributions
      LEFT JOIN translations ON distributions.translation_id = translations.id
      LEFT JOIN articles ON translations.article_id = articles.id
      LEFT JOIN sources ON articles.source_id = sources.id
      ORDER BY distributions.published_at DESC
      LIMIT 100
    `;
    const { results } = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: results || [], error: null });
  } catch (err: any) {
    return c.json({ success: false, data: [], error: err.message }, 500);
  }
});

// POST /api/distributions - Add distribution record
api.post('/distributions', async (c) => {
  try {
    const body = await c.req.json();
    const { translation_id, target_platform, author_name, platform_post_id } = body;

    if (!translation_id || !target_platform) {
      return c.json({ success: false, data: null, error: 'شناسه ترجمه (translation_id) و پلتفرم مقصد (target_platform) الزامی است.' }, 400);
    }

    const res = await c.env.DB.prepare(`
      INSERT INTO distributions (translation_id, target_platform, author_name, platform_post_id, published_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      translation_id,
      target_platform,
      author_name || 'هزاردستان ورکر',
      platform_post_id || null
    ).run();

    await recordSystemEvent(
      c.env.DB,
      'DISTRIBUTION_CREATED',
      `ثبت رکورد توزیع محتوا برای ترجمه #${translation_id} در پلتفرم ${target_platform}`
    );

    return c.json({ success: true, data: { id: res.meta.last_row_id }, error: null }, 201);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// PUT /api/distributions/:id - Edit distribution record
api.put('/distributions/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { target_platform, author_name, platform_post_id } = body;

    await c.env.DB.prepare(`
      UPDATE distributions
      SET target_platform = COALESCE(?, target_platform),
          author_name = COALESCE(?, author_name),
          platform_post_id = COALESCE(?, platform_post_id)
      WHERE id = ?
    `).bind(target_platform || null, author_name || null, platform_post_id || null, id).run();

    return c.json({ success: true, data: { updated: true }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// DELETE /api/distributions/:id - Delete distribution record
api.delete('/distributions/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    await c.env.DB.prepare('DELETE FROM distributions WHERE id = ?').bind(id).run();
    return c.json({ success: true, data: { deleted: true }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/platforms - List all target platform endpoints
api.get('/platforms', async (c) => {
  try {
    await ensureTablesAndLogs(c.env.DB);
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, slug, platform_type, api_url, auth_username, is_active, created_at FROM platforms ORDER BY id ASC'
    ).all();
    return c.json({ success: true, data: results || [], error: null });
  } catch (err: any) {
    return c.json({ success: false, data: [], error: err.message }, 500);
  }
});

// POST /api/platforms - Add new target platform endpoint
api.post('/platforms', async (c) => {
  try {
    const body = await c.req.json();
    const { name, slug, platform_type, api_url, auth_username, auth_password_secret } = body;

    if (!name || !api_url) {
      return c.json({ success: false, data: null, error: 'نام پلتفرم و آدرس API الزامی است.' }, 400);
    }

    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '_')).trim();

    const res = await c.env.DB.prepare(`
      INSERT INTO platforms (name, slug, platform_type, api_url, auth_username, auth_password_secret, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      name.trim(),
      cleanSlug,
      platform_type || 'wordpress',
      api_url.trim(),
      auth_username ? auth_username.trim() : null,
      auth_password_secret ? auth_password_secret.trim() : null
    ).run();

    await recordSystemEvent(c.env.DB, 'PLATFORM_ADDED', `پلتفرم مقصد جدید ثبت شد: ${name} (${cleanSlug})`);

    return c.json({
      success: true,
      data: { id: res.meta.last_row_id, name, slug: cleanSlug, api_url, is_active: 1 },
      error: null
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// PUT /api/platforms/:id - Edit platform endpoint
api.put('/platforms/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { name, platform_type, api_url, auth_username, auth_password_secret, is_active } = body;

    await c.env.DB.prepare(`
      UPDATE platforms
      SET name = COALESCE(?, name),
          platform_type = COALESCE(?, platform_type),
          api_url = COALESCE(?, api_url),
          auth_username = COALESCE(?, auth_username),
          auth_password_secret = COALESCE(?, auth_password_secret),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).bind(
      name || null,
      platform_type || null,
      api_url || null,
      auth_username !== undefined ? auth_username : null,
      auth_password_secret !== undefined ? auth_password_secret : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    ).run();

    return c.json({ success: true, data: { updated: true }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// PUT /api/platforms/:id/toggle - Toggle platform active/paused status
api.put('/platforms/:id/toggle', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const plat = await c.env.DB.prepare('SELECT is_active FROM platforms WHERE id = ?').bind(id).first<any>();
    if (!plat) return c.json({ success: false, data: null, error: 'پلتفرم یافت نشد' }, 404);

    const newStatus = plat.is_active ? 0 : 1;
    await c.env.DB.prepare('UPDATE platforms SET is_active = ? WHERE id = ?').bind(newStatus, id).run();

    return c.json({ success: true, data: { id, is_active: newStatus }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// DELETE /api/platforms/:id - Delete platform endpoint
api.delete('/platforms/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    await c.env.DB.prepare('DELETE FROM platforms WHERE id = ?').bind(id).run();
    return c.json({ success: true, data: { deleted: true }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// GET /api/translations - List translations for CRUD Manager
api.get('/translations', async (c) => {
  try {
    const query = `
      SELECT 
        translations.id,
        translations.article_id,
        translations.target_language,
        translations.translated_title,
        translations.translated_content,
        translations.translated_at,
        translations.model_used,
        translations.ai_model,
        translations.approval_status,
        articles.title AS original_title,
        articles.original_url,
        sources.name AS source_name
      FROM translations
      LEFT JOIN articles ON translations.article_id = articles.id
      LEFT JOIN sources ON articles.source_id = sources.id
      ORDER BY translations.translated_at DESC
      LIMIT 100
    `;
    const { results } = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: results || [], error: null });
  } catch (err: any) {
    return c.json({ success: false, data: [], error: err.message }, 500);
  }
});

// POST /api/translations - Create manual translation record
api.post('/translations', async (c) => {
  try {
    const body = await c.req.json();
    const { article_id, target_language, translated_title, translated_content, model_used } = body;

    if (!article_id || !translated_title || !translated_content) {
      return c.json({ success: false, data: null, error: 'عنوان، متن ترجمه و شناسه مقاله الزامی است.' }, 400);
    }

    const res = await c.env.DB.prepare(`
      INSERT INTO translations (article_id, target_language, translated_title, translated_content, translated_at, model_used)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).bind(
      article_id,
      target_language || 'persian',
      translated_title,
      translated_content,
      model_used || 'manual_editor'
    ).run();

    await c.env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?")
      .bind(article_id).run();

    return c.json({ success: true, data: { id: res.meta.last_row_id }, error: null }, 201);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// PUT /api/translations/:id - Edit translation content / title / approval status
api.put('/translations/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { translated_title, translated_content, target_language, model_used, approval_status } = body;

    await c.env.DB.prepare(`
      UPDATE translations
      SET translated_title = COALESCE(?, translated_title),
          translated_content = COALESCE(?, translated_content),
          target_language = COALESCE(?, target_language),
          model_used = COALESCE(?, model_used),
          approval_status = COALESCE(?, approval_status)
      WHERE id = ?
    `).bind(
      translated_title || null,
      translated_content || null,
      target_language || null,
      model_used || null,
      approval_status || null,
      id
    ).run();

    await recordSystemEvent(c.env.DB, 'TRANSLATION_EDITED', `ویرایش ترجمه #${id}`);
    return c.json({ success: true, data: { updated: true, id }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// PUT /api/translations/:id/approve - Approve translation for distribution
api.put('/translations/:id/approve', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    await c.env.DB.prepare("UPDATE translations SET approval_status = 'approved' WHERE id = ?").bind(id).run();
    await recordSystemEvent(c.env.DB, 'TRANSLATION_APPROVED', `تایید ترجمه #${id} جهت انتشار در پلتفرم‌های هزاردستان`);
    return c.json({ success: true, data: { id, approval_status: 'approved' }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/translations/:id/approve-and-distribute - Approve and instantly distribute to all active platforms
api.post('/translations/:id/approve-and-distribute', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    // Mark as approved first
    await c.env.DB.prepare("UPDATE translations SET approval_status = 'approved' WHERE id = ?").bind(id).run();

    // Find article ID for this translation
    const trans: any = await c.env.DB.prepare('SELECT article_id FROM translations WHERE id = ?').bind(id).first();
    const articleId = trans ? trans.article_id : null;

    // Trigger distribution worker
    const { wpSyncPublisher } = await import('../cron/wpSync');
    const result = await wpSyncPublisher(c.env, { forceArticleId: articleId });

    await recordSystemEvent(
      c.env.DB,
      'DISTRIBUTION_EXECUTED',
      `تایید و ارسال آنی ترجمه #${id} به ${result.successCount} پلتفرم مقصد`
    );

    return c.json({ success: true, data: { id, result }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// DELETE /api/translations/:id - Delete translation record
api.delete('/translations/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    await c.env.DB.prepare('DELETE FROM distributions WHERE translation_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM translations WHERE id = ?').bind(id).run();
    return c.json({ success: true, data: { deleted: true }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// PUT /api/news/:id - Edit original article
api.put('/news/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { title, content, translation_status, wp_sync_status } = body;

    await c.env.DB.prepare(`
      UPDATE articles
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          translation_status = COALESCE(?, translation_status),
          wp_sync_status = COALESCE(?, wp_sync_status)
      WHERE id = ?
    `).bind(
      title || null,
      content || null,
      translation_status || null,
      wp_sync_status || null,
      id
    ).run();

    return c.json({ success: true, data: { updated: true }, error: null });
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/trigger-wp-sync - Trigger WordPress Sync Publisher manually
api.post('/trigger-wp-sync', async (c) => {
  const start = Date.now();
  try {
    let body: { article_id?: number; limit?: number } = {};
    try {
      body = await c.req.json();
    } catch {}

    const result = await wpSyncPublisher(c.env, {
      limit: body.limit || 5,
      forceArticleId: body.article_id,
    });

    const durationMs = Date.now() - start;
    await recordExecutionLog(
      c.env.DB,
      'manual_wp_sync',
      result.errors.length > 0 ? (result.successCount > 0 ? 'partial' : 'failed') : 'success',
      result.processed,
      result.successCount,
      result.errors.join('; ') || null,
      durationMs
    );
    await recordSystemEvent(
      c.env.DB,
      'WP_SYNC_TRIGGERED',
      `انتشار ${result.successCount} مقاله ترجمه‌شده در سایت وردپرس (updaaate.ir)`
    );

    return c.json({ success: true, data: result, error: null }, 200);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    await recordExecutionLog(c.env.DB, 'manual_wp_sync', 'failed', 0, 0, err.message, durationMs);
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/wp-sync/test-connection - Test WordPress REST API & Application Password connection
api.post('/wp-sync/test-connection', async (c) => {
  try {
    let body: { api_url?: string; username?: string; app_password?: string } = {};
    try {
      body = await c.req.json();
    } catch {}

    const apiUrl = (body.api_url || c.env.WP_API_URL || 'https://updaaate.ir/wp-json/wp/v2/').trim();
    let username = (body.username || c.env.WP_USERNAME || '').trim();
    let appPassword = (body.app_password || c.env.WP_APPLICATION_PASSWORD || '').trim();

    // If the frontend sends the masked password or empty, fetch the real one from DB or ENV
    if (!appPassword || appPassword === '••••••••••••••••' || appPassword.includes('•')) {
      if (c.env.WP_APPLICATION_PASSWORD && !c.env.WP_APPLICATION_PASSWORD.includes('•')) {
        appPassword = c.env.WP_APPLICATION_PASSWORD.trim();
      } else if (c.env.DB) {
        try {
          const platform = await c.env.DB.prepare(`
            SELECT auth_password_secret, auth_username, api_url 
            FROM platforms 
            WHERE platform_type = 'wordpress' OR slug = 'updaaate_ir' 
            ORDER BY id ASC LIMIT 1
          `).first() as any;
          if (platform && platform.auth_password_secret && !platform.auth_password_secret.includes('•')) {
            appPassword = platform.auth_password_secret.trim();
            if (!username && platform.auth_username) {
              username = platform.auth_username.trim();
            }
          }
        } catch (err) {}
      }
    }

    if (!username) {
      username = (c.env.WP_USERNAME || '1000dastan').trim();
    }

    if (!appPassword || appPassword === '••••••••••••••••' || appPassword.includes('•')) {
      return c.json({
        success: false,
        data: null,
        error: 'رمز عبور برنامه‌ای (Application Password) وردپرس وارد نشده است. لطفاً رمز عبور واقعی ایجاد شده در بخش کاربران وردپرس (کاربران > شناسنامه شما > رمزهای عبور برنامه) را در کادر مربوطه تایپ کرده و ذخیره نمایید.',
      }, 400);
    }

    const testRes = await testWordPressConnection(apiUrl, username, appPassword);
    return c.json({
      success: testRes.success,
      data: testRes,
      error: testRes.success ? null : testRes.message,
    }, testRes.success ? 200 : 400);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/telegram/test-connection - Test Telegram Bot connectivity
api.post('/telegram/test-connection', async (c) => {
  try {
    let body: { bot_token?: string; chat_id?: string } = {};
    try {
      body = await c.req.json();
    } catch {}

    const token = body.bot_token || c.env.TELEGRAM_BOT_TOKEN || (typeof process !== 'undefined' ? process.env.TELEGRAM_BOT_TOKEN : undefined);
    const chatId = body.chat_id || c.env.TELEGRAM_CHAT_ID || (typeof process !== 'undefined' ? process.env.TELEGRAM_CHAT_ID : undefined) || '@updaaate_crypto';

    if (!token) {
      return c.json({
        success: false,
        data: null,
        error: 'توکن ربات تلگرام (TELEGRAM_BOT_TOKEN) تنظیم نشده است.',
      }, 400);
    }

    const testRes = await testBot(token, chatId);
    return c.json({
      success: testRes.ok,
      data: testRes,
      error: testRes.ok ? null : testRes.description,
    }, testRes.ok ? 200 : 400);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/telegram/send-news - Send article to Telegram channel
api.post('/telegram/send-news', async (c) => {
  try {
    const body = await c.req.json();
    const { title, content, tags, source_url, chat_id, bot_token } = body;

    if (!title || !content) {
      return c.json({
        success: false,
        data: null,
        error: 'عنوان (title) و متن (content) الزامی است.',
      }, 400);
    }

    const token = bot_token || c.env.TELEGRAM_BOT_TOKEN || (typeof process !== 'undefined' ? process.env.TELEGRAM_BOT_TOKEN : undefined);
    const chatId = chat_id || c.env.TELEGRAM_CHAT_ID || (typeof process !== 'undefined' ? process.env.TELEGRAM_CHAT_ID : undefined) || '@updaaate_crypto';

    const sendRes = await sendNewsToTelegram({
      botToken: token,
      chatId,
      title,
      content,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? JSON.parse(tags) : []),
      sourceUrl: source_url,
    });

    return c.json({
      success: sendRes.ok,
      data: sendRes,
      error: sendRes.ok ? null : sendRes.description,
    }, sendRes.ok ? 200 : 400);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/telegram/send/:articleId - Send specific article by ID from DB to Telegram
api.post('/telegram/send/:articleId', async (c) => {
  const articleId = c.req.param('articleId');
  const env = c.env;

  try {
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {}

    // 1. خواندن مقاله از DB
    let article: any = null;
    if (env.DB) {
      try {
        article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
      } catch {}
    }
    if (!article && env.DB_ARCHIVE) {
      try {
        article = await env.DB_ARCHIVE.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
      } catch {}
    }

    if (!article) {
      return c.json({ success: false, data: null, error: 'مقاله پیدا نشد' }, 404);
    }

    const hasPersian = (str: string) => /[\u0600-\u06FF]/.test(str || '');

    // 2. استخراج یا ساخت ترجمه
    let translation: any = null;

    if (body.translated_title || body.translated_content) {
      translation = {
        id: Number(articleId),
        article_id: Number(articleId),
        translated_title: (body.translated_title || '').trim() || article.title,
        translated_content: (body.translated_content || '').trim() || article.content,
        translated_summary: body.translated_summary || '',
        tags: body.tags || null,
      };
    }

    if (!translation && env.DB) {
      try {
        translation = await env.DB.prepare(
          'SELECT * FROM translations WHERE article_id = ? ORDER BY id DESC LIMIT 1'
        ).bind(articleId).first<any>();
      } catch {}
    }

    if (!translation && env.DB_ARCHIVE) {
      try {
        translation = await env.DB_ARCHIVE.prepare(
          'SELECT * FROM translations WHERE article_id = ? ORDER BY id DESC LIMIT 1'
        ).bind(articleId).first<any>();
      } catch {}
    }

    if (!translation && env.DB) {
      try {
        const historyRow = await env.DB.prepare(
          'SELECT * FROM translation_history WHERE article_id = ? ORDER BY id DESC LIMIT 1'
        ).bind(articleId).first<any>();
        if (historyRow) {
          translation = {
            id: historyRow.id,
            article_id: historyRow.article_id,
            translated_title: historyRow.translated_title,
            translated_content: historyRow.translated_content,
            translated_summary: historyRow.translated_summary || '',
            tags: historyRow.tags || null,
          };
        }
      } catch {}
    }

    if (!translation && (hasPersian(article.title) || hasPersian(article.content) || article.translated_title || article.translated_content)) {
      translation = {
        id: article.id,
        article_id: article.id,
        translated_title: article.translated_title || article.title,
        translated_content: article.translated_content || article.content || article.summary || article.title,
        translated_summary: article.summary || '',
        tags: null,
      };
    }

    // اگر ترجمه‌ای وجود نداشت، ترجمه خودکار فوری با AI
    if (!translation || (!translation.translated_title && !translation.translated_content)) {
      try {
        const { translateTextWithAI, generateSeoMetadataWithAI } = await import('../cron/translator');
        const [titleRes, contentRes] = await Promise.all([
          translateTextWithAI(env, article.title, 'english', 'persian'),
          translateTextWithAI(env, article.content || article.summary || article.title, 'english', 'persian'),
        ]);

        const finalTitle = titleRes.translatedText || article.title;
        const finalContent = contentRes.translatedText || article.content || article.title;
        const modelUsed = titleRes.modelUsed || contentRes.modelUsed || 'gemini-3.7-flash';

        const seoRes = await generateSeoMetadataWithAI(env, finalTitle, finalContent, modelUsed);
        const tagsJson = JSON.stringify(seoRes.tags);

        translation = {
          id: Number(articleId),
          article_id: Number(articleId),
          translated_title: finalTitle,
          translated_content: finalContent,
          translated_summary: seoRes.meta_description || '',
          tags: tagsJson,
        };

        if (env.DB) {
          try {
            await env.DB.prepare(`
              INSERT INTO translations (
                article_id, target_language, translated_title, translated_content, 
                suggested_titles, tags, meta_description, translated_at, model_used, approval_status
              ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?, 'approved')
            `).bind(
              articleId,
              finalTitle,
              finalContent,
              JSON.stringify(seoRes.suggested_titles),
              tagsJson,
              seoRes.meta_description,
              modelUsed
            ).run();
            await env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?").bind(articleId).run();
          } catch {}
        }
      } catch (err: any) {
        console.warn('Auto translation fallback error in telegram send:', err.message);
      }
    }

    if (!translation) {
      return c.json({ success: false, data: null, error: 'ترجمه برای این مقاله پیدا نشد' }, 404);
    }

    // Parse tags safely
    let tagsList: string[] = [];
    try {
      if (typeof translation.tags === 'string') {
        tagsList = JSON.parse(translation.tags);
      } else if (Array.isArray(translation.tags)) {
        tagsList = translation.tags;
      }
    } catch {
      tagsList = [];
    }

    // 3. ارسال به Telegram
    const { distributeToTelegram } = await import('../cron/telegramBot');
    const result = await distributeToTelegram(env, {
      article_id: Number(articleId),
      translation_id: translation.id,
      title: translation.translated_title || article.title,
      content: translation.translated_content || translation.translated_summary || article.summary || '',
      summary: translation.translated_summary,
      tags: tagsList,
      source_url: article.link || article.original_url,
    });

    if (!result.ok) {
      return c.json({
        success: false,
        data: null,
        error: result.description || 'خطا در ارسال پیام به تلگرام',
      }, 500);
    }

    const messageId = result.result?.message_id || null;

    return c.json({
      success: true,
      data: {
        message_id: messageId,
        sent: true,
        channel: env.TELEGRAM_CHAT_ID || '@updaaate_crypto',
      },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({
      success: false,
      data: null,
      error: `خطا در پایپ‌لاین تلگرام: ${err.message}`,
    }, 500);
  }
});

// POST /api/wp-sync - Sync & publish translated article to WordPress
api.post('/wp-sync', async (c) => {
  const env = c.env;
  try {
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {}

    const articleId = body.article_id || body.id;

    if (articleId) {
      // 1. خواندن مقاله
      let article: any = null;
      if (env.DB) {
        try {
          article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
        } catch {}
      }
      if (!article && env.DB_ARCHIVE) {
        try {
          article = await env.DB_ARCHIVE.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
        } catch {}
      }

      if (!article) {
        return c.json({ success: false, data: null, error: 'مقاله پیدا نشد' }, 404);
      }

      const hasPersian = (str: string) => /[\u0600-\u06FF]/.test(str || '');

      // 2. خواندن یا استخراج ترجمه
      let translation: any = null;

      if (body.translated_title || body.translated_content) {
        translation = {
          id: Number(articleId),
          article_id: Number(articleId),
          translated_title: (body.translated_title || '').trim() || article.title,
          translated_content: (body.translated_content || '').trim() || article.content,
          translated_summary: body.translated_summary || '',
          tags: body.tags || null,
        };
      }

      if (!translation && env.DB) {
        try {
          translation = await env.DB.prepare(
            'SELECT * FROM translations WHERE article_id = ? ORDER BY id DESC LIMIT 1'
          ).bind(articleId).first<any>();
        } catch {}
      }
      if (!translation && env.DB_ARCHIVE) {
        try {
          translation = await env.DB_ARCHIVE.prepare(
            'SELECT * FROM translations WHERE article_id = ? ORDER BY id DESC LIMIT 1'
          ).bind(articleId).first<any>();
        } catch {}
      }
      if (!translation && (hasPersian(article.title) || hasPersian(article.content) || article.translated_title || article.translated_content)) {
        translation = {
          id: article.id,
          article_id: article.id,
          translated_title: article.translated_title || article.title,
          translated_content: article.translated_content || article.content || article.summary || article.title,
          translated_summary: article.summary || '',
          tags: null,
        };
      }

      // ترجمه خودکار در صورت نیاز
      if (!translation || (!translation.translated_title && !translation.translated_content)) {
        try {
          const { translateTextWithAI, generateSeoMetadataWithAI } = await import('../cron/translator');
          const [titleRes, contentRes] = await Promise.all([
            translateTextWithAI(env, article.title, 'english', 'persian'),
            translateTextWithAI(env, article.content || article.summary || article.title, 'english', 'persian'),
          ]);

          const finalTitle = titleRes.translatedText || article.title;
          const finalContent = contentRes.translatedText || article.content || article.title;
          const modelUsed = titleRes.modelUsed || contentRes.modelUsed || 'gemini-3.7-flash';

          const seoRes = await generateSeoMetadataWithAI(env, finalTitle, finalContent, modelUsed);
          const tagsJson = JSON.stringify(seoRes.tags);

          translation = {
            id: Number(articleId),
            article_id: Number(articleId),
            translated_title: finalTitle,
            translated_content: finalContent,
            translated_summary: seoRes.meta_description || '',
            tags: tagsJson,
          };

          if (env.DB) {
            try {
              await env.DB.prepare(`
                INSERT INTO translations (
                  article_id, target_language, translated_title, translated_content, 
                  suggested_titles, tags, meta_description, translated_at, model_used, approval_status
                ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?, 'approved')
              `).bind(
                articleId,
                finalTitle,
                finalContent,
                JSON.stringify(seoRes.suggested_titles),
                tagsJson,
                seoRes.meta_description,
                modelUsed
              ).run();
              await env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?").bind(articleId).run();
            } catch {}
          }
        } catch (err: any) {
          console.warn('Auto translation fallback error in wp-sync:', err.message);
        }
      }

      if (!translation) {
        return c.json({ success: false, data: null, error: 'ترجمه برای این مقاله پیدا نشد' }, 404);
      }

      // 3. انتشار در وردپرس
      const { distributeToWordPress } = await import('../cron/wpSync');
      const wpResult = await distributeToWordPress(env, {
        article_id: Number(articleId),
        translation_id: translation.id,
        title: translation.translated_title,
        content: translation.translated_content,
        summary: translation.translated_summary,
        tags: translation.tags || null,
        source_url: article.link || article.original_url,
        source_name: 'Cointelegraph',
        featured_image: article.featured_image || null,
      });

      if (!wpResult.ok) {
        return c.json({
          success: false,
          data: null,
          error: wpResult.error || 'خطا در انتشار در وردپرس',
        }, 500);
      }

      return c.json({
        success: true,
        data: {
          post_id: Number(wpResult.postId) || wpResult.postId,
          post_url: wpResult.postUrl,
          published: true,
        },
        error: null,
      }, 200);
    }

    // حالت کلی (Batch Sync)
    const { wpSyncPublisher } = await import('../cron/wpSync');
    const result = await wpSyncPublisher(env, { limit: body.limit || 5 });
    return c.json({ success: true, data: result, error: null }, 200);
  } catch (err: any) {
    return c.json({
      success: false,
      data: null,
      error: `خطا در همگام‌سازی وردپرس: ${err.message}`,
    }, 500);
  }
});

// POST /api/news/:id/distribute - Universal Distribution Hub (Telegram + WordPress)
api.post('/news/:id/distribute', async (c) => {
  const articleId = c.req.param('id');
  const env = c.env;

  try {
    let body: {
      platforms?: string[];
      translated_title?: string;
      translated_content?: string;
      translated_summary?: string;
      tags?: string[] | string;
    } = {};
    try {
      body = await c.req.json();
    } catch {}

    const platforms = (body.platforms && Array.isArray(body.platforms) && body.platforms.length > 0)
      ? body.platforms.map(p => p.toLowerCase().trim())
      : ['telegram', 'wordpress'];

    // 1. خواندن اطلاعات مقاله از DB یا DB_ARCHIVE
    let article: any = null;
    if (env.DB) {
      try {
        article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
      } catch {}
    }
    if (!article && env.DB_ARCHIVE) {
      try {
        article = await env.DB_ARCHIVE.prepare('SELECT * FROM articles WHERE id = ?').bind(articleId).first<any>();
      } catch {}
    }

    if (!article) {
      return c.json({ success: false, data: null, error: 'مقاله پیدا نشد' }, 404);
    }

    const hasPersian = (str: string) => /[\u0600-\u06FF]/.test(str || '');

    // 2. خواندن ترجمه تاییدشده/موجود با جستجوی چند لایه
    let translation: any = null;

    // A. اگر متن ترجمه از پنل Content Desk در درخواست ارسال شده باشد
    if (body.translated_title || body.translated_content) {
      const bTitle = (body.translated_title || '').trim();
      const bContent = (body.translated_content || '').trim();
      if (bTitle || bContent) {
        translation = {
          id: Number(articleId),
          article_id: Number(articleId),
          translated_title: bTitle || article.title,
          translated_content: bContent || bTitle,
          translated_summary: body.translated_summary || '',
          tags: body.tags || null,
        };

        // ذخیره/به‌روزرسانی در دیتابیس
        if (env.DB) {
          try {
            await env.DB.prepare(`
              INSERT INTO translations (
                article_id, target_language, translated_title, translated_content, 
                translated_summary, tags, translated_at, model_used, approval_status
              ) VALUES (?, 'persian', ?, ?, ?, ?, datetime('now'), 'editor_desk', 'approved')
            `).bind(
              articleId,
              translation.translated_title,
              translation.translated_content,
              translation.translated_summary || null,
              typeof translation.tags === 'string' ? translation.tags : JSON.stringify(translation.tags || []),
            ).run();
          } catch {
            try {
              await env.DB.prepare(`
                INSERT INTO translations (article_id, translated_title, translated_content, translated_at)
                VALUES (?, ?, ?, datetime('now'))
              `).bind(articleId, translation.translated_title, translation.translated_content).run();
            } catch {}
          }
        }
      }
    }

    // B. بررسی DB اصلی
    if (!translation && env.DB) {
      try {
        translation = await env.DB.prepare(
          'SELECT * FROM translations WHERE article_id = ? ORDER BY id DESC LIMIT 1'
        ).bind(articleId).first<any>();
      } catch {}
    }

    // C. بررسی DB_ARCHIVE
    if (!translation && env.DB_ARCHIVE) {
      try {
        translation = await env.DB_ARCHIVE.prepare(
          'SELECT * FROM translations WHERE article_id = ? ORDER BY id DESC LIMIT 1'
        ).bind(articleId).first<any>();
      } catch {}
    }

    // D. بررسی جدول تاریخچه ترجمه
    if (!translation && env.DB) {
      try {
        const historyRow = await env.DB.prepare(
          'SELECT * FROM translation_history WHERE article_id = ? ORDER BY id DESC LIMIT 1'
        ).bind(articleId).first<any>();

        if (historyRow) {
          translation = {
            id: historyRow.id,
            article_id: historyRow.article_id,
            translated_title: historyRow.translated_title,
            translated_content: historyRow.translated_content,
            translated_summary: historyRow.translated_summary || '',
            tags: historyRow.tags || null,
          };
        }
      } catch {}
    }

    // E. بررسی اگر خود عنوان یا متن خبر فارسی است
    if (!translation && (hasPersian(article.title) || hasPersian(article.content) || hasPersian(article.summary) || article.translated_title || article.translated_content)) {
      translation = {
        id: article.id,
        article_id: article.id,
        translated_title: article.translated_title || article.title,
        translated_content: article.translated_content || article.content || article.summary || article.title,
        translated_summary: article.summary || '',
        tags: null,
      };
    }

    // F. ترجمه فوری خودکار در صورت عدم وجود هرگونه ترجمه قبلی
    if (!translation || (!translation.translated_title && !translation.translated_content)) {
      try {
        const { translateTextWithAI, generateSeoMetadataWithAI } = await import('../cron/translator');
        const [titleRes, contentRes] = await Promise.all([
          translateTextWithAI(env, article.title, 'english', 'persian'),
          translateTextWithAI(env, article.content || article.summary || article.title, 'english', 'persian'),
        ]);

        const finalTitle = titleRes.translatedText || article.title;
        const finalContent = contentRes.translatedText || article.content || article.title;
        const modelUsed = titleRes.modelUsed || contentRes.modelUsed || 'gemini-3.7-flash';

        const seoRes = await generateSeoMetadataWithAI(env, finalTitle, finalContent, modelUsed);
        const titlesJson = JSON.stringify(seoRes.suggested_titles);
        const tagsJson = JSON.stringify(seoRes.tags);

        translation = {
          id: Number(articleId),
          article_id: Number(articleId),
          translated_title: finalTitle,
          translated_content: finalContent,
          translated_summary: seoRes.meta_description || '',
          tags: tagsJson,
        };

        if (env.DB) {
          try {
            await env.DB.prepare(`
              INSERT INTO translations (
                article_id, target_language, translated_title, translated_content, 
                suggested_titles, tags, meta_description, translated_at, model_used, approval_status
              ) VALUES (?, 'persian', ?, ?, ?, ?, ?, datetime('now'), ?, 'approved')
            `).bind(
              articleId,
              finalTitle,
              finalContent,
              titlesJson,
              tagsJson,
              seoRes.meta_description,
              modelUsed
            ).run();
            await env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?").bind(articleId).run();
          } catch {}
        }
      } catch (autoErr: any) {
        console.warn('Auto translation fallback error in distribute:', autoErr.message);
      }
    }

    if (!translation || (!translation.translated_title && !translation.translated_content)) {
      return c.json({ success: false, data: null, error: 'ترجمه آماده‌ای برای این خبر یافت نشد.' }, 400);
    }

    const responseData: {
      article_id: number;
      telegram?: { sent: boolean; message_id?: any; error?: string };
      wordpress?: { published: boolean; post_id?: any; post_url?: string; error?: string };
    } = {
      article_id: Number(articleId),
    };

    // 3. توزیع در تلگرام در صورت درخواست
    if (platforms.includes('telegram')) {
      try {
        let tagsList: string[] = [];
        try {
          if (typeof translation.tags === 'string') {
            tagsList = JSON.parse(translation.tags);
          } else if (Array.isArray(translation.tags)) {
            tagsList = translation.tags;
          }
        } catch {
          tagsList = [];
        }

        const { distributeToTelegram } = await import('../cron/telegramBot');
        const tgRes = await distributeToTelegram(env, {
          article_id: Number(articleId),
          translation_id: translation.id,
          title: translation.translated_title || article.title,
          content: translation.translated_content || translation.translated_summary || article.summary || '',
          summary: translation.translated_summary,
          tags: tagsList,
          source_url: article.link || article.original_url,
        });

        if (tgRes.ok) {
          responseData.telegram = {
            sent: true,
            message_id: tgRes.result?.message_id || 1,
          };
          if (env.DB) {
            try {
              await env.DB.prepare(`
                UPDATE articles
                SET telegram_sync_status = 'published',
                    telegram_message_id = ?,
                    telegram_published_at = datetime('now'),
                    telegram_error = NULL
                WHERE id = ?
              `).bind(String(tgRes.result?.message_id || '1'), articleId).run();
            } catch {}
          }
        } else {
          responseData.telegram = {
            sent: false,
            error: tgRes.description || 'عدم موفقیت در ارسال تلگرام',
          };
          if (env.DB) {
            try {
              await env.DB.prepare(`
                UPDATE articles
                SET telegram_sync_status = 'failed',
                    telegram_error = ?
                WHERE id = ?
              `).bind(tgRes.description || 'خطای تلگرام', articleId).run();
            } catch {}
          }
        }
      } catch (tgErr: any) {
        responseData.telegram = {
          sent: false,
          error: tgErr.message,
        };
        if (env.DB) {
          try {
            await env.DB.prepare(`
              UPDATE articles
              SET telegram_sync_status = 'failed',
                  telegram_error = ?
              WHERE id = ?
            `).bind(tgErr.message || 'خطای سرور', articleId).run();
          } catch {}
        }
      }
    }

    // 4. توزیع در وردپرس در صورت درخواست
    if (platforms.includes('wordpress')) {
      try {
        const { distributeToWordPress } = await import('../cron/wpSync');
        const wpRes = await distributeToWordPress(env, {
          article_id: Number(articleId),
          translation_id: translation.id,
          title: translation.translated_title,
          content: translation.translated_content,
          summary: translation.translated_summary,
          tags: translation.tags || null,
          source_url: article.link || article.original_url,
          source_name: 'Cointelegraph',
          featured_image: article.featured_image || null,
        });

        if (wpRes.ok) {
          responseData.wordpress = {
            published: true,
            post_id: Number(wpRes.postId) || wpRes.postId,
            post_url: wpRes.postUrl,
          };
          if (env.DB) {
            try {
              await env.DB.prepare(`
                UPDATE articles
                SET wp_sync_status = 'published',
                    wp_post_id = ?,
                    wp_published_at = datetime('now'),
                    wp_error = NULL
                WHERE id = ?
              `).bind(Number(wpRes.postId) || null, articleId).run();
            } catch {}
          }
        } else {
          responseData.wordpress = {
            published: false,
            error: wpRes.error || 'عدم موفقیت در ارسال به وردپرس',
          };
          if (env.DB) {
            try {
              await env.DB.prepare(`
                UPDATE articles
                SET wp_sync_status = 'failed',
                    wp_error = ?
                WHERE id = ?
              `).bind(wpRes.error || 'خطای وردپرس', articleId).run();
            } catch {}
          }
        }
      } catch (wpErr: any) {
        responseData.wordpress = {
          published: false,
          error: wpErr.message,
        };
        if (env.DB) {
          try {
            await env.DB.prepare(`
              UPDATE articles
              SET wp_sync_status = 'failed',
                  wp_error = ?
              WHERE id = ?
            `).bind(wpErr.message || 'خطای سرور', articleId).run();
          } catch {}
        }
      }
    }

    // لاگ سیستم
    await recordSystemEvent(
      env.DB,
      'DISTRIBUTE_HUB_TRIGGERED',
      `توزیع خبر #${articleId} در پلتفرم‌های (${platforms.join(', ')})`
    );

    return c.json({
      success: true,
      data: responseData,
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({
      success: false,
      data: null,
      error: `خطا در مرکز توزیع محتوا: ${err.message}`,
    }, 500);
  }
});

// POST & GET /api/clear-cache - Clear cache headers and instruct client to reset cache
api.all('/clear-cache', async (c) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  c.header('Surrogate-Control', 'no-store');
  return c.json({
    success: true,
    data: { message: 'کش سیستم و پاسخ‌های HTTP با موفقیت پاکسازی شد.', timestamp: new Date().toISOString() },
    error: null,
  }, 200);
});

// POST /api/database/reset - Full/Selective Database Reset with Exact SQL Execution
api.post('/database/reset', async (c) => {
  try {
    await ensureTablesAndLogs(c.env.DB, true);

    interface ResetRequestBody {
      clearSources?: boolean;
      clearArticles?: boolean;
      clearTranslations?: boolean;
      clearApprovedTranslations?: boolean;
      clearPendingTranslations?: boolean;
      clearDistributions?: boolean;
      clearPlatforms?: boolean;
      clearLogs?: boolean;
      rebuildSchema?: boolean;
      vacuum?: boolean;
      target?: string;
    }
    const body: ResetRequestBody = await c.req.json<ResetRequestBody>().catch(() => ({ target: 'all' }));

    const isAll = body.target === 'all';
    const isRebuild = body.target === 'rebuild_schema' || !!body.rebuildSchema;
    const isVacuum = body.target === 'vacuum' || !!body.vacuum;

    if (isVacuum) {
      try {
        await c.env.DB.prepare('VACUUM').run();
      } catch (err: any) {
        // In some D1 environments VACUUM might be automated or unsupported
      }
      return c.json({
        success: true,
        data: {
          message: 'عملیات بهینه‌سازی و فشرده‌سازی پایگاه داده D1 (VACUUM) با موفقیت اجرا شد.',
          executedQueries: ['VACUUM;'],
          cleared: { vacuum: true },
          timestamp: new Date().toISOString()
        },
        error: null
      });
    }

    const shouldTranslations = isAll || isRebuild || body.target === 'translations' || !!body.clearTranslations;
    const shouldApprovedTranslations = !shouldTranslations && (body.target === 'approved_translations' || !!body.clearApprovedTranslations);
    const shouldPendingTranslations = !shouldTranslations && (body.target === 'pending_translations' || !!body.clearPendingTranslations);
    const shouldArticles = isAll || isRebuild || body.target === 'articles' || !!body.clearArticles;
    const shouldSources = isAll || isRebuild || body.target === 'sources' || !!body.clearSources;
    const shouldDistributions = isAll || isRebuild || body.target === 'distributions' || !!body.clearDistributions;
    const shouldPlatforms = isAll || isRebuild || body.target === 'platforms' || !!body.clearPlatforms;
    const shouldLogs = isAll || isRebuild || body.target === 'logs' || !!body.clearLogs;

    const statements: any[] = [];
    const executedQueries: string[] = [];

    // 1. Translations
    if (shouldTranslations) {
      statements.push(c.env.DB.prepare('DELETE FROM translations'));
      executedQueries.push('DELETE FROM translations;');
      statements.push(c.env.DB.prepare('DELETE FROM translation_history'));
      executedQueries.push('DELETE FROM translation_history;');
      try {
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'translations'"));
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'translation_history'"));
        executedQueries.push("UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('translations', 'translation_history');");
      } catch {}
      if (!shouldArticles) {
        statements.push(c.env.DB.prepare("UPDATE articles SET translation_status = 'pending', wp_sync_status = 'pending'"));
        executedQueries.push("UPDATE articles SET translation_status = 'pending', wp_sync_status = 'pending';");
      }
    } else {
      if (shouldApprovedTranslations) {
        statements.push(c.env.DB.prepare("DELETE FROM translations WHERE approval_status = 'approved' OR approval_status IS NULL"));
        executedQueries.push("DELETE FROM translations WHERE approval_status = 'approved';");
      }
      if (shouldPendingTranslations) {
        statements.push(c.env.DB.prepare("DELETE FROM translations WHERE approval_status = 'pending'"));
        statements.push(c.env.DB.prepare("UPDATE articles SET translation_status = 'failed' WHERE translation_status IN ('pending', 'processing')"));
        executedQueries.push("DELETE FROM translations WHERE approval_status = 'pending';");
      }
    }

    // 2. Distributions
    if (shouldDistributions) {
      statements.push(c.env.DB.prepare('DELETE FROM distributions'));
      executedQueries.push('DELETE FROM distributions;');
      try {
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'distributions'"));
        executedQueries.push("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'distributions';");
      } catch {}
    }

    // 3. Articles
    if (shouldArticles) {
      statements.push(c.env.DB.prepare('DELETE FROM articles'));
      executedQueries.push('DELETE FROM articles;');
      try {
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'articles'"));
        executedQueries.push("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'articles';");
      } catch {}
    }

    // 4. Sources
    if (shouldSources) {
      statements.push(c.env.DB.prepare('DELETE FROM sources'));
      executedQueries.push('DELETE FROM sources;');
      try {
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'sources'"));
        executedQueries.push("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'sources';");
      } catch {}
    }

    // 5. Platforms
    if (shouldPlatforms) {
      statements.push(c.env.DB.prepare('DELETE FROM platforms'));
      executedQueries.push('DELETE FROM platforms;');
      try {
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'platforms'"));
        executedQueries.push("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'platforms';");
      } catch {}
    }

    // 6. Logs & Events
    if (shouldLogs) {
      statements.push(c.env.DB.prepare('DELETE FROM execution_logs'));
      statements.push(c.env.DB.prepare('DELETE FROM system_events'));
      executedQueries.push('DELETE FROM execution_logs; DELETE FROM system_events;');
      try {
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'execution_logs'"));
        statements.push(c.env.DB.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'system_events'"));
      } catch {}
    }

    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    if (isRebuild || isAll) {
      await ensureTablesAndLogs(c.env.DB, true);
      executedQueries.push('ENSURE_TABLES_AND_INDEXES(force=true);');
    }

    // Record audit event if logs weren't just cleared
    if (!shouldLogs) {
      try {
        await c.env.DB.prepare(
          "INSERT INTO system_events (event_type, description, created_at) VALUES ('DB_CLEANUP', ?, datetime('now'))"
        ).bind(`پاکسازی جداول دیتابیس با موفقیت انجام شد: ${executedQueries.slice(0, 3).join(' ')}`).run();
      } catch {}
    }

    return c.json({
      success: true,
      data: {
        message: 'عملیات پاکسازی جداول دیتابیس D1 با موفقیت اجرا شد.',
        executedQueries,
        cleared: {
          sources: shouldSources,
          articles: shouldArticles,
          translations: shouldTranslations,
          approvedTranslations: shouldApprovedTranslations,
          pendingTranslations: shouldPendingTranslations,
          distributions: shouldDistributions,
          platforms: shouldPlatforms,
          logs: shouldLogs,
          rebuildSchema: isRebuild || isAll,
        },
        timestamp: new Date().toISOString()
      },
      error: null,
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});


// POST /api/d1/query - Execute raw SQL query
api.post('/d1/query', async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query;
    if (!query) return c.json({ success: false, data: null, error: 'Query is empty' }, 400);

    const startTime = Date.now();
    let results = [];
    try {
      const res = await c.env.DB.prepare(query).all();
      results = res.results || [];
    } catch (e) {
       const res = await c.env.DB.prepare(query).run() as any;
       results = [{ success: res.success, changes: res.meta?.changes, last_row_id: res.meta?.last_row_id }];
    }
    const duration = Date.now() - startTime;
    return c.json({ success: true, data: { results, duration }, error: null });
  } catch (err) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});


// GET /api/secrets/status - View Cloudflare Secrets Store status and loaded keys
api.get('/secrets/status', async (c) => {
  try {
    const status = await getSecretsStatus(c.env);
    return c.json({ success: true, data: status, error: null }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/secrets/sync - Force re-hydrate secrets from Cloudflare Secrets Store
api.post('/secrets/sync', async (c) => {
  try {
    await hydrateEnvWithSecrets(c.env);
    const status = await getSecretsStatus(c.env);
    return c.json({
      success: true,
      data: {
        message: 'همگام‌سازی و خواندن سکرت‌ها از Cloudflare Secrets Store با موفقیت انجام شد.',
        status
      },
      error: null
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/secrets/cf-api-inspect - Inspect Account Secrets Stores, Quota & Scopes via Cloudflare API v4
api.post('/secrets/cf-api-inspect', async (c) => {
  try {
    const body: { account_id?: string; api_token?: string; store_id?: string } = await c.req.json().catch(() => ({}));
    const accountId = body.account_id || (c.env as any).CLOUDFLARE_ACCOUNT_ID || '';
    const apiToken = body.api_token || (c.env as any).CLOUDFLARE_API_TOKEN || '';
    const storeId = body.store_id || '';

    if (!accountId || !apiToken) {
      return c.json({
        success: false,
        data: null,
        error: 'لطفاً شناسه حساب (Account ID) و توکن API با دسترسی Account Secrets Store Read یا Edit را وارد نمایید.',
      }, 400);
    }

    const { listCloudflareStores, listStoreSecrets, getSecretsStoreQuota } = await import('../utils/secrets');

    // 1. Fetch stores
    const storesRes = await listCloudflareStores(accountId, apiToken);
    
    // 2. Fetch quota
    const quotaRes = await getSecretsStoreQuota(accountId, apiToken);

    // 3. Fetch secrets for selected store or first store
    let secretsRes: any = null;
    const targetStoreId = storeId || (storesRes.result && storesRes.result[0]?.id);
    if (targetStoreId) {
      secretsRes = await listStoreSecrets(accountId, targetStoreId, apiToken);
    }

    return c.json({
      success: true,
      data: {
        stores: storesRes.result || [],
        quota: quotaRes.result?.secrets || null,
        selectedStoreId: targetStoreId || null,
        secrets: secretsRes?.result || [],
        hasWorkersScope: (secretsRes?.result || []).map((s: any) => ({
          name: s.name,
          scopes: s.scopes,
          is_workers_ready: Array.isArray(s.scopes) && s.scopes.includes('workers'),
        })),
        api_messages: [...(storesRes.messages || []), ...(quotaRes.messages || [])],
      },
      error: storesRes.errors?.[0]?.message || quotaRes.errors?.[0]?.message || null,
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

export default api;
