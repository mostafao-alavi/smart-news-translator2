import { Env, D1Database } from '../types.ts';

export interface D1StatusReport {
  primary_db: {
    binding: string;
    database_name: string;
    database_id: string;
    connected: boolean;
    latency_ms: number;
    tables: string[];
    table_counts: Record<string, number>;
    error: string | null;
  };
  archive_db: {
    binding: string;
    database_name: string;
    database_id: string;
    connected: boolean;
    latency_ms: number;
    tables: string[];
    table_counts: Record<string, number>;
    error: string | null;
  };
  is_dual_db: boolean;
  timestamp: string;
}

/**
 * Returns Primary D1 database instance
 */
export function getPrimaryDb(env: Env): D1Database {
  return env.DB;
}

/**
 * Returns Archive D1 database instance (falls back to Primary if not configured)
 */
export function getArchiveDb(env: Env): D1Database {
  return env.DB_ARCHIVE || env.DB;
}

/**
 * Core SQL Schema definitions for Hazardastan Crawler & Aggregator
 */
export const CORE_TABLE_DEFINITIONS: string[] = [
  // 1. Sources & Configs
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

  `CREATE TABLE IF NOT EXISTS source_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    fetch_frequency_minutes INTEGER DEFAULT 15,
    rate_limit_rpm INTEGER DEFAULT 60,
    css_content_selector TEXT,
    css_title_selector TEXT,
    css_author_selector TEXT,
    css_date_selector TEXT,
    css_cleaning_selectors TEXT,
    excluded_elements TEXT,
    custom_headers TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (source_id) REFERENCES sources(id)
  );`,

  // 2. Crawl tracking & Checkpoints
  `CREATE TABLE IF NOT EXISTS crawl_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER,
    status TEXT DEFAULT 'pending',
    start_time TEXT,
    end_time TEXT,
    articles_found INTEGER DEFAULT 0,
    articles_saved INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS crawl_checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL UNIQUE,
    last_crawled_url TEXT,
    last_crawled_at TEXT,
    cursor TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS sitemap_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    url TEXT NOT NULL UNIQUE,
    last_modified TEXT,
    status TEXT DEFAULT 'pending',
    discovered_at TEXT DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS crawl_errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER,
    url TEXT,
    error_code TEXT,
    error_message TEXT,
    occurred_at TEXT DEFAULT (datetime('now'))
  );`,

  // 3. Articles, Contents, Blocks & Images
  `CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    original_url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    featured_image TEXT,
    published_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    translation_status TEXT DEFAULT 'pending',
    wp_sync_status TEXT DEFAULT 'pending',
    wp_post_id INTEGER,
    wp_published_at TEXT,
    wp_error TEXT,
    telegram_sync_status TEXT DEFAULT 'pending',
    telegram_message_id TEXT,
    telegram_published_at TEXT,
    telegram_error TEXT,
    FOREIGN KEY (source_id) REFERENCES sources(id)
  );`,

  `CREATE TABLE IF NOT EXISTS article_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL UNIQUE,
    full_text TEXT NOT NULL,
    html_content TEXT,
    author TEXT,
    scraped_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );`,

  `CREATE TABLE IF NOT EXISTS article_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    block_type TEXT NOT NULL,
    content TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );`,

  `CREATE TABLE IF NOT EXISTS article_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    role TEXT DEFAULT 'inline',
    position INTEGER DEFAULT 0,
    alt_text TEXT,
    image_alt TEXT,
    title TEXT,
    caption TEXT,
    description TEXT,
    dimensions TEXT,
    is_featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );`,

  // 4. Tags
  `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS article_tags (
    article_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
  );`,

  // 5. Translations & History
  `CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL UNIQUE,
    target_language TEXT DEFAULT 'persian',
    translated_title TEXT NOT NULL,
    translated_content TEXT NOT NULL,
    suggested_titles TEXT,
    tags TEXT,
    meta_description TEXT,
    translated_at TEXT DEFAULT (datetime('now')),
    model_used TEXT,
    ai_model TEXT,
    approval_status TEXT DEFAULT 'approved',
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );`,

  `CREATE TABLE IF NOT EXISTS translation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    target_language TEXT DEFAULT 'persian',
    translated_title TEXT NOT NULL,
    translated_content TEXT NOT NULL,
    suggested_titles TEXT,
    tags TEXT,
    meta_description TEXT,
    translated_at TEXT DEFAULT (datetime('now')),
    model_used TEXT NOT NULL,
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );`,

  // 6. Distributions & Platforms
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

  // 7. Backups
  `CREATE TABLE IF NOT EXISTS backup_destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    destination_type TEXT DEFAULT 'google_sheets',
    config_json TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS backup_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    destination_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    records_backed_up INTEGER DEFAULT 0,
    error_message TEXT,
    run_at TEXT DEFAULT (datetime('now'))
  );`,

  // 8. Logs & Metrics
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

  `CREATE TABLE IF NOT EXISTS system_metrics (
    key TEXT PRIMARY KEY,
    value INTEGER DEFAULT 0
  );`
];

