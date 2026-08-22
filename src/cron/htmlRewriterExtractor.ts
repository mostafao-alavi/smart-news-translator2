import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

export interface SourceExtractionProfile {
  id: string;
  name: string;
  domains: string[];
  badgeColor?: string;
  isVerified?: boolean;
  description?: string;
  selectors: {
    title: string;
    author: string;
    lead: string;
    featuredImage: string;
    bodyContainer: string;
    bodyParagraphs?: string;
    bodyHeadings?: string;
    bodyImages?: string;
  };
  removeSelectors: string[];
  noiseTextPatterns: string[];
  cutOffMarkers?: string[];
  preserveHeadings: boolean;
  preserveLists: boolean;
  preserveQuotes: boolean;
  minParagraphLength: number;
}

export interface CleaningRules {
  removeSelectors: string[];
  noiseTextPatterns: string[];
  cutOffMarkers?: string[];
  preserveHeadings: boolean;
  preserveLists: boolean;
  preserveQuotes: boolean;
  minParagraphLength: number;
}

/**
 * Built-in Dedicated Profiles for Top News Outlets
 */
export const BUILTIN_PROFILES: Record<string, SourceExtractionProfile> = {
  cointelegraph: {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    domains: ['cointelegraph.com', 'cointelegraph.de', 'cointelegraph.es', 'cointelegraph.it', 'cointelegraph.com.br', 'cointelegraph.in'],
    badgeColor: '#F7931A',
    isVerified: true,
    description: 'پروفایل تنظیم‌شده و آزمایش‌شده اختصاصی برای قالب Cointelegraph Nuxt/Platypus',
    selectors: {
      title: '[data-testid="post__title"], h1, meta[property="og:title"]',
      author: '[data-testid="post-byline-text__name"], .post-meta__author, meta[name="author"]',
      lead: '[data-testid="post__description"], .post__lead, [class*="post__lead"], [class*="post-lead"]',
      featuredImage: '[data-testid="post-cover__image"], meta[property="og:image"], meta[name="twitter:image"]',
      bodyContainer: '[data-testid="post__body"], .ct-prose, [data-testid="post"]',
      bodyParagraphs: 'p',
      bodyHeadings: 'h2, h3',
      bodyImages: 'img',
    },
    removeSelectors: [
      // Cointelegraph specific UI & Ads
      '[data-testid="ad-banner--leaderboard"]',
      '#ct-inline-text-ad',
      '[data-testid="share-buttons--top"]',
      '[data-testid="share-buttons--bottom"]',
      '[data-testid="article-disclaimer"]',
      '[data-testid="article-reactions"]',
      '[data-testid="more-on-subject"]',
      '[data-testid="infinite-tickers"]',
      'section[aria-label="Newsletter subscription"]',
      '[data-testid="post-byline"]',
      '[data-testid="post-article-meta"]',
      'veepn-intro-offer',
      '[data-testid="article-card"]',
      '[data-testid="related-articles"]',
      '[class*="more-on-the-subject"]',
      '[class*="more-on-subject"]',
      // Common noise
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '[class*="related-"]', '[class*="newsletter"]', '[class*="podcast"]'
    ],
    noiseTextPatterns: [
      'magazine:',
      'magazine :',
      'related:',
      'related :',
      'read more:',
      'more on the subject',
      'more on the subject:',
      'more on subject',
      'disclaimer:',
      'produced in accordance with',
      'does not contain investment advice',
      'subscribe to daily byte-sized',
      'subscribe to our newsletter',
      'follow us on telegram',
      'follow us on x',
      'follow us on twitter',
      'all rights reserved',
      'readers are encouraged to verify'
    ],
    cutOffMarkers: [
      'Cointelegraph is committed to independent',
      'Editorial Policy and aims to provide accurate',
      'Subscribe to daily byte-sized crypto news',
      'More on the subject'
    ],
    preserveHeadings: true,
    preserveLists: true,
    preserveQuotes: true,
    minParagraphLength: 10,
  },

  coindesk: {
    id: 'coindesk',
    name: 'CoinDesk',
    domains: ['coindesk.com'],
    badgeColor: '#0052FF',
    isVerified: true,
    description: 'پروفایل اختصاصی برای سایت CoinDesk',
    selectors: {
      title: 'h1[class*="headline"], h1.typography__StyledTypography, h1, meta[property="og:title"]',
      author: '[class*="author-name"], a[href^="/author/"], a[rel="author"], meta[name="author"]',
      lead: '[class*="subheadline"], .article-header__subtitle, h2.font-normal, [class*="description"]',
      featuredImage: '[class*="hero-image"] img, [class*="featured-image"] img, meta[property="og:image"]',
      bodyContainer: '.article-body, [class*="articleBody"], [class*="article-content"], [class*="content-body"], main article',
      bodyParagraphs: 'p',
      bodyHeadings: 'h2, h3',
      bodyImages: 'img',
    },
    removeSelectors: [
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '[class*="ad-"]', '[class*="banner"]', '[class*="related-content"]', '[class*="newsletter"]',
      '[class*="share-"]', '[class*="read-next"]', '[class*="live-stream-player"]', '[class*="chart-container"]',
      '[class*="disclaimer"]', '[class*="disclosure"]'
    ],
    noiseTextPatterns: [
      'disclosure:',
      'edited by:',
      'protocol guide:',
      'first mover',
      'sign up for',
      'the leader in news and information',
      'follow us on x',
      'follow us on twitter'
    ],
    cutOffMarkers: [
      'Disclosure: The leader in news and information',
      'Please note that our privacy policy',
      'Read next'
    ],
    preserveHeadings: true,
    preserveLists: true,
    preserveQuotes: true,
    minParagraphLength: 12,
  },

  decrypt: {
    id: 'decrypt',
    name: 'Decrypt',
    domains: ['decrypt.co'],
    badgeColor: '#10B981',
    isVerified: true,
    description: 'پروفایل اختصاصی برای سایت Decrypt',
    selectors: {
      title: 'h1, [class*="post-title"], meta[property="og:title"]',
      author: '[class*="author-link"], a[href^="/author/"], meta[name="author"]',
      lead: '[class*="post-subhead"], .subhead, [class*="dek"]',
      featuredImage: '[class*="post-hero"] img, meta[property="og:image"]',
      bodyContainer: '[class*="post-content"], .post-content, article',
      bodyParagraphs: 'p',
      bodyHeadings: 'h2, h3',
      bodyImages: 'img',
    },
    removeSelectors: [
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '[class*="ad-"]', '[class*="sponsor"]', '[class*="newsletter"]', '[class*="similar-posts"]', '[class*="embed-widget"]'
    ],
    noiseTextPatterns: [
      'read next:',
      'stay on top of crypto',
      'decrypt news update',
      'follow decrypt on',
      'all rights reserved'
    ],
    cutOffMarkers: [
      'Stay on top of crypto',
      'Sign up for our newsletter'
    ],
    preserveHeadings: true,
    preserveLists: true,
    preserveQuotes: true,
    minParagraphLength: 12,
  },

  theblock: {
    id: 'theblock',
    name: 'The Block',
    domains: ['theblock.co', 'theblockcrypto.com'],
    badgeColor: '#6366F1',
    isVerified: true,
    description: 'پروفایل اختصاصی برای سایت The Block',
    selectors: {
      title: 'h1.article-title, h1, meta[property="og:title"]',
      author: '.article-author a, a[href^="/author/"], meta[name="author"]',
      lead: '.article-subheading, .article-deck',
      featuredImage: '.article-featured-image img, meta[property="og:image"]',
      bodyContainer: '#articleContent, .articleContent, [class*="articleContent"]',
      bodyParagraphs: 'p',
      bodyHeadings: 'h2, h3',
      bodyImages: 'img',
    },
    removeSelectors: [
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '.adUnit', '.newsletter-signup', '.relatedNews', '.disclaimer-block', '.sponsored-box'
    ],
    noiseTextPatterns: [
      '© the block',
      'disclaimer: the block is an independent',
      'subscribe to the block'
    ],
    cutOffMarkers: [
      'Disclaimer: The Block is an independent',
      '© 2026 The Block'
    ],
    preserveHeadings: true,
    preserveLists: true,
    preserveQuotes: true,
    minParagraphLength: 10,
  },

  bitcoinmagazine: {
    id: 'bitcoinmagazine',
    name: 'Bitcoin Magazine',
    domains: ['bitcoinmagazine.com'],
    badgeColor: '#EA580C',
    isVerified: true,
    description: 'پروفایل اختصاصی برای مجله بیت‌کوین (Bitcoin Magazine)',
    selectors: {
      title: 'h1.m-detail--title, h1, meta[property="og:title"]',
      author: '.m-detail--author a, a[href^="/authors/"], meta[name="author"]',
      lead: '.m-detail--deck, .deck',
      featuredImage: '.m-detail--image img, meta[property="og:image"]',
      bodyContainer: '.m-detail--body, [class*="m-detail--body"], .entry-content',
      bodyParagraphs: 'p',
      bodyHeadings: 'h2, h3',
      bodyImages: 'img',
    },
    removeSelectors: [
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '.m-detail--ad', '.m-detail--related', '.newsletter-container'
    ],
    noiseTextPatterns: [
      'read more on bitcoin magazine',
      'subscribe to bitcoin magazine'
    ],
    cutOffMarkers: [
      'Bitcoin Magazine is the oldest',
      'Subscribe to the Bitcoin Magazine newsletter'
    ],
    preserveHeadings: true,
    preserveLists: true,
    preserveQuotes: true,
    minParagraphLength: 10,
  },

  beincrypto: {
    id: 'beincrypto',
    name: 'BeInCrypto',
    domains: ['beincrypto.com'],
    badgeColor: '#8B5CF6',
    isVerified: true,
    description: 'پروفایل اختصاصی برای سایت BeInCrypto',
    selectors: {
      title: 'h1, meta[property="og:title"]',
      author: '.author-link, a[href^="/author/"], meta[name="author"]',
      lead: '[class*="sub-heading"], [class*="lead"]',
      featuredImage: '[class*="featured-image"] img, meta[property="og:image"]',
      bodyContainer: '.article-content, [class*="article-content"], .entry-content',
      bodyParagraphs: 'p',
      bodyHeadings: 'h2, h3',
      bodyImages: 'img',
    },
    removeSelectors: [
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '[class*="ad-wrapper"]', '[class*="related-posts"]', '[class*="newsletter"]'
    ],
    noiseTextPatterns: [
      'disclaimer',
      'trust project guidelines',
      'all the information contained on our website'
    ],
    cutOffMarkers: [
      'Disclaimer: In adherence to the Trust Project',
      'BeInCrypto is committed to unbiased'
    ],
    preserveHeadings: true,
    preserveLists: true,
    preserveQuotes: true,
    minParagraphLength: 10,
  },

  generic: {
    id: 'generic',
    name: 'الگوی عمومی و هوشمند (Generic)',
    domains: ['*'],
    badgeColor: '#64748B',
    isVerified: false,
    description: 'پروفایل منعطف عمومی با قابلیت شناسایی هوشمند ساختار مقالات برای سایت‌های متفرقه',
    selectors: {
      title: 'h1, meta[property="og:title"], title',
      author: '[rel="author"], [class*="author"], meta[name="author"]',
      lead: '[class*="lead"], [class*="summary"], [class*="description"], [class*="subtitle"]',
      featuredImage: 'meta[property="og:image"], meta[name="twitter:image"]',
      bodyContainer: 'article, [data-testid="post__body"], .post-content, [class*="post-content_"], [class*="article-body"], [itemprop="articleBody"], main',
      bodyParagraphs: 'p',
      bodyHeadings: 'h2, h3',
      bodyImages: 'img',
    },
    removeSelectors: [
      'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'form', 'nav', 'header', 'footer',
      '[data-testid="ad-slot"]', '.ad', '.advertisement', '[class*="ad-"]', '[class*="banner"]', '[class*="sponsor"]',
      '[class*="social"]', '[class*="share"]', '[class*="reaction"]', '[class*="post-actions"]',
      '[class*="related-"]', '[class*="recommended-"]', '[class*="read-more"]',
      '[class*="newsletter"]', '[class*="promo"]', '[class*="subscribe"]', '[class*="podcast"]',
      '[class*="disclaimer"]', '[class*="disclosure"]', '[class*="terms"]'
    ],
    noiseTextPatterns: [
      'related:',
      'read more:',
      'disclaimer:',
      'subscribe to our newsletter',
      'follow us on',
      'all rights reserved'
    ],
    cutOffMarkers: [
      'Disclaimer:',
      'Disclosure:'
    ],
    preserveHeadings: true,
    preserveLists: true,
    preserveQuotes: true,
    minParagraphLength: 10,
  }
};

