import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import apiRoutes from './api/routes';
import { scraper } from './cron/scraper';
import { translator } from './cron/translator';
import { Env, ApiResponse, ScheduledEvent, ExecutionContext } from './types';

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

// Cloudflare Worker export with fetch and scheduled handlers
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
};
