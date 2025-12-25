#!/usr/bin/env node
/**
 * Lighthouse worker HTTP-server för SEO Analyzer
 * Kör Lighthouse i separat process för att undvika memory issues
 */
const http = require('http');
const url = require('url');
const LighthouseAnalyzer = require('./lighthouse-analyzer.js');

const PORT = parseInt(process.env.LIGHTHOUSE_WORKER_PORT || '5002', 10);
const TIMEOUT_MS = parseInt(process.env.LIGHTHOUSE_TIMEOUT_MS || '90000', 10);
const CACHE_TTL = parseInt(process.env.LIGHTHOUSE_CACHE_TTL_MS || '600000', 10);
const CONCURRENCY = parseInt(process.env.LIGHTHOUSE_CONCURRENCY || '1', 10);

// För framtida ENV-konfiguration av analyzer
const analyzer = new LighthouseAnalyzer();

const queue = [];
let active = 0;
const cache = new Map();

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(obj));
}

function keyFor(urlToTest) {
  // Enkelt cache-key baserat på URL
  return urlToTest.toLowerCase();
}

async function runJob(job) {
  const { urlToTest, res } = job;
  active++;

  // Cache-kontroll
  const k = keyFor(urlToTest);
  const cached = cache.get(k);
  if (cached && (Date.now() - cached.t) < CACHE_TTL) {
    console.log(`[lh-worker] Cache hit for ${urlToTest}`);
    active--;
    drain();
    return json(res, 200, { success: true, cached: true, data: cached.data });
  }

  // Kör analys med timeout
  console.log(`[lh-worker] Starting analysis for ${urlToTest}`);
  let timer;
  try {
    const p = analyzer.analyze(urlToTest);
    const timed = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        console.error(`[lh-worker] Timeout for ${urlToTest}`);
        reject(new Error('Analysis timeout'));
      }, TIMEOUT_MS);
      p.then(resolve, reject);
    });

    const data = await timed;
    console.log(`[lh-worker] Analysis complete for ${urlToTest}`);

    // Spara i cache
    cache.set(k, { t: Date.now(), data });

    // Rensa gamla cache-poster (enkel cleanup)
    if (cache.size > 50) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    json(res, 200, { success: true, data });
  } catch (err) {
    console.error(`[lh-worker] Analysis failed for ${urlToTest}:`, err.message);
    json(res, 500, {
      success: false,
      error: err.message || 'Analysis failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    clearTimeout(timer);
    active--;
    drain();
  }
}

function drain() {
  while (active < CONCURRENCY && queue.length > 0) {
    const next = queue.shift();
    runJob(next);
  }
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    return res.end();
  }

  // Health check
  if (req.method === 'GET' && parsed.pathname === '/health') {
    return json(res, 200, {
      ok: true,
      queue: queue.length,
      active,
      cache: cache.size,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  }

  // Status endpoint
  if (req.method === 'GET' && parsed.pathname === '/status') {
    return json(res, 200, {
      port: PORT,
      timeout: TIMEOUT_MS,
      cacheTime: CACHE_TTL,
      concurrency: CONCURRENCY,
      chrome: process.env.CHROME_PATH || 'auto-detect'
    });
  }

  // Run analysis
  if (req.method === 'POST' && parsed.pathname === '/run') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Prevent payload too large
      if (body.length > 10000) {
        res.statusCode = 413;
        res.end('Payload too large');
      }
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const urlToTest = payload.url;

        if (!urlToTest) {
          return json(res, 400, { success: false, error: 'URL is required' });
        }

        // Validate URL
        try {
          new URL(urlToTest);
        } catch {
          return json(res, 400, { success: false, error: 'Invalid URL format' });
        }

        console.log(`[lh-worker] Queue job for ${urlToTest} (queue size: ${queue.length})`);
        queue.push({ urlToTest, res });
        drain();
      } catch (e) {
        json(res, 400, { success: false, error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  // 404 for unknown routes
  json(res, 404, { success: false, error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[lh-worker] Lighthouse worker listening on http://127.0.0.1:${PORT}`);
  console.log(`[lh-worker] Config:`, {
    timeout: `${TIMEOUT_MS}ms`,
    cache: `${CACHE_TTL}ms`,
    concurrency: CONCURRENCY,
    chrome: process.env.CHROME_PATH || 'auto-detect'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[lh-worker] SIGTERM received, shutting down...');
  server.close(() => {
    console.log('[lh-worker] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[lh-worker] SIGINT received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});