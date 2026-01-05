const { Worker } = require('bullmq');
const { withBrowser, withPage } = require('./browser-pool');
const { startMemoryGuard } = require('./memory-guard');
const LighthouseAnalyzer = require('../lighthouse-analyzer');
const SEOCrawler = require('../crawler');
const SecurityAnalyzer = require('./security-analyzer');
const SocialAnalyzer = require('./social-analyzer');
const SchemaAnalyzer = require('./schema-analyzer');
const DNSAnalyzer = require('./dns-analyzer');
const LinkmapAnalyzer = require('./linkmap-analyzer');
const IssueMerger = require('./issue-merger');
const SmartCrawler = require('./smart-crawler');
const SwedishContentGrader = require('./swedish-content-grader');
const { extractVisibleText } = require('./text-extractor');
const GdprAnalyzer = require('./gdpr-analyzer');
const FullSecurityAnalyzer = require('./security-analyzer-full');
const axios = require('axios');
const cheerio = require('cheerio');
const Redis = require('ioredis');

// Import queues for AI worker
const {
  lighthouseQueue,
  crawlQueue,
  seoQueue,
  gdprQueue,
  securityQueue,
  addLighthouseJob,
  addCrawlJob,
  addSeoJob,
  addGdprJob,
  addSecurityJob
} = require('./queue-manager');

// Fas 3: Import database modules
const analysisRepo = require('../src/core/analysis.repo');
const artifactStore = require('../src/core/artifact.store');

// Import change detection and rule engine
const { checkForChanges } = require('../src/core/change-detection.service');
const { analyzeWithRules } = require('../src/core/rule-engine');
const rumRepo = require('../src/core/rum.repo');

// Helper function to create detailed error responses for users
function createDetailedErrorResponse(error, url, domain) {
  const errorType = detectErrorType(error);

  if (!errorType) return null; // Let unknown errors throw normally

  return {
    version: 2,
    url: url,
    timestamp: new Date().toISOString(),
    isError: true,
    errorType: errorType.type,

    // User-friendly error display
    title: errorType.title,
    message: errorType.message,
    explanation: errorType.explanation,
    suggestions: errorType.suggestions,

    // Basic structure for compatibility
    seoScore: null,
    recommendations: [],

    // Technical details for debugging
    technicalError: error.message,
    domain: domain
  };
}

function detectErrorType(error) {
  const message = error.message.toLowerCase();

  // 403 Forbidden - Bot protection
  if (error.response?.status === 403 || message.includes('403') || message.includes('forbidden')) {
    return {
      type: 'bot_blocked',
      title: '🛡️ Bot-skydd detekterat',
      message: 'Denna webbplats blockerar automatiserade analyser',
      explanation: [
        'Sajten använder anti-bot teknologi (som Cloudflare)',
        'Skydd mot automatiserade verktyg och crawlers',
        'Detta är vanligt för stora plattformar som ChatGPT, Discord, etc.'
      ],
      suggestions: [
        'Analysera din egen webbplats istället',
        'Prova en mindre skyddad URL',
        'Använd manuella SEO-verktyg för denna sida',
        'Kontakta oss för enterprise-lösningar'
      ]
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || error.code === 'ETIMEDOUT') {
    return {
      type: 'timeout',
      title: '⏱️ Sidan svarar för långsamt',
      message: 'Webbplatsen tog för lång tid att svara (över 15 sekunder)',
      explanation: [
        'Långsam server eller hög belastning',
        'Geografiskt avstånd till servern',
        'Tunga resurser som tar tid att ladda',
        'Detta påverkar användarupplevelsen negativt'
      ],
      suggestions: [
        'Försök igen om några minuter',
        'Kontrollera sidans laddningstid manuellt',
        'Optimera serverprestanda om det är din sajt',
        'Överväg CDN för snabbare global access'
      ]
    };
  }

  // Connection refused/network errors
  if (message.includes('econnrefused') || message.includes('connection refused') ||
      message.includes('network error') || error.code === 'ECONNREFUSED') {
    return {
      type: 'connection_failed',
      title: '🔌 Kan inte ansluta till servern',
      message: 'Webbplatsen är inte tillgänglig just nu',
      explanation: [
        'Servern är nere eller otillgänglig',
        'DNS-problem eller felaktig URL',
        'Nätverksproblem mellan våra servrar',
        'Temporära serverunderhåll'
      ],
      suggestions: [
        'Kontrollera att URL:en är korrekt',
        'Försök igen om några minuter',
        'Testa sajten i din webbläsare',
        'Kontakta webbplatsens ägare om problemet kvarstår'
      ]
    };
  }

  // SSL/Certificate errors
  if (message.includes('certificate') || message.includes('ssl') || message.includes('https')) {
    return {
      type: 'ssl_error',
      title: '🔒 SSL-certifikat problem',
      message: 'Problem med webbplatsens säkerhetscertifikat',
      explanation: [
        'Ogiltigt eller utgånget SSL-certifikat',
        'Säkerhetsproblem som påverkar SEO',
        'Webbläsare kommer varna användare',
        'Google ranknar sajter med SSL-problem lägre'
      ],
      suggestions: [
        'Förnya SSL-certifikatet omedelbart',
        'Kontrollera certifikat-konfigurationen',
        'Använd verktyg som SSL Checker',
        'Detta är kritiskt för SEO och säkerhet'
      ]
    };
  }

  // 5xx Server errors
  if (error.response?.status >= 500 || message.includes('500') || message.includes('502') ||
      message.includes('503') || message.includes('504')) {
    return {
      type: 'server_error',
      title: '🚨 Server-fel detekterat',
      message: 'Webbplatsens server har tekniska problem',
      explanation: [
        'Intern server-fel (5xx status kod)',
        'Overbelastad eller felkonfigurerad server',
        'Detta påverkar SEO och användarupplevelse negativt',
        'Sökrobotar kan ha problem att indexera sidan'
      ],
      suggestions: [
        'Kontakta webbplatsens tekniska support',
        'Kontrollera server-loggar för fel',
        'Överväg server-uppgradering om din sajt',
        'Implementera felhantering och monitoring'
      ]
    };
  }

  return null; // Unknown error type
}

// Puppeteer fallback for 403-blocked sites
async function getPuppeteerHTML(url) {
  console.log(`🚗 Using Puppeteer fallback for ${url}`);

  return await withBrowser(async (browser) => {
    const page = await browser.newPage();

    // Set realistic user agent and viewport
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1366, height: 768 });

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait a bit for any dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));

      const html = await page.content();
      console.log(`✅ Puppeteer fallback successful for ${url}`);
      return html;

    } finally {
      await page.close();
    }
  });
}

// Create Redis client for state management with improved settings
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Fix Redis connection issues
  enableOfflineQueue: true,  // Queue commands when Redis is down
  connectTimeout: 10000,      // 10 seconds connection timeout
  maxRetriesPerRequest: 3,    // Retry commands up to 3 times
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
  // Keep connection alive
  keepAlive: 10000,
  noDelay: true
});

// Set Chrome path for Lighthouse - critical for Linux
if (!process.env.CHROME_PATH) {
  process.env.CHROME_PATH = '/usr/bin/chromium';
}
console.log('Queue worker using Chrome at:', process.env.CHROME_PATH);

// Worker separation: Endast PM2 instance 0 kör Lighthouse för att undvika RAM-överbelastning
const isMainInstance = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
console.log(`PM2 Instance: ${process.env.NODE_APP_INSTANCE || '0'}, Running Lighthouse: ${isMainInstance}`);

