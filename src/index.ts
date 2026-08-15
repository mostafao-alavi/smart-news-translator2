import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import apiRoutes, { pruneOldArticles } from './api/routes.ts';
import { scrapeCointelegraph, scrapeFullArticle, saveArticle, extractFullArticleText } from './cron/scraper.ts';
import { translateArticle } from './cron/translator.ts';
import { distributeToWordPress } from './cron/wpSync.ts';
import { distributeToTelegram } from './cron/telegramBot.ts';
import { Env, ApiResponse, ScheduledEvent, ExecutionContext, MessageBatch } from './types.ts';

const app = new Hono<{ Bindings: Env }>();

// Security and Performance Middleware
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// Global Error Handler
app.onError((err, c) => {
  console.error('Cloudflare Worker Global Error:', err);
  
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: err.message || 'Internal Server Error',
  };

  return c.json(response, 500);
});

// Mount API routes under /api prefix ONLY
app.route('/api', apiRoutes);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'operational',
      version: '1.0.1',
      worker: 'smart-news-translator2',
      focus: 'Cointelegraph -> WordPress & Telegram',
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
});

// Serve static assets from ./dist
app.use('/assets/*', serveStatic({ root: './' }));
app.use('/*.js', serveStatic({ root: './' }));
app.use('/*.css', serveStatic({ root: './' }));
app.use('/*.svg', serveStatic({ root: './' }));
app.use('/*.png', serveStatic({ root: './' }));
app.use('/*.ico', serveStatic({ root: './' }));
app.use('/*.json', serveStatic({ root: './' }));

// SPA Fallback
app.get('*', serveStatic({
  path: './index.html',
  rewriteRequestPath: () => './index.html',
}));

// Cloudflare Worker export with fetch, scheduled, and queue handlers
export default {
  fetch: app.fetch,

  // Scheduled event handler for Cloudflare Cron Triggers (crons = ["*/15 * * * *"])
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Cron] 15-Minute trigger executed at ${new Date().toISOString()} (Cron: ${event.cron})`);

    ctx.waitUntil(
      (async () => {
        try {
          // 0. Garbage Collection / Pruning
          if (env.DB) {
            try {
              await pruneOldArticles(env.DB);
            } catch {}
          }

          // 1. Scrape Cointelegraph RSS
          console.log('[Cron] Step 1: Scraping Cointelegraph RSS...');
          const articles = await scrapeCointelegraph(env);
          console.log(`[Cron] Found ${articles.length} new articles to process`);

          for (const article of articles) {
            try {
              // 2. Scrape full text + all media
              console.log(`[Cron] Step 2: Extracting full article: ${article.link}`);
              const fullContent = await scrapeFullArticle(env, article.link);

              // 3. Save to D1 Primary (news_db)
              console.log(`[Cron] Step 3: Saving article to D1 Primary...`);
              const articleId = await saveArticle(
                env, 
                article, 
                fullContent, 
                fullContent.images
              );

              if (articleId) {
                // 4. Send to Translate Queue
                if (env.TRANSLATE_QUEUE) {
                  console.log(`[Cron] Step 4: Dispatching article ID ${articleId} to TRANSLATE_QUEUE`);
                  await env.TRANSLATE_QUEUE.send({
                    articleId: articleId,
                    priority: 'normal',
                  });
                } else {
                  // Direct translation fallback if queue binding is not attached
                  console.log(`[Cron] No queue binding; running direct inline translation for ID ${articleId}...`);
                  const translated = await translateArticle(env, articleId);
                  const wpRes = await distributeToWordPress(env, translated);
                  await distributeToTelegram(env, {
                    ...translated,
                    source_url: wpRes.postUrl || translated.source_url,
                  });
                }
              }
            } catch (itemErr: any) {
              console.error(`[Cron] Error processing article ${article.link}:`, itemErr.message);
            }
          }

          console.log('[Cron] 15-minute cron execution finished successfully');
        } catch (err: any) {
          console.error('[Cron] Fatal error during scheduled execution:', err);
        }
      })()
    );
  },

  // Queue consumer handler for Cloudflare Queues
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    console.log(`[Queue] Processing ${batch.messages.length} messages for queue: ${batch.queue}`);

    for (const message of batch.messages) {
      try {
        if (batch.queue === 'news-translate-queue') {
          const articleId = message.body?.articleId || message.body?.id;
          if (!articleId) {
            message.ack();
            continue;
          }

          console.log(`[Queue] Starting translation & distribution for article ID ${articleId}`);

          // 5. Translate with Workers AI (or Gemini fallback) + Save to D1 Archive
          const translated = await translateArticle(env, Number(articleId));

          // 6. Distribute to WordPress (with category 3, publish status, featured image)
          const wpRes = await distributeToWordPress(env, translated);

          // 7. Distribute to Telegram Channel (@updaaate_crypto)
          await distributeToTelegram(env, {
            ...translated,
            source_url: wpRes.postUrl || translated.source_url,
          });

          message.ack();
        } else if (batch.queue === 'news-scrape-queue') {
          const { url } = message.body || {};
          if (url) {
            const fullContent = await scrapeFullArticle(env, url);
            if (fullContent.full_text && message.body?.id) {
              await saveArticle(
                env, 
                { source_id: 1, title: message.body.title || '', link: url, published_at: new Date().toISOString() }, 
                fullContent, 
                fullContent.images
              );
              if (env.TRANSLATE_QUEUE) {
                await env.TRANSLATE_QUEUE.send({ articleId: message.body.id });
              }
            }
          }
          message.ack();
        } else {
          message.ack();
        }
      } catch (msgErr: any) {
        console.error(`[Queue] Error processing message:`, msgErr);
        message.retry();
      }
    }
  },
};