/**
 * Initializes schemas and safe column migrations on a D1 database
 */
export async function initializeD1Schema(db: D1Database): Promise<{ success: boolean; error: string | null }> {
  if (!db) return { success: false, error: 'Database binding is undefined' };

  try {
    for (const sql of CORE_TABLE_DEFINITIONS) {
      try {
        await db.prepare(sql).run();
      } catch (err: any) {
        // Table or index might already exist
      }
    }

    // Safe column migrations
    const columnMigrations = [
      "ALTER TABLE sources ADD COLUMN category TEXT DEFAULT 'general'",
      "ALTER TABLE sources ADD COLUMN selector TEXT DEFAULT NULL",
      "ALTER TABLE sources ADD COLUMN scrape_limit INTEGER DEFAULT 10",
      "ALTER TABLE sources ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE sources ADD COLUMN created_at TEXT DEFAULT (datetime('now'))",
      "ALTER TABLE articles ADD COLUMN summary TEXT",
      "ALTER TABLE articles ADD COLUMN featured_image TEXT",
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
      "ALTER TABLE article_images ADD COLUMN alt_text TEXT",
      "ALTER TABLE article_images ADD COLUMN image_alt TEXT",
      "ALTER TABLE article_images ADD COLUMN role TEXT DEFAULT 'inline'",
      "ALTER TABLE article_images ADD COLUMN position INTEGER DEFAULT 0",
      "ALTER TABLE article_images ADD COLUMN title TEXT",
      "ALTER TABLE article_images ADD COLUMN caption TEXT",
      "ALTER TABLE article_images ADD COLUMN description TEXT",
      "ALTER TABLE article_images ADD COLUMN dimensions TEXT"
    ];

    for (const alter of columnMigrations) {
      try {
        await db.prepare(alter).run();
      } catch {}
    }

    // Indexes for fast lookup
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(translation_status);',
      'CREATE INDEX IF NOT EXISTS idx_articles_wp_status ON articles(wp_sync_status);',
      'CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);',
      'CREATE INDEX IF NOT EXISTS idx_article_images_article ON article_images(article_id);',
      'CREATE INDEX IF NOT EXISTS idx_translations_approval ON translations(approval_status);',
      'CREATE INDEX IF NOT EXISTS idx_execution_logs_time ON execution_logs(executed_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_distributions_platform ON distributions(target_platform);'
    ];

    for (const idx of indexes) {
      try {
        await db.prepare(idx).run();
      } catch {}
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to initialize D1 schema' };
  }
}

/**
 * Inspects a D1 Database connection, measuring roundtrip latency and reading tables & counts
 */
export async function inspectD1Database(db: D1Database | undefined): Promise<{
  connected: boolean;
  latency_ms: number;
  tables: string[];
  table_counts: Record<string, number>;
  error: string | null;
}> {
  if (!db) {
    return {
      connected: false,
      latency_ms: 0,
      tables: [],
      table_counts: {},
      error: 'D1 binding is not defined or not attached',
    };
  }

  const start = Date.now();
  try {
    // 1. Connection check
    await db.prepare('SELECT 1 AS ok').first();
    const latency = Date.now() - start;

    // 2. Discover tables
    const tableRes = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all<{ name: string }>();
    const tables = (tableRes.results || []).map(r => r.name);

    // 3. Count rows in essential tables
    const tableCounts: Record<string, number> = {};
    for (const tbl of tables.slice(0, 15)) {
      try {
        const countRes = await db.prepare(`SELECT COUNT(*) AS total FROM ${tbl}`).first<{ total: number }>();
        tableCounts[tbl] = countRes?.total || 0;
      } catch {
        tableCounts[tbl] = 0;
      }
    }

    return {
      connected: true,
      latency_ms: latency,
      tables,
      table_counts: tableCounts,
      error: null,
    };
  } catch (err: any) {
    return {
      connected: false,
      latency_ms: Date.now() - start,
      tables: [],
      table_counts: {},
      error: err?.message || 'Database query failed',
    };
  }
}

/**
 * Generates comprehensive diagnostic status of both D1 bindings
 */
export async function getD1StatusReport(env: Env): Promise<D1StatusReport> {
  const primaryInspect = await inspectD1Database(env.DB);
  const archiveInspect = await inspectD1Database(env.DB_ARCHIVE);

  return {
    primary_db: {
      binding: 'DB',
      database_name: 'news_db',
      database_id: '2815bd80-f483-4f9b-872d-93047309ed13',
      ...primaryInspect,
    },
    archive_db: {
      binding: 'DB_ARCHIVE',
      database_name: 'news_archive_db',
      database_id: 'efe58467-d7ce-4f36-ad57-592b694f8a0e',
      ...archiveInspect,
    },
    is_dual_db: !!(env.DB && env.DB_ARCHIVE && env.DB !== env.DB_ARCHIVE),
    timestamp: new Date().toISOString(),
  };
}