// Lighthouse worker - bara på main instance för att undvika Chrome-konflikter
let lighthouseWorker = null;
if (isMainInstance) {
  lighthouseWorker = new Worker('lighthouse', async (job) => {
    console.log(`Processing Lighthouse job ${job.id} for ${job.data.url}`);
    const startTime = Date.now();
    
    // Write initial state to Redis
    await redis.hset(`job:${job.id}`, {
      state: 'active',
      startedAt: Date.now(),
      progress: '0',
      type: 'lighthouse',
      url: job.data.url
    });
  
  let analyzer = null;
  try {
    // Uppdatera job progress
    await job.updateProgress(10);
    await redis.hset(`job:${job.id}`, { progress: '10' });
    
    // Kör Lighthouse-analys
    analyzer = new LighthouseAnalyzer();
    let result = await analyzer.analyze(job.data.url);
    
    await job.updateProgress(90);
    await redis.hset(`job:${job.id}`, { progress: '90' });
    
    // Enhance result with Rule Engine analysis
    try {
      console.log(`🧠 Running Rule Engine for analysis ${job.data.analysisId}`);
      const ruleAnalysis = await analyzeWithRules(job.data.analysisId, result);
      
      // Add rule engine results to the main result
      if (ruleAnalysis && ruleAnalysis.actionableList) {
        result.ruleEngine = {
          summary: ruleAnalysis.summary,
          actionableList: ruleAnalysis.actionableList,
          totalActions: ruleAnalysis.totalActions
        };
        console.log(`✅ Added ${ruleAnalysis.totalActions} rule-based recommendations`);
      }
    } catch (ruleError) {
      console.warn(`⚠️ Rule Engine failed for ${job.data.analysisId}:`, ruleError.message);
      // Continue without rule engine - don't fail the job
    }
    
    // Get RUM data if available
    try {
      if (job.data.url) {
        const rumData = await rumRepo.getRumStats(job.data.url);
        if (rumData && rumData.metrics) {
          result.rum = {
            p75: rumData.metrics,
            samples: rumData.sampleSize,
            days: rumData.period.days
          };
          console.log(`📊 Added RUM data with ${rumData.sampleSize} samples`);
        }
      }
    } catch (rumError) {
      console.warn(`⚠️ RUM data fetch failed:`, rumError.message);
      // Continue without RUM data
    }
    
    // Run Change Detection
    try {
      if (job.data.url) {
        console.log(`🔍 Running Change Detection for ${job.data.url}`);
        const changeData = await checkForChanges({
          targetUrl: job.data.url,
          url: job.data.url,
          type: 'lighthouse',
          result
        });
        if (changeData && changeData.changes && changeData.changes.length > 0) {
          result.changeDetection = {
            changes: changeData.changes,
            summary: changeData.summary,
            lastCheck: new Date().toISOString()
          };
          console.log(`⚠️ Detected ${changeData.changes.length} changes`);
        }
      }
    } catch (changeError) {
      console.warn(`⚠️ Change Detection failed:`, changeError.message);
      // Continue without change detection
    }
    
    // Add schema version
    result.schemaVersion = result.schemaVersion || 2;
    
    await job.updateProgress(100);
    await redis.hset(`job:${job.id}`, { progress: '100' });
    console.log(`Lighthouse job ${job.id} completed in ${Date.now() - startTime}ms`);
    
    // Fas 3: Save to database if enabled and analysisId exists
    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        console.log(`💾 Updating Lighthouse analysis ${job.data.analysisId} in database`);
        
        // Create summary for database using new Lighthouse format
        const coreWebVitals = result.coreWebVitals || {};

        // Use new format field names from lighthouse-analyzer.js
        const performance = result.performanceScore || result.performance || 0;
        const accessibility = result.accessibilityScore || result.accessibility || 0;
        const seo = result.seoScore || result.seo || 0;
        const bestPractices = result.bestPracticesScore || result.bestPractices || 0;

        // Extract performance metrics from coreWebVitals object
        const lcp = coreWebVitals.lcp?.value || 0;
        const fcp = coreWebVitals.fcp?.value || 0;
        const cls = coreWebVitals.cls?.value || 0;
        const inp = coreWebVitals.inp?.value || null; // Use INP instead of FID
        const tti = coreWebVitals.tti?.value || 0;
        const tbt = coreWebVitals.tbt?.value || 0;
        const ttfb = coreWebVitals.ttfb?.value || 0;
        const speedIndex = coreWebVitals.speedIndex?.value || 0;

        // Count issues from opportunities (new format - array instead of object)
        const opportunities = result.opportunities || [];
        const issueCount = opportunities.filter(opp => opp.score < 0.5).length;
        const warningCount = opportunities.filter(opp => opp.score >= 0.5 && opp.score < 0.9).length;

        const summary = {
          score: performance, // Use the overall performance score
          issues: issueCount,
          warnings: warningCount,
          completedAt: new Date().toISOString(),
          performance: {
            overall: performance,
            accessibility: accessibility,
            seo: seo,
            bestPractices: bestPractices,
            fcp: fcp,
            lcp: lcp,
            cls: cls,
            inp: inp, // Store INP instead of FID
            tti: tti,
            tbt: tbt,
            ttfb: ttfb,
            speedIndex: speedIndex
          }
        };

        // KRITISK ORDNING: Spara resultat FÖRE status sätts till completed
        // Annars får frontend "completed" men inga resultat (race condition)
        try {
          await analysisRepo.setResults(job.data.analysisId, summary);
          console.log(`💾 DB results uppdaterade för ${job.data.analysisId}`);
          
          // NU kan vi sätta status till completed (efter data finns)
          await analysisRepo.updateStatus(job.data.analysisId, 'completed', summary);
        } catch (e) {
          console.error('❌ Misslyckades spara results till DB:', e?.message);
          // Om results-sparning misslyckas, sätt ändå completed med bara summary
          await analysisRepo.updateStatus(job.data.analysisId, 'completed', summary);
        }

        // Store raw results as artifact (use analysis createdAt for correct date folder)
        const analysis = await analysisRepo.getById(job.data.analysisId);
        const artifactKey = artifactStore.generateKeyWithDate(job.data.analysisId, 'lighthouse-results', analysis.createdAt, 'json');
        await artifactStore.put(artifactKey, result, 'application/json');
        
        console.log(`✅ Lighthouse analysis ${job.data.analysisId} updated in database and artifacts`);
        
        // 📊 Log analysis metrics
        const durationMs = Date.now() - startTime;
        const analysisDomain = new URL(job.data.url).hostname;
        console.log(`📊 METRICS [Lighthouse]: domain=${analysisDomain}, score=${performance}, issuesCount=${issueCount}, durationMs=${durationMs}`);
        
        // Return result with analysis ID for frontend
        return { ...result, analysisId: job.data.analysisId };
        
      } catch (dbError) {
        console.error(`❌ Failed to save Lighthouse analysis to database:`, dbError);
        // Continue without database - don't fail the job
        return result;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Lighthouse job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, error.message);
    
    // Logga olika typer av fel för bättre debugging
    if (error.message.includes('performance mark')) {
      console.log(`Chrome performance mark conflict för job ${job.id} - kommer försöka igen`);
    } else if (error.message.includes('Chrome')) {
      console.log(`Chrome process error för job ${job.id} - kommer försöka igen`);
    }
    
    throw error;
  } finally {
    // Explicit cleanup efter Lighthouse-jobb
    analyzer = null;
    
    // Force garbage collection om tillgänglig
    if (global.gc) {
      console.log(`Running garbage collection after Lighthouse job ${job.id}`);
      global.gc();
    }
    
    // Extra cleanup av temp-filer
    try {
      const os = require('os');
      const fs = require('fs').promises;
      const tempDir = os.tmpdir();
      
      // Rensa gamla lighthouse temp-directories (äldre än 1 timme)
      const entries = await fs.readdir(tempDir);
      const lighthouseEntries = entries.filter(entry => entry.startsWith('lighthouse-'));
      
      for (const entry of lighthouseEntries) {
        try {
          const entryPath = require('path').join(tempDir, entry);
          const stats = await fs.stat(entryPath);
          const hourAgo = Date.now() - (60 * 60 * 1000);
          
          if (stats.mtime.getTime() < hourAgo) {
            await fs.rm(entryPath, { recursive: true, force: true });
            console.log(`Cleaned up old temp directory: ${entry}`);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors för individual directories
        }
      }
    } catch (tempCleanupError) {
      console.log('Temp cleanup warning:', tempCleanupError.message);
    }
  }
  }, {
    connection: { host: 'localhost', port: 6379, password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd' },
    concurrency: 1  // Endast 1 samtidig Lighthouse-analys per instance
  });
  
  // Worker event handlers for state management
  lighthouseWorker.on('completed', async (job, result) => {
    // Use the analysisId from job.data which was set when job was created
    const resultId = job.data.analysisId || result?.analysisId || `lighthouse_${job.id}_${Date.now()}`;
    const prevState = await redis.hget(`job:${job.id}`, 'state');
    await redis.hset(`job:${job.id}`, {
      state: 'completed',
      progress: '100',
      resultId: String(resultId),
      completedAt: Date.now()
    });
    console.log(`🔄 STATE TRANSITION [Lighthouse ${job.id}]: ${prevState} → completed (resultId: ${resultId})`);
  });
  
  lighthouseWorker.on('failed', async (job, err) => {
    const prevState = await redis.hget(`job:${job.id}`, 'state');
    await redis.hset(`job:${job.id}`, {
      state: 'failed',
      error: err?.message || 'Unknown error',
      failedAt: Date.now()
    });
    console.log(`🔄 STATE TRANSITION [Lighthouse ${job.id}]: ${prevState} → failed (error: ${err?.message})`);
  });
  
  lighthouseWorker.on('progress', async (job, progress) => {
    await redis.hset(`job:${job.id}`, { progress: String(progress) });
    console.log(`📊 PROGRESS UPDATE [Lighthouse ${job.id}]: ${progress}%`);
  });
  
  lighthouseWorker.on('active', async (job) => {
    const prevState = await redis.hget(`job:${job.id}`, 'state');
    if (prevState !== 'active') {
      console.log(`🔄 STATE TRANSITION [Lighthouse ${job.id}]: ${prevState} → active (worker picked up job)`);
    }
  });
} else {
  console.log(`Instance ${process.env.NODE_APP_INSTANCE} skipping Lighthouse worker creation`);
}

// Crawl worker – styrs av ENV eller main-instans
let crawlWorker = null;
const ENABLE_CRAWL_WORKER =
  process.env.ENABLE_CRAWL_WORKER === 'true' || isMainInstance;
if (ENABLE_CRAWL_WORKER) {
  console.log(`🕷️ Creating Crawl worker (enabled=${ENABLE_CRAWL_WORKER}, isMainInstance=${isMainInstance})`);
  crawlWorker = new Worker('crawl', async (job) => {
    console.log(`Processing Crawl job ${job.id} for ${job.data.url}`);
    const startTime = Date.now();
    // Minimal container så downstream-kod (RUM/Rules/ChangeDetection) kan skriva in resultat
    let result = {};
    
    // Write initial state to Redis
    await redis.hset(`job:${job.id}`, {
      state: 'active',
      startedAt: Date.now(),
      progress: '0',
      type: 'crawl',
      url: job.data.url
    });
    
    try {
    await job.updateProgress(10);
    await redis.hset(`job:${job.id}`, { progress: '10' });
    
    // Initialize SmartCrawler for better error handling
    const smartCrawler = new SmartCrawler({
      maxRetries: 3,
      initialTimeout: 15000,
      maxTimeout: 30000,
      userAgent: 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0; +https://seoanalyze.se)'
    });

    const crawler = new SEOCrawler(job.data.url, {
      maxPages: job.data.maxPages || 100,
      timeout: 15000,  // Increased from 5000ms to 15000ms for slower sites
      smartCrawler: smartCrawler, // Pass SmartCrawler to SEOCrawler
      enablePuppeteerFallback: process.env.ENABLE_CRAWL_PUPPETEER_FALLBACK === 'true',
      puppeteerMinLinks: parseInt(process.env.CRAWL_PUPPETEER_MIN_LINKS || '10', 10),
      progressCallback: async (pagesCompleted) => {
        // Update job progress in both BullMQ and Redis
        await job.updateProgress(pagesCompleted);
        await redis.hset(`job:${job.id}`, { progress: String(pagesCompleted) });
      }
    });
    
    // Kör crawl med progress updates
    const crawlStartTime = new Date();
    const results = await crawler.crawl();
    const crawlEndTime = new Date();
    
    // Skapa sammanfattning
    const pages = results;
    const issues = {
      missingTitles: [],
      missingMetaDescriptions: [],
      missingH1: [],
      thinContent: [],
      brokenLinks: [],
      brokenImages: [],
      imagesWithoutAlt: []
    };
    
    let totalSize = 0;
    
    pages.forEach(page => {
      if (page.title === 'Missing') {
        issues.missingTitles.push(page.url);
      }
      if (page.metaDescription === 'Missing') {
        issues.missingMetaDescriptions.push(page.url);
      }
      if (page.h1Count === 0) {
        issues.missingH1.push(page.url);
      }
      if (page.wordCount < 300) {
        issues.thinContent.push({ url: page.url, wordCount: page.wordCount });
      }
      if (page.brokenLinks && page.brokenLinks.length > 0) {
        page.brokenLinks.forEach(link => {
          issues.brokenLinks.push({
            sourceUrl: page.url,
            targetUrl: link.url,
            statusCode: link.status
          });
        });
      }
      if (page.brokenImages && page.brokenImages.length > 0) {
        page.brokenImages.forEach(img => {
          issues.brokenImages.push({
            pageUrl: page.url,
            src: img.src,
            status: img.status
          });
        });
      }
      
      page.images?.forEach(img => {
        if (!img.hasAlt) {
          issues.imagesWithoutAlt.push({
            pageUrl: page.url,
            src: img.src
          });
        }
      });
      
      if (page.pageSize) {
        totalSize += page.pageSize;
      }
    });
    
    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
    
    // ✨ NEW: Link Map Analysis
    const linkmapAnalysis = LinkmapAnalyzer.analyzeLinkmap({ pages }, job.data.url);
    
    // ✨ NEW: Smart Crawler Error Stats
    const errorStats = smartCrawler.getErrorStats();
    
    const summary = {
      url: job.data.url,
      pagesAnalyzed: pages.length,
      totalIssues,
      sitemapFound: crawler.sitemapUrls.length > 0,
      robotsFound: crawler.robotsTxt !== null,
      avgPageSize: pages.length > 0 ? Math.round(totalSize / pages.length) : 0,
      totalSize: totalSize,
      issues,
      linkmap: linkmapAnalysis,
      errorStats: errorStats, // NEW: Smart crawler error statistics
      quickActions: generateQuickActions(issues, crawler),
      // Crawl metadata fields for frontend display
      startTime: crawlStartTime.toISOString(),
      durationMs: crawlEndTime.getTime() - crawlStartTime.getTime(),
      userAgent: process.env.CRAWL_USER_AGENT || 'Mozilla/5.0 (compatible; SEOAnalyzeBot/1.0; +https://seoanalyze.se/bot)',
      maxDepth: job.data.maxDepth || null,
      concurrency: parseInt(process.env.CRAWL_CONCURRENCY || '5', 10)
    };
    
    // Enhance result with Rule Engine analysis
    try {
      console.log(`🧠 Running Rule Engine for crawl analysis ${job.data.analysisId}`);
      // Skicka ett explicit underlag – undvik beroende på global 'result'
      const baseForRules = { pages, summary };
      const ruleAnalysis = await analyzeWithRules(job.data.analysisId, baseForRules);
      
      // Add rule engine results to the main result
      if (ruleAnalysis && ruleAnalysis.actionableList) {
        result.ruleEngine = {
          summary: ruleAnalysis.summary,
          actionableList: ruleAnalysis.actionableList,
          totalActions: ruleAnalysis.totalActions
        };
        console.log(`✅ Added ${ruleAnalysis.totalActions} rule-based recommendations`);
      }
    } catch (ruleError) {
      console.warn(`⚠️ Rule Engine failed for crawl ${job.data.analysisId}:`, ruleError.message);
      // Continue without rule engine - don't fail the job
    }
    
    // Get RUM data if available
    try {
      if (job.data.url) {
        const rumData = await rumRepo.getRumStats(job.data.url);
        if (rumData && rumData.metrics) {
          result.rum = {
            p75: rumData.metrics,
            samples: rumData.sampleSize,
            days: rumData.period.days
          };
          console.log(`📊 Added RUM data with ${rumData.sampleSize} samples`);
        }
      }
    } catch (rumError) {
      console.warn(`⚠️ RUM data fetch failed:`, rumError.message);
      // Continue without RUM data
    }
    
    // Run Change Detection for crawl
    try {
      if (job.data.url) {
        console.log(`🔍 Running Change Detection for crawl ${job.data.url}`);
        const changeData = await checkForChanges({
          targetUrl: job.data.url,
          url: job.data.url,
          type: 'crawl',
          result
        });
        if (changeData && changeData.changes && changeData.changes.length > 0) {
          result.changeDetection = {
            changes: changeData.changes,
            summary: changeData.summary,
            lastCheck: new Date().toISOString()
          };
          console.log(`⚠️ Detected ${changeData.changes.length} crawl changes`);
        }
      }
    } catch (changeError) {
      console.warn(`⚠️ Change Detection failed for crawl:`, changeError.message);
      // Continue without change detection
    }
    
    await job.updateProgress(100);
    await redis.hset(`job:${job.id}`, { progress: '100' });
    console.log(`Crawl job ${job.id} completed in ${Date.now() - startTime}ms`);
    
    // Fas 3: Save to database if enabled and analysisId exists
    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        console.log(`💾 Updating Crawl analysis ${job.data.analysisId} in database`);
        
        // Create summary for database
        const dbSummary = {
          score: Math.max(0, Math.min(100, 100 - (totalIssues * 2))), // Score based on issues found
          issues: totalIssues,
          warnings: Math.floor(totalIssues * 0.3), // Assume 30% are warnings
          completedAt: new Date().toISOString(),
          performance: {
            pagesAnalyzed: pages.length,
            avgPageSize: pages.length > 0 ? Math.round(totalSize / pages.length) : 0,
            totalSize: totalSize,
            brokenLinks: issues.brokenLinks.length,
            sitemapFound: crawler.sitemapUrls.length > 0,
            robotsFound: crawler.robotsTxt !== null
          }
        };

        // Bygg EN enriched payload som används överallt (DB + artefakt)
        const enrichedResult = {
          pages,
          summary,
          // IMPORTANT: Include linkmap data that frontend expects!
          linkmap: summary.linkmap || linkmapAnalysis || {},
          // Include technical SEO data
          sitemap: {
            present: crawler.sitemapUrls.length > 0,
            urls: crawler.sitemapUrls || [],
            urlCount: crawler.sitemapUrls?.length || 0
          },
          robotsTxt: {
            present: crawler.robotsTxt !== null
          },
          technical: {
            sitemap: {
              present: crawler.sitemapUrls.length > 0,
              urls: crawler.sitemapUrls || []
            },
            robotsTxt: {
              present: crawler.robotsTxt !== null
            }
          }
        };
        enrichedResult.schemaVersion = 2; // håll samma som Lighthouse
        if (result?.rum) enrichedResult.rum = result.rum;
        if (result?.changeDetection) enrichedResult.changeDetection = result.changeDetection;
        if (result?.ruleEngine) enrichedResult.ruleEngine = result.ruleEngine;

        // KRITISK ORDNING: Spara resultat FÖRE status sätts till completed
        try {
          await analysisRepo.setResults(job.data.analysisId, enrichedResult);
          console.log(`💾 DB results uppdaterade för crawl ${job.data.analysisId}`);
          
          // NU kan vi sätta status till completed (efter data finns)
          await analysisRepo.updateStatus(job.data.analysisId, 'completed', dbSummary);
        } catch (e) {
          console.error('❌ Misslyckades spara crawl results till DB:', e?.message);
          // Om results-sparning misslyckas, sätt ändå completed med bara summary
          await analysisRepo.updateStatus(job.data.analysisId, 'completed', dbSummary);
        }

        // 2) Skriv SAMMA enriched till artefakten (så nedladdad JSON matchar API:t)
        const crawlAnalysis = await analysisRepo.getById(job.data.analysisId);
        const artifactKey = artifactStore.generateKeyWithDate(job.data.analysisId, 'crawl-results', crawlAnalysis.createdAt, 'json');
        await artifactStore.put(artifactKey, enrichedResult, 'application/json');
        
        console.log(`✅ Crawl analysis ${job.data.analysisId} updated in database and artifacts`);
        
        // 📊 Log analysis metrics
        const durationMs = Date.now() - startTime;
        const analysisDomain = new URL(job.data.url).hostname;
        console.log(`📊 METRICS [Crawl]: domain=${analysisDomain}, score=${dbSummary.score}, issuesCount=${totalIssues}, durationMs=${durationMs}, pagesCount=${pages.length}`);
        
        // Return result with analysis ID for frontend
        return { pages, summary, analysisId: job.data.analysisId };
        
      } catch (dbError) {
        console.error(`❌ Failed to save Crawl analysis to database:`, dbError);
        // Continue without database - don't fail the job
        return { pages, summary };
      }
    }
    
    return { pages, summary };
  } catch (error) {
    console.error(`Crawl job ${job.id} failed:`, error);
    throw error;
  }
  }, {
    connection: { host: 'localhost', port: 6379, password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd' },
    concurrency: 1  // Endast 1 samtidig Crawl för systemstabilitet
  });
  
  // Worker event handlers for state management
  crawlWorker.on('completed', async (job, result) => {
    // Use the analysisId from job.data which was set when job was created
    const resultId = job.data.analysisId || result?.analysisId || `crawl_${job.id}_${Date.now()}`;
    const prevState = await redis.hget(`job:${job.id}`, 'state');
    await redis.hset(`job:${job.id}`, {
      state: 'completed',
      progress: '100',
      resultId: String(resultId),
      completedAt: Date.now()
    });
    console.log(`🔄 STATE TRANSITION [Crawl ${job.id}]: ${prevState} → completed (resultId: ${resultId})`);
  });
  
  crawlWorker.on('failed', async (job, err) => {
    const prevState = await redis.hget(`job:${job.id}`, 'state');
    await redis.hset(`job:${job.id}`, {
      state: 'failed',
      error: err?.message || 'Unknown error',
      failedAt: Date.now()
    });
    console.log(`🔄 STATE TRANSITION [Crawl ${job.id}]: ${prevState} → failed (error: ${err?.message})`);
  });
  
  crawlWorker.on('progress', async (job, progress) => {
    await redis.hset(`job:${job.id}`, { progress: String(progress) });
    console.log(`📊 PROGRESS UPDATE [Crawl ${job.id}]: ${progress} pages crawled`);
  });
  
  crawlWorker.on('active', async (job) => {
    const prevState = await redis.hget(`job:${job.id}`, 'state');
    if (prevState !== 'active') {
      console.log(`🔄 STATE TRANSITION [Crawl ${job.id}]: ${prevState} → active (worker picked up job)`);
    }
  });
} else {
  console.log(`Instance ${process.env.NODE_APP_INSTANCE} skipping Crawl worker creation`);
}

