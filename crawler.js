const axios = require('axios');
const cheerio = require('cheerio');
const robotsParser = require('robots-parser');
const { URL } = require('url');
const TextNormalizer = require('./src/utils/text-normalizer');
const H1Analyzer = require('./src/utils/h1-analyzer');

class SEOCrawler {
  constructor(startUrl, options = {}) {
    this.startUrl = startUrl;
    this.maxPages = options.maxPages || 500;
    this.visitedUrls = new Set();
    this.queuedUrls = new Set(); // Track URLs that are already queued
    this.urlQueue = [];
    this.results = [];
    this.robotsTxt = null;
    this.baseUrl = new URL(startUrl);
    this.timeout = options.timeout || 5000;
    this.sitemapUrls = [];
    this.progressCallback = options.progressCallback; // Callback for progress updates
    this.concurrency = options.concurrency || 3; // Number of parallel workers
    this.activeWorkers = 0; // Track active parallel requests
    this.lastRequestTime = 0; // Track last request time for rate limiting
    this.errorCount = 0; // Track consecutive errors for backoff
    this.maxErrors = 5; // Max consecutive errors before backing off
    this.enablePuppeteerFallback = options.enablePuppeteerFallback || false;
    this.puppeteerMinLinks = options.puppeteerMinLinks || 10;
  }

  async crawl() {
    try {
      // Först, ladda robots.txt
      await this.loadRobotsTxt();

      // Hybrid approach: Sitemap först, sedan link discovery
      // 1. Alltid lägg till start-URL först (garanterad att crawlas)
      this.urlQueue.push(this.startUrl);
      this.queuedUrls.add(this.startUrl);

      // 2. Försök hitta sitemap för snabb coverage av fler sidor
      const sitemapUrls = await this.findSitemapUrls();
      this.sitemapUrls = sitemapUrls;

      if (sitemapUrls.length > 0) {
        console.log(`Found ${sitemapUrls.length} URLs in sitemap - using sitemap-first strategy`);
        // Prioritera sitemap URLs (de viktigaste sidorna), men reservera plats för start-URL
        const urlsToAdd = sitemapUrls.slice(0, this.maxPages - 1);
        urlsToAdd.forEach(url => {
          if (!this.queuedUrls.has(url)) {
            this.urlQueue.push(url);
            this.queuedUrls.add(url);
          }
        });
      } else {
        console.log('No sitemap found - will discover pages by following links');
      }

      // 2. Crawla sidor med parallellism
      // Link discovery sker automatiskt i crawlPage() när den hittar nya länkar
      const workers = [];
      for (let i = 0; i < this.concurrency; i++) {
        workers.push(this.crawlWorker());
      }

      await Promise.all(workers);

      return this.results;
    } catch (error) {
      console.error('Crawl error:', error);
      throw error;
    }
  }

  async crawlWorker() {
    while (this.urlQueue.length > 0 && this.visitedUrls.size < this.maxPages) {
      const url = this.urlQueue.shift();

      if (!url || this.visitedUrls.has(url)) continue;

      if (!this.canCrawl(url)) {
        console.log(`Robots.txt blocks: ${url}`);
        continue;
      }

      this.activeWorkers++;

      try {
        // Respect crawl-delay per worker
        const crawlDelay = this.getCrawlDelay();
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (crawlDelay > 0 && timeSinceLastRequest < crawlDelay * 1000) {
          const waitTime = (crawlDelay * 1000) - timeSinceLastRequest;
          await this.sleep(waitTime);
        }

        this.lastRequestTime = Date.now();

        await this.crawlPage(url);

        // Reset error count on success
        this.errorCount = 0;

      } catch (error) {
        console.error(`Worker error crawling ${url}:`, error.message);
        this.errorCount++;

        // Exponential backoff if too many errors
        if (this.errorCount >= this.maxErrors) {
          const backoffTime = Math.min(5000, 1000 * Math.pow(2, this.errorCount - this.maxErrors));
          console.log(`Too many errors, backing off for ${backoffTime}ms`);
          await this.sleep(backoffTime);
          this.errorCount = 0; // Reset after backoff
        }
      } finally {
        this.activeWorkers--;
      }
    }
  }