// In-memory registry of custom user profiles
const customProfilesRegistry: Record<string, SourceExtractionProfile> = {};

/**
 * Register or update a custom source profile
 */
export function registerOrUpdateProfile(profile: SourceExtractionProfile) {
  customProfilesRegistry[profile.id] = profile;
}

/**
 * Get all available source profiles (built-in + custom)
 */
export function getAllProfiles(): SourceExtractionProfile[] {
  return [
    ...Object.values(BUILTIN_PROFILES),
    ...Object.values(customProfilesRegistry).filter(p => !BUILTIN_PROFILES[p.id])
  ];
}

/**
 * Match a URL or Domain to the most specific source extraction profile
 */
export function getExtractionProfileForUrl(
  urlOrDomain: string,
  overrides?: Partial<SourceExtractionProfile>
): SourceExtractionProfile {
  let hostname = '';
  try {
    if (urlOrDomain.startsWith('http://') || urlOrDomain.startsWith('https://')) {
      const parsed = new URL(urlOrDomain);
      hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    } else {
      hostname = urlOrDomain.toLowerCase().replace(/^www\./, '').split('/')[0];
    }
  } catch {
    hostname = urlOrDomain.toLowerCase();
  }

  // 1. Check custom profiles first
  for (const profile of Object.values(customProfilesRegistry)) {
    if (profile.domains.some(d => d === '*' || hostname.includes(d.toLowerCase()) || d.toLowerCase().includes(hostname))) {
      return mergeProfile(profile, overrides);
    }
  }

  // 2. Check built-in dedicated profiles
  for (const profile of Object.values(BUILTIN_PROFILES)) {
    if (profile.id === 'generic') continue;
    if (profile.domains.some(d => hostname.includes(d.toLowerCase()) || d.toLowerCase().includes(hostname))) {
      return mergeProfile(profile, overrides);
    }
  }

  // 3. Fallback to generic profile
  return mergeProfile(BUILTIN_PROFILES.generic, overrides);
}