// SEO Analysis worker med BullMQ
const seoWorker = new Worker('seo', async (job) => {
  console.log(`Processing SEO job ${job.id} for ${job.data.url}`);
  const startTime = Date.now();
  
  // Write initial state to Redis
  await redis.hset(`job:${job.id}`, {
    state: 'active',
    startedAt: Date.now(),
    progress: '0',
    type: 'seo',
    url: job.data.url
  });
  
  try {
    await job.updateProgress(10);
    await redis.hset(`job:${job.id}`, { progress: '10' });
    
    // Hämta HTML (med Puppeteer fallback för 403-fel)
    let html;
    let response;
    try {
      response = await axios.get(job.data.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analyzer/1.0; +https://seoanalyze.se)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      html = response.data;
    } catch (axiosError) {
      if (axiosError.response?.status === 403) {
        console.log(`🚗 403 detected for ${job.data.url}, trying Puppeteer fallback...`);
        await job.updateProgress(15);
        await redis.hset(`job:${job.id}`, { progress: '15' });

        try {
          html = await getPuppeteerHTML(job.data.url);
        } catch (puppeteerError) {
          console.error(`❌ Puppeteer fallback also failed:`, puppeteerError.message);
          throw axiosError; // Use original axios error for error response
        }
      } else {
        throw axiosError; // Re-throw non-403 errors
      }
    }

    await job.updateProgress(30);
    await redis.hset(`job:${job.id}`, { progress: '30' });
    console.log(`DEBUG: HTML retrieved for ${job.data.url}, HTML sample=${html.substring(0, 200).replace(/\s+/g, ' ')}`);
    const $ = cheerio.load(html);
    
    // Kör SEO-analys (samma kod som i server.js /api/analyze)
    let result = await performSeoAnalysis(html, job.data.url);

    // Check if Puppeteer fallback is needed for links (ENV-controlled)
    if (process.env.ENABLE_SEO_PUPPETEER_FALLBACK === 'true' &&
        result.links &&
        (result.links.internal || 0) + (result.links.external || 0) < parseInt(process.env.SEO_PUPPETEER_MIN_LINKS || '1', 10)) {
      console.log(`🔄 SEO: No links found with Axios, trying Puppeteer fallback...`);
      try {
        const puppeteerHtml = await getPuppeteerHTML(job.data.url);
        const puppeteerResult = await performSeoAnalysis(puppeteerHtml, job.data.url);

        // Keep Puppeteer result if it has more links
        const puppeteerLinkCount = (puppeteerResult.links?.internal || 0) + (puppeteerResult.links?.external || 0);
        const originalLinkCount = (result.links?.internal || 0) + (result.links?.external || 0);

        if (puppeteerLinkCount > originalLinkCount) {
          console.log(`✅ SEO: Puppeteer found ${puppeteerLinkCount} links vs ${originalLinkCount}, using Puppeteer result`);
          result = puppeteerResult;
        }
      } catch (puppeteerError) {
        console.warn(`⚠️ SEO: Puppeteer fallback failed:`, puppeteerError.message);
      }
    }
    
    // A1: Security Headers Analysis (only if enabled)
    if (process.env.ANALYZERS_SECURITY_ENABLED === 'true' && response?.headers) {
      try {
        const isHttps = job.data.url.startsWith('https://');
        const securityAnalysis = SecurityAnalyzer.analyzeHeaders(response.headers, isHttps);
        if (securityAnalysis && Object.keys(securityAnalysis).length) {
          result.security = securityAnalysis;
        }
      } catch (err) {
        console.warn('Security analysis failed:', err.message);
      }
    }
    
    // A2: DNS Security Analysis (only if enabled)
    if (process.env.ANALYZERS_DNS_ENABLED === 'true') {
      try {
        const domain = new URL(job.data.url).hostname;
        const dnsAnalysis = await DNSAnalyzer.analyzeDNSSecurity(domain);
        if (dnsAnalysis && Object.keys(dnsAnalysis).length) {
          result.dns = dnsAnalysis;
        }
      } catch (err) {
        console.warn('DNS analysis failed:', err.message);
      }
    }
    
    // A3: Social Media Analysis (only if enabled)
    if (process.env.ANALYZERS_SOCIAL_ENABLED === 'true') {
      try {
        const socialAnalysis = SocialAnalyzer.analyzeSocialTags($, job.data.url);
        if (socialAnalysis && Object.keys(socialAnalysis).length) {
          result.social = socialAnalysis;
        }
      } catch (err) {
        console.warn('Social analysis failed:', err.message);
      }
    }
    
    // A4: Schema.org Analysis (only if enabled)
    if (process.env.ANALYZERS_SCHEMA_ENABLED === 'true') {
      try {
        const schemaAnalysis = SchemaAnalyzer.analyzeSchema($, job.data.url);
        if (schemaAnalysis && Object.keys(schemaAnalysis).length) {
          result.schema = schemaAnalysis;
        }
      } catch (err) {
        console.warn('Schema analysis failed:', err.message);
      }
    }
    
    // A5: Build Actionables list (only if enabled)
    if (process.env.ANALYZERS_ACTIONABLES_ENABLED === 'true') {
      try {
        const actionables = [];
        
        // Add security actionables
        if (result.security) {
          if (!result.security.hsts?.present) {
            actionables.push({
              id: 'sec-hsts',
              title: 'HSTS header saknas',
              severity: 'high',
              category: 'security',
              evidence: 'Strict-Transport-Security header hittades inte',
              fix: 'Lägg till: Strict-Transport-Security: max-age=31536000; includeSubDomains'
            });
          }
          if (!result.security.csp?.present) {
            actionables.push({
              id: 'sec-csp',
              title: 'Content Security Policy saknas',
              severity: 'medium',
              category: 'security',
              evidence: 'CSP header skyddar mot XSS-attacker',
              fix: "Lägg till Content-Security-Policy med lämpliga direktiv"
            });
          }
        }
        
        // Add DNS actionables
        if (result.dns) {
          if (result.dns.spf?.status === 'missing') {
            actionables.push({
              id: 'dns-spf',
              title: 'SPF-post saknas',
              severity: 'medium',
              category: 'dns',
              evidence: 'Ingen SPF TXT-post hittades',
              fix: 'Lägg till SPF TXT-post: v=spf1 include:_spf.google.com ~all'
            });
          }
          if (result.dns.dmarc?.status === 'missing') {
            actionables.push({
              id: 'dns-dmarc',
              title: 'DMARC-policy saknas',
              severity: 'low',
              category: 'dns',
              evidence: 'Ingen DMARC TXT-post hittades',
              fix: 'Lägg till _dmarc TXT-post: v=DMARC1; p=quarantine; rua=mailto:dmarc@din-domän.se'
            });
          }
        }
        
        // Add social actionables
        if (result.social?.openGraph?.missing?.length > 0) {
          actionables.push({
            id: 'social-og',
            title: 'Open Graph-taggar saknas',
            severity: 'low',
            category: 'social',
            evidence: `Saknade: ${result.social.openGraph.missing.join(', ')}`,
            fix: 'Lägg till Open Graph meta-taggar för bättre delning på sociala medier'
          });
        }
        
        // Add schema actionables
        if (result.schema && !result.schema.present) {
          actionables.push({
            id: 'schema-missing',
            title: 'Strukturerad data saknas',
            severity: 'low',
            category: 'schema',
            evidence: 'Ingen Schema.org eller JSON-LD hittades',
            fix: 'Lägg till strukturerad data för bättre sökresultat'
          });
        }
        
        // Truncate to max 50 actionables
        if (actionables.length > 0) {
          result.actionables = actionables.slice(0, 50);
        }
      } catch (err) {
        console.warn('Actionables generation failed:', err.message);
      }
    }
    
    await job.updateProgress(90);
    await redis.hset(`job:${job.id}`, { progress: '90' });

    // Fetch analysis from DB once for use in screenshots and final save
    let seoAnalysis = null;
    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        seoAnalysis = await analysisRepo.getById(job.data.analysisId);
      } catch (err) {
        console.warn(`Failed to fetch analysis ${job.data.analysisId}:`, err.message);
      }
    }

    // Screenshots (robust + loggar)
    const screenshotEnabled = String(process.env.ANALYZERS_SCREENSHOT_ENABLED).toLowerCase() === 'true';
    if (screenshotEnabled && job.data.analysisId && seoAnalysis) {
      const screenshotErrors = [];
      let desktopOk = false, mobileOk = false;
      try {
        console.log(`[SCREENSHOT] start id=${job.data.analysisId} url=${job.data.url}`);
        
        await withBrowser(async (browser) => {
          // Desktop (1366x768)
          const desktopPage = await browser.newPage();
          try {
            await desktopPage.setViewport({ width: 1366, height: 768 });
            // Vanlig Chrome-profil + svenska
            await desktopPage.setUserAgent(
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
            );
            await desktopPage.setExtraHTTPHeaders({
              'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7'
            });
            try {
              await desktopPage.goto(job.data.url, { waitUntil: 'networkidle2', timeout: 30000 });
            } catch {
              await desktopPage.goto(job.data.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            }
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const desktopBuffer = await desktopPage.screenshot({
              type: 'png',
              fullPage: false,
              clip: { x: 0, y: 0, width: 1366, height: 768 }
            });
            
            const desktopKey = artifactStore.generateKeyWithDate(job.data.analysisId, 'screenshots/desktop', seoAnalysis.createdAt, 'png');
            await artifactStore.put(desktopKey, desktopBuffer, 'image/png');
            console.log(`[SCREENSHOT] desktop OK key=${desktopKey}`);
            desktopOk = true;
          } finally {
            await desktopPage.close();
          }
          
          // Mobile (375x812, iPhone X)
          const mobilePage = await browser.newPage();
          try {
            await mobilePage.emulate({
              name: 'iPhone X',
              userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
              viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }
            });
            await mobilePage.setExtraHTTPHeaders({
              'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7'
            });
            
            try {
              await mobilePage.goto(job.data.url, { waitUntil: 'networkidle2', timeout: 30000 });
            } catch {
              await mobilePage.goto(job.data.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            }
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mobileBuffer = await mobilePage.screenshot({
              type: 'png',
              fullPage: false,
              clip: { x: 0, y: 0, width: 375, height: 812 }
            });
            
            const mobileKey = artifactStore.generateKeyWithDate(job.data.analysisId, 'screenshots/mobile', seoAnalysis.createdAt, 'png');
            await artifactStore.put(mobileKey, mobileBuffer, 'image/png');
            console.log(`[SCREENSHOT] mobile OK key=${mobileKey}`);
            mobileOk = true;
          } finally {
            await mobilePage.close();
          }
        });
        
        // Lägg in fält (även om något misslyckades)
        if (!result.version) result.version = 2;
        result.screenshots = {
          desktop: desktopOk ? 'screenshots/desktop.png' : null,
          mobile:  mobileOk  ? 'screenshots/mobile.png'  : null,
        };
        result.debug = { ...(result.debug||{}), screenshot: { enabled: screenshotEnabled, desktopOk, mobileOk } };
      } catch (err) {
        screenshotErrors.push(err?.message || String(err));
        console.warn('[SCREENSHOT] failed (non-blocking):', err?.message || err);
        result.screenshots = { desktop: null, mobile: null };
        result.debug = { ...(result.debug||{}), screenshot: { enabled: screenshotEnabled, errors: screenshotErrors } };
      }
    }
    
    // Fas 3: Save results to database and artifacts (if enabled)
    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        // Create summary for quick access
        const summary = {
          score: result.seoScore || 0,
          issues: result.issues?.length || 0,
          warnings: result.warnings?.length || 0,
          performance: result.performance || {},
          completedAt: new Date()
        };
        
        // Save full results as artifact FÖRE status uppdateras (use analysis createdAt for correct date folder)
        // seoAnalysis already fetched at line ~1086
        const artifactKey = artifactStore.generateKeyWithDate(job.data.analysisId, 'seo-results', seoAnalysis.createdAt, 'json');
        await artifactStore.put(artifactKey, result, 'application/json');

        // KRITISK: Sätt status till completed EFTER data sparats
        await analysisRepo.updateStatus(job.data.analysisId, 'completed', summary);
        
        console.log(`💾 Saved SEO analysis ${job.data.analysisId} to database and artifacts`);

        // 🔍 Run change detection on completed analysis
        try {
          const changeResult = await checkForChanges({
            targetUrl: job.data.url,
            crawl: result.crawl,
            robots: result.robots,
            url: job.data.url
          });
          
          if (changeResult.changesDetected > 0) {
            console.log(`🚨 ${changeResult.changesDetected} SEO changes detected for ${job.data.url}`);
          } else if (changeResult.isFirstSnapshot) {
            console.log(`📸 First snapshot created for change monitoring: ${job.data.url}`);
          }
        } catch (changeError) {
          console.error('Change detection failed (non-blocking):', changeError.message);
        }

      } catch (dbError) {
        console.error('Failed to save SEO results to database:', dbError);
        // Continue anyway - don't fail the job if DB save fails
      }
    }
    
    await job.updateProgress(100);
    await redis.hset(`job:${job.id}`, { progress: '100' });
    console.log(`SEO job ${job.id} completed in ${Date.now() - startTime}ms`);
    
    // 📊 Log analysis metrics
    const durationMs = Date.now() - startTime;
    const analysisDomain = new URL(job.data.url).hostname;
    const score = result.seoScore || result.score || 0;
    const issuesCount = (result.issues || []).length;
    console.log(`📊 METRICS [SEO]: domain=${analysisDomain}, score=${score}, issuesCount=${issuesCount}, durationMs=${durationMs}`);
    
    // Return result with analysis ID for frontend (if database save occurred)
    if (job.data.analysisId && analysisRepo.isEnabled) {
      return { ...result, analysisId: job.data.analysisId };
    }
    
    return result;
  } catch (error) {
    console.error(`SEO job ${job.id} failed:`, error);

    // Smart error handling with detailed user messages
    const url = job.data.url;
    const domain = new URL(url).hostname;

    // Create helpful error response instead of just failing
    const errorResponse = createDetailedErrorResponse(error, url, domain);

    if (errorResponse) {
      // Update progress to 100% so it doesn't hang in queue
      await job.updateProgress(100);
      await redis.hset(`job:${job.id}`, { progress: '100' });

      return errorResponse;
    }

    throw error;
  }
}, {
  connection: { host: 'localhost', port: 6379, password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd' },
  concurrency: 2  // Begränsa SEO workers till 2 simultanea för bättre stabilitet
});

