/**
 * GDPR Cookie Analyzer
 * Analyzes websites for GDPR cookie compliance
 *
 * Checks:
 * - Cookies set before user consent
 * - Tracking scripts (GA, FB, etc.)
 * - Cookie banner presence and functionality
 * - "Reject all" button functionality
 * - Cookie policy analysis
 */

const { withBrowser } = require('./browser-pool');

// Known tracking cookies that require consent
const TRACKING_COOKIES = {
  // Google Analytics
  '_ga': { name: 'Google Analytics', category: 'analytics', vendor: 'Google' },
  '_gid': { name: 'Google Analytics', category: 'analytics', vendor: 'Google' },
  '_gat': { name: 'Google Analytics', category: 'analytics', vendor: 'Google' },
  '__utma': { name: 'Google Analytics (Classic)', category: 'analytics', vendor: 'Google' },
  '__utmb': { name: 'Google Analytics (Classic)', category: 'analytics', vendor: 'Google' },
  '__utmc': { name: 'Google Analytics (Classic)', category: 'analytics', vendor: 'Google' },
  '__utmz': { name: 'Google Analytics (Classic)', category: 'analytics', vendor: 'Google' },
  '_ga_': { name: 'Google Analytics 4', category: 'analytics', vendor: 'Google', isPrefix: true },

  // Facebook
  '_fbp': { name: 'Facebook Pixel', category: 'marketing', vendor: 'Meta' },
  '_fbc': { name: 'Facebook Click ID', category: 'marketing', vendor: 'Meta' },
  'fr': { name: 'Facebook Ads', category: 'marketing', vendor: 'Meta' },

  // Hotjar
  '_hjid': { name: 'Hotjar', category: 'analytics', vendor: 'Hotjar' },
  '_hjSessionUser': { name: 'Hotjar Session', category: 'analytics', vendor: 'Hotjar', isPrefix: true },
  '_hjSession': { name: 'Hotjar Session', category: 'analytics', vendor: 'Hotjar', isPrefix: true },

  // LinkedIn
  'li_sugr': { name: 'LinkedIn Insight', category: 'marketing', vendor: 'LinkedIn' },
  'bcookie': { name: 'LinkedIn Browser ID', category: 'marketing', vendor: 'LinkedIn' },
  'lidc': { name: 'LinkedIn Data Center', category: 'marketing', vendor: 'LinkedIn' },

  // Twitter/X
  'guest_id': { name: 'Twitter Guest ID', category: 'marketing', vendor: 'Twitter/X' },
  'personalization_id': { name: 'Twitter Personalization', category: 'marketing', vendor: 'Twitter/X' },

  // Microsoft/Bing
  '_uetsid': { name: 'Bing Ads', category: 'marketing', vendor: 'Microsoft' },
  '_uetvid': { name: 'Bing Ads', category: 'marketing', vendor: 'Microsoft' },
  'MUID': { name: 'Microsoft User ID', category: 'marketing', vendor: 'Microsoft' },

  // HubSpot
  '__hssc': { name: 'HubSpot', category: 'analytics', vendor: 'HubSpot' },
  '__hssrc': { name: 'HubSpot', category: 'analytics', vendor: 'HubSpot' },
  '__hstc': { name: 'HubSpot', category: 'analytics', vendor: 'HubSpot' },
  'hubspotutk': { name: 'HubSpot', category: 'analytics', vendor: 'HubSpot' },

  // Mixpanel
  'mp_': { name: 'Mixpanel', category: 'analytics', vendor: 'Mixpanel', isPrefix: true },

  // Amplitude
  'amplitude_id': { name: 'Amplitude', category: 'analytics', vendor: 'Amplitude', isPrefix: true },

  // Intercom
  'intercom-': { name: 'Intercom', category: 'functional', vendor: 'Intercom', isPrefix: true },

  // Crisp
  'crisp-client': { name: 'Crisp Chat', category: 'functional', vendor: 'Crisp', isPrefix: true },

  // Drift
  'driftt_aid': { name: 'Drift', category: 'marketing', vendor: 'Drift' },

  // Segment
  'ajs_user_id': { name: 'Segment', category: 'analytics', vendor: 'Segment' },
  'ajs_anonymous_id': { name: 'Segment', category: 'analytics', vendor: 'Segment' },

  // Heap
  '_hp2_id': { name: 'Heap Analytics', category: 'analytics', vendor: 'Heap', isPrefix: true },

  // FullStory
  'fs_uid': { name: 'FullStory', category: 'analytics', vendor: 'FullStory' },

  // Crazy Egg
  'cebs': { name: 'Crazy Egg', category: 'analytics', vendor: 'Crazy Egg' },
  '_ceir': { name: 'Crazy Egg', category: 'analytics', vendor: 'Crazy Egg' },

  // Matomo/Piwik
  '_pk_id': { name: 'Matomo', category: 'analytics', vendor: 'Matomo', isPrefix: true },
  '_pk_ses': { name: 'Matomo Session', category: 'analytics', vendor: 'Matomo', isPrefix: true },
};

// Necessary cookies that don't require consent
const NECESSARY_COOKIES = [
  'PHPSESSID', 'JSESSIONID', 'ASP.NET_SessionId',  // Session IDs
  'csrf', 'XSRF-TOKEN', '_csrf',  // CSRF protection
  'auth', 'token', 'jwt',  // Authentication
  'locale', 'lang', 'language',  // Language preferences
  'currency',  // Currency preference
  'cookieconsent', 'cookie_consent', 'gdpr', 'cc_cookie',  // Cookie consent state
  'OptanonConsent', 'CookieConsent',  // Consent management
];

