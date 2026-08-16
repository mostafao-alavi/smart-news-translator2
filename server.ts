import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getRequestListener } from '@hono/node-server';
import apiRoutes from './src/api/routes.ts';
import { mockD1, mockKV } from './src/db/local_d1.ts';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Enable CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Adapter to route Express requests to Hono
  const fetchHandler = (req: any, env: any, ctx: any) => {
    return apiRoutes.fetch(req, {
      DB: mockD1,
      DB_ARCHIVE: mockD1,
      CACHE: mockKV,
      ...process.env,
      ...env
    }, ctx);
  };
  const honoListener = getRequestListener(fetchHandler as any);

  // Mount API
  app.use('/api', (req, res, next) => {
    honoListener(req, res);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
