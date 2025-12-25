const genericPool = require('generic-pool');
const puppeteer = require('puppeteer');

// Get Chrome path from environment or use default Chromium location
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/chromium';

// Puppeteer launch options för produktion
const browserArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  // '--single-process', // Removed - can cause stability issues with screenshots
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-features=site-per-process',
  '--js-flags=--max-old-space-size=768',  // Expert optimization: Begränsa V8 heap
  '--disable-features=AudioServiceOutOfProcess,SitePerProcess',  // Spara extra minne
  '--no-default-browser-check',
  '--disable-blink-features=AutomationControlled'  // Hide automation
];

// Skapa browser pool
const browserPool = genericPool.createPool({
  create: async () => {
    console.log('Creating new browser instance...');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: browserArgs,
      ignoreHTTPSErrors: true,
      timeout: 30000
    });
    
    // Sätt timeout för att döda hängande browsers
    browser._poolTimeout = setTimeout(() => {
      console.warn('Browser timeout - forcing close');
      browser.close().catch(() => {});
    }, 120000); // 2 minuter max livstid
    
    browser._poolCreatedAt = Date.now();
    console.log('Browser instance created');
    return browser;
  },
  
  destroy: async (browser) => {
    console.log('Destroying browser instance...');
    if (browser._poolTimeout) {
      clearTimeout(browser._poolTimeout);
    }
    try {
      await browser.close();
      console.log('Browser instance destroyed');
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  },
  
  validate: async (browser) => {
    try {
      // Kontrollera om browser fortfarande är ansluten
      const isConnected = browser.isConnected();
      
      // Kontrollera ålder (max 90 sekunder)
      const age = Date.now() - browser._poolCreatedAt;
      const isTooOld = age > 90000;
      
      if (!isConnected || isTooOld) {
        console.log(`Browser validation failed: connected=${isConnected}, age=${age}ms`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Browser validation error:', error);
      return false;
    }
  }
}, {
  max: 3,                      // Max 3 samtidiga browsers
  min: 0,                      // Ingen idle browsers
  testOnBorrow: true,          // Validera innan användning
  idleTimeoutMillis: 30000,    // Stäng efter 30s inaktivitet
  evictionRunIntervalMillis: 10000,  // Kör cleanup var 10:e sekund
  acquireTimeoutMillis: 30000, // Max 30s väntetid för browser
  destroyTimeoutMillis: 5000   // Max 5s för att stänga browser
});

// Event handlers
browserPool.on('factoryCreateError', (err) => {
  console.error('Failed to create browser:', err);
});

browserPool.on('factoryDestroyError', (err) => {
  console.error('Failed to destroy browser:', err);
});

// Hjälpfunktion för att använda browser från pool
async function withBrowser(callback, options = {}) {
  const browser = await browserPool.acquire();
  const startTime = Date.now();
  
  try {
    console.log(`Browser acquired from pool (${browserPool.size} in pool, ${browserPool.available} available)`);
    const result = await callback(browser);
    console.log(`Browser operation completed in ${Date.now() - startTime}ms`);
    return result;
  } catch (error) {
    console.error(`Browser operation failed after ${Date.now() - startTime}ms:`, error);
    throw error;
  } finally {
    await browserPool.release(browser);
    console.log(`Browser released to pool`);
  }
}

// Hjälpfunktion för att köra med page
async function withPage(callback, options = {}) {
  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    
    // Optimeringar för prestanda
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);
    
    // Blockera onödiga resurser
    if (options.blockResources) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    
    try {
      return await callback(page);
    } finally {
      await page.close();
    }
  }, options);
}

// Pool statistik
function getPoolStats() {
  return {
    size: browserPool.size,
    available: browserPool.available,
    borrowed: browserPool.borrowed,
    pending: browserPool.pending,
    max: browserPool.max,
    min: browserPool.min
  };
}

// Graceful shutdown
async function closeBrowserPool() {
  console.log('Draining browser pool...');
  await browserPool.drain();
  console.log('Clearing browser pool...');
  await browserPool.clear();
  console.log('Browser pool closed');
}

module.exports = {
  browserPool,
  withBrowser,
  withPage,
  getPoolStats,
  closeBrowserPool
};