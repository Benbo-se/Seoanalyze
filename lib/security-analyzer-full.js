/**
 * Full Security Analyzer
 * Extended security analysis including:
 * - Security headers (from existing SecurityAnalyzer)
 * - SSL/TLS certificate analysis
 * - Exposed sensitive files detection
 * - Vulnerable JavaScript libraries
 * - Mixed content detection
 */

const https = require('https');
const tls = require('tls');
const { URL } = require('url');
const SecurityAnalyzer = require('./security-analyzer');
const { withBrowser } = require('./browser-pool');
const axios = require('axios');

// Known vulnerable JavaScript libraries
const VULNERABLE_LIBRARIES = {
  jquery: [
    { version: '<1.9.0', severity: 'high', cve: 'CVE-2012-6708', issue: 'XSS vulnerability' },
    { version: '<1.12.0', severity: 'medium', cve: 'CVE-2015-9251', issue: 'Prototype pollution' },
    { version: '<3.0.0', severity: 'medium', cve: 'CVE-2019-11358', issue: 'Prototype pollution' },
    { version: '<3.4.0', severity: 'medium', cve: 'CVE-2019-11358', issue: 'Prototype pollution' },
    { version: '<3.5.0', severity: 'medium', cve: 'CVE-2020-11022', issue: 'XSS in htmlPrefilter' },
  ],
  angular: [
    { version: '<1.6.0', severity: 'high', cve: 'Multiple', issue: 'Multiple XSS vulnerabilities' },
    { version: '<1.6.9', severity: 'medium', cve: 'CVE-2019-10768', issue: 'Prototype pollution' },
  ],
  bootstrap: [
    { version: '<3.4.0', severity: 'medium', cve: 'CVE-2018-14040', issue: 'XSS vulnerability' },
    { version: '<4.3.1', severity: 'medium', cve: 'CVE-2019-8331', issue: 'XSS in tooltip' },
  ],
  lodash: [
    { version: '<4.17.5', severity: 'high', cve: 'CVE-2018-3721', issue: 'Prototype pollution' },
    { version: '<4.17.11', severity: 'high', cve: 'CVE-2019-1010266', issue: 'Regular expression DoS' },
    { version: '<4.17.21', severity: 'medium', cve: 'CVE-2021-23337', issue: 'Command injection' },
  ],
  moment: [
    { version: '<2.29.2', severity: 'medium', cve: 'CVE-2022-24785', issue: 'Path traversal' },
  ],
  handlebars: [
    { version: '<4.7.7', severity: 'high', cve: 'CVE-2021-23369', issue: 'Prototype pollution RCE' },
  ],
  react: [
    { version: '<16.4.2', severity: 'medium', cve: 'CVE-2018-6341', issue: 'XSS in server-side rendering' },
  ],
  vue: [
    { version: '<2.5.17', severity: 'medium', cve: 'CVE-2018-11235', issue: 'Script injection in SSR' },
  ],
  dompurify: [
    { version: '<2.2.9', severity: 'high', cve: 'CVE-2021-23648', issue: 'mXSS bypass' },
  ],
  axios: [
    { version: '<0.21.1', severity: 'high', cve: 'CVE-2020-28168', issue: 'Server-Side Request Forgery' },
  ],
};