// Worker event handlers for SEO state management
seoWorker.on('completed', async (job, result) => {
  // Use the analysisId from job.data which was set when job was created
  const resultId = job.data.analysisId || result?.analysisId || `seo_${job.id}_${Date.now()}`;
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'completed',
    progress: '100',
    resultId: String(resultId),
    completedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [SEO ${job.id}]: ${prevState} → completed (resultId: ${resultId})`);
});

seoWorker.on('failed', async (job, err) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'failed',
    error: err?.message || 'Unknown error',
    failedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [SEO ${job.id}]: ${prevState} → failed (error: ${err?.message})`);
});

seoWorker.on('progress', async (job, progress) => {
  await redis.hset(`job:${job.id}`, { progress: String(progress) });
  console.log(`📊 PROGRESS UPDATE [SEO ${job.id}]: ${progress}%`);
});

seoWorker.on('active', async (job) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  if (prevState !== 'active') {
    console.log(`🔄 STATE TRANSITION [SEO ${job.id}]: ${prevState} → active (worker picked up job)`);
  }
});

// Hjälpfunktioner
function generateQuickActions(issues, crawler) {
  const actions = [];
  
  if (!crawler.sitemapUrls || crawler.sitemapUrls.length === 0) {
    actions.push({
      icon: 'map',
      title: 'Lägg till sitemap.xml',
      description: 'En sitemap hjälper sökmotorer hitta alla dina sidor',
      priority: 'high'
    });
  }
  
  if (!crawler.robotsTxt) {
    actions.push({
      icon: 'robot',
      title: 'Skapa robots.txt',
      description: 'Styr hur sökmotorer crawlar din sajt',
      priority: 'medium'
    });
  }
  
  if (issues.missingH1.length > 5) {
    actions.push({
      icon: 'heading',
      title: 'Lägg till H1-rubriker',
      description: `${issues.missingH1.length} sidor saknar H1-rubrik`,
      priority: 'high'
    });
  }
  
  if (issues.brokenImages.length > 0) {
    actions.push({
      icon: 'image',
      title: 'Fixa trasiga bilder',
      description: `${issues.brokenImages.length} bilder kan inte laddas`,
      priority: 'high'
    });
  }
  
  if (issues.imagesWithoutAlt.length > 10) {
    actions.push({
      icon: 'alt',
      title: 'Lägg till alt-texter',
      description: `${issues.imagesWithoutAlt.length} bilder saknar alt-text`,
      priority: 'medium'
    });
  }
  
  return actions.slice(0, 5);
}

// Import text normalizer
const TextNormalizer = require('../src/utils/text-normalizer');
const H1Analyzer = require('../src/utils/h1-analyzer');

