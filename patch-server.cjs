const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Find where API routes start and end
const markerStart = "// In-Memory Database";
const markerEnd = "if (process.env.NODE_ENV !== 'production') {";

const startIndex = code.indexOf(markerStart);
const endIndex = code.indexOf(markerEnd);

if (startIndex === -1 || endIndex === -1) {
   console.error("Could not find markers in server.ts");
   process.exit(1);
}

const replacementCode = `
import { getRequestListener } from '@hono/node-server';
import apiRoutes from './src/api/routes.ts';
import { mockD1 } from './src/db/local_d1.ts';

// Adapter to route Express requests to Hono
const fetchHandler = (req, env, ctx) => {
    return apiRoutes.fetch(req, { DB: mockD1, ...env }, ctx);
};
const honoListener = getRequestListener(fetchHandler);

app.use('/api', (req, res, next) => {
    // We rewrite the URL back to full originalUrl so Hono can route it
    // because Hono expects /api/sources, but Express strips /api in router usually.
    // However, since we mount using app.use('/api'), req.url is /sources.
    // getRequestListener creates a Request with http://host\${req.url}.
    // If we want it to match api.post('/sources', ...), then req.url should be /sources, which it is!
    // Wait, in routes.ts, the paths are NOT prefixed with /api! They are like api.post('/sources', ...)
    // So if Express gives us req.url = '/sources', Hono will match '/sources' perfectly!
    
    // Oh actually, getRequestListener might use req.url. 
    // Express modifies req.url to strip the mount path, so req.url = '/sources'
    // That is PERFECT for routes.ts which does not have /api prefix inside!
    honoListener(req, res);
});

`;

const newCode = code.substring(0, startIndex) + replacementCode + code.substring(endIndex);
fs.writeFileSync('server.ts', newCode);
console.log("Patched server.ts successfully");