// Sensitive files to check
const SENSITIVE_FILES = [
  { path: '/.git/config', severity: 'critical', description: 'Git configuration exposed - source code leak' },
  { path: '/.git/HEAD', severity: 'critical', description: 'Git repository exposed' },
  { path: '/.env', severity: 'critical', description: 'Environment variables exposed - secrets leak' },
  { path: '/.env.local', severity: 'critical', description: 'Local environment variables exposed' },
  { path: '/.env.production', severity: 'critical', description: 'Production environment variables exposed' },
  { path: '/wp-config.php', severity: 'critical', description: 'WordPress config exposed - DB credentials' },
  { path: '/wp-config.php.bak', severity: 'critical', description: 'WordPress config backup exposed' },
  { path: '/config.php', severity: 'high', description: 'Configuration file exposed' },
  { path: '/configuration.php', severity: 'high', description: 'Joomla configuration exposed' },
  { path: '/phpinfo.php', severity: 'high', description: 'PHP info exposed - server information leak' },
  { path: '/info.php', severity: 'high', description: 'PHP info exposed' },
  { path: '/.htaccess', severity: 'medium', description: 'Apache configuration exposed' },
  { path: '/.htpasswd', severity: 'critical', description: 'Apache password file exposed' },
  { path: '/backup.sql', severity: 'critical', description: 'Database backup exposed' },
  { path: '/database.sql', severity: 'critical', description: 'Database dump exposed' },
  { path: '/dump.sql', severity: 'critical', description: 'Database dump exposed' },
  { path: '/db.sql', severity: 'critical', description: 'Database dump exposed' },
  { path: '/.DS_Store', severity: 'low', description: 'macOS metadata file exposed' },
  { path: '/Thumbs.db', severity: 'low', description: 'Windows thumbnail cache exposed' },
  { path: '/web.config', severity: 'medium', description: 'IIS configuration exposed' },
  { path: '/server-status', severity: 'medium', description: 'Apache server status exposed' },
  { path: '/debug', severity: 'medium', description: 'Debug endpoint exposed' },
  { path: '/debug.log', severity: 'high', description: 'Debug log exposed' },
  { path: '/error.log', severity: 'high', description: 'Error log exposed' },
  { path: '/access.log', severity: 'medium', description: 'Access log exposed' },
  { path: '/composer.json', severity: 'low', description: 'Composer dependencies exposed' },
  { path: '/composer.lock', severity: 'low', description: 'Composer lock file exposed' },
  { path: '/package.json', severity: 'low', description: 'NPM dependencies exposed' },
  { path: '/package-lock.json', severity: 'low', description: 'NPM lock file exposed' },
  { path: '/yarn.lock', severity: 'low', description: 'Yarn lock file exposed' },
  { path: '/.npmrc', severity: 'high', description: 'NPM config (may contain tokens)' },
  { path: '/id_rsa', severity: 'critical', description: 'SSH private key exposed' },
  { path: '/.ssh/id_rsa', severity: 'critical', description: 'SSH private key exposed' },
  { path: '/credentials.json', severity: 'critical', description: 'Credentials file exposed' },
  { path: '/secrets.json', severity: 'critical', description: 'Secrets file exposed' },
  { path: '/admin', severity: 'medium', description: 'Admin panel accessible' },
  { path: '/administrator', severity: 'medium', description: 'Admin panel accessible' },
  { path: '/phpmyadmin', severity: 'high', description: 'phpMyAdmin accessible' },
  { path: '/adminer.php', severity: 'high', description: 'Adminer database tool exposed' },
];

class FullSecurityAnalyzer {

  /**
   * Run complete security analysis
   * @param {string} url - URL to analyze
   * @returns {Object} Complete security analysis
   */
  async analyze(url) {
    console.log(`🔒 Starting full security analysis for ${url}`);
    const startTime = Date.now();

    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';

    const result = {
      url,
      timestamp: new Date().toISOString(),
      isHttps,
      headers: null,
      ssl: null,
      exposedFiles: [],
      vulnerableLibraries: [],
      mixedContent: [],
      serverInfo: null,
      score: 0,
      grade: 'F',
      riskLevel: 'unknown',
      issues: [],
      recommendations: [],
      analysisTime: 0
    };

    try {
      // Run all analyses in parallel where possible
      const [headersResult, sslResult, filesResult, libsResult, mixedResult] = await Promise.all([
        this.analyzeHeadersFromUrl(url),
        isHttps ? this.analyzeSSL(parsedUrl.hostname) : Promise.resolve(null),
        this.checkExposedFiles(url),
        this.scanVulnerableLibraries(url),
        isHttps ? this.detectMixedContent(url) : Promise.resolve([])
      ]);

      result.headers = headersResult;
      result.ssl = sslResult;
      result.exposedFiles = filesResult;
      result.vulnerableLibraries = libsResult;
      result.mixedContent = mixedResult;

      // Calculate overall score
      this.calculateOverallScore(result);

    } catch (error) {
      console.error('Security analysis error:', error);
      result.error = error.message;
    }

    result.analysisTime = Date.now() - startTime;
    console.log(`✅ Security analysis completed in ${result.analysisTime}ms`);

    return result;
  }

