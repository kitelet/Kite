/**
 * @file bin/lib/server.js
 * @description Zero-dependency development server for Kite projects.
 *
 * Features:
 *  - Static file serving with correct MIME types.
 *  - Server-Sent Events (SSE) live-reload stream at /__kite_reload.
 *  - Inlines <kite-include src="..."> at serve-time.
 *  - SPA fallback: any unmatched route returns index.html.
 *  - Error overlay injected into HTML responses.
 *  - Watches project files with fs.watch and broadcasts reload events.
 *
 * Zero third-party dependencies. Uses only Node built-ins.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── MIME Types ────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// ─── SSE Client Registry ───────────────────────────────────────────────────
const reloadClients = new Set();

/**
 * Broadcast a reload event to all connected SSE clients.
 */
function broadcastReload() {
  for (const res of reloadClients) {
    try { res.write('data: reload\n\n'); } catch (_) { reloadClients.delete(res); }
  }
}

// ─── Live Reload Snippet ───────────────────────────────────────────────────
const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  var src = new EventSource('/__kite_reload');
  src.onmessage = function() { location.reload(); };
  src.onerror = function() { src.close(); };
})();
</script>`;

// ─── Include Resolver ──────────────────────────────────────────────────────
/**
 * Recursively resolve <kite-include src="..."> tags in an HTML string.
 * @param {string} html
 * @param {string} projectRoot
 * @param {number} [depth=0]
 * @returns {string}
 */
function resolveIncludes(html, projectRoot, depth = 0) {
  if (depth > 20) return html; // Guard against circular includes
  return html.replace(/<kite-include\s+src=["']([^"']+)["']\s*(?:\/>|>(?:<\/kite-include>)?)/gi, (_match, src) => {
    const filePath = path.join(projectRoot, 'public', src.replace(/^\//, ''));
    const fallback = path.join(projectRoot, src.replace(/^\//, ''));
    const resolved = fs.existsSync(filePath) ? filePath : (fs.existsSync(fallback) ? fallback : null);
    if (!resolved) return `<!-- kite-include not found: ${src} -->`;
    try {
      const content = fs.readFileSync(resolved, 'utf8');
      return resolveIncludes(content, projectRoot, depth + 1);
    } catch (_) {
      return `<!-- kite-include read error: ${src} -->`;
    }
  });
}

// ─── Request Handler ───────────────────────────────────────────────────────
/**
 * @param {string} projectRoot
 * @param {boolean} liveReload
 */
function createHandler(projectRoot, liveReload) {
  const serveRoots = [
    path.join(projectRoot, 'public'),
    path.join(projectRoot, 'app'),
    path.join(projectRoot, 'styles'),
    path.join(projectRoot, 'plugins'),
    projectRoot,
  ];

  return function handler(req, res) {
    const url = req.url.split('?')[0];

    // SSE endpoint
    if (url === '/__kite_reload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(':ok\n\n');
      reloadClients.add(res);
      req.on('close', () => reloadClients.delete(res));
      return;
    }

    // Locate file in serve roots
    let filePath = null;
    for (const root of serveRoots) {
      const candidate = path.join(root, url === '/' ? 'index.html' : url);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        filePath = candidate;
        break;
      }
    }

    // SPA fallback
    if (!filePath) {
      const ext = path.extname(url);
      if (!ext) {
        // Looks like a route, serve index.html
        filePath = path.join(projectRoot, 'public', 'index.html');
      } else if (url === '/kite.js') {
        const pkgKiteJsCandidates = [
          path.join(projectRoot, 'node_modules', '@kitelet', 'core', 'dist', 'kite.min.js'),
          path.join(projectRoot, 'node_modules', '@kitelet', 'core', 'src', 'kite.js'),
          path.resolve(__dirname, '..', '..', 'dist', 'kite.min.js'),
          path.resolve(__dirname, '..', '..', 'src', 'kite.js')
        ];
        filePath = pkgKiteJsCandidates.find(c => fs.existsSync(c)) || null;
      } else if (url === '/kite.css') {
        const pkgKiteCssCandidates = [
          path.join(projectRoot, 'node_modules', '@kitelet', 'core', 'src', 'styles', 'kite.css'),
          path.resolve(__dirname, '..', '..', 'src', 'styles', 'kite.css')
        ];
        filePath = pkgKiteCssCandidates.find(c => fs.existsSync(c)) || null;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    let content;
    try {
      content = fs.readFileSync(filePath);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
      return;
    }

    if (ext === '.html') {
      let html = content.toString('utf8');
      html = resolveIncludes(html, projectRoot);
      if (liveReload) {
        html = html.replace('</body>', `${LIVE_RELOAD_SCRIPT}\n</body>`);
      }
      res.writeHead(200, { 'Content-Type': mime });
      res.end(html);
    } else {
      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
    }
  };
}

// ─── File Watcher ──────────────────────────────────────────────────────────
/**
 * Watch project directories and trigger live reload on changes.
 * @param {string} projectRoot
 */
function watchProject(projectRoot) {
  const watchDirs = ['public', 'app', 'styles', 'plugins'].map(d => path.join(projectRoot, d));
  for (const dir of watchDirs) {
    if (!fs.existsSync(dir)) continue;
    fs.watch(dir, { recursive: true }, (_event, filename) => {
      if (filename) broadcastReload();
    });
  }
}

// ─── Public API ────────────────────────────────────────────────────────────
/**
 * Start the Kite dev server.
 * @param {object} options
 * @param {string} options.projectRoot
 * @param {number} [options.port=3000]
 * @param {string} [options.host='localhost']
 * @param {boolean} [options.reload=true]
 * @param {boolean} [options.open=false]
 */
export function startServer({ projectRoot, port = 3000, host = 'localhost', reload = true, open = false }) {
  const handler = createHandler(projectRoot, reload);
  const server = http.createServer(handler);
  if (reload) watchProject(projectRoot);

  server.listen(port, host, () => {
    const url = `http://${host}:${port}`;
    console.log(`\n🪁 Kite Dev Server`);
    console.log(`   Local:  ${url}`);
    console.log(`   Press Ctrl+C to stop.\n`);

    if (open) {
      const cmd = process.platform === 'win32' ? `start ${url}`
                : process.platform === 'darwin' ? `open ${url}`
                : `xdg-open ${url}`;
      exec(cmd);
    }
  });

  return server;
}
