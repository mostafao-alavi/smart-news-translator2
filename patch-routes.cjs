const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf-8');

const queryEndpoint = `
// POST /api/d1/query - Execute raw SQL query
api.post('/d1/query', async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query;
    if (!query) return c.json({ success: false, data: null, error: 'Query is empty' }, 400);

    const startTime = Date.now();
    let results = [];
    try {
      const res = await c.env.DB.prepare(query).all();
      results = res.results || [];
    } catch (e) {
       const res = await c.env.DB.prepare(query).run();
       results = [{ success: res.success, changes: res.meta?.changes, last_row_id: res.meta?.last_row_id }];
    }
    const duration = Date.now() - startTime;
    return c.json({ success: true, data: { results, duration }, error: null });
  } catch (err) {
    return c.json({ success: false, data: null, error: err.message }, 500);
  }
});
`;

if (!code.includes('/d1/query')) {
   code = code.replace("export default api;", queryEndpoint + "\n\nexport default api;");
   fs.writeFileSync('src/api/routes.ts', code);
   console.log('Patched src/api/routes.ts');
}
