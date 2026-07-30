const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace("return apiRoutes.fetch(req, { DB: mockD1, ...env }, ctx);", "return apiRoutes.fetch(req, { DB: mockD1, ...process.env, ...env }, ctx);");
fs.writeFileSync('server.ts', code);
