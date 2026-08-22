import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { Env, Source } from '../types';

function sanitizeContent(markdown: string): string {
  let cleaned = markdown;

  // 1. Remove price bar / top noise (everything before the first main heading)
  const firstHeadingMatch = cleaned.match(/(?:^|\n)#\s/);
  if (firstHeadingMatch && firstHeadingMatch.index !== undefined) {
    cleaned = cleaned.substring(firstHeadingMatch.index).trim();
  }

  // 2. Remove Category and Published Date metadata
  cleaned = cleaned.replace(/\[[^\]]+\]\([^)]+\)Published\s?[a-zA-Z]{3,10}\s?\d{1,2},\s?\d{4}/g, '\n\n');

  // 3. Remove Inline Related Links
  cleaned = cleaned.replace(/_?\*?\*?Related:\*?\*?_?\s*\[.*?\]\(.*?\)/gi, '\n\n');

  // 4. Remove footer/end sections
  const truncatePhrases = [
    "## More on the subject",
    "Subscribe to daily",
    "This article is produced in accordance with",
    "\n*   [",
    "\n* [",
    "_**Magazine:**_",
    "### Disclaimer",
  ];

  for (const phrase of truncatePhrases) {
    const idx = cleaned.indexOf(phrase);
    if (idx !== -1) {
      cleaned = cleaned.substring(0, idx).trim();
    }
  }

  return cleaned;
}

/**
 * Remove HTML tags and unescape common XML entities
 */
function cleanText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lightweight XML tag extractor for RSS (<item>) and Atom (<entry>) feeds.
 */
export function parseRssXml(xmlText: string) {
  const items: Array<{
    title: string;
    link: string;
    summary: string;
    publishedAt: string;
    featuredImage: string | null;
    externalId?: string;
    category?: string;
  }> = [];

  const itemMatches = xmlText.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

  for (const itemXml of itemMatches) {
    try {
      // Extract title
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
      const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
      const title = cleanText(rawTitle);

      // Extract link & clean tracking parameters
      let link = '';
      const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
      if (linkMatch) {
        link = (linkMatch[1] || linkMatch[2] || '').trim();
      } else {
        const hrefMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
        if (hrefMatch) {
          link = hrefMatch[1].trim();
        }
      }

      // Extract Category / Tag
      const catMatch = itemXml.match(/<category[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/category>/i);
      const rawCategory = catMatch ? (catMatch[1] || catMatch[2] || '').trim() : '';

      // Normalize link (remove tracking params like utm_source)
      if (link) {
        try {
          const urlObj = new URL(link);
          urlObj.search = '';
          urlObj.hash = '';
          link = urlObj.toString();
        } catch {}
      }

      // Extract GUID / externalId
      const guidMatch = itemXml.match(/<guid[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/guid>/i);
      const rawGuid = guidMatch ? (guidMatch[1] || guidMatch[2] || '').trim() : undefined;
      let externalId = rawGuid;
      if (externalId && externalId.startsWith('http')) {
        try {
          const gUrl = new URL(externalId);
          gUrl.search = '';
          gUrl.hash = '';
          externalId = gUrl.toString();
        } catch {}
      }

      // Extract description / summary
      const descMatch = itemXml.match(/<(?:description|summary|content:encoded)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:description|summary|content:encoded)>/i);
      const rawDesc = descMatch ? (descMatch[1] || descMatch[2] || '') : '';
      const summary = cleanText(rawDesc);

      // Extract pubDate
      const dateMatch = itemXml.match(/<(?:pubDate|published|updated|dc:date)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:pubDate|published|updated|dc:date)>/i);
      const rawDate = dateMatch ? (dateMatch[1] || dateMatch[2] || '') : '';
      const publishedAt = rawDate ? new Date(rawDate.trim()).toISOString() : new Date().toISOString();

      // Extract image
      let featuredImage: string | null = null;
      const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      if (mediaMatch) {
        featuredImage = mediaMatch[1];
      } else {
        const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
        if (enclosureMatch && enclosureMatch[1].match(/\.(jpeg|jpg|gif|png|webp)/i)) {
          featuredImage = enclosureMatch[1];
        } else {
          const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch) {
            featuredImage = imgMatch[1];
          }
        }
      }

      if (title && link) {
        items.push({
          title,
          link,
          summary: summary || title,
          publishedAt,
          featuredImage,
          externalId: externalId || link,
          category: rawCategory,
        });
      }
    } catch {
      // Skip malformed item
    }
  }

  return items;
}