  /**
   * Analyze security headers by fetching the URL
   */
  async analyzeHeadersFromUrl(url) {
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Normalize headers to lowercase
      const headers = {};
      for (const [key, value] of Object.entries(response.headers)) {
        headers[key.toLowerCase()] = value;
      }

      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';

      // Use existing SecurityAnalyzer for header analysis
      const analysis = SecurityAnalyzer.analyzeHeaders(headers, isHttps);

      // Add server info
      analysis.serverInfo = {
        server: headers['server'] || 'Not disclosed',
        poweredBy: headers['x-powered-by'] || 'Not disclosed',
        aspNetVersion: headers['x-aspnet-version'] || null,
        phpVersion: headers['x-powered-by']?.match(/PHP\/([\d.]+)/)?.[1] || null
      };

      // Check for information disclosure
      if (headers['server'] && headers['server'] !== 'Not disclosed') {
        analysis.issues.push('Server header reveals software: ' + headers['server']);
        analysis.recommendations.push({
          issue: 'Server information disclosure',
          fix: 'Hide server version in response headers',
          code: '# Nginx: server_tokens off;\n# Apache: ServerTokens Prod'
        });
      }

      if (headers['x-powered-by']) {
        analysis.issues.push('X-Powered-By header reveals technology: ' + headers['x-powered-by']);
        analysis.recommendations.push({
          issue: 'Technology disclosure via X-Powered-By',
          fix: 'Remove X-Powered-By header',
          code: '# PHP: expose_php = Off\n# Express: app.disable("x-powered-by")'
        });
      }

      return analysis;

    } catch (error) {
      console.error('Header analysis error:', error.message);
      return {
        score: 0,
        grade: 'F',
        issues: ['Could not fetch headers: ' + error.message],
        recommendations: [],
        details: {}
      };
    }
  }

  /**
   * Analyze SSL/TLS certificate
   */
  async analyzeSSL(hostname) {
    return new Promise((resolve) => {
      const result = {
        valid: false,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysUntilExpiry: null,
        protocol: null,
        cipher: null,
        keyExchange: null,
        issues: [],
        recommendations: []
      };

      const options = {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false // Allow checking invalid certs
      };

      const socket = tls.connect(options, () => {
        try {
          const cert = socket.getPeerCertificate();
          const protocol = socket.getProtocol();
          const cipher = socket.getCipher();

          if (cert && Object.keys(cert).length > 0) {
            result.valid = socket.authorized;
            result.issuer = cert.issuer?.O || cert.issuer?.CN || 'Unknown';
            result.subject = cert.subject?.CN || hostname;
            result.validFrom = cert.valid_from;
            result.validTo = cert.valid_to;

            // Calculate days until expiry
            const expiryDate = new Date(cert.valid_to);
            const now = new Date();
            result.daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

            result.protocol = protocol;
            result.cipher = cipher?.name;
            result.keyExchange = cipher?.standardName;

            // Check for issues
            if (!socket.authorized) {
              result.issues.push('SSL certificate is not valid: ' + socket.authorizationError);
            }

            if (result.daysUntilExpiry < 0) {
              result.issues.push('SSL certificate has EXPIRED');
            } else if (result.daysUntilExpiry < 30) {
              result.issues.push(`SSL certificate expires in ${result.daysUntilExpiry} days`);
              result.recommendations.push({
                issue: 'Certificate expiring soon',
                fix: 'Renew SSL certificate immediately',
                code: '# Let\'s Encrypt: certbot renew'
              });
            } else if (result.daysUntilExpiry < 90) {
              result.recommendations.push({
                issue: 'Certificate renewal reminder',
                fix: `Certificate expires in ${result.daysUntilExpiry} days - plan renewal`
              });
            }

            // Check protocol version
            if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
              result.issues.push(`Outdated TLS version: ${protocol}`);
              result.recommendations.push({
                issue: 'Deprecated TLS version',
                fix: 'Upgrade to TLS 1.2 or TLS 1.3',
                code: '# Nginx: ssl_protocols TLSv1.2 TLSv1.3;'
              });
            }

            if (protocol === 'TLSv1.2') {
              result.recommendations.push({
                issue: 'TLS 1.3 recommended',
                fix: 'Enable TLS 1.3 for better performance and security'
              });
            }
          }
        } catch (e) {
          result.issues.push('Could not analyze certificate: ' + e.message);
        }

        socket.end();
        resolve(result);
      });

      socket.on('error', (err) => {
        result.issues.push('SSL connection error: ' + err.message);
        resolve(result);
      });

      socket.setTimeout(10000, () => {
        result.issues.push('SSL connection timeout');
        socket.destroy();
        resolve(result);
      });
    });
  }

  /**
   * Check for exposed sensitive files
   */
  async checkExposedFiles(baseUrl) {
    const exposed = [];
    const parsedUrl = new URL(baseUrl);
    const origin = parsedUrl.origin;

    // Check files in parallel with limited concurrency
    const batchSize = 10;
    for (let i = 0; i < SENSITIVE_FILES.length; i += batchSize) {
      const batch = SENSITIVE_FILES.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (file) => {
          try {
            const checkUrl = origin + file.path;
            const response = await axios.head(checkUrl, {
              timeout: 5000,
              maxRedirects: 0,
              validateStatus: () => true,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)'
              }
            });

            // Check if file exists (200, 403 sometimes means it exists)
            if (response.status === 200) {
              return {
                ...file,
                url: checkUrl,
                status: response.status,
                found: true
              };
            }
            // 403 might indicate the file exists but is protected
            if (response.status === 403 && file.severity === 'critical') {
              return {
                ...file,
                url: checkUrl,
                status: response.status,
                found: true,
                note: 'File exists but access is forbidden'
              };
            }
          } catch (e) {
            // Connection refused, timeout, etc. - file likely doesn't exist
          }
          return null;
        })
      );

      exposed.push(...results.filter(r => r !== null));
    }

    return exposed;
  }

  /**
   * Scan for vulnerable JavaScript libraries
   */
  async scanVulnerableLibraries(url) {
    const vulnerabilities = [];

    try {
      await withBrowser(async (browser) => {
        const page = await browser.newPage();

        // Capture loaded scripts
        const scripts = [];
        page.on('response', async (response) => {
          const reqUrl = response.url();
          if (reqUrl.endsWith('.js') || response.headers()['content-type']?.includes('javascript')) {
            scripts.push(reqUrl);
          }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Check for library versions in window object
        const detectedLibs = await page.evaluate(() => {
          const libs = {};

          // jQuery
          if (window.jQuery) libs.jquery = window.jQuery.fn?.jquery || window.jQuery.prototype?.jquery;

          // Angular
          if (window.angular) libs.angular = window.angular.version?.full;

          // React
          if (window.React) libs.react = window.React.version;

          // Vue
          if (window.Vue) libs.vue = window.Vue.version;

          // Lodash
          if (window._) libs.lodash = window._.VERSION;

          // Moment
          if (window.moment) libs.moment = window.moment.version;

          // Bootstrap (check for jQuery plugin)
          if (window.jQuery?.fn?.tooltip?.Constructor?.VERSION) {
            libs.bootstrap = window.jQuery.fn.tooltip.Constructor.VERSION;
          }

          // Axios
          if (window.axios) libs.axios = window.axios.VERSION;

          return libs;
        });

        // Also check script URLs for versions
        for (const scriptUrl of scripts) {
          // Match common CDN patterns like jquery-3.6.0.min.js
          const versionMatch = scriptUrl.match(/([a-z]+)[-.](\d+\.\d+\.\d+)/i);
          if (versionMatch) {
            const [, lib, version] = versionMatch;
            const libName = lib.toLowerCase();
            if (!detectedLibs[libName]) {
              detectedLibs[libName] = version;
            }
          }
        }

        // Check detected libraries against vulnerability database
        for (const [libName, version] of Object.entries(detectedLibs)) {
          if (version && VULNERABLE_LIBRARIES[libName]) {
            for (const vuln of VULNERABLE_LIBRARIES[libName]) {
              if (this.isVersionVulnerable(version, vuln.version)) {
                vulnerabilities.push({
                  library: libName,
                  detectedVersion: version,
                  vulnerableVersions: vuln.version,
                  severity: vuln.severity,
                  cve: vuln.cve,
                  issue: vuln.issue,
                  recommendation: `Update ${libName} to latest version`
                });
              }
            }
          }
        }

        await page.close();
      });
    } catch (error) {
      console.error('Library scan error:', error.message);
    }

    return vulnerabilities;
  }

  /**
   * Check if version is vulnerable
   */
  isVersionVulnerable(detected, vulnerable) {
    // Parse version pattern like "<3.5.0"
    const match = vulnerable.match(/([<>=]+)?(\d+\.\d+\.\d+)/);
    if (!match) return false;

    const [, operator, targetVersion] = match;
    const comparison = this.compareVersions(detected, targetVersion);

    switch (operator) {
      case '<': return comparison < 0;
      case '<=': return comparison <= 0;
      case '>': return comparison > 0;
      case '>=': return comparison >= 0;
      default: return comparison === 0;
    }
  }

  /**
   * Compare semantic versions
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * Detect mixed content (HTTP resources on HTTPS page)
   */
  async detectMixedContent(url) {
    const mixedContent = [];

    try {
      await withBrowser(async (browser) => {
        const page = await browser.newPage();

        // Intercept all requests
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const reqUrl = request.url();
          if (reqUrl.startsWith('http://') && !reqUrl.includes('localhost')) {
            mixedContent.push({
              url: reqUrl,
              type: request.resourceType(),
              isBlocked: true
            });
          }
          request.continue();
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Also check HTML for hardcoded HTTP URLs
        const htmlMixed = await page.evaluate(() => {
          const httpResources = [];
          const elements = document.querySelectorAll('[src^="http://"], [href^="http://"]');
          elements.forEach(el => {
            const attrValue = el.src || el.href;
            if (attrValue && attrValue.startsWith('http://') && !attrValue.includes('localhost')) {
              httpResources.push({
                url: attrValue,
                type: el.tagName.toLowerCase(),
                attribute: el.src ? 'src' : 'href'
              });
            }
          });
          return httpResources;
        });

        for (const item of htmlMixed) {
          if (!mixedContent.find(m => m.url === item.url)) {
            mixedContent.push(item);
          }
        }

        await page.close();
      });
    } catch (error) {
      console.error('Mixed content scan error:', error.message);
    }

    return mixedContent;
  }

  /**
   * Calculate overall security score
   */
  calculateOverallScore(result) {
    let score = 100;
    const issues = [];
    const recommendations = [];

    // HTTPS check (20 points)
    if (!result.isHttps) {
      score -= 20;
      issues.push({ severity: 'critical', message: 'Site does not use HTTPS' });
    }

    // SSL issues (up to 20 points)
    if (result.ssl) {
      if (!result.ssl.valid) {
        score -= 15;
        issues.push({ severity: 'critical', message: 'Invalid SSL certificate' });
      }
      if (result.ssl.daysUntilExpiry < 30) {
        score -= 5;
        issues.push({ severity: 'high', message: `SSL expires in ${result.ssl.daysUntilExpiry} days` });
      }
      result.ssl.issues.forEach(issue => {
        issues.push({ severity: 'medium', message: issue });
      });
    }

    // Header issues (up to 30 points)
    if (result.headers) {
      const headerScore = result.headers.score || 0;
      const headerPenalty = Math.round((100 - headerScore) * 0.3);
      score -= headerPenalty;
      result.headers.issues.forEach(issue => {
        issues.push({ severity: 'medium', message: issue });
      });
      recommendations.push(...(result.headers.recommendations || []));
    }

    // Exposed files (up to 30 points)
    for (const file of result.exposedFiles) {
      switch (file.severity) {
        case 'critical':
          score -= 15;
          issues.push({ severity: 'critical', message: `Exposed: ${file.path} - ${file.description}` });
          break;
        case 'high':
          score -= 8;
          issues.push({ severity: 'high', message: `Exposed: ${file.path} - ${file.description}` });
          break;
        case 'medium':
          score -= 3;
          issues.push({ severity: 'medium', message: `Exposed: ${file.path}` });
          break;
      }
    }

    // Vulnerable libraries (up to 20 points)
    for (const vuln of result.vulnerableLibraries) {
      switch (vuln.severity) {
        case 'high':
          score -= 10;
          issues.push({ severity: 'high', message: `Vulnerable: ${vuln.library} ${vuln.detectedVersion} (${vuln.cve})` });
          break;
        case 'medium':
          score -= 5;
          issues.push({ severity: 'medium', message: `Outdated: ${vuln.library} ${vuln.detectedVersion}` });
          break;
      }
      recommendations.push({
        issue: `Update ${vuln.library}`,
        fix: vuln.recommendation
      });
    }

    // Mixed content (up to 10 points)
    if (result.mixedContent.length > 0) {
      score -= Math.min(10, result.mixedContent.length * 2);
      issues.push({ severity: 'medium', message: `${result.mixedContent.length} mixed content resource(s)` });
    }

    // Ensure score is in valid range
    score = Math.max(0, Math.min(100, score));

    // Determine grade
    let grade;
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    // Determine risk level
    let riskLevel;
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) riskLevel = 'critical';
    else if (highCount > 2) riskLevel = 'high';
    else if (highCount > 0 || score < 70) riskLevel = 'medium';
    else riskLevel = 'low';

    result.score = score;
    result.grade = grade;
    result.riskLevel = riskLevel;
    result.issues = issues;
    result.recommendations = recommendations;
  }
}

module.exports = FullSecurityAnalyzer;