// SEO-analys funktion (kopierad från server.js)
async function performSeoAnalysis(html, url) {
  try {
    const finalUrl = url;
    const cheerio = require('cheerio');
    console.log(`DEBUG: performSeoAnalysis creating new Cheerio instance for ${url}`);
    console.log(`DEBUG: Cheerio version: ${require('cheerio/package.json').version}`);

    // Try different Cheerio configurations
    const $ = cheerio.load(html, {
      xmlMode: false,
      decodeEntities: true,
      lowerCaseAttributeNames: false
    });
    
    // Basic Meta Tags - WITH TEXT NORMALIZATION
    const rawTitle = $('title').text() || '';
    const title = TextNormalizer.normalizeText(rawTitle) || 'Missing';
    const titleLength = title.length;
    
    const rawMetaDescription = $('meta[name="description"]').attr('content') || '';
    const metaDescription = TextNormalizer.normalizeMeta(rawMetaDescription) || 'Missing';
    const metaDescriptionLength = metaDescription === 'Missing' ? 0 : metaDescription.length;
    
    const rawMetaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const metaKeywords = TextNormalizer.normalizeText(rawMetaKeywords) || 'Missing';
    
    const metaRobots = $('meta[name="robots"]').attr('content')?.trim() || 'Not specified';
    const canonicalUrl = TextNormalizer.normalizeUrl($('link[rel="canonical"]').attr('href')) || 'Missing';
    const viewport = $('meta[name="viewport"]').attr('content') || 'Missing';
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || 'Not specified';
    
    // Open Graph Tags - WITH TEXT NORMALIZATION
    const rawOgTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogTitle = TextNormalizer.normalizeMeta(rawOgTitle) || 'Missing';
    
    const rawOgDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogDescription = TextNormalizer.normalizeMeta(rawOgDescription) || 'Missing';
    
    const ogImage = TextNormalizer.normalizeUrl($('meta[property="og:image"]').attr('content')) || 'Missing';
    const ogType = $('meta[property="og:type"]').attr('content') || 'Missing';
    const ogUrl = TextNormalizer.normalizeUrl($('meta[property="og:url"]').attr('content')) || 'Missing';
    
    // Twitter Cards - WITH TEXT NORMALIZATION
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || 'Missing';
    
    const rawTwitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
    const twitterTitle = TextNormalizer.normalizeMeta(rawTwitterTitle) || 'Missing';
    
    const rawTwitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
    const twitterDescription = TextNormalizer.normalizeMeta(rawTwitterDescription) || 'Missing';
    
    const twitterImage = TextNormalizer.normalizeUrl($('meta[name="twitter:image"]').attr('content')) || 'Missing';
    
    // Language and Localization
    const htmlLang = $('html').attr('lang') || 'Missing';
    const alternateLanguages = [];
    $('link[rel="alternate"][hreflang]').each((i, elem) => {
      alternateLanguages.push({
        lang: $(elem).attr('hreflang'),
        url: $(elem).attr('href')
      });
    });
    
    // Headings Analysis - UNIFIED H1 ANALYSIS
    const h1Analysis = H1Analyzer.analyze($);
    const h1Count = h1Analysis.count;
    const h1Texts = h1Analysis.texts;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    const h4Count = $('h4').length;
    const h5Count = $('h5').length;
    const h6Count = $('h6').length;
    
    // Check heading hierarchy (no level skipping)
    const headingLevels = $('h1,h2,h3,h4,h5,h6').map((i, el) => +el.tagName[1]).get();
    let hasHeadingSkip = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        hasHeadingSkip = true;
        break;
      }
    }
    
    // Content Analysis - WITH CLEAN TEXT EXTRACTION
    const rawBodyText = extractVisibleText($);
    const bodyText = TextNormalizer.normalizeText(rawBodyText);
    const wordCount = bodyText.split(' ').filter(word => word.length > 0).length;
    
    // Keyword Density Analysis (top 10 keywords) - WITH TEXT NORMALIZATION
    const words = TextNormalizer.extractKeywords(bodyText, 3); // Use normalized keyword extraction
    
    const wordFrequency = {};
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    const keywordDensity = Object.entries(wordFrequency)
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / words.length) * 100).toFixed(2)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // ✨ NEW: Swedish Content Grading (90-day feature)
    const contentGrading = SwedishContentGrader.analyzeContent(bodyText);
    const readability = {
      lix: contentGrading.lix,
      grade: contentGrading.grade,
      level: contentGrading.level,
      description: contentGrading.description,
      score: contentGrading.score,
      seoScore: SwedishContentGrader.calculateSEOScore(contentGrading),
      metrics: contentGrading.metrics,
      recommendations: contentGrading.recommendations
    };
    
    // Focus keyword analysis - WEIGHTED ALGORITHM
    const focusKeywordWeights = new Map();

    // Multilingual stopwords to filter out from focus keyword
    const stopwords = new Set([
      // Swedish stopwords
      'och', 'i', 'att', 'det', 'som', 'på', 'är', 'för', 'en', 'av',
      'till', 'med', 'har', 'inte', 'den', 'du', 'var', 'ett', 'han',
      'de', 'om', 'så', 'men', 'från', 'kan', 'vid', 'nu', 'skulle',
      'eller', 'bara', 'även', 'när', 'mycket', 'utan', 'din', 'ditt',
      'dina', 'sig', 'får', 'vara', 'blir', 'hade', 'alla', 'denna',
      'detta', 'dessa', 'där', 'här', 'sedan', 'redan', 'efter', 'under',
      'över', 'mellan', 'genom', 'hela', 'sådan', 'vilket', 'andra',
      // English stopwords
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
      'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
      'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did',
      'she', 'use', 'way', 'with', 'have', 'this', 'will', 'your', 'from',
      'they', 'been', 'more', 'when', 'than', 'find', 'many', 'then', 'them',
      'made', 'call', 'what', 'were', 'time', 'very', 'that', 'their', 'would',
      'about', 'which', 'there', 'could', 'other', 'make', 'into', 'these'
    ]);

    // Helper function to add weight
    function addKeywordWeight(word, weight) {
      if (!word || word.length < 3) return; // Skip short words
      const normalized = word.toLowerCase().trim();
      // Skip stopwords
      if (stopwords.has(normalized)) return;
      const current = focusKeywordWeights.get(normalized) || 0;
      focusKeywordWeights.set(normalized, current + weight);
    }

    // 1. Title tag words (highest weight = 10)
    if (title && title !== 'Missing') {
      title.toLowerCase().split(/\s+/).forEach(word => {
        addKeywordWeight(word, 10);
      });
    }

    // 2. H1 tag words (weight = 8)
    if (h1Texts && h1Texts.length > 0) {
      h1Texts.forEach(h1Text => {
        h1Text.toLowerCase().split(/\s+/).forEach(word => {
          addKeywordWeight(word, 8);
        });
      });
    }

    // 3. Meta description words (weight = 6)
    if (metaDescription && metaDescription !== 'Missing') {
      metaDescription.toLowerCase().split(/\s+/).forEach(word => {
        addKeywordWeight(word, 6);
      });
    }

    // 4. URL slug words (weight = 5)
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(/[\/\-_]/).filter(p => p.length >= 3);
      pathParts.forEach(part => {
        addKeywordWeight(part, 5);
      });
    } catch (e) {
      // Ignore URL parse errors
    }

    // 5. Keyword density top 5 (weight = count * 2)
    if (keywordDensity && keywordDensity.length > 0) {
      keywordDensity.slice(0, 5).forEach(kw => {
        addKeywordWeight(kw.word, kw.count * 2);
      });
    }

    // Sort by weight and get top keyword
    const sortedKeywords = Array.from(focusKeywordWeights.entries())
      .sort((a, b) => b[1] - a[1]);

    const rawFocusKeyword = sortedKeywords.length > 0 ? sortedKeywords[0][0] : '';
    const focusKeyword = TextNormalizer.normalizeKeyword(rawFocusKeyword);
    const hasFocusInTitle = focusKeyword && title.toLowerCase().includes(focusKeyword);
    const hasFocusInMeta = focusKeyword && metaDescription.toLowerCase().includes(focusKeyword);
    
    // Images Analysis - WITH TEXT NORMALIZATION
    const images = [];
    $('img').each((i, elem) => {
      const img = $(elem);
      const rawAlt = img.attr('alt') || '';
      const rawTitle = img.attr('title') || '';
      images.push({
        src: TextNormalizer.normalizeUrl(img.attr('src')) || 'Missing',
        alt: TextNormalizer.normalizeAltText(rawAlt),
        title: TextNormalizer.normalizeText(rawTitle),
        width: img.attr('width') || 'Not specified',
        height: img.attr('height') || 'Not specified',
        loading: img.attr('loading') || 'Not specified'
      });
    });
    
    const imgCount = images.length;
    const imgWithoutAlt = images.filter(img => !img.alt).length;
    const imgWithLazyLoad = images.filter(img => img.loading === 'lazy').length;
    
    // Links Analysis - WITH TEXT NORMALIZATION
    const links = [];
    $('a[href]').each((i, elem) => {
      const link = $(elem);
      const href = link.attr('href');
      if (href) {
        const rawText = link.text();
        const rawTitle = link.attr('title') || '';
        links.push({
          href: TextNormalizer.normalizeUrl(href),
          text: TextNormalizer.normalizeText(rawText),
          title: TextNormalizer.normalizeText(rawTitle),
          rel: link.attr('rel') || '',
          target: link.attr('target') || ''
        });
      }
    });
    
    const internalLinks = links.filter(link => {
      const href = link.href;
      return href.startsWith('/') || href.includes(new URL(finalUrl).hostname);
    }).length;
    
    const externalLinks = links.filter(link => {
      const href = link.href;
      return href.startsWith('http') && !href.includes(new URL(finalUrl).hostname);
    }).length;
    
    const nofollowLinks = links.filter(link => link.rel.includes('nofollow')).length;
    const brokenAnchors = links.filter(link => link.href === '#' || link.href === '').length;
    
    // Schema.org / Structured Data - REGEX FALLBACK due to Cheerio parsing issues
    const schemaScripts = [];
    const allScripts = $('script');
    const jsonLdScripts = $('script[type="application/ld+json"]');
    console.log(`DEBUG: URL=${url}, Cheerio found ${allScripts.length} scripts, ${jsonLdScripts.length} JSON-LD`);

    // Since Cheerio fails to parse elements, use regex as fallback
    if (jsonLdScripts.length === 0 && html.includes('application/ld+json')) {
      console.log('DEBUG: Using regex fallback for JSON-LD extraction');

      // Extract JSON-LD using regex
      const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;

      while ((match = jsonLdPattern.exec(html)) !== null) {
        try {
          const jsonText = match[1].trim();
          if (jsonText) {
            const schema = JSON.parse(jsonText);
            schemaScripts.push(schema);
            console.log(`Found JSON-LD via regex: ${JSON.stringify(schema).substring(0, 100)}...`);
          }
        } catch (e) {
          console.log('Failed to parse regex-extracted JSON-LD:', e.message);
        }
      }
    } else {
      // Use Cheerio if it actually found scripts
      jsonLdScripts.each((i, elem) => {
        try {
          const schemaText = $(elem).text().trim();
          if (schemaText) {
            const schema = JSON.parse(schemaText);
            schemaScripts.push(schema);
            console.log(`Found JSON-LD via Cheerio: ${JSON.stringify(schema).substring(0, 100)}...`);
          }
        } catch (e) {
          console.log('Failed to parse Cheerio JSON-LD:', e.message);
        }
      });
    }

    // Extract types from schemas (handle both single objects and @graph arrays)
    const schemaTypes = [];
    schemaScripts.forEach(schema => {
      if (schema['@type']) {
        schemaTypes.push(schema['@type']);
      } else if (schema['@graph'] && Array.isArray(schema['@graph'])) {
        schema['@graph'].forEach(item => {
          if (item['@type']) schemaTypes.push(item['@type']);
        });
      }
    });

    const hasSchema = schemaScripts.length > 0;
    console.log(`Schema detection: found ${schemaScripts.length} scripts, hasSchema: ${hasSchema}, types: ${schemaTypes}`);
    
    // Performance Indicators
    const inlineStyles = $('style').length + $('[style]').length;
    const externalCSS = $('link[rel="stylesheet"]').length;
    const externalJS = $('script[src]').length;
    const inlineJS = $('script:not([src])').length - schemaScripts.length; // Exclude schema scripts
    
    // Mobile & Responsive
    const hasViewport = viewport !== 'Missing';
    const hasResponsiveImages = images.some(img => 
      img.src.includes('srcset') || $(`img[src="${img.src}"]`).attr('srcset')
    );
    
    // Security
    const hasHTTPS = finalUrl.startsWith('https://');
    const mixedContent = hasHTTPS && (
      images.some(img => img.src.startsWith('http://')) ||
      links.some(link => link.href.startsWith('http://'))
    );
    
    // SEO Score Calculation (Enhanced)
    let score = 0;
    const scoreBreakdown = {
      title: 0,
      metaDescription: 0,
      headings: 0,
      content: 0,
      images: 0,
      technical: 0,
      social: 0,
      mobile: 0
    };
    
    // Title scoring (15 points)
    if (title !== 'Missing') {
      scoreBreakdown.title += 7;
      if (titleLength >= 30 && titleLength <= 60) scoreBreakdown.title += 5;
      else if (titleLength > 0 && titleLength < 30) scoreBreakdown.title += 2;
      else if (titleLength > 60 && titleLength <= 70) scoreBreakdown.title += 2;
      
      // Focus keyword in title bonus
      if (hasFocusInTitle) scoreBreakdown.title += 3;
    }
    
    // Meta Description scoring (15 points)
    if (metaDescription !== 'Missing') {
      scoreBreakdown.metaDescription += 7;
      if (metaDescriptionLength >= 120 && metaDescriptionLength <= 160) scoreBreakdown.metaDescription += 5;
      else if (metaDescriptionLength >= 50 && metaDescriptionLength < 120) scoreBreakdown.metaDescription += 2;
      else if (metaDescriptionLength > 160 && metaDescriptionLength <= 200) scoreBreakdown.metaDescription += 2;
      
      // Focus keyword in meta description bonus
      if (hasFocusInMeta) scoreBreakdown.metaDescription += 3;
    }
    
    // Headings scoring (15 points)
    if (h1Count === 1) scoreBreakdown.headings += 10;
    else if (h1Count === 2) scoreBreakdown.headings += 5;
    if (h2Count > 0) scoreBreakdown.headings += 2;
    
    // Heading hierarchy bonus
    if (!hasHeadingSkip && headingLevels.length > 1) scoreBreakdown.headings += 3;
    
    // Content scoring (15 points + LIX contribution ±5)
    if (wordCount >= 300) scoreBreakdown.content += 10;
    else if (wordCount >= 150) scoreBreakdown.content += 5;
    if (keywordDensity.length >= 5) scoreBreakdown.content += 5;
    
    // LIX readability contribution (max ±5 points)
    if (readability && readability.lix && isFinite(readability.lix)) {
      const optimalLix = 45; // Optimal för svensk webbtext
      const deviation = Math.abs(readability.lix - optimalLix);
      const lixContribution = Math.max(-5, Math.min(5, 5 - (deviation / 5)));
      scoreBreakdown.content += Math.round(lixContribution);
    }
    
    // Images scoring (10 points)
    if (imgCount > 0) {
      scoreBreakdown.images += 3;
      if (imgWithoutAlt === 0) scoreBreakdown.images += 4;
      else if (imgWithoutAlt < imgCount * 0.2) scoreBreakdown.images += 2;
      scoreBreakdown.images += 3; // Assuming no oversized images in queue version
    }
    
    // Technical SEO scoring (10 points)
    if (hasHTTPS) scoreBreakdown.technical += 3;
    if (canonicalUrl !== 'Missing') scoreBreakdown.technical += 2;
    if (hasSchema) scoreBreakdown.technical += 3;
    if (metaRobots !== 'Missing') scoreBreakdown.technical += 2;
    
    // Social scoring (10 points)
    if (ogTitle !== 'Missing' && ogDescription !== 'Missing') scoreBreakdown.social += 5;
    if (ogImage !== 'Missing') scoreBreakdown.social += 3;
    if (twitterCard !== 'Missing') scoreBreakdown.social += 2;
    
    // Mobile scoring (10 points)
    if (hasViewport) scoreBreakdown.mobile += 7;
    if (hasResponsiveImages) scoreBreakdown.mobile += 3;
    
    // Calculate total score
    score = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);
    
    // Generate Recommendations
    const recommendations = [];
    
    // Title recommendations
    if (title === 'Missing') {
      recommendations.push({ 
        type: 'error', 
        category: 'title',
        text: 'Lägg till en title-tagg på din sida',
        impact: 'high'
      });
    } else if (titleLength < 30) {
      recommendations.push({ 
        type: 'warning', 
        category: 'title',
        text: 'Din title är för kort. Sikta på 30-60 tecken för bästa resultat',
        impact: 'medium'
      });
    } else if (titleLength > 60) {
      recommendations.push({ 
        type: 'warning', 
        category: 'title',
        text: 'Din title är för lång och kan bli avklippt i sökresultaten',
        impact: 'medium'
      });
    }
    
    // Meta description recommendations
    if (metaDescription === 'Missing') {
      recommendations.push({ 
        type: 'error', 
        category: 'meta',
        text: 'Lägg till en meta description för att förbättra klickfrekvensen',
        impact: 'high'
      });
    } else if (metaDescriptionLength < 120) {
      recommendations.push({ 
        type: 'warning', 
        category: 'meta',
        text: 'Din meta description är för kort. Använd 120-160 tecken',
        impact: 'medium'
      });
    } else if (metaDescriptionLength > 160) {
      recommendations.push({ 
        type: 'warning', 
        category: 'meta',
        text: 'Din meta description är för lång och kommer klippas av',
        impact: 'medium'
      });
    }
    
    // Heading recommendations
    if (h1Count === 0) {
      recommendations.push({ 
        type: 'error', 
        category: 'headings',
        text: 'Lägg till en H1-rubrik på din sida',
        impact: 'high'
      });
    } else if (h1Count > 1) {
      recommendations.push({ 
        type: 'warning', 
        category: 'headings',
        text: `Du har ${h1Count} H1-rubriker. Använd endast en H1 per sida`,
        impact: 'medium'
      });
    }
    
    if (hasHeadingSkip) {
      recommendations.push({
        type: 'warning',
        category: 'headings',
        text: 'Rubriker hoppar över nivåer (t.ex. H2 → H4). Behåll logisk hierarki.',
        impact: 'medium'
      });
    }
    
    // Content recommendations
    if (wordCount < 300) {
      recommendations.push({ 
        type: 'warning', 
        category: 'content',
        text: `Din sida har endast ${wordCount} ord. Sikta på minst 300 ord för bättre SEO`,
        impact: 'high'
      });
    }
    
    // Image recommendations
    if (imgWithoutAlt > 0) {
      recommendations.push({ 
        type: 'error', 
        category: 'images',
        text: `${imgWithoutAlt} bilder saknar alt-text. Detta påverkar tillgänglighet och SEO`,
        impact: 'medium'
      });
    }
    
    // Technical recommendations
    if (!hasHTTPS) {
      recommendations.push({ 
        type: 'error', 
        category: 'technical',
        text: 'Din sida använder inte HTTPS. Detta påverkar säkerhet och ranking',
        impact: 'high'
      });
    }
    
    if (!hasSchema) {
      recommendations.push({ 
        type: 'info', 
        category: 'technical',
        text: 'Lägg till strukturerad data (Schema.org) för rikare sökresultat',
        impact: 'medium'
      });
    }
    
    // Mobile recommendations
    if (!hasViewport) {
      recommendations.push({ 
        type: 'error', 
        category: 'mobile',
        text: 'Saknar viewport meta-tagg. Din sida är inte mobiloptimerad',
        impact: 'high'
      });
    }

    // ✨ NEW: Check robots.txt and sitemap.xml directly
    let robotsTxtFound = false;
    let sitemapFound = false;

    try {
      const parsedUrl = new URL(finalUrl);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
      const robotsResponse = await axios.get(robotsUrl, { timeout: 5000 });
      robotsTxtFound = robotsResponse.status === 200 && robotsResponse.data.trim().length > 0;
      console.log(`robots.txt check: ${robotsTxtFound}`);
    } catch (error) {
      console.log('No robots.txt found');
    }

    try {
      const parsedUrl = new URL(finalUrl);
      const sitemapUrl = `${parsedUrl.protocol}//${parsedUrl.host}/sitemap.xml`;
      const sitemapResponse = await axios.get(sitemapUrl, { timeout: 5000 });
      sitemapFound = sitemapResponse.status === 200 &&
        (sitemapResponse.data.includes('<urlset') || sitemapResponse.data.includes('<sitemapindex'));
      console.log(`sitemap.xml check: ${sitemapFound}`);
    } catch (error) {
      console.log('No sitemap.xml found');
    }

    // Sort recommendations by impact
    const impactOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

    // Return comprehensive analysis
    const result = {
      version: 2,
      url: finalUrl,
      timestamp: new Date(),
      
      // Basic Info
      title,
      titleLength,
      metaDescription,
      metaDescriptionLength,
      metaKeywords,
      metaRobots,
      canonicalUrl,
      viewport,
      charset,
      language: htmlLang,
      alternateLanguages,
      
      // Focus keyword analysis
      focusKeyword,
      titleHasKeyword: hasFocusInTitle,
      metaHasKeyword: hasFocusInMeta,
      
      // Headings
      headings: {
        h1: { count: h1Count, texts: h1Texts },
        h2: { count: h2Count },
        h3: { count: h3Count },
        h4: { count: h4Count },
        h5: { count: h5Count },
        h6: { count: h6Count },
        hasSkip: hasHeadingSkip
      },
      
      // Content
      wordCount,
      keywordDensity,
      
      // Readability (Swedish Content Grading)
      readability,
      
      // Images
      images: {
        total: imgCount,
        withoutAlt: imgWithoutAlt,
        withLazyLoad: imgWithLazyLoad,
        oversized: 0, // Simplified for queue version
        details: images.slice(0, 10) // First 10 images
      },
      
      // Links
      links: {
        internal: internalLinks,
        external: externalLinks,
        nofollow: nofollowLinks,
        broken: brokenAnchors,
        total: links.length
      },
      
      // Social Media
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
        type: ogType,
        url: ogUrl
      },
      
      twitter: {
        card: twitterCard,
        title: twitterTitle,
        description: twitterDescription,
        image: twitterImage
      },
      
      // Technical SEO
      technical: {
        https: hasHTTPS,
        mixedContent,
        hasSchema,
        schemaTypes,
        inlineStyles,
        externalCSS,
        externalJS,
        inlineJS,
        sitemap: sitemapFound,
        robotsTxt: robotsTxtFound
      },
      
      // Mobile
      mobile: {
        hasViewport,
        hasResponsiveImages
      },
      
      // Scores
      seoScore: Math.min(score, 100),
      scoreBreakdown,
      
      // Recommendations
      recommendations
    };
    
    return result;
    
  } catch (error) {
    console.error('SEO Analysis error:', error);
    throw new Error(`SEO analysis failed: ${error.message}`);
  }
}

