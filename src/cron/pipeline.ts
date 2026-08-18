import { Env } from '../types.ts';
import { scrapeCointelegraph, scrapeFullArticle, saveArticle } from './scraper.ts';
import { translateArticle } from './translator.ts';
import { distributeToWordPress } from './wpSync.ts';
import { distributeToTelegram } from './telegramBot.ts';
import { distributeToInstagram } from './instagramPublisher.ts';

export interface PipelineStepStatus {
  step: 'scrape' | 'extract' | 'translate' | 'wordpress' | 'telegram' | 'instagram';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  itemsProcessed: number;
  details?: string;
  error?: string;
}

export interface PipelineExecutionResult {
  success: boolean;
  startTime: string;
  endTime: string;
  durationMs: number;
  stats: {
    scrapedArticles: number;
    translatedArticles: number;
    wpPublishedArticles: number;
    telegramPublishedArticles: number;
    instagramPublishedArticles: number;
  };
  steps: PipelineStepStatus[];
  processedArticles: Array<{
    id: number;
    title: string;
    originalUrl: string;
    wpUrl?: string;
    wpPostId?: string;
    telegramMessageId?: string;
    instagramPostId?: string;
    featuredImage?: string;
  }>;
  error: string | null;
}

let latestPipelineExecution: PipelineExecutionResult | null = null;
let isPipelineRunning = false;
let autopilotActive = true; // Default ON for automated pipeline loop

export function getAutopilotStatus(): { isActive: boolean; isRunning: boolean; latestRun: PipelineExecutionResult | null } {
  return {
    isActive: autopilotActive,
    isRunning: isPipelineRunning,
    latestRun: latestPipelineExecution,
  };
}

export function setAutopilotActive(active: boolean): boolean {
  autopilotActive = active;
  return autopilotActive;
}

/**
 * Runs the full end-to-end automated news pipeline:
 * 1. Discover RSS feeds & check for new articles
 * 2. Fetch full webpage text and featured images
 * 3. AI Translation to Persian in sequence
 * 4. Auto-publish to WordPress website with featured media
 * 5. Auto-publish to Telegram channel with Featured Image and WordPress website link
 * 6. Auto-publish / format Instagram post with website link and hashtags
 */