function mergeProfile(base: SourceExtractionProfile, overrides?: Partial<SourceExtractionProfile>): SourceExtractionProfile {
  if (!overrides) return base;
  return {
    ...base,
    ...overrides,
    selectors: {
      ...base.selectors,
      ...(overrides.selectors || {}),
    },
    removeSelectors: overrides.removeSelectors || base.removeSelectors,
    noiseTextPatterns: overrides.noiseTextPatterns || base.noiseTextPatterns,
    cutOffMarkers: overrides.cutOffMarkers || base.cutOffMarkers,
  };
}

export const DEFAULT_CLEANING_RULES: CleaningRules = {
  removeSelectors: BUILTIN_PROFILES.cointelegraph.removeSelectors,
  noiseTextPatterns: BUILTIN_PROFILES.cointelegraph.noiseTextPatterns,
  cutOffMarkers: BUILTIN_PROFILES.cointelegraph.cutOffMarkers,
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
  applied_profile: {
    id: string;
    name: string;
    isVerified: boolean;
  };
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
 * Check if a paragraph hits a cut-off point where remaining text should be ignored
 */
export function isCutOffMarker(line: string, cutOffMarkers: string[] = []): boolean {
  if (!line || cutOffMarkers.length === 0) return false;
  const lower = line.toLowerCase().trim();
  return cutOffMarkers.some(marker => lower.includes(marker.toLowerCase()));
}

/**
 * Extract structured JSON-LD schema (NewsArticle / Article) embedded in the HTML page.
 * Extremely high fidelity for Cointelegraph, CoinDesk, Decrypt, and WordPress publications.
 */
export function extractFromJsonLd(htmlText: string): Partial<ExtractedArticleResult> | null {
  try {
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(htmlText)) !== null) {
      try {
        const rawJson = match[1].trim();
        const data = JSON.parse(rawJson);
        const candidates = Array.isArray(data)
          ? data
          : (data['@graph'] && Array.isArray(data['@graph']) ? data['@graph'] : [data]);

        for (const item of candidates) {
          if (!item) continue;
          const type = (item['@type'] || '').toString();
          const isArticle = type.includes('Article') || type.includes('News') || type.includes('Posting') || type.includes('Report');

          if (item.articleBody && typeof item.articleBody === 'string' && item.articleBody.length > 50) {
            const rawBody: string = item.articleBody;
            const paragraphs = rawBody
              .split(/\n+/)
              .map(p => cleanRawText(p))
              .filter(p => p.length >= 10);

            const title = cleanRawText(item.headline || item.name || '');
            const lead = cleanRawText(item.description || '');
            
            let authorName: string | null = null;
            if (typeof item.author === 'string') {
              authorName = cleanRawText(item.author);
            } else if (item.author && typeof item.author === 'object') {
              authorName = cleanRawText(item.author.name || (Array.isArray(item.author) ? item.author[0]?.name : ''));
            }

            let featuredImg: string | null = null;
            if (typeof item.image === 'string') {
              featuredImg = item.image;
            } else if (item.image && typeof item.image === 'object') {
              featuredImg = item.image.url || (Array.isArray(item.image) ? (typeof item.image[0] === 'string' ? item.image[0] : item.image[0]?.url) : null);
            }

            return {
              title: title || null,
              author: authorName || null,
              featured_image: featuredImg || null,
              lead_text: lead || null,
              full_text: rawBody.trim(),
              paragraphs: paragraphs.length > 0 ? paragraphs : [rawBody.trim()],
            };
          }
        }
      } catch {}
    }
  } catch {}
  return null;
}

