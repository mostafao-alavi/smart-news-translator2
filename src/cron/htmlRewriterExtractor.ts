import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

export interface CleaningRules {
  removeSelectors: string[];
  noiseTextPatterns: string[];
  preserveHeadings: boolean;
  preserveLists: boolean;
  preserveQuotes: boolean;
  minParagraphLength: number;
}

export const DEFAULT_CLEANING_RULES: CleaningRules = {
  removeSelectors: [
    // Scripts, styles, and embed frames
    'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
    // Advertisements & Sponsoring
    '[data-testid="ad-slot"]', '.ad', '.advertisement', '[class*="ad-"]', '[class*="banner"]', '[class*="banner_"]', '[class*="sponsor"]',
    // Social share bars & action rows
    '[class*="social"]', '[class*="share"]', '[class*="reaction"]', '[class*="post-actions"]', '[class*="actions_"]',
    // Related articles & recommendations
    '[class*="related-articles"]', '[class*="related-posts"]', '[class*="related_"]', '[class*="recommended-"]', '[class*="read-more"]',
    // Subscriptions, Newsletters, Podcasts
    '[class*="newsletter"]', '[class*="promo"]', '[class*="subscribe"]', '[class*="podcast"]', '[class*="telegram-widget"]',
    '[class*="audio-player"]', '[class*="podcast-player"]', '[class*="player_"]',
    // Disclaimers, Terms, Financial disclosures
    '[class*="disclaimer"]', '[class*="disclosure"]', '[class*="terms"]',
    // Price Tickers & Indices
    '[class*="ticker"]', '[class*="coin-index"]', '[class*="price-index"]',
    // Author Bio & Metadata headers
    '[class*="author-block"]', '[class*="post-meta"]', '[class*="post-header"]'
  ],
  noiseTextPatterns: [
    'related:',
    'related :',
    'read more:',
    'magazine:',
    'disclaimer:',
    'produced in accordance with',
    'does not contain investment advice',
    'subscribe to our newsletter',
    'follow us on telegram',
    'follow us on x',
    'follow us on twitter',
    'source:',
    'all rights reserved',
    'join our community'
  ],
  preserveHeadings: true,
  preserveLists: true,
  preserveQuotes: true,
  minParagraphLength: 10,
};

export interface ExtractedArticleResult {
  url: string;
  title: string | null;
  author: string | null;
  featured_image: string | null;
  lead_text: string | null;
  full_text: string;
  paragraphs: string[];
  headings: string[];
  images: Array<{ url: string; alt?: string; is_featured: number }>;
  stats: {
    char_count: number;
    word_count: number;
    paragraph_count: number;
    heading_count: number;
    image_count: number;
    removed_noise_count: number;
  };
  html_content?: string;
  engine_used: 'cloudflare_htmlrewriter' | 'cheerio_dom';
}

/**
 * Clean and normalize text, removing excessive spaces and special entities
 */
export function cleanRawText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filter out noisy lines that match blacklisted patterns
 */
export function isNoiseLine(line: string, patterns: string[]): boolean {
  if (!line || line.trim().length === 0) return true;
  const lower = line.toLowerCase().trim();
  return patterns.some(pattern => lower.startsWith(pattern) || lower.includes(pattern));
}

/**
 * Cloudflare HTMLRewriter Implementation for Edge Worker runtime
 */
