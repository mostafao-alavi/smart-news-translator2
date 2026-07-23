import { Env, Source } from '../types';

/**
 * Lightweight XML tag extractor for RSS (<item>) and Atom (<entry>) feeds.
 */
function parseRssXml(xmlText: string) {
  const items: Array<{ title: string; link: string; content: string; publishedAt: string }> = [];

  // Match either <item>...</item> or <entry>...</entry>
  const itemMatches = xmlText.match(/<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi) || [];

  for (const itemXml of itemMatches) {
    try {
      // Extract title
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
      const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
      const title = cleanText(rawTitle);

      // Extract link/url
      let link = '';
      const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
      if (linkMatch) {
        link = (linkMatch[1] || linkMatch[2] || '').trim();
      } else {
        // Atom style link href attribute: <link href="..." />
        const hrefMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
        if (hrefMatch) {
          link = hrefMatch[1].trim();
        }
      }

      // Extract content or description
      const contentMatch = itemXml.match(/<(?:content:encoded|content|description)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:content:encoded|content|description)>/i);
      const rawContent = contentMatch ? (contentMatch[1] || contentMatch[2] || '') : '';
      const content = cleanText(rawContent);

      // Extract pubDate / updated
      const dateMatch = itemXml.match(/<(?:pubDate|published|updated|dc:date)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:pubDate|published|updated|dc:date)>/i);
      const rawDate = dateMatch ? (dateMatch[1] || dateMatch[2] || '') : '';
      const publishedAt = rawDate ? new Date(rawDate.trim()).toISOString() : new Date().toISOString();

      if (title && link) {
        items.push({
          title,
          link,
          content: content || title,
          publishedAt,
        });
      }
    } catch {
      // Skip invalid individual XML item
    }
  }

  return items;
}

/**
 * Remove HTML tags and unescape common XML entities
 */
function cleanText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cron scraper routine:
 * Fetches RSS feeds for all sources in D1 and saves articles with 'pending' status.
 */
export async function scraper(env: Env): Promise<{ scrapedSources: number; insertedArticles: number; errors: string[] }> {
  const errors: string[] = [];
  let insertedCount = 0;
  let sourcesCount = 0;

  try {
    // 1. Fetch all active sources from Cloudflare D1
    const { results: sources } = await env.DB.prepare(
      'SELECT id, name, url, language FROM sources'
    ).all<Source>();

    if (!sources || sources.length === 0) {
      return { scrapedSources: 0, insertedArticles: 0, errors: [] };
    }

    sourcesCount = sources.length;

    // 2. Process each RSS source inside try/catch block
    for (const source of sources) {
      try {
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'CloudflareNewsWorkerScraper/1.0 (RSS Aggregator Bot)',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
          },
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} when fetching ${source.url}`);
        }

        const xmlText = await response.text();
        const parsedArticles = parseRssXml(xmlText);

        for (const item of parsedArticles) {
          try {
            // INSERT OR IGNORE based on unique constraint on original_url
            const insertResult = await env.DB.prepare(`
              INSERT OR IGNORE INTO articles (
                source_id, 
                original_url, 
                title, 
                content, 
                published_at, 
                created_at, 
                translation_status
              ) VALUES (?, ?, ?, ?, ?, datetime('now'), 'pending')
            `).bind(
              source.id,
              item.link,
              item.title,
              item.content,
              item.publishedAt
            ).run();

            if (insertResult.meta.changes > 0) {
              insertedCount++;
            }
          } catch (insertError: any) {
            // Ignore single row insert failures
          }
        }
      } catch (sourceErr: any) {
        // Catch error for specific source so that remaining sources continue processing
        errors.push(`Error scraping source "${source.name}" (${source.url}): ${sourceErr.message}`);
      }
    }
  } catch (globalErr: any) {
    errors.push(`Global scraper error: ${globalErr.message}`);
  }

  return {
    scrapedSources: sourcesCount,
    insertedArticles: insertedCount,
    errors,
  };
}
