-- ==========================================================
-- D1 Archive Schema: news_archive_db (Database ID: efe58467-d7ce-4f36-ad57-592b694f8a0e)
-- Role: Translations, Content Distributions, Operation & Audit Logs
-- ==========================================================

-- 1. translations
CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  translated_title TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  translated_summary TEXT,
  meta_description TEXT,
  suggested_titles TEXT,
  tags TEXT,
  ai_model TEXT DEFAULT 'workers-ai',
  translated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. distributions
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

-- 3. operation_logs
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,
  article_id INTEGER,
  status TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Querying
CREATE INDEX IF NOT EXISTS idx_translations_article_id ON translations(article_id);
CREATE INDEX IF NOT EXISTS idx_distributions_article_id ON distributions(article_id);
CREATE INDEX IF NOT EXISTS idx_distributions_platform ON distributions(platform);
CREATE INDEX IF NOT EXISTS idx_operation_logs_time ON operation_logs(created_at DESC);
