-- Cloudflare D1 Database Schema for Smart News Aggregator & AI Translator Worker
-- Execute via Wrangler CLI: npx wrangler d1 execute news-db --file=schema.sql

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  language TEXT DEFAULT 'en'
);

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

-- Seed initial RSS sources
INSERT OR IGNORE INTO sources (name, url, language) VALUES 
('BBC World News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'en'),
('TechCrunch', 'https://techcrunch.com/feed/', 'en'),
('Hacker News', 'https://news.ycombinator.com/rss', 'en');