  async loadRobotsTxt() {
    try {
      const robotsUrl = `${this.baseUrl.protocol}//${this.baseUrl.host}/robots.txt`;
      const response = await axios.get(robotsUrl, { timeout: this.timeout });
      this.robotsTxt = robotsParser(robotsUrl, response.data);
      console.log('Loaded robots.txt');
    } catch (error) {
      console.log('No robots.txt found');
      this.robotsTxt = null;
    }
  }

  async findSitemapUrls() {
    const urls = [];
    const foundSitemaps = new Set(); // Prevent duplicates
    
    // 1. Kolla om robots.txt har sitemap
    if (this.robotsTxt) {
      const sitemaps = this.robotsTxt.getSitemaps();
      for (const sitemapUrl of sitemaps) {
        if (!foundSitemaps.has(sitemapUrl)) {
          foundSitemaps.add(sitemapUrl);
          const sitemapUrls = await this.parseSitemap(sitemapUrl);
          urls.push(...sitemapUrls);
        }
      }
    }
    
    // 2. Prova vanliga sitemap-platser (även om robots.txt fanns)
    const commonSitemapPaths = [
      '/sitemap.xml',
      '/sitemap_index.xml', 
      '/sitemap.txt',
      '/sitemaps.xml',
      '/sitemap-index.xml',
      '/wp-sitemap.xml', // WordPress
      '/page-sitemap.xml'
    ];
    
    for (const path of commonSitemapPaths) {
      const sitemapUrl = `${this.baseUrl.protocol}//${this.baseUrl.host}${path}`;
      if (!foundSitemaps.has(sitemapUrl)) {
        foundSitemaps.add(sitemapUrl);
        const sitemapUrls = await this.parseSitemap(sitemapUrl);
        if (sitemapUrls.length > 0) {
          urls.push(...sitemapUrls);
        }
      }
    }
    
    return [...new Set(urls)]; // Remove duplicate URLs
  }

  async parseSitemap(sitemapUrl) {
    try {
      const response = await axios.get(sitemapUrl, { timeout: this.timeout });
      const $ = cheerio.load(response.data, { xmlMode: true });
      const urls = [];
      
      // Hantera reguljära sitemap URLs
      $('url > loc').each((i, elem) => {
        const url = $(elem).text().trim();
        if (url) urls.push(url);
      });
      
      // Hantera sitemap index - collect nested sitemap URLs first
      const nestedSitemaps = [];
      $('sitemap > loc').each((i, elem) => {
        const sitemapUrl = $(elem).text().trim();
        if (sitemapUrl) nestedSitemaps.push(sitemapUrl);
      });
      
      // Process nested sitemaps sequentially
      for (const nestedSitemapUrl of nestedSitemaps) {
        try {
          const nestedUrls = await this.parseSitemap(nestedSitemapUrl);
          urls.push(...nestedUrls);
        } catch (nestedError) {
          console.log(`Failed to parse nested sitemap: ${nestedSitemapUrl}`);
        }
      }
      
      return urls;
    } catch (error) {
      console.log(`Could not parse sitemap: ${sitemapUrl}`);
      return [];
    }
  }

  canCrawl(url) {
    if (!this.robotsTxt) return true;

    // Use our specific bot name, fallback to wildcard
    const userAgent = 'SEOAnalyzeBot';
    const isAllowed = this.robotsTxt.isAllowed(url, userAgent);

    // If no specific rule for our bot, check wildcard
    if (isAllowed === undefined) {
      return this.robotsTxt.isAllowed(url, '*');
    }

    return isAllowed;
  }

  getCrawlDelay() {
    if (!this.robotsTxt) return 0;

    // Check for crawl-delay for our bot
    let delay = this.robotsTxt.getCrawlDelay('SEOAnalyzeBot');

    // Fallback to wildcard crawl-delay
    if (delay === undefined) {
      delay = this.robotsTxt.getCrawlDelay('*');
    }

    // Default to 0.2 seconds if no delay specified (faster but still polite)
    return delay || 0.2;
  }

