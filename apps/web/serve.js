/**
 * PromoDesk web server — serves the SPA from /public with history-API fallback.
 * Any non-file path falls back to index.html so client-side routes (e.g.
 * /products, /earnings) keep working on refresh and deep links.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const API_PORT = Number(process.env.API_PORT) || 4000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  // Reverse-proxy API calls to the backend so the app is same-origin in production
  if (req.url.startsWith('/api/') || req.url.startsWith('/health')) {
    proxyToApi(req, res);
    return;
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400); res.end('Bad Request'); return;
  }

  // Resolve within PUBLIC_DIR only
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serve(filePath, res);
      return;
    }
    // SPA fallback: unknown paths without a file extension are client-side routes
    const ext = path.extname(filePath).toLowerCase();
    if (!ext) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, data) => {
        if (e2) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
});

function serve(filePath, res) {
  const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function proxyToApi(req, res) {
  const proxyReq = http.request(
    { hostname: '127.0.0.1', port: API_PORT, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${API_PORT}` } },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Service temporarily unavailable. Please try again shortly.' }));
  });
  req.pipe(proxyReq);
}

server.listen(PORT, () => {
  console.log(`PromoDesk web server running at http://localhost:${PORT}`);
});