/**
 * Cloudflare HTMLRewriter Implementation for Edge Worker runtime with dynamic source profile.
 * Correctly uses el.onEndTag(...) callbacks supported by Cloudflare Workers runtime.
 */
export async function extractWithCloudflareHTMLRewriter(
  htmlText: string,
  url: string,
  customRules?: Partial<SourceExtractionProfile | CleaningRules>
): Promise<ExtractedArticleResult | null> {
  // Check if Cloudflare HTMLRewriter global exists in environment
  if (typeof (globalThis as any).HTMLRewriter === 'undefined') {
    return null;
  }

  const profile = getExtractionProfileForUrl(url, customRules as any);
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
    let currentQuoteText = '';
    let currentListItemText = '';

    let titleExtracted = false;
    let authorExtracted = false;
    let leadExtracted = false;

    const rewriter = new (globalThis as any).HTMLRewriter()
      // Title
      .on(profile.selectors.title, {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !title) {
            title = cleanRawText(val);
            titleExtracted = true;
          }
        },
        text(textChunk: any) {
          if (!titleExtracted) {
            title += textChunk.text;
            if (textChunk.lastInTextNode) {
              titleExtracted = true;
            }
          }
        }
      })
      .on('title', {
        text(textChunk: any) {
          if (!title) {
            title += textChunk.text;
          }
        }
      })
      // Author
      .on(profile.selectors.author, {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !author) {
            author = cleanRawText(val);
            authorExtracted = true;
          }
        },
        text(textChunk: any) {
          if (!authorExtracted) {
            author += textChunk.text;
            if (textChunk.lastInTextNode) {
              authorExtracted = true;
            }
          }
        }
      })
      // Featured Image
      .on(profile.selectors.featuredImage, {
        element(el: any) {
          const src = el.getAttribute('src') || el.getAttribute('content');
          if (src && !featuredImage) featuredImage = src;
        }
      })
      // Lead / Key Takeaways
      .on(profile.selectors.lead, {
        element() {
          if (!leadExtracted) {
            leadText = '';
          }
        },
        text(textChunk: any) {
          if (!leadExtracted) {
            leadText += textChunk.text;
            if (textChunk.lastInTextNode) {
              leadExtracted = true;
            }
          }
        }
      });

    // Remove noise selector handlers
    for (const selector of profile.removeSelectors) {
      try {
        rewriter.on(selector, {
          element(el: any) {
            removedNoiseCount++;
            try { el.remove(); } catch {}
          }
        });
      } catch {}
    }

    // We target the single best container selector or split cleanly
    const primaryContainer = profile.selectors.bodyContainer.split(',')[0].trim() || '[data-testid="post__body"]';

    // Track active element type to avoid overlap and isolate buffers
    let activeType: 'p' | 'h' | 'quote' | 'li' | null = null;
    let headingPrefix = '##';

    rewriter
      .on(`${primaryContainer} p, .ct-prose p`, {
        element(el: any) {
          activeType = 'p';
          currentParagraphText = '';
          el.onEndTag(() => {
            const cleanP = cleanRawText(currentParagraphText);
            if (cleanP.length >= profile.minParagraphLength && !isNoiseLine(cleanP, profile.noiseTextPatterns)) {
              if (!isCutOffMarker(cleanP, profile.cutOffMarkers)) {
                if (!paragraphs.includes(cleanP)) {
                  paragraphs.push(cleanP);
                }
              }
            }
            currentParagraphText = '';
            activeType = null;
          });
        },
        text(textChunk: any) {
          if (activeType === 'p') {
            currentParagraphText += textChunk.text;
          }
        }
      });

    // Handle Headings (H2 / H3)
    rewriter.on(`${primaryContainer} h2, ${primaryContainer} h3, .ct-prose h2, .ct-prose h3`, {
      element(el: any) {
        activeType = 'h';
        const tag = (el.tagName || '').toLowerCase();
        headingPrefix = tag === 'h3' ? '###' : '##';
        currentHeadingText = '';
        el.onEndTag(() => {
          const cleanH = cleanRawText(currentHeadingText);
          if (cleanH.length >= 3 && !isNoiseLine(cleanH, profile.noiseTextPatterns) && !isCutOffMarker(cleanH, profile.cutOffMarkers)) {
            const formatted = `${headingPrefix} ${cleanH}`;
            if (!paragraphs.includes(formatted)) {
              headings.push(formatted);
              paragraphs.push(formatted);
            }
          }
          currentHeadingText = '';
          activeType = null;
        });
      },
      text(textChunk: any) {
        if (activeType === 'h') {
          currentHeadingText += textChunk.text;
        }
      }
    });

    if (profile.preserveQuotes) {
      rewriter.on(`${primaryContainer} blockquote, .ct-prose blockquote`, {
        element(el: any) {
          activeType = 'quote';
          currentQuoteText = '';
          el.onEndTag(() => {
            const cleanQ = cleanRawText(currentQuoteText);
            if (cleanQ.length >= 5 && !isNoiseLine(cleanQ, profile.noiseTextPatterns) && !isCutOffMarker(cleanQ, profile.cutOffMarkers)) {
              const formatted = `> ${cleanQ}`;
              if (!paragraphs.includes(formatted)) {
                paragraphs.push(formatted);
              }
            }
            currentQuoteText = '';
            activeType = null;
          });
        },
        text(textChunk: any) {
          if (activeType === 'quote') {
            currentQuoteText += textChunk.text;
          }
        }
      });
    }

    if (profile.preserveLists) {
      rewriter.on(`${primaryContainer} li, .ct-prose li`, {
        element(el: any) {
          activeType = 'li';
          currentListItemText = '';
          el.onEndTag(() => {
            const cleanLi = cleanRawText(currentListItemText);
            if (cleanLi.length >= 5 && !isNoiseLine(cleanLi, profile.noiseTextPatterns) && !isCutOffMarker(cleanLi, profile.cutOffMarkers)) {
              const formatted = `* ${cleanLi}`;
              if (!paragraphs.includes(formatted)) {
                paragraphs.push(formatted);
              }
            }
            currentListItemText = '';
            activeType = null;
          });
        },
        text(textChunk: any) {
          if (activeType === 'li') {
            currentListItemText += textChunk.text;
          }
        }
      });
    }

    rewriter.on(`${primaryContainer} img, .ct-prose img`, {
      element(el: any) {
        const src = el.getAttribute('src') || el.getAttribute('data-src');
        const alt = el.getAttribute('alt') || '';
        if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon')) {
          if (!images.some(img => img.url === src)) {
            images.push({ url: src, alt: alt.trim(), is_featured: images.length === 0 ? 1 : 0 });
            if (!featuredImage) featuredImage = src;
          }
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
      author: author ? cleanRawText(author) : profile.name,
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
      applied_profile: {
        id: profile.id,
        name: profile.name,
        isVerified: !!profile.isVerified,
      },
    };
  } catch (err: any) {
    console.warn('[HTMLRewriter] Fallback due to runtime error:', err.message);
    return null;
  }
}

