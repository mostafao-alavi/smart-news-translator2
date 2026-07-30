const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const queryEndpoint = `
// POST /api/d1/query - Mock execution for development
app.post('/api/d1/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, data: null, error: 'Query is empty' });

    const startTime = Date.now();
    let results = [];
    
    // Naive mock for the default query
    if (query.toLowerCase().includes('group by translation_status')) {
       const counts = articles.reduce((acc, a) => {
          acc[a.translation_status || 'pending'] = (acc[a.translation_status || 'pending'] || 0) + 1;
          return acc;
       }, {});
       
       results = Object.entries(counts).map(([status, total]) => ({ total, translation_status: status }));
    } else {
       // generic mock
       return res.status(400).json({ success: false, data: null, error: 'In local development (Express mock), raw SQL queries are not fully supported. Deploy to Cloudflare to use the real D1 database.' });
    }
    
    const duration = Date.now() - startTime;
    return res.json({ success: true, data: { results, duration }, error: null });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: err.message });
  }
});
`;

if (!code.includes('/api/d1/query')) {
   code = code.replace("app.listen(PORT", queryEndpoint + "\n\napp.listen(PORT");
   fs.writeFileSync('server.ts', code);
   console.log('Patched server.ts');
}
