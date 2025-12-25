const path = require('path');
const fs = require('fs').promises;

class LighthouseAnalyzer {
  
  // Hitta Chrome-installation på Windows och Linux
  findChrome() {
    // Prioritera CHROME_PATH environment variable
    if (process.env.CHROME_PATH) {
      console.log(`Using CHROME_PATH: ${process.env.CHROME_PATH}`);
      return process.env.CHROME_PATH;
    }
    
    const os = require('os');
    const platform = os.platform();
    
    let possiblePaths = [];
    
    if (platform === 'win32') {
      // Windows paths
      possiblePaths = [
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
        process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe'
      ];
    } else if (platform === 'linux') {
      // Linux paths
      possiblePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        '/opt/google/chrome/chrome',
        '/usr/local/bin/chrome'
      ];
    } else if (platform === 'darwin') {
      // macOS paths
      possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
      ];
    }
    
    for (const chromePath of possiblePaths) {
      try {
        if (chromePath && require('fs').existsSync(chromePath)) {
          console.log(`Found Chrome at: ${chromePath}`);
          return chromePath;
        }
      } catch (e) {
        // Ignorera fel
      }
    }
    
    // Om ingen sökväg hittas, låt chrome-launcher försöka hitta Chrome
    console.log('No Chrome path found, letting chrome-launcher auto-detect...');
    return undefined;
  }

  async analyze(url) {
    let chrome = null;
    let userDataDir = null;
    let lighthouse = null;
    let chromeLauncher = null;
    
    try {
      // Dynamic import för ES modules
      console.log('Loading ES modules...');
      const lighthouseModule = await import('lighthouse');
      const chromeLauncherModule = await import('chrome-launcher');
      
      // Extract the modules properly
      lighthouse = lighthouseModule.default || lighthouseModule;
      chromeLauncher = chromeLauncherModule.default || chromeLauncherModule;
      
      // Skapa unik temp-katalog för varje körning (cross-platform)
      const os = require('os');
      const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 10) + '-' + process.pid;
      userDataDir = path.join(os.tmpdir(), `lighthouse-${uniqueId}`);
      
      // Försök skapa katalogen
      try {
        await fs.mkdir(userDataDir, { recursive: true });
      } catch (err) {
        console.log('Could not create user data dir:', err.message);
      }
      
      // Starta Chrome i headless-läge med ENV-styrda flaggor
      const chromePath = process.env.CHROME_PATH || '/usr/bin/chromium';
      console.log(`Using Chrome path: ${chromePath}`);

      // Parse Chrome flags from ENV or use defaults
      const defaultFlags = [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ];

      const chromeFlags = process.env.LIGHTHOUSE_CHROME_FLAGS
        ? process.env.LIGHTHOUSE_CHROME_FLAGS.split(' ').filter(Boolean)
        : defaultFlags;

      console.log(`Chrome flags: ${chromeFlags.length} flags configured`);

      chrome = await chromeLauncher.launch({
        chromeFlags: chromeFlags,
        chromePath: chromePath,
        userDataDir: userDataDir,
        ignoreDefaultFlags: false  // Use default flags from chrome-launcher
      });
      
      // Parse categories from ENV or use defaults
      const defaultCategories = ['performance', 'accessibility', 'seo', 'best-practices'];
      const onlyCategories = process.env.LIGHTHOUSE_ONLY_CATEGORIES
        ? process.env.LIGHTHOUSE_ONLY_CATEGORIES.split(',').map(c => c.trim())
        : defaultCategories;

      console.log(`Lighthouse categories: ${onlyCategories.join(', ')}`);

      const options = {
        logLevel: 'error',
        output: 'json',
        port: chrome.port,
        onlyCategories: onlyCategories,
        throttling: {
          cpuSlowdownMultiplier: 4,
          downloadThroughputKbps: 1.6 * 1024,
          uploadThroughputKbps: 768,
          rttMs: 150
        }
      };
      
      // Kör Lighthouse (använd dynamic import för ES module)
      const runnerResult = await lighthouse(url, options);
      
      if (!runnerResult || !runnerResult.lhr) {
        throw new Error('Lighthouse analysis failed');
      }
      
      const lhr = runnerResult.lhr;
      
      // Extrahera Core Web Vitals
      const metrics = lhr.audits;
      const coreWebVitals = {
        lcp: {
          value: metrics['largest-contentful-paint']?.numericValue || 0,
          score: metrics['largest-contentful-paint']?.score || 0,
          displayValue: metrics['largest-contentful-paint']?.displayValue || 'N/A'
        },
        inp: {
          value: metrics['experimental-interaction-to-next-paint']?.numericValue || null,
          score: metrics['experimental-interaction-to-next-paint']?.score || 0,
          displayValue: metrics['experimental-interaction-to-next-paint']?.displayValue || null
        },
        cls: {
          value: metrics['cumulative-layout-shift']?.numericValue || 0,
          score: metrics['cumulative-layout-shift']?.score || 0,
          displayValue: metrics['cumulative-layout-shift']?.displayValue || 'N/A'
        },
        fcp: {
          value: metrics['first-contentful-paint']?.numericValue || 0,
          score: metrics['first-contentful-paint']?.score || 0,
          displayValue: metrics['first-contentful-paint']?.displayValue || 'N/A'
        },
        ttfb: {
          value: metrics['server-response-time']?.numericValue || 0,
          score: metrics['server-response-time']?.score || 0,
          displayValue: metrics['server-response-time']?.displayValue || 'N/A'
        },
        tti: {
          value: metrics['interactive']?.numericValue || 0,
          score: metrics['interactive']?.score || 0,
          displayValue: metrics['interactive']?.displayValue || 'N/A'
        },
        speedIndex: {
          value: metrics['speed-index']?.numericValue || 0,
          score: metrics['speed-index']?.score || 0,
          displayValue: metrics['speed-index']?.displayValue || 'N/A'
        },
        tbt: {
          value: metrics['total-blocking-time']?.numericValue || 0,
          score: metrics['total-blocking-time']?.score || 0,
          displayValue: metrics['total-blocking-time']?.displayValue || 'N/A'
        }
      };
      
      // Extrahera ALLA opportunities dynamiskt från Lighthouse
      const opportunities = {};

      // Lista över alla kända Lighthouse opportunity audits
      const opportunityAudits = [
        'unused-javascript', 'unused-css-rules', 'render-blocking-resources',
        'offscreen-images', 'modern-image-formats', 'uses-optimized-images',
        'uses-webp-images', 'uses-responsive-images', 'efficiently-encode-images',
        'preload-lcp-image', 'uses-rel-preconnect', 'uses-rel-preload',
        'font-display', 'unminified-css', 'unminified-javascript',
        'legacy-javascript', 'duplicated-javascript', 'uses-long-cache-ttl',
        'total-byte-weight', 'uses-text-compression', 'redirects',
        'uses-http2', 'efficient-animated-content', 'dom-size'
      ];

      // Impact/effort classification mapping
      const getImpactEffort = (auditId, savingsMs, score) => {
        const impact = savingsMs > 1000 ? 'Hög' : savingsMs > 500 ? 'Medel' : 'Låg';

        // Effort classification based on typical implementation complexity
        const effortMapping = {
          'uses-optimized-images': 'Låg',
          'modern-image-formats': 'Låg',
          'uses-webp-images': 'Låg',
          'efficiently-encode-images': 'Låg',
          'uses-text-compression': 'Låg',
          'unminified-css': 'Låg',
          'unminified-javascript': 'Låg',
          'uses-long-cache-ttl': 'Medel',
          'unused-css-rules': 'Medel',
          'unused-javascript': 'Hög',
          'render-blocking-resources': 'Hög',
          'offscreen-images': 'Medel',
          'legacy-javascript': 'Hög',
          'preload-lcp-image': 'Medel',
          'uses-rel-preconnect': 'Låg',
          'font-display': 'Låg',
          'total-byte-weight': 'Hög',
          'redirects': 'Medel',
          'uses-http2': 'Medel',
          'dom-size': 'Hög'
        };

        const effort = effortMapping[auditId] || 'Medel';

        // Time estimate based on effort and impact
        const getTimeEstimate = (impact, effort) => {
          if (effort === 'Låg') return '≤2 tim';
          if (effort === 'Medel') return '2-8 tim';
          return '1-2 dagar';
        };

        return {
          impact,
          effort,
          timeEstimate: getTimeEstimate(impact, effort)
        };
      };

      opportunityAudits.forEach(auditId => {
        const audit = metrics[auditId];
        if (audit && audit.score !== null && audit.score < 1) {
          // Bara inkludera audits som faktiskt har förbättringsmöjligheter
          const savingsMs = audit.details?.overallSavingsMs || audit.numericValue || 0;
          const classification = getImpactEffort(auditId, savingsMs, audit.score);

          opportunities[auditId] = {
            id: auditId,
            score: audit.score,
            title: audit.title,
            description: audit.description,
            displayValue: audit.displayValue,
            overallSavingsMs: savingsMs,
            estimatedSavings: savingsMs > 0 ? (savingsMs / 1000).toFixed(1) : null, // Convert to seconds for frontend
            details: audit.details,
            impact: classification.impact,
            effort: classification.effort,
            timeEstimate: classification.timeEstimate
          };
        }
      });
      
      // Extrahera ALLA diagnostics dynamiskt från Lighthouse
      const diagnostics = {};

      // Lista över alla kända Lighthouse diagnostic audits
      const diagnosticAudits = [
        'mainthread-work-breakdown', 'bootup-time', 'network-requests',
        'network-rtt', 'network-server-latency', 'third-party-summary',
        'largest-contentful-paint-element', 'layout-shift-elements',
        'long-tasks', 'non-composited-animations', 'critical-request-chains',
        'user-timings', 'screenshot-thumbnails', 'final-screenshot',
        'metrics', 'performance-budget', 'timing-budget', 'resource-summary'
      ];

      diagnosticAudits.forEach(auditId => {
        const audit = metrics[auditId];
        if (audit && audit.details) {
          diagnostics[auditId] = {
            id: auditId,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
            details: audit.details
          };
        }
      });
      
      // Extract URL information that frontend expects
      const finalUrl = lhr.finalUrl || lhr.requestedUrl || url;
      const requestedUrl = lhr.requestedUrl || url;

      const scores = {
        performance: lhr.categories.performance ? Math.round(lhr.categories.performance.score * 100) : null,
        accessibility: lhr.categories.accessibility ? Math.round(lhr.categories.accessibility.score * 100) : null,
        seo: lhr.categories.seo ? Math.round(lhr.categories.seo.score * 100) : null,
        bestPractices: lhr.categories['best-practices'] ? Math.round(lhr.categories['best-practices'].score * 100) : null
      };

      return {
        // Score fields (multiple formats for compatibility)
        ...scores,
        performanceScore: scores.performance,
        accessibilityScore: scores.accessibility,
        seoScore: scores.seo,
        bestPracticesScore: scores.bestPractices,

        // URL fields that frontend expects
        targetUrl: finalUrl,
        url: finalUrl,
        requestedUrl: requestedUrl,
        finalUrl: finalUrl,

        // Core data
        coreWebVitals,
        opportunities: Object.values(opportunities), // Convert to array for frontend
        diagnostics: Object.values(diagnostics), // Convert to array for frontend

        // Additional metadata that might be needed
        runtimeError: lhr.runtimeError || null,
        runWarnings: lhr.runWarnings || [],
        userAgent: lhr.userAgent || null
      };
      
    } catch (error) {
      console.error('Lighthouse analysis error:', error);
      
      if (error.message.includes('No Chrome installations found')) {
        throw new Error('Chrome/Chromium is not installed. Please install Google Chrome or Chromium browser.');
      } else if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Could not connect to Chrome. Make sure Chrome is properly installed.');
      } else if (error.message.includes('ERR_REQUIRE_ESM')) {
        throw new Error('Module loading error. Please check Node.js version compatibility.');
      }
      
      throw new Error(`Lighthouse analysis failed: ${error.message}`);
      
    } finally {
      // Aggressiv Chrome cleanup
      if (chrome) {
        try {
          // Forceful shutdown
          await chrome.kill();
          console.log(`Chrome process ${chrome.pid} killed successfully`);
        } catch (e) {
          console.log('Chrome cleanup error:', e.message);
          // Force kill if normal shutdown fails
          if (chrome.pid) {
            try {
              process.kill(chrome.pid, 'SIGKILL');
              console.log(`Force killed Chrome process ${chrome.pid}`);
            } catch (killError) {
              console.log('Force kill failed:', killError.message);
            }
          }
        }
      }
      
      // Rensa temp-katalog med bättre error handling
      if (userDataDir) {
        try {
          // Använd fs.rm istället för deprecated fs.rmdir
          await fs.rm(userDataDir, { recursive: true, force: true });
          console.log(`Cleaned up temp directory: ${userDataDir}`);
        } catch (e) {
          console.log('Temp dir cleanup error:', e.message);
          // Försök med sync-version som fallback
          try {
            require('fs').rmSync(userDataDir, { recursive: true, force: true });
            console.log(`Fallback cleanup successful: ${userDataDir}`);
          } catch (syncError) {
            console.log('Fallback cleanup also failed:', syncError.message);
          }
        }
      }
      
      // Explicit garbage collection efter tunga Lighthouse-operationer
      if (global.gc) {
        console.log('Running explicit garbage collection after Lighthouse analysis');
        global.gc();
      }
      
      // Nollställ referenser för att hjälpa GC
      lighthouse = null;
      chromeLauncher = null;
      chrome = null;
      userDataDir = null;
    }
  }
}

module.exports = LighthouseAnalyzer;