  async crawlPage(url) {
    try {
      const pageNumber = this.visitedUrls.size + 1;
      console.log(`Crawling (${pageNumber}/${this.maxPages}): ${url}`);
      this.visitedUrls.add(url);

      // Report progress if callback is provided
      if (this.progressCallback) {
        this.progressCallback(pageNumber);
      }

      // Crawl-delay is now handled in crawlWorker() for parallel crawling

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzeBot/1.0; +https://seoanalyze.se/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: this.timeout,
        maxContentLength: 10 * 1024 * 1024, // Max 10MB per sida
        validateStatus: (status) => status < 500
      });
      
      const $ = cheerio.load(response.data);

      // Check robots meta tag on the page
      const robotsMeta = $('meta[name="robots"]').attr('content') || '';
      const robotsDirectives = robotsMeta.toLowerCase().split(',').map(d => d.trim());

      // Check if page should be indexed
      const noindex = robotsDirectives.includes('noindex');
      const nofollow = robotsDirectives.includes('nofollow');

      if (noindex) {
        console.log(`Page has noindex directive, skipping: ${url}`);
        // Still return basic info but mark as noindex
        return {
          url,
          status: response.status,
          noindex: true,
          robotsMeta
        };
      }

      // Text normalization for consistent data
      const rawTitle = $('title').text();
      const rawMetaDescription = $('meta[name="description"]').attr('content') || '';
      const rawBodyText = $('body').text();
      
      // Analyze H1 tags with full details
      const h1Analysis = H1Analyzer.analyze($);

      const pageResult = {
        url,
        status: response.status,
        title: TextNormalizer.normalizeText(rawTitle) || 'Missing',
        metaDescription: TextNormalizer.normalizeMeta(rawMetaDescription) || 'Missing',
        h1Count: h1Analysis.count,
        h1Tags: h1Analysis.texts, // Store actual H1 texts for AI analysis
        wordCount: TextNormalizer.normalizeText(rawBodyText).split(' ').filter(w => w.length > 0).length,
        images: [],
        links: [],
        errors: [],
        pageSize: response.data.length // Lägg till sidstorlek i bytes
      };
      
