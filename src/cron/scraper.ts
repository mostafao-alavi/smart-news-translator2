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
 * 1. Scrapes Cointelegraph RSS feed focusing on Latest News and ingests all available items
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
  const rssUrl = 'https://cointelegraph.com/rss';
  const limit = options?.maxItems || 30;
  console.log(`[Scraper] Fetching Cointelegraph RSS: ${rssUrl} (Targeting Latest News, max ${limit})`);

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Hazardastan-RSS/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching Cointelegraph RSS`);
    }

    const xmlText = await response.text();
    const allItems = parseRssXml(xmlText);
    console.log(`[Scraper] Parsed ${allItems.length} total items from Cointelegraph RSS`);

    if (allItems.length === 0) return [];

    // Filter strictly for "Latest News" (or /news/ path which corresponds to latest news)
    const latestNewsItems = allItems.filter(item => {
      const cat = (item.category || '').toLowerCase().trim();
      const isLatestCat = cat.includes('latest') || cat === 'latest news' || cat === 'news';
      const isNewsPath = item.link.includes('/news/');
      return isLatestCat || isNewsPath || !cat;
    });

    const itemsToProcess = latestNewsItems.length > 0 ? latestNewsItems : allItems;
    console.log(`[Scraper] Found ${itemsToProcess.length} "latest-news" items in feed`);

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
        source_id: 1,
        title: item.title,
        link: item.link,
        summary: item.summary,
        published_at: item.publishedAt,
        featured_image: item.featuredImage,
        external_id: item.externalId || item.link,
      }));

    console.log(`[Scraper] Found ${newArticles.length} brand new latest-news articles to process`);
    return newArticles;
  } catch (err: any) {
    console.error(`[Scraper] Error fetching Cointelegraph RSS:`, err.message);
    return [];
  }
}

/**
 * 2. Downloads full article HTML from the web page and extracts clean structured body text, author, and media
 */
export async function scrapeFullArticle(env: Env, url: string): Promise<{
  full_text: string;
  html_content: string;
  author: string | null;
  images: Array<{ url: string; alt?: string; is_featured: number }>;
  featured_image: string | null;
}> {
  console.log(`[Scraper] Fetching full article webpage from URL: ${url}`);

  const defaultResult = {
    full_text: '',
    html_content: '',
    author: null,
    images: [],
    featured_image: null,
  };

  if (!url || !url.startsWith('http')) return defaultResult;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CointelegraphNewsReader/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(14000),
    });

    if (!response.ok) {
      console.warn(`[Scraper] Webpage HTTP ${response.status} for ${url}`);
      return defaultResult;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Author
    const author = $('meta[name="author"]').attr('content') ||
      $('[data-testid="author-link"], .post-meta__author, a[rel="author"], [class*="author-link"]').first().text().trim() ||
      $('[class*="author"]').first().text().trim() ||
      'Cointelegraph';

    // Extract Featured Image from OpenGraph / Twitter meta tags
    let featuredImage = $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content') ||
      null;

    // Target Cointelegraph main content container
    // Cointelegraph uses .post-content, div.post-content, article, [class*="post-content_"]
    let $container = $('.post-content, [class*="post-content_"], .post__content, article .post-content').first();
    if ($container.length === 0) {
      $container = $('article').first();
    }
    if ($container.length === 0) {
      $container = $('[class*="post-body"], [class*="StoryBody"], main').first();
    }
    if ($container.length === 0) {
      $container = $('body');
    }

    // Clone container to clean without destroying original
    const $body = $container.clone();

    // 1. Remove all noise, scripts, ads, social bars, and trackers
    $body.find([
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '[data-testid="ad-slot"]', '.ad', '.advertisement', '[class*="ad-"]', '[class*="banner"]', '[class*="banner_"]',
      '[class*="social"]', '[class*="share"]', '[class*="reaction"]', '[class*="post-actions"]', '[class*="actions_"]',
      '[class*="related-articles"]', '[class*="related-posts"]', '[class*="related_"]', '[class*="recommended-"]',
      '[class*="newsletter"]', '[class*="promo"]', '[class*="subscribe"]', '[class*="podcast"]', '[class*="telegram-widget"]',
      '[class*="audio-player"]', '[class*="podcast-player"]', '[class*="player_"]',
      '[class*="disclaimer"]', '[class*="disclosure"]', '[class*="terms"]',
      '[class*="ticker"]', '[class*="coin-index"]', '[class*="price-index"]',
      '[class*="author-block"]', '[class*="post-meta"]', '[class*="post-header"]'
    ].join(', ')).remove();

    // 2. Extract Lead / Key Takeaway paragraph if present
    const leadText = $('.post__lead, [class*="post__lead"], [class*="post-lead"], [data-testid="post-lead"]').first().text().trim();

    // 3. Extract Clean Paragraphs and Structure
    const cleanParagraphs: string[] = [];
    if (leadText && leadText.length > 25) {
      cleanParagraphs.push(leadText);
    }

    $body.find('p, h2, h3, blockquote, ul').each((_, el) => {
      const tagName = el.tagName?.toLowerCase();
      const text = $(el).text().trim();

      if (!text || text.length < 6) return;

      // Filter out unwanted noise lines for Cointelegraph
      const lower = text.toLowerCase();
      if (
        lower.startsWith('related:') ||
        lower.startsWith('related :') ||
        lower.startsWith('read more:') ||
        lower.startsWith('magazine:') ||
        lower.startsWith('disclaimer:') ||
        lower.includes('produced in accordance with') ||
        lower.includes('does not contain investment advice') ||
        lower.includes('subscribe to our newsletter') ||
        lower.includes('follow us on telegram') ||
        lower.includes('follow us on x') ||
        lower.includes('follow us on twitter') ||
        lower.startsWith('source:') ||
        lower.includes('all rights reserved')
      ) {
        return;
      }

      if (tagName === 'h2') {
        cleanParagraphs.push(`## ${text}`);
      } else if (tagName === 'h3') {
        cleanParagraphs.push(`### ${text}`);
      } else if (tagName === 'blockquote') {
        cleanParagraphs.push(`> ${text}`);
      } else if (tagName === 'ul') {
        const items: string[] = [];
        $(el).find('li').each((_, li) => {
          const liText = $(li).text().trim();
          if (liText && !liText.toLowerCase().includes('related')) {
            items.push(`* ${liText}`);
          }
        });
        if (items.length > 0) {
          cleanParagraphs.push(items.join('\n'));
        }
      } else {
        // Skip duplicate of leadText
        if (leadText && text === leadText) return;
        cleanParagraphs.push(text);
      }
    });

    let fullText = cleanParagraphs.join('\n\n').trim();

    // Fallback using Turndown if paragraph extraction was too short
    const contentHtml = $body.html() || '';
    if (fullText.length < 80 && contentHtml.length > 0) {
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      let markdown = turndownService.turndown(contentHtml);
      markdown = sanitizeContent(markdown);
      fullText = markdown.trim() || cleanText(contentHtml);
    }

    // 4. Extract all image references (Image URL and metadata only, no file storage)
    const images: Array<{ url: string; alt?: string; is_featured: number }> = [];
    const seenImageUrls = new Set<string>();

    if (featuredImage) {
      seenImageUrls.add(featuredImage);
      images.push({ url: featuredImage, alt: 'Featured Image', is_featured: 1 });
    }

    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset')?.split(' ')[0];
      const alt = $(el).attr('alt') || '';
      if (
        src &&
        src.startsWith('http') &&
        !seenImageUrls.has(src) &&
        !src.includes('avatar') &&
        !src.includes('logo') &&
        !src.includes('icon') &&
        !src.includes('badge')
      ) {
        seenImageUrls.add(src);
        images.push({
          url: src,
          alt: alt.trim() || 'Article Image',
          is_featured: !featuredImage ? 1 : 0,
        });
        if (!featuredImage) featuredImage = src;
      }
    });

    console.log(`[Scraper] Extracted clean text (${fullText.length} chars, ${images.length} images) from ${url}`);

    return {
      full_text: fullText,
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
 * 3. Saves article metadata, full webpage text, and images into D1 Primary (`news_db`)
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
    const fullTextBody = (content.full_text || article.summary || article.title).trim();
    const shortSummary = (article.summary || content.full_text.slice(0, 300) || article.title).trim();

    // 1. Check if article already exists in DB by link or original_url
    let articleId: number | null = null;
    try {
      const existing = await env.DB.prepare(
        'SELECT id, content FROM articles WHERE link = ? OR original_url = ?'
      ).bind(article.link, article.link).first<{ id: number; content?: string }>();

      if (existing) {
        articleId = existing.id;
        // Update content and featured_image if we now have full text
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

    // 3. Insert or update article_contents table
    if (fullTextBody) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO article_contents (article_id, full_text, html_content, author, scraped_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
          articleId,
          fullTextBody,
          content.html_content || null,
          content.author || 'Cointelegraph'
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