export async function extractWithCloudflareHTMLRewriter(
  htmlText: string,
  url: string,
  customRules?: Partial<CleaningRules>
): Promise<ExtractedArticleResult | null> {
  // Check if Cloudflare HTMLRewriter global exists in environment
  if (typeof (globalThis as any).HTMLRewriter === 'undefined') {
    return null;
  }

  const rules: CleaningRules = { ...DEFAULT_CLEANING_RULES, ...customRules };
  let title = '';
  let author = '';
  let featuredImage = '';
  let leadText = '';
  const paragraphs: string[] = [];
  const headings: string[] = [];
  const images: Array<{ url: string; alt?: string; is_featured: number }> = [];
  let removedNoiseCount = 0;

  try {
    let currentParagraphText = '';
    let currentHeadingText = '';
    let isInsideNoiseElement = 0;

    const rewriter = new (globalThis as any).HTMLRewriter()
      // Title
      .on('meta[property="og:title"]', {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !title) title = cleanRawText(val);
        }
      })
      .on('title', {
        text(textChunk: any) {
          if (!title) title += textChunk.text;
        }
      })
      // Author
      .on('meta[name="author"]', {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !author) author = cleanRawText(val);
        }
      })
      // Featured Image
      .on('meta[property="og:image"]', {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !featuredImage) featuredImage = val;
        }
      })
      .on('meta[name="twitter:image"]', {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !featuredImage) featuredImage = val;
        }
      })
      // Lead / Key Takeaways
      .on('.post__lead, [class*="post__lead"], [class*="post-lead"]', {
        text(textChunk: any) {
          leadText += textChunk.text;
        }
      });

    // Remove noise selector handlers
    for (const selector of rules.removeSelectors) {
      rewriter.on(selector, {
        element(el: any) {
          removedNoiseCount++;
          el.remove();
        }
      });
    }

    // Article Content extraction
    rewriter
      .on('article p, .post-content p, [class*="post-content_"] p, main p', {
        element() {
          currentParagraphText = '';
        },
        text(textChunk: any) {
          currentParagraphText += textChunk.text;
        },
        elementEnd() {
          const cleanP = cleanRawText(currentParagraphText);
          if (cleanP.length >= rules.minParagraphLength && !isNoiseLine(cleanP, rules.noiseTextPatterns)) {
            paragraphs.push(cleanP);
          }
        }
      })
      .on('article h2, article h3, .post-content h2, .post-content h3', {
        element() {
          currentHeadingText = '';
        },
        text(textChunk: any) {
          currentHeadingText += textChunk.text;
        },
        elementEnd(el: any) {
          const cleanH = cleanRawText(currentHeadingText);
          if (cleanH.length >= 3 && !isNoiseLine(cleanH, rules.noiseTextPatterns)) {
            const prefix = el.tagName === 'h3' ? '###' : '##';
            headings.push(`${prefix} ${cleanH}`);
            paragraphs.push(`${prefix} ${cleanH}`);
          }
        }
      })
      .on('article img, .post-content img, [class*="post-content_"] img', {
        element(el: any) {
          const src = el.getAttribute('src') || el.getAttribute('data-src');
          const alt = el.getAttribute('alt') || '';
          if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo')) {
            images.push({ url: src, alt: alt.trim(), is_featured: images.length === 0 ? 1 : 0 });
            if (!featuredImage) featuredImage = src;
          }
        }
      });

    const response = new Response(htmlText, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

    const transformed = rewriter.transform(response);
    await transformed.text(); // Consume stream to trigger all element handlers

    // Format full clean text
    const cleanLead = cleanRawText(leadText);
    const allTextBlocks = cleanLead && cleanLead.length > 20 && !paragraphs.includes(cleanLead)
      ? [cleanLead, ...paragraphs]
      : paragraphs;

    const fullText = allTextBlocks.join('\n\n').trim();

    return {
      url,
      title: title ? cleanRawText(title) : null,
      author: author ? cleanRawText(author) : 'Cointelegraph',
      featured_image: featuredImage || null,
      lead_text: cleanLead || null,
      full_text: fullText,
      paragraphs: allTextBlocks,
      headings,
      images,
      stats: {
        char_count: fullText.length,
        word_count: fullText ? fullText.split(/\s+/).length : 0,
        paragraph_count: allTextBlocks.length,
        heading_count: headings.length,
        image_count: images.length,
        removed_noise_count: removedNoiseCount,
      },
      engine_used: 'cloudflare_htmlrewriter',
    };
  } catch (err: any) {
    console.warn('[HTMLRewriter] Fallback to Cheerio parser due to error:', err.message);
    return null;
  }
}

/**
 * Universal Cheerio / DOM Implementation (used in Node, dev, or as robust fallback)
 */
