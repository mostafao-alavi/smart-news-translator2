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
  }> = [];

  const itemMatches = xmlText.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

  for (const itemXml of itemMatches) {
    try {
      // Extract title
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
      const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
      const title = cleanText(rawTitle);

      // Extract link
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

      // Extract GUID / externalId
      const guidMatch = itemXml.match(/<guid[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/guid>/i);
      const externalId = guidMatch ? (guidMatch[1] || guidMatch[2] || '').trim() : undefined;

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
          externalId,
        });
      }
    } catch {
      // Skip malformed item
    }
  }

  return items;
}

/**
 * 1. Scrapes Cointelegraph RSS feed and filters out already scraped articles
 */
export async function scrapeCointelegraph(env: Env): Promise<Array<{
  source_id: number;
  title: string;
  link: string;
  summary: string;
  published_at: string;
  featured_image?: string | null;
  external_id?: string;
  id?: number;
}>> {
  const rssUrl = 'https://cointelegraph.com/rss';
  console.log(`[Scraper] Fetching Cointelegraph RSS: ${rssUrl}`);

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Hazardastan-RSS/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching Cointelegraph RSS`);
    }

    const xmlText = await response.text();
    const items = parseRssXml(xmlText);
    console.log(`[Scraper] Parsed ${items.length} items from Cointelegraph RSS`);

    if (items.length === 0) return [];

    // Check existing in DB Primary
    const links = items.map(i => i.link);
    const placeholders = links.map(() => '?').join(',');

    let existingLinks = new Set<string>();

    if (env.DB) {
      try {
        const existingRes = await env.DB.prepare(
          `SELECT link FROM articles WHERE link IN (${placeholders})`
        ).bind(...links).all<{ link: string }>();

        existingLinks = new Set(existingRes.results?.map(r => r.link) || []);
      } catch (dbErr) {
        // Table might use original_url in legacy schema
        try {
          const legacyRes = await env.DB.prepare(
            `SELECT original_url FROM articles WHERE original_url IN (${placeholders})`
          ).bind(...links).all<{ original_url: string }>();
          existingLinks = new Set(legacyRes.results?.map(r => r.original_url) || []);
        } catch {}
      }
    }

    // Also check KV cache if available
    if (env.CACHE) {
      for (const item of items) {
        try {
          const cached = await env.CACHE.get(`rss_seen:${item.link}`);
          if (cached) existingLinks.add(item.link);
        } catch {}
      }
    }

    const newArticles = items
      .filter(item => !existingLinks.has(item.link))
      .slice(0, 10)
      .map(item => ({
        source_id: 1,
        title: item.title,
        link: item.link,
        summary: item.summary,
        published_at: item.publishedAt,
        featured_image: item.featuredImage,
        external_id: item.externalId || item.link,
      }));

    console.log(`[Scraper] Found ${newArticles.length} brand new articles to process`);
    return newArticles;
  } catch (err: any) {
    console.error(`[Scraper] Error fetching Cointelegraph RSS:`, err.message);
    return [];
  }
}

/**
 * 2. Downloads full article HTML and extracts structured text, markdown, author, and all images
 */
export async function scrapeFullArticle(env: Env, url: string): Promise<{
  full_text: string;
  html_content: string;
  author: string | null;
  images: Array<{ url: string; alt?: string; is_featured: number }>;
  featured_image: string | null;
}> {
  console.log(`[Scraper] Fetching full article text & media: ${url}`);

  const defaultResult = {
    full_text: '',
    html_content: '',
    author: null,
    images: [],
    featured_image: null,
  };

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CointelegraphReader/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) return defaultResult;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Author
    const author = $('[class*="author"], .post-meta__author, a[rel="author"], meta[name="author"]').first().text().trim() ||
      $('meta[name="author"]').attr('content') || null;

    // Extract Featured Image from meta tag or header
    let featuredImage = $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') || null;

    // Remove unwanted noise elements
    $('script, style, nav, footer, header, iframe, noscript, svg, form, button, .ad, .advertisement, .sidebar, [class*="ad-"]').remove();

    const targetSelector = 'article, .post-content, .entry-content, .article-content, [class*="post-body"], [class*="StoryBody"], main';
    const selectedElements = $(targetSelector);

    let contentHtml = '';
    if (selectedElements.length > 0) {
      selectedElements.each((_, el) => {
        contentHtml += $(el).html() + '\n\n';
      });
    } else {
      contentHtml = $('body').html() || '';
    }

    // Extract all images
    const images: Array<{ url: string; alt?: string; is_featured: number }> = [];
    const seenImageUrls = new Set<string>();

    if (featuredImage) {
      seenImageUrls.add(featuredImage);
      images.push({ url: featuredImage, alt: 'Featured Image', is_featured: 1 });
    }

    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset')?.split(' ')[0];
      const alt = $(el).attr('alt') || '';
      if (src && src.startsWith('http') && !seenImageUrls.has(src) && !src.includes('avatar') && !src.includes('logo')) {
        seenImageUrls.add(src);
        images.push({
          url: src,
          alt,
          is_featured: !featuredImage ? 1 : 0,
        });
        if (!featuredImage) featuredImage = src;
      }
    });

    // Convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    let markdown = turndownService.turndown(contentHtml);
    markdown = sanitizeContent(markdown);

    return {
      full_text: markdown.trim() || cleanText(contentHtml),
      html_content: contentHtml,
      author: author || 'Cointelegraph',
      images,
      featured_image: featuredImage,
    };
  } catch (err: any) {
    console.error(`[Scraper] Error scraping full article ${url}:`, err.message);
    return defaultResult;
  }
}

/**
 * 3. Saves article metadata, full content, and images into D1 Primary (`news_db`)
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

    // 1. Insert into articles (including featured_image)
    let articleId: number | null = null;

    try {
      const artRes = await env.DB.prepare(`
        INSERT INTO articles (source_id, external_id, title, link, summary, featured_image, published_at, scraped_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
      `).bind(
        article.source_id || 1,
        article.external_id || article.link,
        article.title,
        article.link,
        article.summary || '',
        featuredImg,
        article.published_at
      ).run();

      articleId = Number(artRes.meta?.last_row_id);
    } catch {
      // Fallback if table doesn't have external_id or uses original_url
      try {
        const altRes = await env.DB.prepare(`
          INSERT INTO articles (source_id, title, link, summary, featured_image, published_at, scraped_at, status)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
        `).bind(
          article.source_id || 1,
          article.title,
          article.link,
          article.summary || '',
          featuredImg,
          article.published_at
        ).run();
        articleId = Number(altRes.meta?.last_row_id);
      } catch {
        // Legacy schema fallback
        const legRes = await env.DB.prepare(`
          INSERT OR IGNORE INTO articles (source_id, original_url, title, content, featured_image, published_at, created_at, translation_status)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
        `).bind(
          article.source_id || 1,
          article.link,
          article.title,
          content.full_text || article.summary || '',
          featuredImg,
          article.published_at
        ).run();
        articleId = Number(legRes.meta?.last_row_id);
      }
    }

    if (!articleId) {
      // Try to select existing article ID by link
      const existing = await env.DB.prepare(
        'SELECT id FROM articles WHERE link = ? OR original_url = ?'
      ).bind(article.link, article.link).first<{ id: number }>();
      articleId = existing?.id || null;
    }

    if (!articleId) return null;

    // 2. Insert into article_contents
    if (content.full_text) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO article_contents (article_id, full_text, html_content, author, scraped_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
          articleId,
          content.full_text,
          content.html_content || null,
          content.author || 'Cointelegraph'
        ).run();
      } catch {}
    }

    // 3. Insert into article_images
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

    // 4. Update KV cache
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
 * General multi-source scraper for backwards compatibility
 */
export async function scraper(env: Env): Promise<{ scrapedSources: number; insertedArticles: number; errors: string[] }> {
  const cointelegraphArticles = await scrapeCointelegraph(env);
  let inserted = 0;

  for (const art of cointelegraphArticles) {
    const full = await scrapeFullArticle(env, art.link);
    const id = await saveArticle(env, art, full, full.images);
    if (id) inserted++;
  }

  return {
    scrapedSources: 1,
    insertedArticles: inserted,
    errors: [],
  };
}

export async function extractFullArticleText(url: string, selector?: string): Promise<string | null> {
  const res = await scrapeFullArticle({} as any, url);
  return res.full_text || null;
}
