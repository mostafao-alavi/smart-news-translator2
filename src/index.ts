import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import apiRoutes, { pruneOldArticles } from './api/routes.ts';
import { scraper, extractFullArticleText } from './cron/scraper.ts';
import { translator } from './cron/translator.ts';
import { wpSyncPublisher } from './cron/wpSync.ts';
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
      worker: 'news-worker',
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
});

// Serve static assets (js, css, images) from ./dist
app.use('/assets/*', serveStatic({ root: './' }));
app.use('/*.js', serveStatic({ root: './' }));
app.use('/*.css', serveStatic({ root: './' }));
app.use('/*.svg', serveStatic({ root: './' }));
app.use('/*.png', serveStatic({ root: './' }));
app.use('/*.ico', serveStatic({ root: './' }));
app.use('/*.json', serveStatic({ root: './' }));

// SPA Fallback: Serve index.html for all client-side navigation routes (/settings, /sources, /news, etc.)
app.get('*', serveStatic({
  path: './index.html',
  rewriteRequestPath: () => './index.html',
}));

// Cloudflare Worker export with fetch, scheduled, and queue handlers
export default {
  // Fetch event handler for HTTP requests
  fetch: app.fetch,

  // Scheduled event handler for Cloudflare Cron Triggers (crons = ["0 * * * *"])
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger executed at ${new Date().toISOString()} (Cron: ${event.cron})`);

    // Use ctx.waitUntil to ensure background tasks complete fully before worker terminates
    ctx.waitUntil(
      (async () => {
        try {
          // 1. Run D1 Data Pruning / Garbage Collection (Clear content older than 7 days to maintain < 500MB limit)
          console.log('Starting D1 Garbage Collection step...');
          const pruneResult = await pruneOldArticles(env.DB);
          console.log('D1 Pruning finished:', JSON.stringify(pruneResult));

          // 2. Run RSS Scraper
          console.log('Starting scheduled scraper step...');
          const scraperResult = await scraper(env);
          console.log('Scraper finished:', JSON.stringify(scraperResult));

          // 3. Run AI Translator
          console.log('Starting scheduled translator step...');
          const translatorResult = await translator(env);
          console.log('Translator finished:', JSON.stringify(translatorResult));
        } catch (err) {
          console.error('Fatal error during scheduled cron task execution:', err);
        }
      })()
    );
  },

  // Queue consumer handler for asynchronous Cloudflare Queues
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    console.log(`Processing queue batch for queue: ${batch.queue} (${batch.messages.length} messages)`);

    if (batch.queue === 'news-translate-queue') {
      for (const message of batch.messages) {
        try {
          let rawText = message.body?.text || '';
          if (!rawText && message.body?.hash && env.CONTENT_BUCKET) {
            try {
              const rawFile = await env.CONTENT_BUCKET.get(`english/${message.body.hash}.txt`);
              if (rawFile) {
                rawText = await rawFile.text();
              }
            } catch (r2Err) {
              console.warn('R2 bucket fetch skipped/paused:', r2Err);
            }
          }

          // Fast classification with Cloudflare Workers AI
          let category = 'technology';
          if (env.AI && rawText) {
            try {
              const categoryResult = await env.AI.run('@cf/facebook/bart-large-mnli', {
                text: rawText,
                candidate_labels: ['technology', 'cybersecurity', 'ai', 'business'],
              });
              if (categoryResult?.labels?.[0]) {
                category = categoryResult.labels[0];
              }
            } catch (aiErr) {
              console.warn('Workers AI classification skipped:', aiErr);
            }
          }

          // Update metadata & category in D1 Database
          if (env.DB && message.body?.id) {
            await env.DB.prepare("UPDATE articles SET status = 'translated', category = ? WHERE id = ?")
              .bind(category, message.body.id)
              .run();
          }

          message.ack();
        } catch (err) {
          console.error('Error processing translate queue message:', err);
          message.retry();
        }
      }
    } else if (batch.queue === 'news-scrape-queue') {
      for (const message of batch.messages) {
        try {
          const { url, sourceSelector, hash, id } = message.body || {};
          console.log('Processing scrape queue message for feed/article:', url);

          if (url) {
            // 1. Download HTML and extract full article text using Cheerio
            const fullText = await extractFullArticleText(url, sourceSelector);

            if (fullText && fullText.length > 50) {
              const fileHash = hash || `article-${id || Date.now()}`;

              // 2. Direct storage into Cloudflare D1 database (Focus on D1)
              if (env.DB && id) {
                await env.DB.prepare('UPDATE articles SET content = ? WHERE id = ?')
                  .bind(fullText, id)
                  .run();
              }

              // Optional: Save to R2 if available
              if (env.CONTENT_BUCKET) {
                try {
                  await env.CONTENT_BUCKET.put(`english/${fileHash}.txt`, fullText);
                } catch (r2Err) {
                  console.warn('R2 Storage skipped:', r2Err);
                }
              }

              // 3. Dispatch message to translate queue
              if (env.TRANSLATE_QUEUE) {
                await env.TRANSLATE_QUEUE.send({
                  id: id,
                  hash: fileHash,
                  text: fullText,
                });
              }
            } else {
              console.log(`Failed to extract full text for: ${url}`);
            }
          }
          message.ack();
        } catch (err) {
          console.error('Error in news-scrape-queue handler:', err);
          message.retry();
        }
      }
    }
  },
};
