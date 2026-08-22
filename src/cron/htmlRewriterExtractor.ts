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
 * Cloudflare HTMLRewriter Implementation for Edge Worker runtime with dynamic source profile
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

    const rewriter = new (globalThis as any).HTMLRewriter()
      // Title
      .on(profile.selectors.title, {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !title) title = cleanRawText(val);
        },
        text(textChunk: any) {
          if (!title) title += textChunk.text;
        }
      })
      .on('title', {
        text(textChunk: any) {
          if (!title) title += textChunk.text;
        }
      })
      // Author
      .on(profile.selectors.author, {
        element(el: any) {
          const val = el.getAttribute('content');
          if (val && !author) author = cleanRawText(val);
        },
        text(textChunk: any) {
          if (!author) author += textChunk.text;
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
        text(textChunk: any) {
          leadText += textChunk.text;
        }
      });

    // Remove noise selector handlers
    for (const selector of profile.removeSelectors) {
      rewriter.on(selector, {
        element(el: any) {
          removedNoiseCount++;
          el.remove();
        }
      });
    }

    // Article Content extraction targeting specific body container
    const bodyPSelector = profile.selectors.bodyContainer.split(',').map(c => `${c.trim()} p`).join(', ');
    const bodyHSelector = profile.selectors.bodyContainer.split(',').map(c => `${c.trim()} h2, ${c.trim()} h3`).join(', ');
    const bodyImgSelector = profile.selectors.bodyContainer.split(',').map(c => `${c.trim()} img`).join(', ');

    rewriter
      .on(bodyPSelector, {
        element() {
          currentParagraphText = '';
        },
        text(textChunk: any) {
          currentParagraphText += textChunk.text;
        },
        elementEnd() {
          const cleanP = cleanRawText(currentParagraphText);
          if (cleanP.length >= profile.minParagraphLength && !isNoiseLine(cleanP, profile.noiseTextPatterns)) {
            paragraphs.push(cleanP);
          }
        }
      })
      .on(bodyHSelector, {
        element() {
          currentHeadingText = '';
        },
        text(textChunk: any) {
          currentHeadingText += textChunk.text;
        },
        elementEnd(el: any) {
          const cleanH = cleanRawText(currentHeadingText);
          if (cleanH.length >= 3 && !isNoiseLine(cleanH, profile.noiseTextPatterns)) {
            const prefix = el.tagName === 'h3' ? '###' : '##';
            headings.push(`${prefix} ${cleanH}`);
            paragraphs.push(`${prefix} ${cleanH}`);
          }
        }
      })
      .on(bodyImgSelector, {
        element(el: any) {
          const src = el.getAttribute('src') || el.getAttribute('data-src');
          const alt = el.getAttribute('alt') || '';
          if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon')) {
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

    // Check cut-off markers
    let finalParagraphs: string[] = [];
    for (const p of paragraphs) {
      if (profile.cutOffMarkers && isCutOffMarker(p, profile.cutOffMarkers)) {
        break;
      }
      finalParagraphs.push(p);
    }

    // Format full clean text
    const cleanLead = cleanRawText(leadText);
    const allTextBlocks = cleanLead && cleanLead.length > 20 && !finalParagraphs.includes(cleanLead)
      ? [cleanLead, ...finalParagraphs]
      : finalParagraphs;

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
    console.warn('[HTMLRewriter] Fallback to Cheerio parser due to error:', err.message);
    return null;
  }
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

  let hitCutOff = false;
  $body.find('p, h2, h3, blockquote, ul, ol').each((_, el) => {
    if (hitCutOff) return;

    const tagName = el.tagName?.toLowerCase();
    const rawContent = $(el).text();
    const cleanText = cleanRawText(rawContent);

    if (!cleanText || cleanText.length < profile.minParagraphLength) return;
    if (isNoiseLine(cleanText, profile.noiseTextPatterns)) return;

    // Check cut-off markers (e.g. disclaimer at bottom)
    if (profile.cutOffMarkers && isCutOffMarker(cleanText, profile.cutOffMarkers)) {
      hitCutOff = true;
      return;
    }

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
 * Primary Unified Extractor: Runs Cloudflare HTMLRewriter when in Workers environment,
 * or Cheerio DOM parser in Node / fallback environment.
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
    engine_used: 'cheerio_dom',
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
      console.log(`[FullTextExtractor] Successfully extracted with Cloudflare HTMLRewriter (${cfResult.stats.char_count} chars, profile: ${profile.name})`);
      return cfResult;
    }

    // 2. Use Cheerio DOM Parser
    const domResult = extractWithCheerioDom(htmlText, url, customRules);
    console.log(`[FullTextExtractor] Extracted with Cheerio DOM (${domResult.stats.char_count} chars, ${domResult.stats.paragraph_count} paragraphs, profile: ${profile.name})`);
    return domResult;
  } catch (err: any) {
    console.error(`[FullTextExtractor] Error extracting from ${url}:`, err.message);
    return emptyResult;
  }
}