// Common CMP (Consent Management Platform) selectors
const CMP_SELECTORS = {
  banner: [
    // Generic cookie banner selectors
    '[class*="cookie-banner"]',
    '[class*="cookie-notice"]',
    '[class*="cookie-consent"]',
    '[class*="cookiebanner"]',
    '[class*="cookienotice"]',
    '[id*="cookie-banner"]',
    '[id*="cookie-notice"]',
    '[id*="cookie-consent"]',
    '[id*="cookieconsent"]',
    '[class*="gdpr"]',
    '[id*="gdpr"]',
    '[class*="consent-banner"]',
    '[class*="privacy-banner"]',

    // Specific CMPs
    '#onetrust-consent-sdk',  // OneTrust
    '.cc-window',  // Cookie Consent by Insites
    '#CybotCookiebotDialog',  // Cookiebot
    '[class*="quantcast"]',  // Quantcast
    '#usercentrics',  // Usercentrics
    '.didomi-popup-container',  // Didomi
    '#sp_message_container',  // SourcePoint
    '.iubenda-cs-container',  // iubenda
    '#ez-cookie-dialog',  // EZ Cookie
    '.termly-styles-root',  // Termly
    '[class*="osano"]',  // Osano
  ],

  acceptAll: [
    // Accept all buttons
    '[class*="accept-all"]',
    '[class*="accept_all"]',
    '[class*="acceptall"]',
    '[id*="accept-all"]',
    'button:contains("Acceptera alla")',
    'button:contains("Accept all")',
    'button:contains("Godkänn alla")',
    'button:contains("Accept All")',
    'button:contains("Tillåt alla")',
    'button:contains("Allow all")',
    '[class*="agree-button"]',
    '[class*="consent-give"]',
    '.cc-btn.cc-allow',
    '#onetrust-accept-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  ],

  rejectAll: [
    // Reject all buttons
    '[class*="reject-all"]',
    '[class*="reject_all"]',
    '[class*="rejectall"]',
    '[class*="deny-all"]',
    '[id*="reject-all"]',
    '[id*="deny-all"]',
    'button:contains("Neka alla")',
    'button:contains("Reject all")',
    'button:contains("Avvisa alla")',
    'button:contains("Decline all")',
    'button:contains("Endast nödvändiga")',
    'button:contains("Only necessary")',
    'button:contains("Refuse")',
    '.cc-btn.cc-deny',
    '#onetrust-reject-all-handler',
    '#CybotCookiebotDialogBodyButtonDecline',
    '[class*="necessary-only"]',
  ],

  // CMP iframes - consent banners often load in iframes
  iframes: [
    // Sourcepoint
    'iframe[id*="sp_message_iframe"]',
    'iframe[src*="sourcepoint"]',
    'iframe[title*="SP Consent"]',
    'iframe[title*="Privacy"]',
    // OneTrust
    'iframe[id*="onetrust"]',
    'iframe[src*="onetrust"]',
    // Cookiebot
    'iframe[src*="cookiebot"]',
    'iframe[id*="CybotCookiebot"]',
    // Quantcast
    'iframe[src*="quantcast"]',
    // Didomi
    'iframe[src*="didomi"]',
    // TrustArc
    'iframe[src*="trustarc"]',
    'iframe[src*="truste"]',
    // Generic consent iframes
    'iframe[src*="consent"]',
    'iframe[src*="cookie"]',
    'iframe[src*="gdpr"]',
    'iframe[title*="consent"]',
    'iframe[title*="cookie"]',
    'iframe[title*="Cookie"]',
  ]
};

class GdprAnalyzer {

  /**
   * Main analysis method
   * @param {string} url - URL to analyze
   * @returns {Object} GDPR analysis results
   */
  async analyze(url) {
    console.log(`🍪 Starting GDPR analysis for ${url}`);
    const startTime = Date.now();

    const result = {
      url,
      timestamp: new Date().toISOString(),
      cookiesBeforeConsent: [],
      cookiesAfterAccept: [],
      cookiesAfterReject: [],
      trackingScripts: [],
      banner: {
        exists: false,
        hasAcceptAll: false,
        hasRejectAll: false,
        hasSettings: false,
        selector: null
      },
      violations: [],
      compliant: [],
      riskLevel: 'low',
      complianceScore: 100,
      analysisTime: 0
    };

    try {
      await withBrowser(async (browser) => {
        const page = await browser.newPage();

        // Set realistic user agent
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.setViewport({ width: 1366, height: 768 });

        // Track network requests for third-party scripts
        const trackingRequests = [];
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const reqUrl = request.url();
          const trackingDomain = this.isTrackingRequest(reqUrl);
          if (trackingDomain) {
            trackingRequests.push({
              url: reqUrl,
              type: request.resourceType(),
              vendor: trackingDomain
            });
          }
          request.continue();
        });

        try {
          // 1. Navigate and collect cookies BEFORE any interaction
          console.log('📍 Step 1: Collecting cookies before consent...');
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await this.wait(4000); // Wait for JS-rendered banners (increased from 2s)

          const cookiesBefore = await page.cookies();
          result.cookiesBeforeConsent = this.analyzeCookies(cookiesBefore);

          // 2. Check for tracking scripts loaded
          console.log('📍 Step 2: Checking tracking scripts...');
          result.trackingScripts = this.categorizeTrackingRequests(trackingRequests);

          // 3. Find cookie banner
          console.log('📍 Step 3: Looking for cookie banner...');
          const bannerInfo = await this.findCookieBanner(page);
          result.banner = bannerInfo;

          // 4. Test "Accept All" if available
          if (bannerInfo.hasAcceptAll && bannerInfo.acceptAllSelector) {
            console.log('📍 Step 4a: Testing Accept All...');
            try {
              await page.click(bannerInfo.acceptAllSelector);
              await this.wait(2000);
              const cookiesAfterAccept = await page.cookies();
              result.cookiesAfterAccept = this.analyzeCookies(cookiesAfterAccept);
            } catch (e) {
              console.log('Could not click Accept All button');
            }
          }

          // 5. Reload and test "Reject All" if available
          if (bannerInfo.hasRejectAll && bannerInfo.rejectAllSelector) {
            console.log('📍 Step 4b: Testing Reject All...');
            try {
              // Clear cookies and reload
              const client = await page.target().createCDPSession();
              await client.send('Network.clearBrowserCookies');
              await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
              await this.wait(2000);

              // Click reject
              await page.click(bannerInfo.rejectAllSelector);
              await this.wait(2000);
              const cookiesAfterReject = await page.cookies();
              result.cookiesAfterReject = this.analyzeCookies(cookiesAfterReject);
            } catch (e) {
              console.log('Could not test Reject All button');
            }
          }

          // 6. Find privacy/cookie policy link
          console.log('📍 Step 5: Looking for cookie policy...');
          result.policyLink = await this.findCookiePolicy(page);

        } finally {
          await page.close();
        }
      });

      // 7. Analyze violations and calculate score
      console.log('📍 Step 6: Analyzing violations...');
      this.analyzeViolations(result);
      this.calculateScore(result);

    } catch (error) {
      console.error('GDPR analysis error:', error);
      result.error = error.message;
      result.riskLevel = 'unknown';
      result.complianceScore = 0;
    }

    result.analysisTime = Date.now() - startTime;
    console.log(`✅ GDPR analysis completed in ${result.analysisTime}ms`);

    return result;
  }

  /**
   * Analyze cookies and categorize them
   */
  analyzeCookies(cookies) {
    return cookies.map(cookie => {
      const classification = this.classifyCookie(cookie.name);
      return {
        name: cookie.name,
        domain: cookie.domain,
        value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : ''),
        expires: cookie.expires ? new Date(cookie.expires * 1000).toISOString() : 'Session',
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        ...classification
      };
    });
  }

  /**
   * Classify a cookie as tracking, necessary, or unknown
   */
  classifyCookie(name) {
    // Check against tracking cookies
    for (const [key, info] of Object.entries(TRACKING_COOKIES)) {
      if (info.isPrefix) {
        if (name.startsWith(key)) {
          return {
            isTracking: true,
            category: info.category,
            vendor: info.vendor,
            knownCookie: info.name,
            requiresConsent: true
          };
        }
      } else if (name === key) {
        return {
          isTracking: true,
          category: info.category,
          vendor: info.vendor,
          knownCookie: info.name,
          requiresConsent: true
        };
      }
    }

    // Check if necessary cookie
    for (const necessaryCookie of NECESSARY_COOKIES) {
      if (name.toLowerCase().includes(necessaryCookie.toLowerCase())) {
        return {
          isTracking: false,
          category: 'necessary',
          vendor: 'Unknown',
          knownCookie: null,
          requiresConsent: false
        };
      }
    }

    // Unknown cookie - potentially tracking
    return {
      isTracking: false,
      category: 'unknown',
      vendor: 'Unknown',
      knownCookie: null,
      requiresConsent: false // Conservative: unknown cookies might need review
    };
  }

  /**
   * Check if a request URL is from a known tracking service
   */
  isTrackingRequest(url) {
    const trackingDomains = [
      { pattern: /google-analytics\.com|googletagmanager\.com|gtag/, vendor: 'Google Analytics' },
      { pattern: /facebook\.com\/tr|connect\.facebook|fbevents/, vendor: 'Facebook Pixel' },
      { pattern: /hotjar\.com/, vendor: 'Hotjar' },
      { pattern: /linkedin\.com\/px|snap\.licdn/, vendor: 'LinkedIn' },
      { pattern: /twitter\.com\/i\/adsct|ads-twitter\.com/, vendor: 'Twitter/X' },
      { pattern: /bing\.com\/bat|clarity\.ms/, vendor: 'Microsoft/Bing' },
      { pattern: /hubspot\.com/, vendor: 'HubSpot' },
      { pattern: /segment\.com|segment\.io/, vendor: 'Segment' },
      { pattern: /mixpanel\.com/, vendor: 'Mixpanel' },
      { pattern: /amplitude\.com/, vendor: 'Amplitude' },
      { pattern: /fullstory\.com/, vendor: 'FullStory' },
      { pattern: /crazyegg\.com/, vendor: 'Crazy Egg' },
      { pattern: /intercom\.io/, vendor: 'Intercom' },
      { pattern: /doubleclick\.net|googlesyndication/, vendor: 'Google Ads' },
      { pattern: /tiktok\.com/, vendor: 'TikTok' },
      { pattern: /pinterest\.com\/ct/, vendor: 'Pinterest' },
      { pattern: /snap\.com|snapchat\.com/, vendor: 'Snapchat' },
    ];

    for (const { pattern, vendor } of trackingDomains) {
      if (pattern.test(url)) {
        return vendor;
      }
    }
    return null;
  }

  /**
   * Categorize tracking requests
   */
  categorizeTrackingRequests(requests) {
    const byVendor = {};
    for (const req of requests) {
      if (!byVendor[req.vendor]) {
        byVendor[req.vendor] = {
          vendor: req.vendor,
          requestCount: 0,
          urls: []
        };
      }
      byVendor[req.vendor].requestCount++;
      if (byVendor[req.vendor].urls.length < 3) {
        byVendor[req.vendor].urls.push(req.url.substring(0, 100));
      }
    }
    return Object.values(byVendor);
  }

  /**
   * Find cookie consent banner using multiple detection methods
   * 1. CSS selector detection (known CMPs)
   * 2. Text-based detection (keyword search)
   * 3. Visual detection (fixed/sticky overlays)
   * 4. Consent cookie detection (fallback indicator)
   */
  async findCookieBanner(page) {
    const result = {
      exists: false,
      hasAcceptAll: false,
      hasRejectAll: false,
      hasSettings: false,
      selector: null,
      acceptAllSelector: null,
      rejectAllSelector: null,
      detectionMethod: null
    };

    // METHOD 1: CSS Selector Detection (known CMPs)
    for (const selector of CMP_SELECTORS.banner) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isIntersectingViewport();
          if (isVisible) {
            result.exists = true;
            result.selector = selector;
            result.detectionMethod = 'css-selector';
            break;
          }
        }
      } catch (e) {
        // Selector not found, continue
      }
    }

    // METHOD 2: Text-based Detection (if CSS failed)
    if (!result.exists) {
      const bannerKeywords = [
        // Swedish
        'cookies', 'kakor', 'samtycke', 'godkänn', 'acceptera', 'integritet',
        // English
        'consent', 'privacy', 'cookie policy', 'we use cookies',
        // German
        'einwilligung', 'zustimmen',
        // Common phrases
        'cookie notice', 'cookie banner', 'gdpr'
      ];

      try {
        const textBanner = await page.evaluate((keywords) => {
          // Find visible elements with consent-related text
          const allElements = document.querySelectorAll('div, section, aside, dialog, [role="dialog"], [role="alertdialog"]');

          for (const el of allElements) {
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' &&
                              style.visibility !== 'hidden' &&
                              style.opacity !== '0' &&
                              el.offsetHeight > 50;

            if (!isVisible) continue;

            const text = el.textContent?.toLowerCase() || '';
            const hasKeyword = keywords.some(kw => text.includes(kw.toLowerCase()));

            // Must have buttons to be a consent banner
            const hasButtons = el.querySelectorAll('button, [role="button"], a.btn, a.button, input[type="submit"]').length >= 1;

            if (hasKeyword && hasButtons) {
              // Check if it looks like a banner (fixed/sticky or at bottom/top)
              const rect = el.getBoundingClientRect();
              const isFixed = style.position === 'fixed' || style.position === 'sticky';
              const isAtEdge = rect.top < 100 || rect.bottom > window.innerHeight - 200;
              const isOverlay = style.zIndex && parseInt(style.zIndex) > 100;

              if (isFixed || isAtEdge || isOverlay) {
                return { found: true, tagName: el.tagName, className: el.className };
              }
            }
          }
          return { found: false };
        }, bannerKeywords);

        if (textBanner.found) {
          result.exists = true;
          result.detectionMethod = 'text-based';
          result.selector = `${textBanner.tagName}.${textBanner.className?.split(' ')[0] || 'detected'}`;
        }
      } catch (e) {
        console.log('Text-based detection failed:', e.message);
      }
    }

    // METHOD 3: Visual Overlay Detection (if still not found)
    if (!result.exists) {
      try {
        const visualBanner = await page.evaluate(() => {
          const overlays = document.querySelectorAll('div, section, aside, dialog');

          for (const el of overlays) {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();

            // Check for fixed/sticky positioning with high z-index
            const isFixed = style.position === 'fixed' || style.position === 'sticky';
            const hasHighZIndex = parseInt(style.zIndex) > 999 || style.zIndex === 'auto';
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
            const hasSize = rect.width > 200 && rect.height > 50;
            const hasButtons = el.querySelectorAll('button, [role="button"]').length >= 1;

            // Check if positioned at bottom or as modal
            const isAtBottom = rect.bottom >= window.innerHeight - 50;
            const isModal = rect.top > 50 && rect.bottom < window.innerHeight - 50 &&
                           rect.left > 50 && rect.right < window.innerWidth - 50;

            if (isFixed && isVisible && hasSize && hasButtons && (isAtBottom || isModal || hasHighZIndex)) {
              return { found: true, position: isAtBottom ? 'bottom' : 'modal' };
            }
          }
          return { found: false };
        });

        if (visualBanner.found) {
          result.exists = true;
          result.detectionMethod = 'visual-overlay';
          result.selector = `visual-${visualBanner.position}`;
        }
      } catch (e) {
        console.log('Visual detection failed:', e.message);
      }
    }

    // METHOD 4: Consent Cookie Detection (fallback indicator)
    if (!result.exists) {
      const cookies = await page.cookies();
      const consentCookieNames = [
        'cookieconsent', 'cookie_consent', 'gdpr', 'cc_cookie', 'CookieConsent',
        'OptanonConsent', 'OptanonAlertBoxClosed', 'euconsent', 'euconsent-v2',
        'CookieControl', 'CookieLaw', 'cookie-agreed', 'cookies-accepted',
        'hasConsent', 'consent', 'cookie_notice', 'cookiePolicy'
      ];

      const hasConsentCookie = cookies.some(cookie =>
        consentCookieNames.some(name =>
          cookie.name.toLowerCase().includes(name.toLowerCase())
        )
      );

      if (hasConsentCookie) {
        // Consent cookie exists = user already interacted with banner previously
        result.exists = true;
        result.detectionMethod = 'consent-cookie';
        result.selector = 'consent-cookie-detected';
      }
    }

    // METHOD 5: TCF (IAB Transparency and Consent Framework) Detection
    if (!result.exists) {
      try {
        const tcfDetection = await page.evaluate(() => {
          // Check for __tcfapi (TCF v2 API)
          if (typeof window.__tcfapi === 'function') {
            return { found: true, version: 'tcf-v2', method: '__tcfapi' };
          }

          // Check for __cmp (TCF v1 API - legacy)
          if (typeof window.__cmp === 'function') {
            return { found: true, version: 'tcf-v1', method: '__cmp' };
          }

          // Check for TCF config variables
          if (window.__tcfapiLocator || window.__cmpLocator) {
            return { found: true, version: 'tcf-locator', method: 'locator-frame' };
          }

          // Check for common TCF/CMP global variables
          const tcfVars = ['__tcfapiQueue', '__cmpQueue', 'gdprApplies', '__gpp'];
          for (const varName of tcfVars) {
            if (window[varName] !== undefined) {
              return { found: true, version: 'tcf-queue', method: varName };
            }
          }

          // Check for Sourcepoint specific
          if (window._sp_ || window._sp_ccpa || window._sp_v2) {
            return { found: true, version: 'sourcepoint', method: 'sourcepoint-global' };
          }

          return { found: false };
        });

        if (tcfDetection.found) {
          result.exists = true;
          result.detectionMethod = 'tcf-api';
          result.tcfVersion = tcfDetection.version;
          result.selector = `tcf-${tcfDetection.method}`;
          result.isTcf = true;
          console.log(`🔐 TCF detected: ${tcfDetection.version} via ${tcfDetection.method}`);
        }
      } catch (e) {
        console.log('TCF detection failed:', e.message);
      }
    }

    // METHOD 6: Check for TCF cookies (IABTCF_ prefix)
    if (!result.exists) {
      const cookies = await page.cookies();
      const tcfCookies = cookies.filter(c =>
        c.name.startsWith('IABTCF_') ||
        c.name === 'euconsent-v2' ||
        c.name.startsWith('_sp_')
      );

      if (tcfCookies.length > 0) {
        result.exists = true;
        result.detectionMethod = 'tcf-cookie';
        result.isTcf = true;
        result.selector = 'tcf-cookie-detected';
        console.log(`🔐 TCF cookies found: ${tcfCookies.map(c => c.name).join(', ')}`);
      }
    }

    // Now find Accept All and Reject All buttons
    if (result.exists) {
      await this.findConsentButtons(page, result);
    }

    // STEG 1: Extract banner text, buttons, and screenshot for AI analysis
    if (result.exists && result.detectionMethod !== 'consent-cookie') {
      try {
        await this.extractBannerData(page, result);
      } catch (e) {
        console.log('Could not extract banner data:', e.message);
      }
    }

    return result;
  }

  /**
   * Find Accept All and Reject All buttons using multiple methods
   */
  async findConsentButtons(page, result) {
    // Keywords for button detection
    const acceptKeywords = [
      // Swedish
      'acceptera', 'godkänn', 'tillåt', 'ja', 'ok', 'jag förstår', 'jag accepterar',
      'acceptera alla', 'godkänn alla', 'tillåt alla',
      // English
      'accept', 'allow', 'agree', 'yes', 'ok', 'i understand', 'i accept',
      'accept all', 'allow all', 'agree to all', 'got it', 'enable all'
    ];

    const rejectKeywords = [
      // Swedish
      'neka', 'avvisa', 'avböj', 'nej', 'endast nödvändiga', 'bara nödvändiga',
      'neka alla', 'avvisa alla', 'avvisa icke-nödvändiga',
      // English
      'reject', 'decline', 'deny', 'refuse', 'no', 'necessary only', 'only necessary',
      'reject all', 'decline all', 'deny all', 'essential only', 'required only'
    ];

    const settingsKeywords = [
      // Swedish
      'anpassa', 'inställningar', 'hantera', 'välj cookies', 'cookie-inställningar',
      'mer info', 'mer information', 'läs mer', 'detaljer', 'visa detaljer',
      'hantera cookies', 'hantera inställningar', 'anpassa cookies',
      // English
      'settings', 'customize', 'customise', 'manage', 'preferences', 'options',
      'more options', 'cookie settings', 'learn more', 'more info', 'details',
      'manage cookies', 'manage preferences', 'cookie preferences', 'show details'
    ];

    try {
      // Find all clickable elements
      const buttons = await page.evaluate((acceptKw, rejectKw, settingsKw) => {
        const clickables = document.querySelectorAll('button, [role="button"], a.btn, a.button, input[type="submit"], input[type="button"]');
        let acceptBtn = null;
        let rejectBtn = null;
        let settingsBtn = null;

        for (const el of clickables) {
          const text = (el.textContent || el.value || '').toLowerCase().trim();
          const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
          const combinedText = text + ' ' + ariaLabel;

          // Skip tiny or hidden elements
          const rect = el.getBoundingClientRect();
          if (rect.width < 30 || rect.height < 20) continue;

          // Check for accept button
          if (!acceptBtn) {
            for (const kw of acceptKw) {
              if (combinedText.includes(kw.toLowerCase())) {
                acceptBtn = { found: true, text: text.substring(0, 50) };
                break;
              }
            }
          }

          // Check for reject button
          if (!rejectBtn) {
            for (const kw of rejectKw) {
              if (combinedText.includes(kw.toLowerCase())) {
                rejectBtn = { found: true, text: text.substring(0, 50) };
                break;
              }
            }
          }

          // Check for settings button
          if (!settingsBtn) {
            for (const kw of settingsKw) {
              if (combinedText.includes(kw.toLowerCase())) {
                settingsBtn = { found: true, text: text.substring(0, 50) };
                break;
              }
            }
          }
        }

        return { acceptBtn, rejectBtn, settingsBtn };
      }, acceptKeywords, rejectKeywords, settingsKeywords);

      if (buttons.acceptBtn?.found) {
        result.hasAcceptAll = true;
        result.acceptAllSelector = `button:text("${buttons.acceptBtn.text}")`;
      }

      if (buttons.rejectBtn?.found) {
        result.hasRejectAll = true;
        result.rejectAllSelector = `button:text("${buttons.rejectBtn.text}")`;
      }

      if (buttons.settingsBtn?.found) {
        result.hasSettings = true;
        result.settingsSelector = `button:text("${buttons.settingsBtn.text}")`;
      }

    } catch (e) {
      console.log('Button detection failed:', e.message);
    }

    // Fallback: Try CSS selectors
    if (!result.hasAcceptAll) {
      for (const selector of CMP_SELECTORS.acceptAll) {
        try {
          if (!selector.includes(':contains')) {
            const element = await page.$(selector);
            if (element) {
              result.hasAcceptAll = true;
              result.acceptAllSelector = selector;
              break;
            }
          }
        } catch (e) {}
      }
    }

    if (!result.hasRejectAll) {
      for (const selector of CMP_SELECTORS.rejectAll) {
        try {
          if (!selector.includes(':contains')) {
            const element = await page.$(selector);
            if (element) {
              result.hasRejectAll = true;
              result.rejectAllSelector = selector;
              break;
            }
          }
        } catch (e) {}
      }
    }

    // IFRAME DETECTION: If buttons not found on main page, check CMP iframes
    if (!result.hasAcceptAll || !result.hasRejectAll || !result.hasSettings) {
      await this.findButtonsInIframes(page, result);
    }
  }

  /**
   * Find consent buttons inside CMP iframes (Sourcepoint, OneTrust, etc.)
   */
  async findButtonsInIframes(page, result) {
    const acceptKeywords = [
      'acceptera', 'godkänn', 'tillåt', 'acceptera alla', 'godkänn alla', 'tillåt alla',
      'accept', 'allow', 'agree', 'accept all', 'allow all', 'agree to all', 'got it', 'enable all',
      'jag godkänner', 'i agree', 'yes to all', 'ja till alla'
    ];

    const rejectKeywords = [
      'neka', 'avvisa', 'avböj', 'endast nödvändiga', 'bara nödvändiga', 'neka alla', 'avvisa alla',
      'reject', 'decline', 'deny', 'refuse', 'necessary only', 'only necessary',
      'reject all', 'decline all', 'deny all', 'essential only', 'required only',
      'nej tack', 'no thanks', 'do not accept'
    ];

    const settingsKeywords = [
      'anpassa', 'inställningar', 'hantera', 'välj cookies', 'mer info', 'detaljer',
      'settings', 'customize', 'customise', 'manage', 'preferences', 'options',
      'more options', 'cookie settings', 'learn more', 'show purposes', 'visa syften'
    ];

    try {
      // Find all potential CMP iframes
      for (const iframeSelector of CMP_SELECTORS.iframes) {
        try {
          const iframeHandle = await page.$(iframeSelector);
          if (!iframeHandle) continue;

          // Get the iframe's content frame
          const frame = await iframeHandle.contentFrame();
          if (!frame) continue;

          console.log(`🔍 Checking iframe: ${iframeSelector}`);

          // Wait a bit for iframe content to load
          await this.wait(500);

          // Find buttons inside the iframe
          const iframeButtons = await frame.evaluate((acceptKw, rejectKw, settingsKw) => {
            const clickables = document.querySelectorAll('button, [role="button"], a, span[onclick], div[onclick], [class*="button"], [class*="btn"]');
            let acceptBtn = null;
            let rejectBtn = null;
            let settingsBtn = null;

            for (const el of clickables) {
              const text = (el.textContent || el.innerText || '').toLowerCase().trim();
              const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
              const title = (el.getAttribute('title') || '').toLowerCase();
              const combinedText = text + ' ' + ariaLabel + ' ' + title;

              // Skip tiny elements
              const rect = el.getBoundingClientRect();
              if (rect.width < 20 || rect.height < 15) continue;

              // Check for accept button
              if (!acceptBtn) {
                for (const kw of acceptKw) {
                  if (combinedText.includes(kw.toLowerCase())) {
                    acceptBtn = { found: true, text: text.substring(0, 50) };
                    break;
                  }
                }
              }

              // Check for reject button
              if (!rejectBtn) {
                for (const kw of rejectKw) {
                  if (combinedText.includes(kw.toLowerCase())) {
                    rejectBtn = { found: true, text: text.substring(0, 50) };
                    break;
                  }
                }
              }

              // Check for settings button
              if (!settingsBtn) {
                for (const kw of settingsKw) {
                  if (combinedText.includes(kw.toLowerCase())) {
                    settingsBtn = { found: true, text: text.substring(0, 50) };
                    break;
                  }
                }
              }

              // Early exit if all found
              if (acceptBtn && rejectBtn && settingsBtn) break;
            }

            return { acceptBtn, rejectBtn, settingsBtn };
          }, acceptKeywords, rejectKeywords, settingsKeywords);

          // Update result with found buttons
          if (iframeButtons.acceptBtn?.found && !result.hasAcceptAll) {
            result.hasAcceptAll = true;
            result.acceptAllSelector = `iframe >> "${iframeButtons.acceptBtn.text}"`;
            result.iframeDetected = true;
            console.log(`✅ Found accept button in iframe: "${iframeButtons.acceptBtn.text}"`);
          }

          if (iframeButtons.rejectBtn?.found && !result.hasRejectAll) {
            result.hasRejectAll = true;
            result.rejectAllSelector = `iframe >> "${iframeButtons.rejectBtn.text}"`;
            result.iframeDetected = true;
            console.log(`✅ Found reject button in iframe: "${iframeButtons.rejectBtn.text}"`);
          }

          if (iframeButtons.settingsBtn?.found && !result.hasSettings) {
            result.hasSettings = true;
            result.settingsSelector = `iframe >> "${iframeButtons.settingsBtn.text}"`;
            result.iframeDetected = true;
            console.log(`✅ Found settings button in iframe: "${iframeButtons.settingsBtn.text}"`);
          }

          // If we found all buttons, stop searching
          if (result.hasAcceptAll && result.hasRejectAll && result.hasSettings) {
            break;
          }

        } catch (e) {
          // Iframe might not be accessible (cross-origin), continue to next
          continue;
        }
      }
    } catch (e) {
      console.log('Iframe button detection failed:', e.message);
    }
  }

  /**
   * Extract banner text, buttons, and screenshot for AI analysis
   * This data helps DeepSeek understand the actual banner content
   */
  async extractBannerData(page, result) {
    // Try to find the banner element again
    let bannerElement = null;

    // First try the detected selector if it's a valid CSS selector
    if (result.selector && !result.selector.startsWith('visual-') && !result.selector.includes(':text')) {
      try {
        bannerElement = await page.$(result.selector);
      } catch (e) {
        // Selector might not be valid CSS
      }
    }

    // If no element found, try common banner selectors
    if (!bannerElement) {
      for (const selector of CMP_SELECTORS.banner) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await element.isIntersectingViewport().catch(() => false);
            if (isVisible) {
              bannerElement = element;
              break;
            }
          }
        } catch (e) {}
      }
    }

    // If still no element, try to find by visual detection
    if (!bannerElement) {
      try {
        bannerElement = await page.evaluateHandle(() => {
          const overlays = document.querySelectorAll('div, section, aside, dialog');
          for (const el of overlays) {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const isFixed = style.position === 'fixed' || style.position === 'sticky';
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
            const hasButtons = el.querySelectorAll('button, [role="button"]').length >= 1;
            const hasSize = rect.width > 200 && rect.height > 50;

            if (isFixed && isVisible && hasButtons && hasSize) {
              return el;
            }
          }
          return null;
        });

        // Check if we got an element
        const isNull = await bannerElement.evaluate(el => el === null).catch(() => true);
        if (isNull) {
          bannerElement = null;
        }
      } catch (e) {
        bannerElement = null;
      }
    }

    // If still no element and iframe was detected, try to extract from iframe
    if (!bannerElement && result.iframeDetected) {
      console.log('🔍 Trying to extract banner data from iframe...');
      await this.extractBannerDataFromIframe(page, result);
      return;
    }

    if (!bannerElement) {
      console.log('Could not find banner element for data extraction');
      return;
    }

    // Extract banner text (max 1000 chars)
    try {
      result.text = await bannerElement.evaluate(el => {
        const text = el.textContent || '';
        // Clean up whitespace and limit length
        return text.replace(/\s+/g, ' ').trim().substring(0, 1000);
      });
      console.log(`📝 Extracted banner text: ${result.text.substring(0, 100)}...`);
    } catch (e) {
      console.log('Could not extract banner text:', e.message);
    }

    // Extract all button texts in the banner
    try {
      result.buttons = await bannerElement.evaluate(el => {
        const btns = el.querySelectorAll('button, [role="button"], a.btn, a.button, input[type="submit"], input[type="button"]');
        return Array.from(btns)
          .map(b => (b.textContent || b.value || '').trim())
          .filter(Boolean)
          .filter(t => t.length < 100); // Filter out very long texts
      });
      console.log(`🔘 Extracted ${result.buttons.length} button texts:`, result.buttons);
    } catch (e) {
      console.log('Could not extract button texts:', e.message);
    }

    // Take screenshot of the banner (base64 for DeepSeek vision)
    try {
      const screenshot = await bannerElement.screenshot({
        type: 'png',
        encoding: 'base64'
      });
      result.screenshot = screenshot;
      console.log(`📸 Captured banner screenshot (${Math.round(screenshot.length / 1024)}KB)`);
    } catch (e) {
      console.log('Could not capture banner screenshot:', e.message);
    }
  }

  /**
   * Extract banner data from CMP iframe
   */
  async extractBannerDataFromIframe(page, result) {
    try {
      for (const iframeSelector of CMP_SELECTORS.iframes) {
        try {
          const iframeHandle = await page.$(iframeSelector);
          if (!iframeHandle) continue;

          const frame = await iframeHandle.contentFrame();
          if (!frame) continue;

          // Extract text and buttons from iframe
          const iframeData = await frame.evaluate(() => {
            // Find the main content container
            const body = document.body;
            if (!body) return null;

            const text = body.textContent || '';
            const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 1000);

            // Find all buttons
            const btns = document.querySelectorAll('button, [role="button"], a, [class*="button"], [class*="btn"]');
            const buttonTexts = Array.from(btns)
              .map(b => (b.textContent || b.innerText || '').trim())
              .filter(Boolean)
              .filter(t => t.length > 2 && t.length < 100);

            return {
              text: cleanText,
              buttons: [...new Set(buttonTexts)] // Remove duplicates
            };
          });

          if (iframeData && iframeData.text) {
            result.text = iframeData.text;
            result.buttons = iframeData.buttons || [];
            console.log(`📝 Extracted iframe banner text: ${result.text.substring(0, 100)}...`);
            console.log(`🔘 Extracted ${result.buttons.length} button texts from iframe:`, result.buttons);

            // Try to take screenshot of the iframe
            try {
              const screenshot = await iframeHandle.screenshot({
                type: 'png',
                encoding: 'base64'
              });
              result.screenshot = screenshot;
              console.log(`📸 Captured iframe screenshot (${Math.round(screenshot.length / 1024)}KB)`);
            } catch (e) {
              console.log('Could not capture iframe screenshot');
            }

            break; // Found data, stop searching
          }

        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.log('Iframe banner data extraction failed:', e.message);
    }
  }

  /**
   * Find cookie/privacy policy link
   */
  async findCookiePolicy(page) {
    const policyPatterns = [
      /cookie.*policy/i,
      /privacy.*policy/i,
      /integritetspolicy/i,
      /dataskydd/i,
      /gdpr/i,
      /cookies/i
    ];

    try {
      const links = await page.$$eval('a', anchors =>
        anchors.map(a => ({ href: a.href, text: a.textContent?.trim() }))
      );

      for (const link of links) {
        for (const pattern of policyPatterns) {
          if (pattern.test(link.text) || pattern.test(link.href)) {
            return {
              exists: true,
              url: link.href,
              text: link.text
            };
          }
        }
      }
    } catch (e) {
      console.log('Could not find policy link');
    }

    return { exists: false, url: null, text: null };
  }

  /**
   * Analyze GDPR violations
   */
  analyzeViolations(result) {
    const violations = [];
    const compliant = [];

    // Check: Tracking cookies before consent
    const trackingBeforeConsent = result.cookiesBeforeConsent.filter(c => c.isTracking);
    if (trackingBeforeConsent.length > 0) {
      violations.push({
        severity: 'critical',
        issue: 'Tracking-cookies sätts innan samtycke',
        description: `${trackingBeforeConsent.length} tracking-cookie(s) sätts innan användaren gett samtycke`,
        cookies: trackingBeforeConsent.map(c => c.name),
        gdprArticle: 'Artikel 6, 7',
        action: 'Blockera tracking-scripts tills användaren ger samtycke'
      });
    } else {
      compliant.push('Inga tracking-cookies innan samtycke');
    }

    // Check: Tracking scripts before consent
    if (result.trackingScripts.length > 0) {
      violations.push({
        severity: 'high',
        issue: 'Tracking-skript laddas innan samtycke',
        description: `${result.trackingScripts.length} tracking-tjänst(er) laddas innan samtycke: ${result.trackingScripts.map(s => s.vendor).join(', ')}`,
        vendors: result.trackingScripts.map(s => s.vendor),
        gdprArticle: 'Artikel 6, 7',
        action: 'Använd tag manager med consent mode eller lazy-load scripts'
      });
    }

    // Check: Cookie banner exists
    // IMPORTANT: Only require banner if there are tracking cookies/scripts
    const hasTracking = trackingBeforeConsent.length > 0 || result.trackingScripts.length > 0;

    if (!result.banner.exists) {
      if (hasTracking) {
        // Has tracking but no banner = violation
        violations.push({
          severity: 'critical',
          issue: 'Cookie-banner saknas',
          description: 'Tracking används men ingen cookie-banner hittades',
          gdprArticle: 'Artikel 7, 13',
          action: 'Implementera en cookie-banner med samtyckesfunktion'
        });
      } else {
        // No tracking and no banner = privacy by design (GOOD!)
        compliant.push('Privacy by design - ingen tracking, ingen banner behövs');
        result.privacyByDesign = true;
      }
    } else {
      compliant.push('Cookie-banner finns');
    }

    // Check: Reject All option (only relevant if banner exists AND it's a real consent banner)
    // If banner text says "no cookies" / "don't track" - it's an informative notice, not a consent banner
    const bannerText = (result.banner?.text || '').toLowerCase();
    const isPrivacyNotice = bannerText.includes('no cookies') ||
                            bannerText.includes('don\'t use cookies') ||
                            bannerText.includes('do not use cookies') ||
                            bannerText.includes('don\'t track') ||
                            bannerText.includes('cookie-free') ||
                            bannerText.includes('inga cookies') ||
                            bannerText.includes('använder inga cookies') ||
                            bannerText.includes('spårar dig inte');

    if (isPrivacyNotice && !hasTracking) {
      // This is a "we don't use cookies" notice - treat as privacy by design
      compliant.push('Privacy by design - informativ integritetsbanner utan tracking');
      result.privacyByDesign = true;
      result.isPrivacyNotice = true;
    } else if (result.banner.isTcf && !hasTracking) {
      // TCF-based CMP detected and no tracking before consent = properly implemented
      compliant.push('TCF/IAB-kompatibel consent-lösning - tracking blockeras före samtycke');
      result.tcfCompliant = true;
    } else if (result.banner.exists && !result.banner.hasRejectAll && hasTracking) {
      // Only require reject button if there's actual tracking AND not TCF
      if (result.banner.isTcf) {
        // TCF has its own reject mechanism, but tracking is still loading = problem
        violations.push({
          severity: 'high',
          issue: 'TCF-banner men tracking laddar före samtycke',
          description: 'TCF/CMP finns men tracking-scripts laddar ändå innan samtycke getts',
          gdprArticle: 'Artikel 6, 7',
          action: 'Konfigurera TCF/CMP att blockera tracking tills samtycke ges'
        });
      } else {
        violations.push({
          severity: 'high',
          issue: '"Neka alla" saknas',
          description: 'Cookie-bannern saknar ett enkelt sätt att neka alla cookies',
          gdprArticle: 'Artikel 7(3)',
          action: 'Lägg till en "Neka alla" eller "Endast nödvändiga" knapp'
        });
      }
    } else if (result.banner.hasRejectAll) {
      compliant.push('"Neka alla"-knapp finns');
    }

    // NEW: Always check for missing reject button (EDPB guidelines)
    // "Reject all" should be as easy as "Accept all" - regardless of tracking status
    if (result.banner.exists && !result.banner.hasRejectAll && !isPrivacyNotice && !result.privacyByDesign) {
      // Check if we already added a violation for this
      const alreadyHasRejectViolation = violations.some(v => v.issue.includes('Neka alla'));
      if (!alreadyHasRejectViolation) {
        violations.push({
          severity: 'medium',
          issue: '"Neka alla"-knapp saknas eller är gömd',
          description: 'Enligt EDPB-riktlinjer ska "Neka alla" vara lika enkelt som "Acceptera alla". Att gömma avvisningsalternativet bakom "Inställningar" räknas som dark pattern.',
          gdprArticle: 'EDPB Riktlinjer 05/2020',
          action: 'Lägg till en synlig "Neka alla" eller "Endast nödvändiga" knapp på första skärmen'
        });
      }
    }

    // Check: Cookies after reject
    if (result.cookiesAfterReject.length > 0) {
      const trackingAfterReject = result.cookiesAfterReject.filter(c => c.isTracking);
      if (trackingAfterReject.length > 0) {
        violations.push({
          severity: 'critical',
          issue: 'Tracking-cookies sätts trots avslag',
          description: `${trackingAfterReject.length} tracking-cookie(s) sätts även efter att användaren nekat`,
          cookies: trackingAfterReject.map(c => c.name),
          gdprArticle: 'Artikel 6, 7',
          action: 'Se till att "Neka alla" faktiskt blockerar alla tracking-cookies'
        });
      } else {
        compliant.push('Tracking-cookies blockeras vid avslag');
      }
    }

    // Check: Privacy policy
    if (!result.policyLink?.exists) {
      violations.push({
        severity: 'medium',
        issue: 'Cookie/integritetspolicy saknas',
        description: 'Ingen länk till cookie- eller integritetspolicy hittades',
        gdprArticle: 'Artikel 13, 14',
        action: 'Lägg till en länk till er integritetspolicy i cookie-bannern'
      });
    } else {
      compliant.push('Integritetspolicy finns');
    }

    result.violations = violations;
    result.compliant = compliant;
  }

  /**
   * Calculate compliance score
   */
  calculateScore(result) {
    let score = 100;
    let riskLevel = 'low';

    for (const violation of result.violations) {
      switch (violation.severity) {
        case 'critical':
          score -= 30;
          riskLevel = 'critical';
          break;
        case 'high':
          score -= 20;
          if (riskLevel !== 'critical') riskLevel = 'high';
          break;
        case 'medium':
          score -= 10;
          if (riskLevel === 'low') riskLevel = 'medium';
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    result.complianceScore = Math.max(0, score);
    result.riskLevel = riskLevel;

    // Privacy by design bonus
    if (result.privacyByDesign) {
      result.complianceScore = Math.min(100, result.complianceScore + 10); // Bonus for privacy-first
      result.riskLevel = 'low';
      result.privacyNote = {
        text: 'Privacy by design',
        description: 'Sajten använder ingen tracking och behöver därför ingen cookie-banner. Detta är bästa praxis enligt GDPR.',
        gdprArticle: 'Artikel 25 - Inbyggt dataskydd'
      };
    }

    // Add potential fine warning
    if (riskLevel === 'critical' || riskLevel === 'high') {
      result.fineWarning = {
        text: 'Potentiell bot enligt GDPR',
        maxFine: 'Upp till 20 miljoner EUR eller 4% av global omsättning',
        authority: 'IMY (Integritetsskyddsmyndigheten)'
      };
    }
  }

  /**
   * Helper: Wait for specified time
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GdprAnalyzer;
