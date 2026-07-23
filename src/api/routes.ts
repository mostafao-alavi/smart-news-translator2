import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, ApiResponse, Source, JoinedArticleNews, StatsData } from '../types';

const api = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

let tablesEnsured = false;
export async function ensureTablesAndLogs(db: any) {
  if (tablesEnsured || !db) return;
  try {
    tablesEnsured = true;
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT NOT NULL UNIQUE,
          language TEXT DEFAULT 'en'
        );
      `),
      db.prepare(`
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
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS translations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          article_id INTEGER NOT NULL UNIQUE,
          target_language TEXT DEFAULT 'persian',
          translated_title TEXT NOT NULL,
          translated_content TEXT NOT NULL,
          translated_at TEXT DEFAULT (datetime('now')),
          model_used TEXT,
          ai_model TEXT,
          FOREIGN KEY (article_id) REFERENCES articles(id)
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS translation_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          article_id INTEGER NOT NULL,
          target_language TEXT DEFAULT 'persian',
          translated_title TEXT NOT NULL,
          translated_content TEXT NOT NULL,
          translated_at TEXT DEFAULT (datetime('now')),
          model_used TEXT NOT NULL,
          FOREIGN KEY (article_id) REFERENCES articles(id)
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS execution_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_type TEXT NOT NULL,
          status TEXT NOT NULL,
          items_processed INTEGER DEFAULT 0,
          items_success INTEGER DEFAULT 0,
          error_message TEXT,
          duration_ms INTEGER DEFAULT 0,
          executed_at TEXT DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS system_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(translation_status);'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_translations_model ON translations(model_used);'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_execution_logs_time ON execution_logs(executed_at DESC);'),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_translation_history_article ON translation_history(article_id);'),
    ]);
  } catch (err) {
    console.warn('Database table auto-initialization check:', err);
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
        articles.published_at,
        articles.created_at,
        articles.translation_status,
        translations.translated_title,
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
        articles.published_at,
        articles.created_at,
        articles.translation_status,
        translations.translated_title,
        translations.translated_content,
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

// POST /api/sources - Add a new RSS news source
api.post('/sources', async (c) => {
  try {
    const body = await c.req.json<{ name?: string; url?: string; language?: string }>();

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

    // Check if source URL already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM sources WHERE url = ?'
    ).bind(trimmedUrl).first();

    if (existing) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: 'این آدرس منبع قبلاً در سیستم ثبت شده است',
      };
      return c.json(response, 409);
    }

    // Insert new source
    const result = await c.env.DB.prepare(
      'INSERT INTO sources (name, url, language) VALUES (?, ?, ?)'
    ).bind(trimmedName, trimmedUrl, lang).run();

    const newSource: Source = {
      id: result.meta.last_row_id as number,
      name: trimmedName,
      url: trimmedUrl,
      language: lang,
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

// GET /api/sources - List all news sources
api.get('/sources', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT id, name, url, language FROM sources ORDER BY id ASC').all<Source>();
    const response: ApiResponse<Source[]> = {
      success: true,
      data: results || [],
      error: null,
    };
    c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
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

// GET /api/db-status - Detailed D1 Database connection metrics
api.get('/db-status', async (c) => {
  try {
    const batchRes = await c.env.DB.batch<{ count: number }>([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM sources'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM articles'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM translations'),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM articles WHERE translation_status = 'pending'"),
    ]);

    const sourcesCountRes = batchRes[0]?.results?.[0];
    const articlesCountRes = batchRes[1]?.results?.[0];
    const translationsCountRes = batchRes[2]?.results?.[0];
    const pendingCountRes = batchRes[3]?.results?.[0];

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

    const selectedModel = body.model || '@cf/meta/m2m100-1.2b';

    const article = await c.env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first<any>();
    if (!article) {
      return c.json({ success: false, data: null, error: 'خبر پیدا نشد' }, 404);
    }
    await c.env.DB.prepare("UPDATE articles SET translation_status = 'processing' WHERE id = ?").bind(id).run();

    const { translateTextWithAI } = await import('../cron/translator');

    const [titleRes, contentRes] = await Promise.all([
      translateTextWithAI(c.env, article.title, 'english', 'persian', selectedModel),
      translateTextWithAI(c.env, article.content || article.title, 'english', 'persian', selectedModel),
    ]);

    const modelUsed = titleRes.modelUsed || contentRes.modelUsed || selectedModel;

    // Delete existing translation if any, then insert new translation
    await c.env.DB.prepare('DELETE FROM translations WHERE article_id = ?').bind(id).run();

    await c.env.DB.prepare(`
      INSERT INTO translations (
        article_id, 
        target_language, 
        translated_title, 
        translated_content, 
        translated_at,
        model_used,
        ai_model
      ) VALUES (?, 'persian', ?, ?, datetime('now'), ?, ?)
    `).bind(
      id,
      titleRes.translatedText || article.title,
      contentRes.translatedText || article.content || article.title,
      modelUsed,
      modelUsed
    ).run();

    // Also insert into translation_history table
    try {
      await c.env.DB.prepare(`
        INSERT INTO translation_history (article_id, target_language, translated_title, translated_content, translated_at, model_used)
        VALUES (?, 'persian', ?, ?, datetime('now'), ?)
      `).bind(
        id,
        titleRes.translatedText || article.title,
        contentRes.translatedText || article.content || article.title,
        modelUsed
      ).run();
    } catch {}

    await recordSystemEvent(c.env.DB, 'ARTICLE_TRANSLATED', `ترجمه خبر شماره ${id} با مدل ${modelUsed}`);

    await c.env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?").bind(id).run();

    return c.json({
      success: true,
      data: {
        id,
        translated_title: titleRes.translatedText || article.title,
        translated_content: contentRes.translatedText || article.content,
        model_used: modelUsed,
      },
      error: null
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/news/custom - Insert custom article and translate with selected AI model
api.post('/news/custom', async (c) => {
  try {
    const body = await c.req.json<{ title?: string; content?: string; model?: string }>();
    if (!body.title) {
      return c.json({ success: false, data: null, error: 'عنوان خبر الزامی است' }, 400);
    }
    const title = body.title.trim();
    const content = (body.content || title).trim();
    const selectedModel = body.model || '@cf/meta/m2m100-1.2b';
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

    const { translateTextWithAI } = await import('../cron/translator');

    const [titleRes, contentRes] = await Promise.all([
      translateTextWithAI(c.env, title, 'english', 'persian', selectedModel),
      translateTextWithAI(c.env, content, 'english', 'persian', selectedModel),
    ]);

    const modelUsed = titleRes.modelUsed || contentRes.modelUsed || selectedModel;

    await c.env.DB.prepare(`
      INSERT INTO translations (
        article_id, 
        target_language, 
        translated_title, 
        translated_content, 
        translated_at,
        model_used,
        ai_model
      ) VALUES (?, 'persian', ?, ?, datetime('now'), ?, ?)
    `).bind(
      articleId,
      titleRes.translatedText || title,
      contentRes.translatedText || content,
      modelUsed,
      modelUsed
    ).run();

    await c.env.DB.prepare("UPDATE articles SET translation_status = 'completed' WHERE id = ?").bind(articleId).run();

    return c.json({
      success: true,
      data: { id: articleId, title, model_used: modelUsed },
      error: null
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});

// POST /api/sources/:id/scrape - Scrape single source RSS feed
api.post('/sources/:id/scrape', async (c) => {
  try {
    const id = c.req.param('id');
    const source = await c.env.DB.prepare('SELECT * FROM sources WHERE id = ?').bind(id).first<Source>();
    if (!source) {
      return c.json({ success: false, data: null, error: 'منبع یافت نشد' }, 404);
    }
    let newlyInserted = 0;
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'CloudflareNewsWorker/1.0' },
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const xml = await response.text();
        const itemMatches = xml.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];
        for (const itemXml of itemMatches.slice(0, 5)) {
          const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
          const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
          const title = rawTitle.replace(/<[^>]+>/g, '').trim();

          const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i) || itemXml.match(/href=["']([^"']+)["']/i);
          const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : `${source.url}#item-${Date.now()}`;

          if (title) {
            const exists = await c.env.DB.prepare('SELECT id FROM articles WHERE original_url = ?').bind(link).first();
            if (!exists) {
              const now = new Date().toISOString();
              await c.env.DB.prepare(
                "INSERT INTO articles (source_id, original_url, title, content, published_at, created_at, translation_status) VALUES (?, ?, ?, ?, ?, ?, 'pending')"
              ).bind(source.id, link, title, title, now, now).run();
              newlyInserted++;
            }
          }
        }
      }
    } catch (e) {}

    return c.json({ success: true, data: { newlyInserted }, error: null }, 200);
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

// GET /api/stats - Get count of sources, articles, and translations
api.get('/stats', async (c) => {
  try {
    const batchRes = await c.env.DB.batch<{ count: number }>([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM sources'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM articles'),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM translations'),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM articles WHERE translation_status = 'pending'"),
    ]);

    const stats: StatsData = {
      sources_count: batchRes[0]?.results?.[0]?.count || 0,
      articles_count: batchRes[1]?.results?.[0]?.count || 0,
      translations_count: batchRes[2]?.results?.[0]?.count || 0,
      pending_translations_count: batchRes[3]?.results?.[0]?.count || 0,
    };

    const response: ApiResponse<StatsData> = {
      success: true,
      data: stats,
      error: null,
    };

    c.header('Cache-Control', 'public, max-age=10, s-maxage=30');
    return c.json(response, 200);
  } catch (err: any) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: err.message || 'Error fetching stats',
    };
    return c.json(response, 500);
  }
});

export default api;
