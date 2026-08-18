import Database from 'better-sqlite3';

const sqlite = new Database('local_d1.sqlite');

// Initialize base schema on load
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      rss_url TEXT,
      base_url TEXT,
      language TEXT DEFAULT 'en',
      category TEXT DEFAULT 'crypto',
      selector TEXT,
      is_active INTEGER DEFAULT 1,
      scrape_limit INTEGER DEFAULT 10,
      last_scraped_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      external_id TEXT,
      title TEXT NOT NULL,
      link TEXT NOT NULL UNIQUE,
      original_url TEXT,
      content TEXT,
      summary TEXT,
      featured_image TEXT,
      published_at TEXT,
      scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      translation_status TEXT DEFAULT 'pending',
      wp_sync_status TEXT DEFAULT 'pending',
      wp_post_id INTEGER,
      wp_published_at TEXT,
      wp_error TEXT,
      FOREIGN KEY (source_id) REFERENCES sources(id)
    );

    CREATE TABLE IF NOT EXISTS article_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL UNIQUE,
      full_text TEXT NOT NULL,
      html_content TEXT,
      author TEXT,
      scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_alt TEXT,
      is_featured INTEGER DEFAULT 0,
      downloaded_path TEXT,
      wp_media_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL UNIQUE,
      target_language TEXT DEFAULT 'persian',
      translated_title TEXT NOT NULL,
      translated_content TEXT NOT NULL,
      translated_summary TEXT,
      suggested_titles TEXT,
      tags TEXT,
      meta_description TEXT,
      translated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      model_used TEXT,
      ai_model TEXT DEFAULT 'workers-ai',
      approval_status TEXT DEFAULT 'approved',
      FOREIGN KEY (article_id) REFERENCES articles(id)
    );

    CREATE TABLE IF NOT EXISTS distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      translation_id INTEGER,
      platform TEXT NOT NULL,
      platform_post_id TEXT,
      platform_url TEXT,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      published_at TEXT,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      article_id INTEGER,
      status TEXT,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO sources (id, name, rss_url, url, base_url, language, category, is_active, scrape_limit)
    VALUES (1, 'Cointelegraph', 'https://cointelegraph.com/rss', 'https://cointelegraph.com/rss', 'https://cointelegraph.com', 'en', 'crypto', 1, 10);
  `);

  // Run dynamic column migrations for existing SQLite schemas
  const safeAddColumn = (tbl: string, colDef: string) => {
    try { sqlite.exec(`ALTER TABLE ${tbl} ADD COLUMN ${colDef}`); } catch {}
  };

  safeAddColumn('articles', 'original_url TEXT');
  safeAddColumn('articles', 'content TEXT');
  safeAddColumn('articles', 'created_at TEXT');
  safeAddColumn('articles', 'translation_status TEXT DEFAULT "pending"');
  safeAddColumn('articles', 'wp_sync_status TEXT DEFAULT "pending"');
  safeAddColumn('articles', 'wp_post_id INTEGER');
  safeAddColumn('articles', 'wp_published_at TEXT');
  safeAddColumn('articles', 'wp_error TEXT');
  safeAddColumn('articles', 'telegram_sync_status TEXT DEFAULT "pending"');
  safeAddColumn('articles', 'telegram_message_id TEXT');
  safeAddColumn('articles', 'telegram_published_at TEXT');
  safeAddColumn('articles', 'telegram_error TEXT');

  safeAddColumn('sources', 'url TEXT');
  safeAddColumn('sources', 'selector TEXT');

  // Check if sources table has legacy NOT NULL constraints on rss_url or base_url and rebuild if needed
  try {
    const tableInfo = sqlite.prepare("PRAGMA table_info(sources)").all() as any[];
    const rssCol = tableInfo.find((c: any) => c.name === 'rss_url');
    const baseCol = tableInfo.find((c: any) => c.name === 'base_url');
    if ((rssCol && rssCol.notnull === 1) || (baseCol && baseCol.notnull === 1)) {
      sqlite.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE IF NOT EXISTS sources_v2 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          rss_url TEXT,
          base_url TEXT,
          language TEXT DEFAULT 'en',
          category TEXT DEFAULT 'crypto',
          selector TEXT,
          is_active INTEGER DEFAULT 1,
          scrape_limit INTEGER DEFAULT 10,
          last_scraped_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO sources_v2 (id, name, url, rss_url, base_url, language, category, selector, is_active, scrape_limit, last_scraped_at, created_at)
        SELECT id, name, COALESCE(url, rss_url, ''), rss_url, base_url, language, category, selector, is_active, scrape_limit, last_scraped_at, created_at
        FROM sources;
        DROP TABLE sources;
        ALTER TABLE sources_v2 RENAME TO sources;
        PRAGMA foreign_keys = ON;
      `);
    }
  } catch (schemaErr: any) {
    console.warn('[Local D1] sources schema check:', schemaErr.message);
  }

  // Backfill aliases
  try {
    sqlite.exec(`UPDATE articles SET original_url = link WHERE original_url IS NULL;`);
    sqlite.exec(`UPDATE articles SET created_at = scraped_at WHERE created_at IS NULL;`);
    sqlite.exec(`UPDATE sources SET url = rss_url WHERE url IS NULL OR url = '';`);
  } catch {}
} catch (e: any) {
  console.warn('[Local D1] SQLite initialization notice:', e.message);
}

export const mockD1 = {
  prepare: (query: string) => {
    return {
      bind: (...params: any[]) => {
        return {
          all: async <T = any>() => {
            const stmt = sqlite.prepare(query);
            const results = stmt.all(...params) as T[];
            return { success: true, results };
          },
          run: async () => {
            const stmt = sqlite.prepare(query);
            const info = stmt.run(...params);
            return {
              success: true,
              meta: { changes: info.changes, last_row_id: info.lastInsertRowid }
            };
          },
          first: async <T = any>() => {
            const stmt = sqlite.prepare(query);
            const result = stmt.get(...params) as T | undefined;
            return result || null;
          }
        };
      },
      all: async <T = any>() => {
        const stmt = sqlite.prepare(query);
        const results = stmt.all() as T[];
        return { success: true, results };
      },
      run: async () => {
        const stmt = sqlite.prepare(query);
        const info = stmt.run();
        return {
          success: true,
          meta: { changes: info.changes, last_row_id: info.lastInsertRowid }
        };
      },
      first: async <T = any>() => {
        const stmt = sqlite.prepare(query);
        const result = stmt.get() as T | undefined;
        return result || null;
      }
    };
  },
  batch: async (statements: any[]) => {
    const results = [];
    sqlite.exec('BEGIN');
    try {
      for (const stmt of statements) {
         results.push(await stmt.run());
      }
      sqlite.exec('COMMIT');
      return results;
    } catch (e) {
      sqlite.exec('ROLLBACK');
      throw e;
    }
  },
  exec: async (query: string) => {
    sqlite.exec(query);
    return { success: true };
  }
};

const localKvMap = new Map<string, string>();
export const mockKV = {
  get: async (key: string) => localKvMap.get(key) || null,
  put: async (key: string, value: string) => { localKvMap.set(key, String(value)); },
  delete: async (key: string) => { localKvMap.delete(key); },
  list: async () => ({ keys: Array.from(localKvMap.keys()).map(k => ({ name: k })), list_complete: true }),
};