      // Analysera bilder - WITH TEXT NORMALIZATION
      $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        const rawAlt = $(elem).attr('alt') || '';
        if (src) {
          const normalizedAlt = TextNormalizer.normalizeAltText(rawAlt);
          pageResult.images.push({
            src: this.resolveUrl(src, url),
            alt: normalizedAlt,
            hasAlt: !!normalizedAlt
          });
        }
      });
      
      // Analysera länkar - WITH TEXT NORMALIZATION
      $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        const rawText = $(elem).text();

        // Check for rel="nofollow" on individual links
        const rel = $(elem).attr('rel') || '';
        const hasNofollow = rel.toLowerCase().includes('nofollow');

        if (href) {
          const resolvedUrl = this.resolveUrl(href, url);
          const normalizedText = TextNormalizer.normalizeText(rawText);
          pageResult.links.push({
            href: resolvedUrl,
            text: normalizedText,
            isInternal: this.isInternalUrl(resolvedUrl),
            nofollow: hasNofollow
          });

          // Only queue links if not nofollow (from page meta or link rel)
          if (!nofollow && !hasNofollow &&
              this.isInternalUrl(resolvedUrl) &&
              !this.visitedUrls.has(resolvedUrl) &&
              !this.queuedUrls.has(resolvedUrl) &&
              this.visitedUrls.size < this.maxPages) {
            this.urlQueue.push(resolvedUrl);
            this.queuedUrls.add(resolvedUrl);
          }
        }
      });

      // 🔥 PUPPETEER FALLBACK for SPAs (like Webhallen)
      if (this.enablePuppeteerFallback && pageResult.links.length < this.puppeteerMinLinks) {
        console.log(`🔄 CRAWL: Only ${pageResult.links.length} links found with Axios, trying Puppeteer fallback for ${url}...`);
        try {
          const { withBrowser } = require('./lib/browser-pool');

          const puppeteerHtml = await withBrowser(async (browser) => {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            try {
              await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for JS
              const html = await page.content();
              console.log(`✅ CRAWL: Puppeteer HTML retrieved for ${url}`);
              return html;
            } finally {
              await page.close();
            }
          });

          // Re-parse with Puppeteer HTML
          const $puppeteer = cheerio.load(puppeteerHtml);
          const puppeteerLinks = [];

          $puppeteer('a[href]').each((i, elem) => {
            const href = $puppeteer(elem).attr('href');
            const rawText = $puppeteer(elem).text();
            const rel = $puppeteer(elem).attr('rel') || '';
            const hasNofollow = rel.toLowerCase().includes('nofollow');

            if (href) {
              const resolvedUrl = this.resolveUrl(href, url);
              const normalizedText = TextNormalizer.normalizeText(rawText);
              puppeteerLinks.push({
                href: resolvedUrl,
                text: normalizedText,
                isInternal: this.isInternalUrl(resolvedUrl),
                nofollow: hasNofollow
              });

              // Queue internal links
              if (!nofollow && !hasNofollow &&
                  this.isInternalUrl(resolvedUrl) &&
                  !this.visitedUrls.has(resolvedUrl) &&
                  !this.queuedUrls.has(resolvedUrl) &&
                  this.visitedUrls.size < this.maxPages) {
                this.urlQueue.push(resolvedUrl);
                this.queuedUrls.add(resolvedUrl);
              }
            }
          });

          if (puppeteerLinks.length > pageResult.links.length) {
            console.log(`✅ CRAWL: Puppeteer found ${puppeteerLinks.length} links vs ${pageResult.links.length}, using Puppeteer result`);
            pageResult.links = puppeteerLinks;

            // Also update images from Puppeteer HTML
            pageResult.images = [];
            $puppeteer('img').each((i, elem) => {
              const src = $puppeteer(elem).attr('src');
              const rawAlt = $puppeteer(elem).attr('alt') || '';
              if (src) {
                const normalizedAlt = TextNormalizer.normalizeAltText(rawAlt);
                pageResult.images.push({
                  src: this.resolveUrl(src, url),
                  alt: normalizedAlt,
                  hasAlt: !!normalizedAlt
                });
              }
            });
          }
        } catch (puppeteerError) {
          console.warn(`⚠️ CRAWL: Puppeteer fallback failed for ${url}:`, puppeteerError.message);
          // Continue with Axios result
        }
      }
      
      // Kontrollera trasiga länkar och bilder
      pageResult.brokenLinks = await this.checkBrokenLinks(pageResult.links.slice(0, 10)); // Kolla max 10 länkar per sida
      pageResult.brokenImages = await this.checkBrokenImages(pageResult.images.slice(0, 10)); // Kolla max 10 bilder per sida
      
      this.results.push(pageResult);
      
    } catch (error) {
      console.error(`Error crawling ${url}:`, error.message);
      this.results.push({
        url,
        status: error.response?.status || 0,
        error: error.message,
        errors: [`Failed to crawl: ${error.message}`]
      });
    }
  }

  resolveUrl(href, baseUrl) {
    try {
      const url = new URL(href, baseUrl);
      // Ta bort fragment (#anchor) från URL
      url.hash = '';
      return url.href;
    } catch {
      return href;
    }
  }

  isInternalUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.host === this.baseUrl.host;
    } catch {
      return false;
    }
  }

  async checkBrokenLinks(links) {
    const broken = [];
    for (const link of links) {
      if (!link.isInternal) continue; // Kolla bara interna länkar
      
      try {
        await axios.head(link.href, { 
          timeout: 3000,
          validateStatus: (status) => status < 400
        });
      } catch (error) {
        const status = error.response?.status;
        broken.push({
          url: link.href,
          text: link.text,
          status: status !== undefined ? status : 'Network error'
        });
      }
    }
    return broken;
  }

  async checkBrokenImages(images) {
    const broken = [];
    for (const img of images) {
      try {
        await axios.head(img.src, { 
          timeout: 3000,
          validateStatus: (status) => status < 400
        });
      } catch (error) {
        const status = error.response?.status;
        broken.push({
          src: img.src,
          alt: img.alt,
          status: status !== undefined ? status : 'Network error'
        });
      }
    }
    return broken;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SEOCrawler;