// AI Analysis worker - runs full analysis pipeline with competitor comparison
const aiAnalysisWorker = new Worker('ai-analysis', async (job) => {
  console.log(`🤖 Processing AI Analysis job ${job.id} for ${job.data.url}`);
  const startTime = Date.now();

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const aiAnalysisId = job.data.aiAnalysisId;
    const targetUrl = job.data.url;

    // Step 1: Analyze user's website (SEO + Lighthouse)
    console.log(`🤖 Step 1: Analyzing user's website ${targetUrl}`);
    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: { status: 'crawling_user', progress: 10 }
    });

    // Create Analysis records for SEO, Crawl, and Lighthouse (same as /api/analyze does)
    const seoAnalysis = await prisma.analysis.create({
      data: {
        targetUrl: targetUrl,
        type: 'seo',
        status: 'processing'
      }
    });

    const crawlAnalysis = await prisma.analysis.create({
      data: {
        targetUrl: targetUrl,
        type: 'crawl',
        status: 'pending'
      }
    });

    const lighthouseAnalysis = await prisma.analysis.create({
      data: {
        targetUrl: targetUrl,
        type: 'lighthouse',
        status: 'pending'
      }
    });

    console.log(`🤖 Created SEO analysis: ${seoAnalysis.id}, Crawl analysis: ${crawlAnalysis.id}, Lighthouse analysis: ${lighthouseAnalysis.id}`);

    // Create SEO, Crawl, and Lighthouse jobs with analysisId
    const userSeoJob = await addSeoJob({
      url: targetUrl,
      clientId: `ai-seo-${aiAnalysisId}`,
      analysisId: seoAnalysis.id
    });

    const userCrawlJob = await addCrawlJob({
      url: targetUrl,
      maxPages: 100,
      clientId: `ai-crawl-${aiAnalysisId}`,
      analysisId: crawlAnalysis.id
    });

    const userLighthouseJob = await addLighthouseJob({
      url: targetUrl,
      clientId: `ai-lh-${aiAnalysisId}`,
      analysisId: lighthouseAnalysis.id
    });

    // Wait for all three jobs to complete
    console.log(`🤖 Waiting for user SEO (${userSeoJob.id}), Crawl (${userCrawlJob.id}), and Lighthouse (${userLighthouseJob.id})`);

    // Poll for job completion
    // SEO: 5 minutes (usually fast)
    // Crawl: 30 minutes (can be slow for large JS-heavy e-commerce sites with 100 pages)
    // Lighthouse: 3 minutes (usually fast)
    const userSeoResult = await waitForJob(seoQueue, userSeoJob.id, 300000);
    const userCrawlResult = await waitForJob(crawlQueue, userCrawlJob.id, 1800000); // 30 min for large sites
    const userLighthouseResult = await waitForJob(lighthouseQueue, userLighthouseJob.id, 180000);

    console.log(`🤖 SEO, Crawl, and Lighthouse jobs completed successfully`);

    // Fetch full data from database AND artifacts
    // IMPORTANT: Results are stored in artifact store, not in DB
    const seoAnalysisData = await prisma.analysis.findUnique({
      where: { id: seoAnalysis.id }
    });

    const crawlAnalysisData = await prisma.analysis.findUnique({
      where: { id: crawlAnalysis.id }
    });

    const lighthouseAnalysisData = await prisma.analysis.findUnique({
      where: { id: lighthouseAnalysis.id }
    });

    // Load results from artifact store (same as API does)
    let seoResults = null;
    let crawlResults = null;
    let lighthouseResults = null;

    try {
      const seoResultsKey = artifactStore.generateKeyWithDate(seoAnalysis.id, 'seo-results', seoAnalysisData.createdAt, 'json');
      const seoResultsJson = await artifactStore.get(seoResultsKey);
      if (seoResultsJson) {
        seoResults = JSON.parse(seoResultsJson);
      }
    } catch (error) {
      console.warn(`Could not load SEO results for ${seoAnalysis.id}:`, error.message);
    }

    try {
      const crawlResultsKey = artifactStore.generateKeyWithDate(crawlAnalysis.id, 'crawl-results', crawlAnalysisData.createdAt, 'json');
      const crawlResultsJson = await artifactStore.get(crawlResultsKey);
      if (crawlResultsJson) {
        crawlResults = JSON.parse(crawlResultsJson);
      }
    } catch (error) {
      console.warn(`Could not load Crawl results for ${crawlAnalysis.id}:`, error.message);
    }

    try {
      const lighthouseResultsKey = artifactStore.generateKeyWithDate(lighthouseAnalysis.id, 'lighthouse-results', lighthouseAnalysisData.createdAt, 'json');
      const lighthouseResultsJson = await artifactStore.get(lighthouseResultsKey);
      if (lighthouseResultsJson) {
        lighthouseResults = JSON.parse(lighthouseResultsJson);
      }
    } catch (error) {
      console.warn(`Could not load Lighthouse results for ${lighthouseAnalysis.id}:`, error.message);
    }

    // Combine DB data with artifact results
    if (seoAnalysisData && seoResults) {
      seoAnalysisData.results = seoResults;
    }
    if (crawlAnalysisData && crawlResults) {
      crawlAnalysisData.results = crawlResults;
    }
    if (lighthouseAnalysisData && lighthouseResults) {
      lighthouseAnalysisData.results = lighthouseResults;
    }

    console.log(`🤖 Fetched full data from DB - SEO has summary: ${!!seoAnalysisData?.summary}, Crawl has summary: ${!!crawlAnalysisData?.summary}, Lighthouse has summary: ${!!lighthouseAnalysisData?.summary}`);

    // Save the analysis IDs to AiAnalysis (we already have them from the create above)
    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: {
        userAnalysisId: seoAnalysis.id,
        userCrawlId: crawlAnalysis.id,
        userLighthouseId: lighthouseAnalysis.id
      }
    });

    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: { progress: 30 }
    });

    // Step 2: Get competitors from job data (user-provided)
    const competitors = job.data.competitors || [];
    console.log(`🤖 Step 2: Using ${competitors.length} user-provided competitors:`, competitors);

    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: {
        competitors: competitors,
        progress: 40,
        status: competitors.length > 0 ? 'crawling_competitors' : 'analyzing'
      }
    });

    // Step 3: Crawl competitors
    console.log(`🤖 Step 3: Crawling ${competitors.length} competitors`);
    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: { status: 'crawling_competitors', progress: 45 }
    });

    const competitorResults = [];
    for (let i = 0; i < competitors.length; i++) {
      const competitorUrl = competitors[i];
      console.log(`🤖 Crawling competitor ${i + 1}/${competitors.length}: ${competitorUrl}`);

      const compCrawlJob = await addCrawlJob({
        url: competitorUrl,
        maxPages: 100,
        clientId: `ai-comp-${i}-${aiAnalysisId}`,
        analysisId: null
      });

      const compResult = await waitForJob(crawlQueue, compCrawlJob.id, 1500000); // 25 minutes for competitor crawl
      competitorResults.push({
        url: competitorUrl,
        data: compResult
      });

      await prisma.aiAnalysis.update({
        where: { id: aiAnalysisId },
        data: { progress: 45 + ((i + 1) / competitors.length) * 35 }
      });
    }

    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: {
        competitorData: competitorResults,
        progress: 80
      }
    });

    // Step 4: Generate AI report with DeepSeek
    console.log(`🤖 Step 4: Generating AI report with DeepSeek`);
    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: { status: 'analyzing', progress: 85 }
    });

    const aiReport = await generateAiReport(targetUrl, seoAnalysisData, crawlAnalysisData, lighthouseAnalysisData, competitorResults);

    // Step 5: Save final report
    console.log(`🤖 Step 5: Saving AI report`);
    await prisma.aiAnalysis.update({
      where: { id: aiAnalysisId },
      data: {
        status: 'completed',
        progress: 100,
        aiReport: aiReport,
        completedAt: new Date()
      }
    });

    console.log(`🤖 AI Analysis job ${job.id} completed in ${Date.now() - startTime}ms`);

    return {
      aiAnalysisId,
      status: 'completed',
      report: aiReport
    };

  } catch (error) {
    console.error(`🤖 AI Analysis job ${job.id} failed:`, error);

    // Update database with error
    if (job.data.aiAnalysisId) {
      try {
        await prisma.aiAnalysis.update({
          where: { id: job.data.aiAnalysisId },
          data: {
            status: 'failed',
            error: error.message
          }
        });
      } catch (dbError) {
        console.error('Failed to update AI analysis error status:', dbError);
      }
    }

    throw error;
  }
}, {
  connection: { host: 'localhost', port: 6379, password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd' },
  concurrency: 1  // Only 1 simultaneous AI analysis (resource intensive)
});

