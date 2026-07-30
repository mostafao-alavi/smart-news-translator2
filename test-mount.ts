import express from 'express';
import { Hono } from 'hono';
import { getRequestListener } from '@hono/node-server';

const api = new Hono();
api.get('/api/hello', (c) => c.json({ message: "Hello from hono", db: c.env.DB }));

const app = express();

const fetchHandler = (req: any, env: any, ctx: any) => {
    return api.fetch(req, { DB: "MOCK_DB_INSTANCE", ...env }, ctx);
};
const honoListener = getRequestListener(fetchHandler);

app.use('/api', (req, res, next) => {
    req.url = req.originalUrl;
    honoListener(req, res);
});

const server = app.listen(3001, async () => {
    const res = await fetch("http://localhost:3001/api/hello");
    console.log(await res.json());
    server.close();
});
