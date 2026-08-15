-- Cloudflare D1 Database Schema for Smart News Aggregator & AI Translator Worker
-- Execute via Wrangler CLI: npx wrangler d1 execute news_db --file=schema.sql

-- 1. RSS Sources Table
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

-- 2. Scraped News Articles Table (با ستون featured_image)
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

-- 3. Full Article Contents
CREATE TABLE IF NOT EXISTS article_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL UNIQUE,
  full_text TEXT NOT NULL,
  html_content TEXT,
  author TEXT,
  scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- 4. Article Images Table
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

-- 5. Active Translations Table (سازگار با نسخه تک دیتابیسی و پشتیبان)
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

-- 6. Content Distributions Table
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

-- 7. Operation & Audit Logs
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,
  article_id INTEGER,
  status TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 8. Global Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_scraped ON articles(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_images_article ON article_images(article_id);
CREATE INDEX IF NOT EXISTS idx_translations_article ON translations(article_id);

-- Seed: Cointelegraph Source
INSERT OR IGNORE INTO sources (id, name, rss_url, base_url, language, category, is_active, scrape_limit)
VALUES (1, 'Cointelegraph', 'https://cointelegraph.com/rss', 'https://cointelegraph.com', 'en', 'crypto', 1, 10);
