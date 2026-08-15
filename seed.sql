-- Seed Data for 1000 Dastan (Local D1 Database)

-- 1. Seed Test RSS Sources
INSERT OR REPLACE INTO sources (id, name, url, language, category, scrape_limit, is_active)
VALUES 
  (1, 'TechCrunch', 'https://techcrunch.com/feed/', 'en', 'technology', 10, 1),
  (2, 'BBC World News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'en', 'world', 10, 1);

-- 2. Seed Sample Scraped English Article
INSERT OR REPLACE INTO articles (id, source_id, original_url, title, content, featured_image, published_at, translation_status, wp_sync_status)
VALUES (
  1,
  1,
  'https://techcrunch.com/sample-ai-breakthrough-2026',
  'Next-Generation Edge AI Transforms Cloud Computing Paradigms',
  'Researchers and engineers have demonstrated a breakthrough in serverless edge computing, enabling neural networks to execute inferences with sub-millisecond latency directly at content delivery points. This shift dramatically reduces cloud infrastructure costs while preserving user data privacy.',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
  datetime('now'),
  'completed',
  'pending'
);

-- 3. Seed Corresponding Sample Persian Translation
INSERT OR REPLACE INTO translations (id, article_id, target_language, translated_title, translated_content, model_used, ai_model, approval_status)
VALUES (
  1,
  1,
  'persian',
  'نسل جدید هوش مصنوعی لبه پارادایم‌های رایانش ابری را متحول می‌کند',
  'پژوهشگران و مهندسان به دستاوردی چشمگیر در رایانش لبه بدون سرور (Serverless Edge) دست یافته‌اند که امکان اجرای استنتاج‌های شبکه‌های عصبی را با تاخیر زیر یک میلی‌ثانیه در نقاط تحویل محتوا فراهم می‌سازد. این تحول ساختاری، هزینه‌های زیرساخت ابری را به شدت کاهش داده و امنیت داده‌های کاربران را تضمین می‌کند.',
  'gemini-2.5-flash',
  'gemini-2.5-flash',
  'approved'
);
