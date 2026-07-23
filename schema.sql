-- Cloudflare D1 Database Schema for Smart News Aggregator & AI Translator Worker
-- Execute via Wrangler CLI: npx wrangler d1 execute news-db --file=schema.sql

-- 1. RSS Sources Table
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  language TEXT DEFAULT 'en'
);

-- 2. Scraped News Articles Table
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

-- 3. Translations Table (Active Translations)
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

-- 4. Translation History Log (Audit log for multiple AI re-translations)
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

-- 5. Cron & Task Execution Logs Table (Scraper / Translator / Manual Triggers)
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

-- 6. System Events Audit Log Table
CREATE TABLE IF NOT EXISTS system_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(translation_status);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_translations_model ON translations(model_used);
CREATE INDEX IF NOT EXISTS idx_execution_logs_time ON execution_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_translation_history_article ON translation_history(article_id);

-- Seed initial RSS sources
INSERT OR IGNORE INTO sources (name, url, language) VALUES 
('BBC World News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'en'),
('TechCrunch', 'https://techcrunch.com/feed/', 'en'),
('Hacker News', 'https://news.ycombinator.com/rss', 'en');