// Helper function to wait for a job to complete
async function waitForJob(queue, jobId, timeout = 600000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();

    if (state === 'completed') {
      return job.returnvalue;
    }

    if (state === 'failed') {
      const error = job.failedReason || 'Unknown error';
      throw new Error(`Job ${jobId} failed: ${error}`);
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error(`Job ${jobId} timed out after ${timeout}ms`);
}

// Helper function to find competitors via Google Custom Search API
// This function is now deprecated - competitors should come from user input
async function findCompetitors(targetUrl, seoAnalysisData) {
  console.log('⚠️ Automatic competitor finding is disabled. User must provide competitors manually.');
  return [];
}

// Helper function to generate AI report with DeepSeek
async function generateAiReport(targetUrl, seoAnalysisData, crawlAnalysisData, lighthouseAnalysisData, competitors) {
  try {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Extract detailed metrics from Lighthouse (use summary.performance AND results)
    const lhSummary = lighthouseAnalysisData?.summary || {};
    const lhResults = lighthouseAnalysisData?.results || {};
    const lhMetrics = {
      // From results
      performance: lhResults.performanceScore || 0,
      accessibility: lhResults.accessibilityScore || 0,
      bestPractices: lhResults.bestPracticesScore || 0,
      seo: lhResults.seoScore || 0,
      // From summary.performance (Core Web Vitals)
      lcp: lhSummary.performance?.lcp || null,
      fcp: lhSummary.performance?.fcp || null,
      cls: lhSummary.performance?.cls || null,
      tbt: lhSummary.performance?.tbt || null,
      tti: lhSummary.performance?.tti || null,
      speedIndex: lhSummary.performance?.speedIndex || null
    };

    // Extract detailed SEO data (use summary AND results)
    const seoSummary = seoAnalysisData?.summary || {};
    const seoResults = seoAnalysisData?.results || {};

    console.log('🔍 DEBUG seoAnalysisData:', JSON.stringify({
      hasSummary: !!seoAnalysisData?.summary,
      hasResults: !!seoAnalysisData?.results,
      summaryScore: seoAnalysisData?.summary?.score,
      resultsTitle: seoAnalysisData?.results?.title,
      resultsWordCount: seoAnalysisData?.results?.wordCount,
      resultsHttps: seoAnalysisData?.results?.technical?.https,
      resultsRobots: seoAnalysisData?.results?.technical?.robotsTxt
    }, null, 2));

    const seoDetails = {
      // From summary
      score: seoSummary.score || 0,
      issues: seoSummary.issues || 0,
      warnings: seoSummary.warnings || 0,
      // From results
      wordCount: seoResults.wordCount || 0,
      titleLength: seoResults.titleLength || 0,
      title: seoResults.title || '',
      robotsFound: seoResults.technical?.robotsTxt || false,
      sitemapFound: seoResults.technical?.sitemap || false,
      httpsEnabled: seoResults.technical?.https || false,
      imagesTotal: seoResults.images?.total || 0,
      imagesWithoutAlt: seoResults.images?.withoutAlt || 0,
      internalLinks: seoResults.links?.internal || 0,
      externalLinks: seoResults.links?.external || 0,
      brokenLinks: seoResults.links?.broken || 0,
      readabilityScore: seoResults.readability?.score || 0,
      lixScore: seoResults.readability?.lix || 0,
      hasMetaDescription: seoResults.metaDescription ? true : false,
      metaDescriptionLength: seoResults.metaDescriptionLength || 0,
      hasH1: seoResults.h1 ? true : false,
      schemaTypes: seoResults.schema?.types || [],
      socialMetaTags: {
        ogTitle: seoResults.social?.openGraph?.title || null,
        ogDescription: seoResults.social?.openGraph?.description || null,
        ogImage: seoResults.social?.openGraph?.image || null,
        ogUrl: seoResults.social?.openGraph?.url || null,
        ogType: seoResults.social?.openGraph?.type || null,
        twitterCard: seoResults.social?.twitterCards?.card || null,
        twitterTitle: seoResults.social?.twitterCards?.title || null,
        twitterDescription: seoResults.social?.twitterCards?.description || null,
        twitterImage: seoResults.social?.twitterCards?.image || null
      }
    };

    console.log('🔍 DEBUG seoDetails extracted:', JSON.stringify({
      title: seoDetails.title,
      titleLength: seoDetails.titleLength,
      wordCount: seoDetails.wordCount,
      robotsFound: seoDetails.robotsFound,
      sitemapFound: seoDetails.sitemapFound,
      httpsEnabled: seoDetails.httpsEnabled
    }, null, 2));

    // Extract Crawl data (use summary.performance AND results.summary)
    const crawlSummary = crawlAnalysisData?.summary || {};
    const crawlResults = crawlAnalysisData?.results || {};

    // Extract H1 data from crawl pages (more comprehensive than SEO homepage-only analysis)
    const allH1Tags = [];
    const h1CountsPerPage = {};
    if (crawlResults.pages && Array.isArray(crawlResults.pages)) {
      crawlResults.pages.forEach(page => {
        if (page.h1Tags && Array.isArray(page.h1Tags)) {
          allH1Tags.push(...page.h1Tags);
          h1CountsPerPage[page.url] = page.h1Count || page.h1Tags.length;
        }
      });
    }

    // Aggregate images from all crawled pages (replaces homepage-only SEO data)
    const totalImages = crawlResults.pages?.reduce((sum, page) =>
      sum + (page.images?.length || 0), 0) || 0;

    // Aggregate word count from all crawled pages (replaces homepage-only SEO data)
    const totalWords = crawlResults.pages?.reduce((sum, page) =>
      sum + (page.wordCount || 0), 0) || 0;
    const avgWordCount = crawlResults.pages?.length > 0
      ? Math.round(totalWords / crawlResults.pages.length)
      : 0;

    // Get internal links from linkmap (replaces homepage-only SEO data)
    const totalInternalLinks = crawlResults.linkmap?.linkDistribution?.totalInternal || 0;

    const crawlDetails = {
      // From summary
      score: crawlSummary.score || 0,
      issues: crawlSummary.issues || 0,
      warnings: crawlSummary.warnings || 0,
      // From summary.performance
      pagesAnalyzed: crawlSummary.performance?.pagesAnalyzed || 0,
      robotsFound: crawlSummary.performance?.robotsFound || false,
      sitemapFound: crawlSummary.performance?.sitemapFound || false,
      totalSize: crawlSummary.performance?.totalSize || 0,
      avgPageSize: crawlSummary.performance?.avgPageSize || 0,
      brokenLinks: crawlSummary.performance?.brokenLinks || 0,
      // From results.summary
      totalIssues: crawlResults.summary?.totalIssues || 0,
      // H1 data from all crawled pages
      h1Tags: allH1Tags,
      h1CountsPerPage: h1CountsPerPage,
      totalH1sFound: allH1Tags.length,
      // Aggregated data from all pages (replaces SEO homepage-only data)
      totalImages: totalImages,
      avgWordCount: avgWordCount,
      totalWords: totalWords,
      totalInternalLinks: totalInternalLinks
    };

    // Competitor comparison data (competitors use job result structure: {pages, summary})
    const competitorSummary = competitors.map((c, i) => {
      const crawlData = c.data;
      return {
        url: c.url,
        pages: crawlData?.pages?.length || 0,
        issues: crawlData?.summary?.totalIssues || 0,
        avgPageSize: crawlData?.summary?.avgPageSize || 0
      };
    });

    // Prepare comprehensive data for AI analysis
    const prompt = `You are a senior technical SEO consultant.
Analyze the provided website data and produce a complete, professional SEO report for a client.
Write in professional Swedish, with precise and objective language.

TARGET WEBSITE: ${targetUrl}

LIGHTHOUSE PERFORMANCE DATA:
- Performance Score: ${lhMetrics?.performance || 'N/A'}/100
- Accessibility Score: ${lhMetrics?.accessibility || 'N/A'}/100
- Best Practices Score: ${lhMetrics?.bestPractices || 'N/A'}/100
- SEO Score: ${lhMetrics?.seo || 'N/A'}/100

Core Web Vitals:
- LCP (Largest Contentful Paint): ${lhMetrics?.lcp ? (lhMetrics.lcp / 1000).toFixed(1) + 's' : 'N/A'}
- FCP (First Contentful Paint): ${lhMetrics?.fcp ? (lhMetrics.fcp / 1000).toFixed(1) + 's' : 'N/A'}
- CLS (Cumulative Layout Shift): ${lhMetrics?.cls !== undefined ? lhMetrics.cls : 'N/A'}
- TBT (Total Blocking Time): ${lhMetrics?.tbt ? lhMetrics.tbt + 'ms' : 'N/A'}
- TTI (Time to Interactive): ${lhMetrics?.tti ? (lhMetrics.tti / 1000).toFixed(1) + 's' : 'N/A'}
- Speed Index: ${lhMetrics?.speedIndex || 'N/A'}

Google's Thresholds:
- LCP: Good < 2.5s, Needs Improvement 2.5-4s, Poor > 4s
- CLS: Good < 0.1, Needs Improvement 0.1-0.25, Poor > 0.25
- TBT: Good < 200ms, Needs Improvement 200-600ms, Poor > 600ms
- FCP: Good < 1.8s, Needs Improvement 1.8-3s, Poor > 3s

SEO ANALYSIS DATA (Homepage):
- Page Title: "${seoDetails.title}"
- Title Length: ${seoDetails.titleLength} characters
- Meta Description: ${seoDetails.hasMetaDescription ? 'Yes (' + seoDetails.metaDescriptionLength + ' characters)' : 'No'}
- HTTPS Enabled: ${seoDetails.httpsEnabled ? 'Yes' : 'No'}
- Sitemap Found: ${seoDetails.sitemapFound ? 'Yes' : 'No'}
- Robots.txt Found: ${seoDetails.robotsFound ? 'Yes' : 'No'}

SITE-WIDE CONTENT DATA (from crawl of ${crawlDetails.pagesAnalyzed} pages):
- Total Images Across All Pages: ${crawlDetails.totalImages}
- Images Without Alt Text: ${seoDetails.imagesWithoutAlt} (homepage only)
- Average Word Count Per Page: ${crawlDetails.avgWordCount} words
- Total Words Across All Pages: ${crawlDetails.totalWords} words
- Internal Links Across Site: ${crawlDetails.totalInternalLinks}
- External Links: ${seoDetails.externalLinks} (homepage only)
- Broken Links: ${crawlDetails.brokenLinks}

Content Quality:
- Readability Score: ${seoDetails.readabilityScore}/100
- LIX Score: ${seoDetails.lixScore} (${seoDetails.lixScore < 30 ? 'Very Easy' : seoDetails.lixScore < 40 ? 'Easy' : seoDetails.lixScore < 50 ? 'Medium' : seoDetails.lixScore < 60 ? 'Difficult' : 'Very Difficult'})

Structured Data:
- Schema Types: ${seoDetails.schemaTypes.length > 0 ? seoDetails.schemaTypes.join(', ') : 'None'}

Social Meta Tags:
- Open Graph Title: ${seoDetails.socialMetaTags.ogTitle || 'Not set'}
- Open Graph Description: ${seoDetails.socialMetaTags.ogDescription || 'Not set'}
- Open Graph Image: ${seoDetails.socialMetaTags.ogImage || 'Not set'}
- Open Graph URL: ${seoDetails.socialMetaTags.ogUrl || 'Not set'}
- Open Graph Type: ${seoDetails.socialMetaTags.ogType || 'Not set'}
- Twitter Card: ${seoDetails.socialMetaTags.twitterCard || 'Not set'}
- Twitter Title: ${seoDetails.socialMetaTags.twitterTitle || 'Not set'}
- Twitter Description: ${seoDetails.socialMetaTags.twitterDescription || 'Not set'}
- Twitter Image: ${seoDetails.socialMetaTags.twitterImage || 'Not set'}

⚠️ IMPORTANT: Only recommend adding social meta tags if multiple fields show "Not set". If 5+ fields are set, social sharing is properly configured.

CRAWL ANALYSIS DATA:
- Pages Analyzed: ${crawlDetails.pagesAnalyzed}
- Total Issues Found: ${crawlDetails.totalIssues}
- Robots.txt Found: ${crawlDetails.robotsFound ? 'Yes' : 'No'}
- Sitemap Found: ${crawlDetails.sitemapFound ? 'Yes' : 'No'}
- Broken Links: ${crawlDetails.brokenLinks}
- Total Site Size: ${Math.round(crawlDetails.totalSize / (1024 * 1024))} MB
- Average Page Size: ${Math.round(crawlDetails.avgPageSize / 1024)} KB
- Crawl Score: ${crawlDetails.score}/100

H1 Tags Analysis (from crawl of ${crawlDetails.pagesAnalyzed} pages):
- Total H1 Tags Found: ${crawlDetails.totalH1sFound}
- Unique H1 Texts: ${[...new Set(crawlDetails.h1Tags)].length}
- Pages with H1: ${Object.keys(crawlDetails.h1CountsPerPage).length}
- H1 Examples: ${crawlDetails.h1Tags.slice(0, 5).join(', ') || 'None found'}
${crawlDetails.totalH1sFound === 0 ? '⚠️ CRITICAL: No H1 tags found on any crawled page!' : ''}

COMPETITOR COMPARISON:
${competitorSummary.length > 0 ? competitorSummary.map((c, i) => `${i + 1}. ${c.url}
   - Pages: ${c.pages}
   - Issues: ${c.issues}
   - Avg Page Size: ${Math.round(c.avgPageSize / 1024)} KB`).join('\n') : 'No relevant competitors found. Competitor analysis skipped.\n⚠️ Note: Focus analysis solely on the target website without competitor comparison.'}

INSTRUCTIONS:
Use only the provided metrics — do not add generic assumptions.
Follow these exact steps:

1. Calculate an overall SEO health score (0–100) using this weighting:
   - Performance (Lighthouse Performance + Core Web Vitals): 40%
   - SEO (metadata, structure, content quality): 30%
   - Crawl health (technical issues, broken links, etc.): 20%
   - Accessibility & Best Practices: 10%

2. Identify criticalIssues (maximum 5) — these are URGENT, HIGH-IMPACT problems that directly harm SEO or UX:
   - Examples: LCP exceeds Google's 2.5s threshold, broken links blocking indexing, missing critical meta tags
   - Each must reference actual metrics from the data above
   - Exclude minor optimizations — those go in "improvements"

3. Propose improvements (at least 5-7) across different areas:
   - Categories: Performance, Content, Technical SEO, Accessibility, Infrastructure
   - Each improvement must include:
     * area: Category name
     * title: Short descriptive title
     * description: Detailed explanation with relevant metrics
     * action: Specific, technical implementation steps
     * priority: "High" | "Medium" | "Low"
     * estimatedTime: Realistic time estimate (e.g., "2-4 timmar", "1-2 dagar")
     * expectedImpact: Measurable impact description

4. Include a comparison section with:
   - summary: 2-3 sentences comparing site to competitors
   - strengths: Array of strengths vs competitors (data-based)
   - weaknesses: Array of weaknesses vs competitors (data-based)
   - opportunities: Specific, data-based gaps or opportunities

5. Add an impact section estimating realistic results:
   - immediate: Expected results within 1-4 weeks
   - short_term: Expected results within 1-3 months
   - long_term: Expected results within 3-12 months

OUTPUT FORMAT:
All output must be in valid JSON format (no Markdown code blocks), following this structure exactly:

{
  "score": 0-100,
  "scoreBreakdown": {
    "performance": 0-100,
    "seo": 0-100,
    "crawlHealth": 0-100,
    "accessibility": 0-100
  },
  "criticalIssues": [
    {
      "issue": "Short title",
      "description": "Detailed explanation with metrics",
      "action": "Specific technical fix"
    }
  ],
  "improvements": [
    {
      "area": "Category",
      "title": "Title",
      "description": "Description",
      "action": "Implementation steps",
      "priority": "High|Medium|Low",
      "estimatedTime": "Time estimate",
      "expectedImpact": "Impact description"
    }
  ],
  "comparison": {
    "summary": "2-3 sentences comparing to competitors, or 'Ingen konkurrentjämförelse tillgänglig' if no competitors",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "opportunities": ["opportunity 1", "opportunity 2"]
  },
  "impact": {
    "immediate": "1-4 weeks results",
    "short_term": "1-3 months results",
    "long_term": "3-12 months results"
  }
}

CRITICAL REQUIREMENTS:
- Write ALL text in professional Swedish
- Reference all metrics numerically (e.g., "LCP = 3.3s överskrider Googles tröskel på 2.5s")
- Use professional, objective tone (as for a client report)
- Do not restate input data — focus on analysis and actionable insights
- If metrics are perfect, note that explicitly and suggest minor optimizations
- Maintain internal consistency between scores and findings
- Distinguish clearly between criticalIssues (urgent fixes) and improvements (optimizations)
- For social meta tags: Only recommend improvements if MULTIPLE tags show "Not set" (5+ missing). If most tags are present, this is not an issue.
- Format response as pure JSON without markdown code blocks`;


    console.log('🤖 Sending request to DeepSeek AI...');

    // Retry logic for DeepSeek API with increased timeout
    let retries = 3;
    let lastError;
    let response;

    while (retries > 0) {
      try {
        response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a professional SEO consultant providing actionable advice.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000  // Increased from 2000 to allow complete reports
        }, {
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000 // Increased to 90 seconds
        });

        // Success - break out of retry loop
        break;

      } catch (error) {
        lastError = error;

        // Check if it's a connection abort/reset error that we should retry
        if ((error.code === 'ECONNRESET' || error.code === 'ECONNABORTED' || error.message?.includes('aborted')) && retries > 1) {
          console.log(`⚠️ DeepSeek API error (${error.code || error.message}), retrying... (${4 - retries}/3)`);
          retries--;
          await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds before retry
          continue;
        }

        // For other errors or last retry, throw
        throw error;
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response from DeepSeek API');
    }

    const aiResponse = response.data.choices[0].message.content;
    console.log('🤖 DeepSeek AI response received');

    // Try to parse JSON from response
    let report;
    try {
      // First, try direct JSON parse
      report = JSON.parse(aiResponse);
    } catch (e) {
      // If failed, try to extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          report = JSON.parse(jsonMatch[1]);
          console.log('🤖 Successfully extracted JSON from markdown');
        } catch (e2) {
          console.error('🤖 Failed to parse extracted JSON:', e2);
          report = {
            rawResponse: aiResponse,
            score: 70,
            criticalIssues: ['Unable to parse AI response'],
            improvements: [],
            comparison: {},
            impact: {}
          };
        }
      } else {
        // No JSON found, wrap in basic structure
        report = {
          rawResponse: aiResponse,
          score: 70,
          criticalIssues: ['Unable to parse AI response'],
          improvements: [],
          comparison: {},
          impact: {}
        };
      }
    }

    return report;

  } catch (error) {
    console.error('Failed to generate AI report:', error);

    // Return fallback report
    return {
      error: error.message,
      score: 0,
      criticalIssues: ['AI analysis failed - please try again'],
      improvements: [],
      comparison: {},
      impact: {}
    };
  }
}

