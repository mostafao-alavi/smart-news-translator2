import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import apiRoutes from './api/routes';
import { scraper } from './cron/scraper';
import { translator } from './cron/translator';
import { Env, ApiResponse, ScheduledEvent, ExecutionContext, MessageBatch } from './types';

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
          // 1. Run RSS Scraper
          console.log('Starting scheduled scraper step...');
          const scraperResult = await scraper(env);
          console.log('Scraper finished:', JSON.stringify(scraperResult));

          // 2. Run AI Translator
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
          let rawText = '';
          if (message.body?.hash && env.CONTENT_BUCKET) {
            // 1. Read raw text from Cloudflare R2 Bucket
            const rawFile = await env.CONTENT_BUCKET.get(`english/${message.body.hash}.txt`);
            if (rawFile) {
              rawText = await rawFile.text();
            }
          } else if (message.body?.text) {
            rawText = message.body.text;
          }

          // 2. Fast classification with Cloudflare Workers AI
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

          // 3. Update metadata & category in D1 Database
          if (env.DB && message.body?.id) {
            await env.DB.prepare("UPDATE articles SET status = 'translated', category = ? WHERE id = ?")
              .bind(category, message.body.id)
              .run();
          }

          // Acknowledge task completion
          message.ack();
        } catch (err) {
          console.error('Error processing translate queue message:', err);
          message.retry();
        }
      }
    } else if (batch.queue === 'news-scrape-queue') {
      for (const message of batch.messages) {
        try {
          console.log('Processing scrape queue message for feed:', message.body);
          message.ack();
        } catch (err) {
          message.retry();
        }
      }
    }
  },
};
