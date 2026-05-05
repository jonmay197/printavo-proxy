const https = require('https');
const http = require('http');

const EMAIL = 'jon@ftacharlotte.com';
const TOKEN = 'bgXN54ykJDHOaBrv2US4AA';
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/graphql') { res.writeHead(404); res.end('Not found'); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const auth = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');
    const options = {
      hostname: 'www.printavo.com',
      path: '/api/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const proxyReq = https.request(options, proxyRes => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });

    proxyReq.on('error', err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => console.log(`Printavo proxy running on port ${PORT}`));