// AI Analysis worker event handlers
aiAnalysisWorker.on('completed', async (job, result) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'completed',
    progress: '100',
    resultId: job.data.aiAnalysisId,
    completedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [AI Analysis ${job.id}]: ${prevState} → completed`);
});

aiAnalysisWorker.on('failed', async (job, err) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'failed',
    error: err?.message || 'Unknown error',
    failedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [AI Analysis ${job.id}]: ${prevState} → failed (error: ${err?.message})`);
});

aiAnalysisWorker.on('progress', async (job, progress) => {
  await redis.hset(`job:${job.id}`, { progress: String(progress) });
  console.log(`📊 PROGRESS UPDATE [AI Analysis ${job.id}]: ${progress}%`);
});

aiAnalysisWorker.on('active', async (job) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  if (prevState !== 'active') {
    console.log(`🔄 STATE TRANSITION [AI Analysis ${job.id}]: ${prevState} → active (worker picked up job)`);
  }
});

// ============================================================
// GDPR ANALYSIS WORKER
// ============================================================
const gdprWorker = new Worker('gdpr', async (job) => {
  console.log(`🍪 Processing GDPR job ${job.id} for ${job.data.url}`);
  const startTime = Date.now();

  try {
    // Update Redis state
    await redis.hset(`job:${job.id}`, { state: 'active', progress: '0' });

    // Step 1: Run GDPR analysis (10%)
    await job.updateProgress(10);
    console.log(`🍪 Step 1: Running GDPR cookie analysis for ${job.data.url}`);

    const gdprAnalyzer = new GdprAnalyzer();
    const gdprResult = await gdprAnalyzer.analyze(job.data.url);

    await job.updateProgress(50);
    console.log(`🍪 GDPR analysis complete: ${gdprResult.cookiesBeforeConsent?.length || 0} cookies detected`);

    // Step 2: Generate AI report (70%)
    await job.updateProgress(70);
    console.log(`🍪 Step 2: Generating AI GDPR report`);

    let aiReport = null;
    try {
      const { generateGdprAiReport } = require('./gdpr-ai-report');
      aiReport = await generateGdprAiReport(gdprResult);
      console.log(`🍪 AI GDPR report generated`);
    } catch (aiError) {
      console.warn(`🍪 AI report generation failed, continuing without:`, aiError.message);
    }

    gdprResult.aiReport = aiReport;
    await job.updateProgress(90);

    // Step 3: Save to database and artifact store (90%)
    console.log(`🍪 Step 3: Saving GDPR results`);

    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        await analysisRepo.setResults(job.data.analysisId, gdprResult);
        await analysisRepo.updateStatus(job.data.analysisId, 'completed', {
          score: gdprResult.complianceScore,
          riskLevel: gdprResult.riskLevel
        });

        // Save artifact
        const artifactKey = artifactStore.generateKeyWithDate(
          job.data.analysisId, 'gdpr-results', new Date(), 'json'
        );
        await artifactStore.put(artifactKey, gdprResult, 'application/json');
        console.log(`🍪 GDPR results saved to artifact store: ${artifactKey}`);
      } catch (dbError) {
        console.error(`🍪 Failed to save to database:`, dbError.message);
      }
    }

    await job.updateProgress(100);
    console.log(`🍪 GDPR job ${job.id} completed in ${Date.now() - startTime}ms`);

    return {
      ...gdprResult,
      analysisId: job.data.analysisId
    };

  } catch (error) {
    console.error(`🍪 GDPR job ${job.id} failed:`, error);

    // Update database with error
    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        await analysisRepo.updateStatus(job.data.analysisId, 'failed');
      } catch (dbError) {
        console.error(`🍪 Failed to update error status:`, dbError.message);
      }
    }

    throw error;
  }
}, {
  connection: { host: 'localhost', port: 6379, password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd' },
  concurrency: 1,  // Only one GDPR job at a time (Puppeteer heavy)
  limiter: {
    max: 2,
    duration: 60000  // Max 2 jobs per minute
  }
});

// GDPR Worker event handlers
gdprWorker.on('completed', async (job, result) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'completed',
    progress: '100',
    resultId: job.data.analysisId,
    completedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [GDPR ${job.id}]: ${prevState} → completed`);
});

gdprWorker.on('failed', async (job, err) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'failed',
    error: err?.message || 'Unknown error',
    failedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [GDPR ${job.id}]: ${prevState} → failed (error: ${err?.message})`);
});

gdprWorker.on('progress', async (job, progress) => {
  await redis.hset(`job:${job.id}`, { progress: String(progress) });
  console.log(`📊 PROGRESS UPDATE [GDPR ${job.id}]: ${progress}%`);
});

gdprWorker.on('active', async (job) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  if (prevState !== 'active') {
    console.log(`🔄 STATE TRANSITION [GDPR ${job.id}]: ${prevState} → active (worker picked up job)`);
  }
});

// ============================================================
// SECURITY ANALYSIS WORKER
// ============================================================
const securityWorker = new Worker('security', async (job) => {
  console.log(`🔒 Processing Security job ${job.id} for ${job.data.url}`);
  const startTime = Date.now();

  try {
    // Update Redis state
    await redis.hset(`job:${job.id}`, { state: 'active', progress: '0' });

    // Step 1: Run Security analysis (10%)
    await job.updateProgress(10);
    console.log(`🔒 Step 1: Running security analysis for ${job.data.url}`);

    const securityAnalyzer = new FullSecurityAnalyzer();
    const securityResult = await securityAnalyzer.analyze(job.data.url);

    await job.updateProgress(50);
    console.log(`🔒 Security analysis complete: Grade ${securityResult.grade}, Score ${securityResult.score}`);

    // Step 2: Generate AI report (70%)
    await job.updateProgress(70);
    console.log(`🔒 Step 2: Generating AI Security report`);

    let aiReport = null;
    try {
      const { generateSecurityAiReport } = require('./security-ai-report');
      aiReport = await generateSecurityAiReport(securityResult);
      console.log(`🔒 AI Security report generated`);
    } catch (aiError) {
      console.warn(`🔒 AI report generation failed, continuing without:`, aiError.message);
    }

    securityResult.aiReport = aiReport;
    await job.updateProgress(90);

    // Step 3: Save to database and artifact store (90%)
    console.log(`🔒 Step 3: Saving Security results`);

    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        await analysisRepo.setResults(job.data.analysisId, securityResult);
        await analysisRepo.updateStatus(job.data.analysisId, 'completed', {
          score: securityResult.score,
          grade: securityResult.grade
        });

        // Save artifact
        const artifactKey = artifactStore.generateKeyWithDate(
          job.data.analysisId, 'security-results', new Date(), 'json'
        );
        await artifactStore.put(artifactKey, securityResult, 'application/json');
        console.log(`🔒 Security results saved to artifact store: ${artifactKey}`);
      } catch (dbError) {
        console.error(`🔒 Failed to save to database:`, dbError.message);
      }
    }

    await job.updateProgress(100);
    console.log(`🔒 Security job ${job.id} completed in ${Date.now() - startTime}ms`);

    return {
      ...securityResult,
      analysisId: job.data.analysisId
    };

  } catch (error) {
    console.error(`🔒 Security job ${job.id} failed:`, error);

    // Update database with error
    if (job.data.analysisId && analysisRepo.isEnabled) {
      try {
        await analysisRepo.updateStatus(job.data.analysisId, 'failed');
      } catch (dbError) {
        console.error(`🔒 Failed to update error status:`, dbError.message);
      }
    }

    throw error;
  }
}, {
  connection: { host: 'localhost', port: 6379, password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd' },
  concurrency: 2,  // Security analysis is lighter, can run 2 concurrently
  limiter: {
    max: 5,
    duration: 60000  // Max 5 jobs per minute
  }
});

// Security Worker event handlers
securityWorker.on('completed', async (job, result) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'completed',
    progress: '100',
    resultId: job.data.analysisId,
    completedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [Security ${job.id}]: ${prevState} → completed`);
});

securityWorker.on('failed', async (job, err) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  await redis.hset(`job:${job.id}`, {
    state: 'failed',
    error: err?.message || 'Unknown error',
    failedAt: Date.now()
  });
  console.log(`🔄 STATE TRANSITION [Security ${job.id}]: ${prevState} → failed (error: ${err?.message})`);
});

securityWorker.on('progress', async (job, progress) => {
  await redis.hset(`job:${job.id}`, { progress: String(progress) });
  console.log(`📊 PROGRESS UPDATE [Security ${job.id}]: ${progress}%`);
});

securityWorker.on('active', async (job) => {
  const prevState = await redis.hget(`job:${job.id}`, 'state');
  if (prevState !== 'active') {
    console.log(`🔄 STATE TRANSITION [Security ${job.id}]: ${prevState} → active (worker picked up job)`);
  }
});

// Start memory guard för backup säkerhet (utöver PM2's max_memory_restart)
startMemoryGuard(`queue-workers-${process.env.NODE_APP_INSTANCE || '0'}`);

module.exports = {
  // Workers startas automatiskt när filen importeras
};