-- ==========================================================
-- D1 Primary Schema: news_db (Database ID: 2815bd80-f483-4f9b-872d-93047309ed13)
-- Role: News Sources, Articles, Full Contents, Images, Settings
-- ==========================================================

-- 1. sources
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

-- 2. articles (شامل ستون featured_image)
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

-- 3. article_contents
CREATE TABLE IF NOT EXISTS article_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL UNIQUE,
  full_text TEXT NOT NULL,
  html_content TEXT,
  author TEXT,
  scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- 4. article_images
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

-- 5. settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Querying
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_scraped ON articles(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_images_article ON article_images(article_id);

-- Seed: Cointelegraph
INSERT OR IGNORE INTO sources (id, name, rss_url, base_url, language, category, is_active, scrape_limit)
VALUES (1, 'Cointelegraph', 'https://cointelegraph.com/rss', 'https://cointelegraph.com', 'en', 'crypto', 1, 10);