/**
 * 1. Scrapes any RSS feed source and identifies new items
 */
export async function scrapeFeedSource(
  env: Env,
  source: { id: number; name: string; url: string; category?: string; scrape_limit?: number }
): Promise<Array<{
  source_id: number;
  title: string;
  link: string;
  summary: string;
  published_at: string;
  featured_image?: string | null;
  external_id?: string;
}>> {
  const rssUrl = source.url;
  const limit = source.scrape_limit || 20;
  console.log(`[Scraper] Fetching feed for "${source.name}": ${rssUrl} (Limit: ${limit})`);

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Hazardastan-RSS/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching feed ${rssUrl}`);
    }

    const xmlText = await response.text();
    const allItems = parseRssXml(xmlText);
    console.log(`[Scraper] Parsed ${allItems.length} items from ${source.name} RSS`);

    if (allItems.length === 0) return [];

    // Filter items (prefer news / latest)
    const filtered = allItems.filter(item => {
      const cat = (item.category || '').toLowerCase().trim();
      const isLatestCat = cat.includes('latest') || cat === 'latest news' || cat === 'news';
      const isNewsPath = item.link.includes('/news/') || item.link.includes('/markets/') || item.link.includes('/post/');
      return isLatestCat || isNewsPath || !cat;
    });

    const itemsToProcess = filtered.length > 0 ? filtered : allItems;

    // Check existing in DB Primary
    const links = itemsToProcess.map(i => i.link);
    const placeholders = links.map(() => '?').join(',');

    let existingLinks = new Set<string>();

    if (env.DB && links.length > 0) {
      try {
        const existingRes = await env.DB.prepare(
          `SELECT link FROM articles WHERE link IN (${placeholders})`
        ).bind(...links).all<{ link: string }>();

        existingLinks = new Set(existingRes.results?.map(r => r.link) || []);
      } catch (dbErr) {
        try {
          const legacyRes = await env.DB.prepare(
            `SELECT original_url FROM articles WHERE original_url IN (${placeholders})`
          ).bind(...links).all<{ original_url: string }>();
          existingLinks = new Set(legacyRes.results?.map(r => r.original_url) || []);
        } catch {}
      }
    }

    if (env.CACHE) {
      for (const item of itemsToProcess) {
        try {
          const cached = await env.CACHE.get(`rss_seen:${item.link}`);
          if (cached) existingLinks.add(item.link);
        } catch {}
      }
    }

    const newArticles = itemsToProcess
      .filter(item => !existingLinks.has(item.link))
      .slice(0, limit)
      .map(item => ({
        source_id: source.id,
        title: item.title,
        link: item.link,
        summary: item.summary,
        published_at: item.publishedAt,
        featured_image: item.featuredImage,
        external_id: item.externalId || item.link,
      }));

    console.log(`[Scraper] Found ${newArticles.length} brand new articles to ingest from ${source.name}`);
    return newArticles;
  } catch (err: any) {
    console.error(`[Scraper] Error fetching feed for ${source.name}:`, err.message);
    return [];
  }
}

/**
 * Scrapes Cointelegraph RSS feed focusing on Latest News (Legacy alias)
 */
export async function scrapeCointelegraph(env: Env, options?: { maxItems?: number }): Promise<Array<{
  source_id: number;
  title: string;
  link: string;
  summary: string;
  published_at: string;
  featured_image?: string | null;
  external_id?: string;
  id?: number;
}>> {
  return scrapeFeedSource(env, {
    id: 1,
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    scrape_limit: options?.maxItems || 30
  });
}

/**
 * 2. Downloads full article HTML from the web page and automatically extracts clean structured body text, author, and media via HTMLRewriter
 */
import { extractArticleFullText } from './htmlRewriterExtractor';

export async function scrapeFullArticle(env: Env, url: string): Promise<{
  full_text: string;
  html_content: string;
  author: string | null;
  images: Array<{ url: string; alt?: string; is_featured: number }>;
  featured_image: string | null;
}> {
  const result = await extractArticleFullText(url);
  return {
    full_text: result.full_text || '',
    html_content: result.html_content || '',
    author: result.author || null,
    images: result.images || [],
    featured_image: result.featured_image || null,
  };
}


/**
 * 3. Saves article metadata, full webpage text, and images into D1 Primary (`news_db`)
 * NOTE: The full_text extracted from HTMLRewriter is ALWAYS the primary source of truth for `content`.
 */
export async function saveArticle(
  env: Env,
  article: {
    source_id: number;
    title: string;
    link: string;
    summary?: string;
    published_at: string;
    featured_image?: string | null;
    external_id?: string;
  },
  content: {
    full_text: string;
    html_content?: string;
    author?: string | null;
  },
  images: Array<{ url: string; alt?: string; is_featured: number }> = []
): Promise<number | null> {
  if (!env.DB) return null;

  try {
    const featuredImg = article.featured_image || (images && images.length > 0 ? images[0].url : null);
    
    // Crucial rule: Full HTMLRewriter text is the content basis, NEVER the truncated RSS summary.
    const fullTextBody = (content.full_text && content.full_text.length > 50)
      ? content.full_text.trim()
      : (article.summary || article.title).trim();

    const shortSummary = (content.full_text && content.full_text.length > 50)
      ? content.full_text.slice(0, 300).trim()
      : (article.summary || article.title).trim();

    // 1. Check if article already exists in DB by link or original_url
    let articleId: number | null = null;
    try {
      const existing = await env.DB.prepare(
        'SELECT id, content FROM articles WHERE link = ? OR original_url = ?'
      ).bind(article.link, article.link).first<{ id: number; content?: string }>();

      if (existing) {
        articleId = existing.id;
        // Upgrade content with HTMLRewriter full text
        if (fullTextBody && fullTextBody.length > (existing.content?.length || 0)) {
          try {
            await env.DB.prepare(`
              UPDATE articles 
              SET content = ?, summary = ?, featured_image = COALESCE(?, featured_image)
              WHERE id = ?
            `).bind(fullTextBody, shortSummary, featuredImg, articleId).run();
          } catch {
            await env.DB.prepare(`
              UPDATE articles 
              SET content = ?, featured_image = COALESCE(?, featured_image)
              WHERE id = ?
            `).bind(fullTextBody, featuredImg, articleId).run();
          }
        }
      }
    } catch {}

    // 2. Insert new article if not found
    if (!articleId) {
      try {
        const artRes = await env.DB.prepare(`
          INSERT INTO articles (source_id, original_url, title, content, summary, featured_image, published_at, created_at, translation_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
        `).bind(
          article.source_id || 1,
          article.link,
          article.title,
          fullTextBody,
          shortSummary,
          featuredImg,
          article.published_at
        ).run();

        articleId = Number(artRes.meta?.last_row_id);
      } catch {
        try {
          const artRes = await env.DB.prepare(`
            INSERT INTO articles (source_id, external_id, title, link, summary, content, featured_image, published_at, scraped_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
          `).bind(
            article.source_id || 1,
            article.external_id || article.link,
            article.title,
            article.link,
            shortSummary,
            fullTextBody,
            featuredImg,
            article.published_at
          ).run();

          articleId = Number(artRes.meta?.last_row_id);
        } catch {
          // Legacy schema fallback
          const legRes = await env.DB.prepare(`
            INSERT OR IGNORE INTO articles (source_id, original_url, title, content, featured_image, published_at, created_at, translation_status)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
          `).bind(
            article.source_id || 1,
            article.link,
            article.title,
            fullTextBody,
            featuredImg,
            article.published_at
          ).run();
          articleId = Number(legRes.meta?.last_row_id);
        }
      }
    }

    if (!articleId) {
      const existing = await env.DB.prepare(
        'SELECT id FROM articles WHERE link = ? OR original_url = ?'
      ).bind(article.link, article.link).first<{ id: number }>();
      articleId = existing?.id || null;
    }

    if (!articleId) return null;

    // 3. Insert or update article_contents table with full text
    if (fullTextBody) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO article_contents (article_id, full_text, html_content, author, scraped_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
          articleId,
          fullTextBody,
          content.html_content || null,
          content.author || 'Unknown'
        ).run();
      } catch {}
    }

    // 4. Insert into article_images
    if (images.length > 0) {
      for (const img of images) {
        try {
          await env.DB.prepare(`
            INSERT INTO article_images (article_id, image_url, image_alt, is_featured, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
          `).bind(
            articleId,
            img.url,
            img.alt || article.title,
            img.is_featured ? 1 : 0
          ).run();
        } catch {}
      }
    }

    // 5. Update KV cache
    if (env.CACHE) {
      try {
        await env.CACHE.put(`rss_seen:${article.link}`, '1', { expirationTtl: 86400 * 7 }); // 7 days
      } catch {}
    }

    return articleId;
  } catch (err: any) {
    console.error(`[Scraper] Error saving article to D1 Primary:`, err.message);
    return null;
  }
}

/**
 * Multi-source scraper: Automatically fetches all active sources,
 * and extracts 100% full text using HTMLRewriter automatically for every new article.
 */
export async function scraper(env: Env): Promise<{ scrapedSources: number; insertedArticles: number; errors: string[] }> {
  let sourcesToScrape: Array<{ id: number; name: string; url: string; scrape_limit?: number }> = [];

  try {
    if (env.DB) {
      const activeRes = await env.DB.prepare('SELECT id, name, url, scrape_limit FROM sources WHERE is_active = 1').all<any>();
      if (activeRes.results && activeRes.results.length > 0) {
        sourcesToScrape = activeRes.results;
      }
    }
  } catch (err: any) {
    console.warn('[Scraper] Error loading active sources from DB:', err.message);
  }

  if (sourcesToScrape.length === 0) {
    sourcesToScrape = [
      { id: 1, name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', scrape_limit: 15 },
      { id: 2, name: 'Decrypt', url: 'https://decrypt.co/feed', scrape_limit: 10 },
      { id: 3, name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', scrape_limit: 10 }
    ];
  }

  let totalInserted = 0;
  const errors: string[] = [];

  for (const src of sourcesToScrape) {
    try {
      const newItems = await scrapeFeedSource(env, src);
      for (const item of newItems) {
        try {
          // ALWAYS automatically extract full HTMLRewriter text
          const full = await scrapeFullArticle(env, item.link);
          const id = await saveArticle(env, item, full, full.images);
          if (id) totalInserted++;
        } catch (itemErr: any) {
          console.error(`[Scraper] Error auto-extracting item ${item.link}:`, itemErr.message);
        }
      }
    } catch (srcErr: any) {
      errors.push(`Error scraping ${src.name}: ${srcErr.message}`);
    }
  }

  return {
    scrapedSources: sourcesToScrape.length,
    insertedArticles: totalInserted,
    errors,
  };
}

export async function extractFullArticleText(url: string, selector?: string): Promise<string | null> {
  const res = await scrapeFullArticle({} as any, url);
  return res.full_text || null;
}