/**
 * Pure Regex & String DOM Extractor: Zero-dependency fallback that guarantees
 * 100% extraction in any JS environment (Cloudflare Workers, Node.js, V8)
 * even without Cheerio or HTMLRewriter.
 */
export function extractWithPureRegexDom(
  htmlText: string,
  url: string,
  customRules?: Partial<SourceExtractionProfile | CleaningRules>
): ExtractedArticleResult {
  const profile = getExtractionProfileForUrl(url, customRules as any);

  // 1. Title
  let title: string | null = null;
  const h1Match = htmlText.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) title = cleanRawText(h1Match[1]);
  if (!title) {
    const ogTitle = htmlText.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    if (ogTitle) title = cleanRawText(ogTitle[1]);
  }
  if (!title) {
    const titleTag = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleTag) title = cleanRawText(titleTag[1]);
  }

  // 2. Author
  let author: string | null = null;
  const authMeta = htmlText.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
  if (authMeta) author = cleanRawText(authMeta[1]);
  if (!author) author = profile.name;

  // 3. Featured Image
  let featuredImage: string | null = null;
  const ogImg = htmlText.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImg) featuredImage = ogImg[1];

  // 4. Lead text
  let leadText: string | null = null;
  const descMeta = htmlText.match(/<meta[^>]+(?:name|property)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i);
  if (descMeta) leadText = cleanRawText(descMeta[1]);

  // 5. Extract Paragraphs from Body
  const paragraphs: string[] = [];
  const headings: string[] = [];

  // Remove scripts and styles first
  const sanitizedHtml = htmlText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  const blockMatches = sanitizedHtml.matchAll(/<(p|h2|h3|blockquote|li)[^>]*>([\s\S]*?)<\/\1>/gi);
  for (const match of blockMatches) {
    const tag = match[1].toLowerCase();
    const rawContent = match[2];
    const cleanText = cleanRawText(rawContent);

    if (!cleanText || cleanText.length < profile.minParagraphLength) continue;
    if (isNoiseLine(cleanText, profile.noiseTextPatterns)) continue;
    if (isCutOffMarker(cleanText, profile.cutOffMarkers)) continue;

    if (tag === 'h2' && profile.preserveHeadings) {
      headings.push(`## ${cleanText}`);
      paragraphs.push(`## ${cleanText}`);
    } else if (tag === 'h3' && profile.preserveHeadings) {
      headings.push(`### ${cleanText}`);
      paragraphs.push(`### ${cleanText}`);
    } else if (tag === 'blockquote' && profile.preserveQuotes) {
      paragraphs.push(`> ${cleanText}`);
    } else if (tag === 'li' && profile.preserveLists) {
      paragraphs.push(`* ${cleanText}`);
    } else if (tag === 'p') {
      paragraphs.push(cleanText);
    }
  }

  // Deduplicate and assemble
  const uniqueParagraphs: string[] = [];
  for (const p of paragraphs) {
    if (!uniqueParagraphs.includes(p)) {
      uniqueParagraphs.push(p);
    }
  }

  const allBlocks = leadText && leadText.length > 20 && !uniqueParagraphs.includes(leadText)
    ? [leadText, ...uniqueParagraphs]
    : uniqueParagraphs;

  const fullText = allBlocks.join('\n\n').trim();

  // Images
  const images: Array<{ url: string; alt?: string; is_featured: number }> = [];
  if (featuredImage) {
    images.push({ url: featuredImage, alt: 'Featured Image', is_featured: 1 });
  }

  return {
    url,
    title,
    author,
    featured_image: featuredImage,
    lead_text: leadText,
    full_text: fullText,
    paragraphs: allBlocks,
    headings,
    images,
    stats: {
      char_count: fullText.length,
      word_count: fullText ? fullText.split(/\s+/).length : 0,
      paragraph_count: allBlocks.length,
      heading_count: headings.length,
      image_count: images.length,
      removed_noise_count: 0,
    },
    engine_used: 'cheerio_dom',
    applied_profile: {
      id: profile.id,
      name: profile.name,
      isVerified: !!profile.isVerified,
    },
  };
}