export async function runAutonomousPipeline(
  env: Env,
  options: { limit?: number; forceAllPending?: boolean } = {}
): Promise<PipelineExecutionResult> {
  if (isPipelineRunning) {
    throw new Error('فرآیند خودکار در حال حاضر در حال اجراست. لطفاً چند لحظه صبر کنید.');
  }

  isPipelineRunning = true;
  const startTs = Date.now();
  const startTimeIso = new Date().toISOString();
  const maxBatch = options.limit || 5;

  const result: PipelineExecutionResult = {
    success: true,
    startTime: startTimeIso,
    endTime: '',
    durationMs: 0,
    stats: {
      scrapedArticles: 0,
      translatedArticles: 0,
      wpPublishedArticles: 0,
      telegramPublishedArticles: 0,
      instagramPublishedArticles: 0,
    },
    steps: [
      { step: 'scrape', title: '۱. بررسی و دریافت اخبار جدید (RSS Scrape)', status: 'pending', itemsProcessed: 0 },
      { step: 'extract', title: '۲. استخراج محتوای کامل و تصویر شاخص', status: 'pending', itemsProcessed: 0 },
      { step: 'translate', title: '۳. ترجمه هوشمند و سئو به فارسی به ترتیب', status: 'pending', itemsProcessed: 0 },
      { step: 'wordpress', title: '۴. انتشار خودکار در وب‌سایت وردپرس با تصویر شاخص', status: 'pending', itemsProcessed: 0 },
      { step: 'telegram', title: '۵. انتشار در تلگرام همراه با تصویر شاخص و لینک سایت', status: 'pending', itemsProcessed: 0 },
      { step: 'instagram', title: '۶. آماده‌سازی و انتشار پست اینستاگرام با لینک سایت', status: 'pending', itemsProcessed: 0 },
    ],
    processedArticles: [],
    error: null,
  };

  try {
    // -------------------------------------------------------------
    // STEP 1 & 2: DISCOVER RSS & SCRAPE FULL WEBPAGE CONTENT
    // -------------------------------------------------------------
    result.steps[0].status = 'running';
    result.steps[1].status = 'running';

    console.log('[Pipeline] Step 1: Checking for new RSS news items...');
    const rawRssArticles = await scrapeCointelegraph(env);
    result.steps[0].itemsProcessed = rawRssArticles.length;
    result.steps[0].status = 'completed';
    result.steps[0].details = `${rawRssArticles.length} خبر جدید از منابع RSS شناسایی شد.`;

    console.log(`[Pipeline] Step 2: Fetching full text and extracting images for ${rawRssArticles.length} articles...`);
    const savedArticleIds: number[] = [];

    for (const art of rawRssArticles.slice(0, maxBatch)) {
      try {
        const fullContent = await scrapeFullArticle(env, art.link);
        const artId = await saveArticle(env, art, fullContent, fullContent.images);
        if (artId) {
          savedArticleIds.push(artId);
        }
      } catch (err: any) {
        console.warn(`[Pipeline] Error extracting full article for ${art.link}:`, err.message);
      }
    }

    result.stats.scrapedArticles = savedArticleIds.length;
    result.steps[1].itemsProcessed = savedArticleIds.length;
    result.steps[1].status = 'completed';
    result.steps[1].details = `متن کامل و تصاویر برای ${savedArticleIds.length} خبر ذخیره شد.`;

    // -------------------------------------------------------------
    // STEP 3: SEQUENTIAL AI TRANSLATION
    // -------------------------------------------------------------
    result.steps[2].status = 'running';
    console.log('[Pipeline] Step 3: Querying pending articles for sequential translation...');

    let pendingArticles: any[] = [];
    if (env.DB) {
      try {
        const queryRes = await env.DB.prepare(`
          SELECT id, title, content, link, original_url, featured_image
          FROM articles
          WHERE translation_status = 'pending' OR status = 'pending' OR status IS NULL
          ORDER BY id ASC
          LIMIT ?
        `).bind(maxBatch).all();

        pendingArticles = queryRes.results || [];
      } catch (err: any) {
        console.warn('[Pipeline] D1 query for pending articles failed:', err.message);
      }
    }

    // Fallback if none found by status, check newly saved ones
    if (pendingArticles.length === 0 && savedArticleIds.length > 0 && env.DB) {
      for (const sId of savedArticleIds) {
        const row = await env.DB.prepare('SELECT id, title, content, link, original_url, featured_image FROM articles WHERE id = ?').bind(sId).first();
        if (row) pendingArticles.push(row);
      }
    }

    const translatedResults: any[] = [];
    for (const pArt of pendingArticles) {
      try {
        console.log(`[Pipeline] Translating article ID ${pArt.id} (${pArt.title.slice(0, 40)}...)...`);
        const trans = await translateArticle(env, pArt.id);
        if (trans) {
          translatedResults.push({
            ...trans,
            featured_image: pArt.featured_image || trans.featured_image || null,
          });
        }
      } catch (tErr: any) {
        console.error(`[Pipeline] Translation failed for article ${pArt.id}:`, tErr.message);
      }
    }

    result.stats.translatedArticles = translatedResults.length;
    result.steps[2].itemsProcessed = translatedResults.length;
    result.steps[2].status = 'completed';
    result.steps[2].details = `${translatedResults.length} خبر با موفقیت به فارسی ترجمه و سئو شدند.`;

    // -------------------------------------------------------------
    // STEP 4: AUTO PUBLISH TO WORDPRESS WEBSITE
    // -------------------------------------------------------------
    result.steps[3].status = 'running';
    console.log('[Pipeline] Step 4: Publishing translated articles to WordPress...');

    const wpPublishedArticles: any[] = [];
    for (const tItem of translatedResults) {
      try {
        const wpRes = await distributeToWordPress(env, {
          article_id: tItem.article_id,
          translation_id: tItem.translation_id,
          title: tItem.title,
          content: tItem.content,
          summary: tItem.summary,
          tags: tItem.tags,
          featured_image: tItem.featured_image,
          source_url: tItem.source_url,
          source_name: tItem.source_name,
        });

        const wpUrl = wpRes.ok && wpRes.postUrl ? wpRes.postUrl : `https://updaaate.ir/?p=${wpRes.postId || tItem.article_id}`;
        wpPublishedArticles.push({
          ...tItem,
          wpOk: wpRes.ok,
          wpPostId: wpRes.postId,
          wpUrl: wpUrl,
        });
      } catch (wpErr: any) {
        console.error(`[Pipeline] WordPress publish failed for article ${tItem.article_id}:`, wpErr.message);
        wpPublishedArticles.push({
          ...tItem,
          wpOk: false,
          wpUrl: `https://updaaate.ir`,
        });
      }
    }

    const wpSuccessCount = wpPublishedArticles.filter(a => a.wpOk).length;
    result.stats.wpPublishedArticles = wpSuccessCount;
    result.steps[3].itemsProcessed = wpSuccessCount;
    result.steps[3].status = 'completed';
    result.steps[3].details = `${wpSuccessCount} خبر در وب‌سایت وردپرس منتشر شد.`;

    // -------------------------------------------------------------
    // STEP 5: AUTO PUBLISH TO TELEGRAM (WITH FEATURED IMAGE & SITE LINK)
    // -------------------------------------------------------------
    result.steps[4].status = 'running';
    console.log('[Pipeline] Step 5: Publishing to Telegram with featured image & website link...');

    let telegramSuccessCount = 0;
    for (const wpArt of wpPublishedArticles) {
      try {
        const tgRes = await distributeToTelegram(env, {
          article_id: wpArt.article_id,
          translation_id: wpArt.translation_id,
          title: wpArt.title,
          content: wpArt.content,
          summary: wpArt.summary,
          tags: wpArt.tags,
          source_url: wpArt.wpUrl, // Directly link to the live WordPress article
          featured_image: wpArt.featured_image,
        });

        if (tgRes.ok) {
          telegramSuccessCount++;
          wpArt.telegramMessageId = tgRes.result?.message_id ? String(tgRes.result.message_id) : undefined;
        }
      } catch (tgErr: any) {
        console.warn(`[Pipeline] Telegram distribution notice for article ${wpArt.article_id}:`, tgErr.message);
      }
    }

    result.stats.telegramPublishedArticles = telegramSuccessCount;
    result.steps[4].itemsProcessed = telegramSuccessCount;
    result.steps[4].status = 'completed';
    result.steps[4].details = `${telegramSuccessCount} پست با تصویر شاخص و لینک سایت به کانال تلگرام ارسال شد.`;

    // -------------------------------------------------------------
    // STEP 6: AUTO INSTAGRAM / SOCIAL DISTRIBUTION
    // -------------------------------------------------------------
    result.steps[5].status = 'running';
    console.log('[Pipeline] Step 6: Formatting and distributing Instagram / Social posts...');

    let igSuccessCount = 0;
    for (const wpArt of wpPublishedArticles) {
      try {
        const igRes = await distributeToInstagram(env, {
          article_id: wpArt.article_id,
          translation_id: wpArt.translation_id,
          title: wpArt.title,
          content: wpArt.content,
          summary: wpArt.summary,
          tags: wpArt.tags,
          website_url: wpArt.wpUrl,
          featured_image: wpArt.featured_image,
        });

        if (igRes.ok) {
          igSuccessCount++;
          wpArt.instagramPostId = igRes.postId;
        }
      } catch (igErr: any) {
        console.warn(`[Pipeline] Instagram distribution notice:`, igErr.message);
      }

      result.processedArticles.push({
        id: wpArt.article_id,
        title: wpArt.title,
        originalUrl: wpArt.source_url,
        wpUrl: wpArt.wpUrl,
        wpPostId: wpArt.wpPostId,
        telegramMessageId: wpArt.telegramMessageId,
        instagramPostId: wpArt.instagramPostId,
        featuredImage: wpArt.featured_image,
      });
    }

    result.stats.instagramPublishedArticles = igSuccessCount;
    result.steps[5].itemsProcessed = igSuccessCount;
    result.steps[5].status = 'completed';
    result.steps[5].details = `${igSuccessCount} پست اینستاگرام و شبکه‌های اجتماعی آماده و توزیع شد.`;

    // Record system execution log in D1
    const endTs = Date.now();
    result.durationMs = endTs - startTs;
    result.endTime = new Date().toISOString();

    const targetDb = env.DB_ARCHIVE || env.DB;
    if (targetDb) {
      try {
        await targetDb.prepare(`
          INSERT INTO execution_logs (task_type, status, items_processed, items_success, duration_ms, executed_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          'autonomous_pipeline',
          'success',
          result.stats.scrapedArticles,
          result.stats.wpPublishedArticles,
          result.durationMs
        ).run();

        await targetDb.prepare(`
          INSERT INTO system_events (event_type, description, created_at)
          VALUES (?, ?, datetime('now'))
        `).bind(
          'AUTOPILOT_PIPELINE_SUCCESS',
          `پایپلاین خودکار اجرا شد: ${result.stats.scrapedArticles} دریافت، ${result.stats.translatedArticles} ترجمه، ${result.stats.wpPublishedArticles} وردپرس، ${result.stats.telegramPublishedArticles} تلگرام، ${result.stats.instagramPublishedArticles} اینستاگرام`
        ).run();
      } catch {}
    }

    latestPipelineExecution = result;
    return result;
  } catch (err: any) {
    result.success = false;
    result.error = err.message || 'Pipeline execution failed';
    result.endTime = new Date().toISOString();
    result.durationMs = Date.now() - startTs;

    console.error('[Pipeline] Fatal pipeline error:', err);
    latestPipelineExecution = result;
    return result;
  } finally {
    isPipelineRunning = false;
  }
}
