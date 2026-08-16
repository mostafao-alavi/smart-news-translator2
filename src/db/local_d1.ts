import Database from 'better-sqlite3';

const sqlite = new Database('local_d1.sqlite');

// Initialize base schema on load
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rss_url TEXT NOT NULL UNIQUE,
      base_url TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      category TEXT DEFAULT 'crypto',
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
      summary TEXT,
      featured_image TEXT,
      published_at TEXT,
      scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
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

    INSERT OR IGNORE INTO sources (id, name, rss_url, base_url, language, category, is_active, scrape_limit)
    VALUES (1, 'Cointelegraph', 'https://cointelegraph.com/rss', 'https://cointelegraph.com', 'en', 'crypto', 1, 10);
  `);
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