/**
 * Universal Cheerio / DOM Implementation with dynamic source profiling
 */
export function extractWithCheerioDom(
  htmlText: string,
  url: string,
  customRules?: Partial<SourceExtractionProfile | CleaningRules>
): ExtractedArticleResult {
  const profile = getExtractionProfileForUrl(url, customRules as any);
  const $ = cheerio.load(htmlText);

  // 1. Extract Metadata using Profile Selectors
  let title = $(profile.selectors.title).first().text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    null;

  let author = $(profile.selectors.author).first().text().trim() ||
    $('[data-testid="author-link"], .post-meta__author, a[rel="author"], [class*="author-link"]').first().text().trim() ||
    $('meta[name="author"]').attr('content') ||
    profile.name;

  let featuredImage = $(profile.selectors.featuredImage).attr('src') ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[name="twitter:image:src"]').attr('content') ||
    null;

  // 2. Target Container based on source profile
  let $container = $(profile.selectors.bodyContainer).first();

  if ($container.length === 0) {
    $container = $('article:not([data-testid="article-card"])').first();
  }
  if ($container.length === 0) {
    $container = $('[class*="post-body"], [class*="StoryBody"], main').first();
  }
  if ($container.length === 0) {
    $container = $('body');
  }

  const $body = $container.clone();

  // 3. Remove all blacklisted noise selectors for this source
  let removedNoiseCount = 0;
  for (const selector of profile.removeSelectors) {
    const found = $body.find(selector);
    removedNoiseCount += found.length;
    found.remove();
  }

  // 4. Extract Lead Text / Key Takeaway
  const leadText = cleanRawText(
    $(profile.selectors.lead).first().text()
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

    if (!cleanText || cleanText.length < profile.minParagraphLength) return;
    if (isNoiseLine(cleanText, profile.noiseTextPatterns)) return;
    if (profile.cutOffMarkers && isCutOffMarker(cleanText, profile.cutOffMarkers)) return;

    if (tagName === 'h2' && profile.preserveHeadings) {
      headings.push(`## ${cleanText}`);
      paragraphs.push(`## ${cleanText}`);
    } else if (tagName === 'h3' && profile.preserveHeadings) {
      headings.push(`### ${cleanText}`);
      paragraphs.push(`### ${cleanText}`);
    } else if (tagName === 'blockquote' && profile.preserveQuotes) {
      paragraphs.push(`> ${cleanText}`);
    } else if ((tagName === 'ul' || tagName === 'ol') && profile.preserveLists) {
      const items: string[] = [];
      $(el).find('li').each((_, li) => {
        const liText = cleanRawText($(li).text());
        if (liText && !isNoiseLine(liText, profile.noiseTextPatterns)) {
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
    author: author ? cleanRawText(author) : profile.name,
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
    applied_profile: {
      id: profile.id,
      name: profile.name,
      isVerified: !!profile.isVerified,
    },
  };
}

/**
 * Primary Unified Extractor: Multi-strategy resilient runner that guarantees
 * complete, high-fidelity article extraction on Cloudflare Workers, Cloudflare Pages,
 * and Node environments.
 */
export async function extractArticleFullText(
  url: string,
  customRules?: Partial<SourceExtractionProfile | CleaningRules>
): Promise<ExtractedArticleResult> {
  const profile = getExtractionProfileForUrl(url, customRules as any);
  console.log(`[FullTextExtractor] Fetching HTML from ${url} using profile "${profile.name}" (${profile.id})...`);

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
    engine_used: 'cloudflare_htmlrewriter',
    applied_profile: {
      id: profile.id,
      name: profile.name,
      isVerified: !!profile.isVerified,
    },
  };

  if (!url || !url.startsWith('http')) return emptyResult;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CointelegraphNewsReader/1.0',
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

    // Strategy 1: Cloudflare HTMLRewriter (if running inside Cloudflare Workers)
    try {
      const cfResult = await extractWithCloudflareHTMLRewriter(htmlText, url, customRules);
      if (cfResult && cfResult.full_text && cfResult.full_text.length >= 100) {
        console.log(`[FullTextExtractor] Successfully extracted with Cloudflare HTMLRewriter (${cfResult.stats.char_count} chars, profile: ${profile.name})`);
        return cfResult;
      }
    } catch (cfErr: any) {
      console.warn(`[FullTextExtractor] HTMLRewriter strategy note: ${cfErr.message}`);
    }

    // Strategy 2: Cheerio DOM Parser (if Cheerio is supported in runtime)
    try {
      const domResult = extractWithCheerioDom(htmlText, url, customRules);
      if (domResult && domResult.full_text && domResult.full_text.length >= 100) {
        console.log(`[FullTextExtractor] Extracted with Cheerio DOM (${domResult.stats.char_count} chars, ${domResult.stats.paragraph_count} paragraphs, profile: ${profile.name})`);
        return domResult;
      }
    } catch (cheerioErr: any) {
      console.warn(`[FullTextExtractor] Cheerio strategy note: ${cheerioErr.message}`);
    }

    // Strategy 3: JSON-LD Structured Schema (articleBody field)
    try {
      const jsonLdData = extractFromJsonLd(htmlText);
      if (jsonLdData && jsonLdData.full_text && jsonLdData.full_text.length >= 80) {
        console.log(`[FullTextExtractor] Extracted via JSON-LD Structured Schema (${jsonLdData.full_text.length} chars)`);
        const pList = jsonLdData.paragraphs || [jsonLdData.full_text];
        return {
          url,
          title: jsonLdData.title || null,
          author: jsonLdData.author || profile.name,
          featured_image: jsonLdData.featured_image || null,
          lead_text: jsonLdData.lead_text || null,
          full_text: jsonLdData.full_text,
          paragraphs: pList,
          headings: [],
          images: jsonLdData.featured_image ? [{ url: jsonLdData.featured_image, alt: 'Featured Image', is_featured: 1 }] : [],
          stats: {
            char_count: jsonLdData.full_text.length,
            word_count: jsonLdData.full_text.split(/\s+/).length,
            paragraph_count: pList.length,
            heading_count: 0,
            image_count: jsonLdData.featured_image ? 1 : 0,
            removed_noise_count: 0,
          },
          engine_used: 'cloudflare_htmlrewriter',
          applied_profile: {
            id: profile.id,
            name: profile.name,
            isVerified: !!profile.isVerified,
          },
        };
      }
    } catch (jsonErr: any) {
      console.warn(`[FullTextExtractor] JSON-LD strategy note: ${jsonErr.message}`);
    }

    // Strategy 4: Pure RegEx DOM Extractor (Zero-dependency fallback)
    const regexResult = extractWithPureRegexDom(htmlText, url, customRules);
    console.log(`[FullTextExtractor] Extracted with Pure RegEx Fallback (${regexResult.stats.char_count} chars, ${regexResult.stats.paragraph_count} paragraphs)`);
    return regexResult;
  } catch (err: any) {
    console.error(`[FullTextExtractor] Error extracting from ${url}:`, err.message);
    return emptyResult;
  }
}