export function extractWithCheerioDom(
  htmlText: string,
  url: string,
  customRules?: Partial<CleaningRules>
): ExtractedArticleResult {
  const rules: CleaningRules = { ...DEFAULT_CLEANING_RULES, ...customRules };
  const $ = cheerio.load(htmlText);

  // 1. Extract Metadata (Title, Author, Images)
  const title = $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    null;

  const author = $('meta[name="author"]').attr('content') ||
    $('[data-testid="author-link"], .post-meta__author, a[rel="author"], [class*="author-link"]').first().text().trim() ||
    $('[class*="author"]').first().text().trim() ||
    'Cointelegraph';

  let featuredImage = $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[name="twitter:image:src"]').attr('content') ||
    null;

  // 2. Target Container
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

  const $body = $container.clone();

  // 3. Remove all blacklisted noise selectors
  let removedNoiseCount = 0;
  for (const selector of rules.removeSelectors) {
    const found = $body.find(selector);
    removedNoiseCount += found.length;
    found.remove();
  }

  // 4. Extract Lead Text / Key Takeaway
  const leadText = cleanRawText(
    $('.post__lead, [class*="post__lead"], [class*="post-lead"], [data-testid="post-lead"]').first().text()
  );

  // 5. Extract Paragraphs, Headings, Lists, Quotes
  const paragraphs: string[] = [];
  const headings: string[] = [];

  if (leadText && leadText.length > 20) {
    paragraphs.push(leadText);
  }

  $body.find('p, h2, h3, blockquote, ul, ol').each((_, el) => {
    const tagName = el.tagName?.toLowerCase();
    const rawContent = $(el).text();
    const cleanText = cleanRawText(rawContent);

    if (!cleanText || cleanText.length < rules.minParagraphLength) return;
    if (isNoiseLine(cleanText, rules.noiseTextPatterns)) return;

    if (tagName === 'h2' && rules.preserveHeadings) {
      headings.push(`## ${cleanText}`);
      paragraphs.push(`## ${cleanText}`);
    } else if (tagName === 'h3' && rules.preserveHeadings) {
      headings.push(`### ${cleanText}`);
      paragraphs.push(`### ${cleanText}`);
    } else if (tagName === 'blockquote' && rules.preserveQuotes) {
      paragraphs.push(`> ${cleanText}`);
    } else if ((tagName === 'ul' || tagName === 'ol') && rules.preserveLists) {
      const items: string[] = [];
      $(el).find('li').each((_, li) => {
        const liText = cleanRawText($(li).text());
        if (liText && !isNoiseLine(liText, rules.noiseTextPatterns)) {
          items.push(`* ${liText}`);
        }
      });
      if (items.length > 0) {
        paragraphs.push(items.join('\n'));
      }
    } else {
      // Regular paragraph: Avoid duplicate lead
      if (leadText && cleanText === leadText) return;
      paragraphs.push(cleanText);
    }
  });

  let fullText = paragraphs.join('\n\n').trim();

  // Fallback to Turndown markdown if paragraph extraction yields very short text
  const contentHtml = $body.html() || '';
  if (fullText.length < 100 && contentHtml.length > 0) {
    try {
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      const markdown = turndownService.turndown(contentHtml);
      fullText = cleanRawText(markdown);
    } catch {}
  }

  // 6. Extract Images
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

  return {
    url,
    title: title ? cleanRawText(title) : null,
    author: author ? cleanRawText(author) : 'Cointelegraph',
    featured_image: featuredImage,
    lead_text: leadText || null,
    full_text: fullText,
    paragraphs,
    headings,
    images,
    stats: {
      char_count: fullText.length,
      word_count: fullText ? fullText.split(/\s+/).length : 0,
      paragraph_count: paragraphs.length,
      heading_count: headings.length,
      image_count: images.length,
      removed_noise_count: removedNoiseCount,
    },
    html_content: contentHtml,
    engine_used: 'cheerio_dom',
  };
}

/**
 * Primary Unified Extractor: Runs Cloudflare HTMLRewriter when in Workers environment,
 * or Cheerio DOM parser in Node / fallback environment.
 */
export async function extractArticleFullText(
  url: string,
  customRules?: Partial<CleaningRules>
): Promise<ExtractedArticleResult> {
  console.log(`[FullTextExtractor] Fetching HTML from ${url}...`);

  const emptyResult: ExtractedArticleResult = {
    url,
    title: null,
    author: null,
    featured_image: null,
    lead_text: null,
    full_text: '',
    paragraphs: [],
    headings: [],
    images: [],
    stats: {
      char_count: 0,
      word_count: 0,
      paragraph_count: 0,
      heading_count: 0,
      image_count: 0,
      removed_noise_count: 0,
    },
    engine_used: 'cheerio_dom',
  };

  if (!url || !url.startsWith('http')) return emptyResult;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CointelegraphNewsReader/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[FullTextExtractor] HTTP ${response.status} when fetching ${url}`);
      return emptyResult;
    }

    const htmlText = await response.text();

    // 1. Try Cloudflare HTMLRewriter if in Workers
    const cfResult = await extractWithCloudflareHTMLRewriter(htmlText, url, customRules);
    if (cfResult && cfResult.full_text.length >= 80) {
      console.log(`[FullTextExtractor] Successfully extracted with Cloudflare HTMLRewriter (${cfResult.stats.char_count} chars)`);
      return cfResult;
    }

    // 2. Use Cheerio DOM Parser
    const domResult = extractWithCheerioDom(htmlText, url, customRules);
    console.log(`[FullTextExtractor] Extracted with Cheerio DOM (${domResult.stats.char_count} chars, ${domResult.stats.paragraph_count} paragraphs)`);
    return domResult;
  } catch (err: any) {
    console.error(`[FullTextExtractor] Error extracting from ${url}:`, err.message);
    return emptyResult;
  }
}
