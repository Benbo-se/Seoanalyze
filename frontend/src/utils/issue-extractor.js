const { ulid } = require('ulid');
const TextNormalizer = require('./text-normalizer');

/**
 * Extract fixable issues from analysis results
 * Transforms raw analysis data into structured issues with quick fixes
 * Supports SEO, Crawl, and Lighthouse analysis types
 */
class IssueExtractor {
  
  /**
   * Extract top issues from analysis result
   * @param {Object} result - Analysis result (SEO, Crawl, or Lighthouse)
   * @param {string} targetUrl - Analyzed URL
   * @param {string} analysisType - Type of analysis: 'seo', 'crawl', 'lighthouse'
   * @returns {Array} Array of structured issues
   */
  static extractIssues(result, targetUrl, analysisType = 'seo') {
    switch (analysisType) {
      case 'seo':
        return this.extractSeoIssues(result, targetUrl);
      case 'crawl':
        return this.extractCrawlIssues(result, targetUrl);
      case 'lighthouse':
        return this.extractLighthouseIssues(result, targetUrl);
      default:
        return [];
    }
  }

  /**
   * Extract fixable issues from SEO analysis results
   * @param {Object} result - SEO analysis result
   * @param {string} targetUrl - Analyzed URL
   * @returns {Array} Array of structured issues
   */
  static extractSeoIssues(result, targetUrl) {
    const issues = [];
    const domain = new URL(targetUrl).hostname;

    // 1. Missing H1 Issue
    if (!result.headings?.h1 || result.headings.h1.length === 0) {
      issues.push({
        id: `missing-h1-${ulid()}`,
        title: "Saknar H1-rubrik",
        severity: "critical",
        foundOn: ["/"],
        howTo: [
          "Lägg till exakt en H1-tag per sida som beskriver sidans huvudsyfte.",
          "Placera H1-rubriken ovanför huvudinnehållet på sidan.",
          "Använd 20-70 tecken och inkludera viktiga sökord.",
          "Se till att H1 är unik för varje sida på webbplatsen."
        ],
        links: [
          {
            label: "Google: Heading best practices",
            url: "https://developers.google.com/search/docs/appearance/title-link"
          },
          {
            label: "MDN: H1-H6 elements",
            url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements"
          }
        ],
        quickFixes: [
          {
            label: "Grundläggande H1",
            snippet: `<h1>${this.generateTitle(result, domain)}</h1>`
          },
          {
            label: "H1 med nyckelord",
            snippet: `<h1>${result.primaryKeyword ? `${result.primaryKeyword} - ` : ''}${this.generateTitle(result, domain)}</h1>`
          }
        ]
      });
    }

    // 2. Meta Description Issues
    const metaDesc = result.metaDescription;
    if (!metaDesc || metaDesc.length < 120 || metaDesc.length > 160) {
      const suggestedDesc = this.generateMetaDescription(result, domain);
      
      issues.push({
        id: `meta-description-${ulid()}`,
        title: !metaDesc ? "Saknar meta description" : "Meta description fel längd",
        severity: "important",
        foundOn: ["/"],
        howTo: [
          "Skriv en lockande beskrivning på 150-160 tecken.",
          "Inkludera huvudnyckelordet tidigt i beskrivningen.", 
          "Förklara tydligt vad besökaren kan förvänta sig.",
          "Undvik dubbletter - varje sida ska ha unik meta description."
        ],
        links: [
          {
            label: "Google: Meta description best practices",
            url: "https://developers.google.com/search/docs/appearance/snippet"
          },
          {
            label: "Moz: Meta descriptions guide",
            url: "https://moz.com/learn/seo/meta-description"
          }
        ],
        quickFixes: [
          {
            label: "Optimerad meta description",
            snippet: `<meta name="description" content="${suggestedDesc}">`
          }
        ]
      });
    }

    // 3. Missing Alt Text for Images
    if (result.images && result.images.length > 0) {
      const missingAltImages = result.images.filter(img => !img.alt || img.alt.trim() === '');
      
      if (missingAltImages.length > 0) {
        issues.push({
          id: `missing-alt-text-${ulid()}`,
          title: `${missingAltImages.length} bilder saknar alt-text`,
          severity: "important", 
          foundOn: ["/"],
          howTo: [
            "Lägg till beskrivande alt-attribut för alla bilder.",
            "Beskriv vad som visas i bilden, inte bara \"bild\" eller \"foto\".",
            "Använd 125 tecken eller mindre för optimal tillgänglighet.",
            "För dekorativa bilder, använd tom alt-text: alt=\"\""
          ],
          links: [
            {
              label: "WebAIM: Alt text guide",
              url: "https://webaim.org/articles/images/"
            },
            {
              label: "Google: Image best practices",
              url: "https://developers.google.com/search/docs/appearance/google-images"
            }
          ],
          quickFixes: [
            {
              label: "Alt-text mall",
              snippet: `alt="${this.generateAltText(missingAltImages[0], domain)}"`
            },
            {
              label: "Batch alt-text script", 
              snippet: `// Lägg till alt-text för alla bilder utan
document.querySelectorAll('img:not([alt])').forEach((img, index) => {
  const fileName = img.src.split('/').pop().split('.')[0];
  img.alt = fileName.replace(/-|_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
});`
            }
          ]
        });
      }
    }

    // 4. Missing Open Graph Tags
    if (!result.openGraph || Object.keys(result.openGraph).length < 3) {
      const ogData = this.generateOpenGraphData(result, targetUrl, domain);
      
      issues.push({
        id: `missing-open-graph-${ulid()}`,
        title: "Saknar Open Graph meta tags",
        severity: "important",
        foundOn: ["/"],
        howTo: [
          "Lägg till Open Graph meta tags i <head>-sektionen.",
          "Inkludera minst og:title, og:description, og:url och og:image.",
          "Använd rätt dimensioner för og:image (1200x630px rekommenderas).",
          "Testa hur det ser ut med Facebook Sharing Debugger."
        ],
        links: [
          {
            label: "Open Graph protocol",
            url: "https://ogp.me/"
          },
          {
            label: "Facebook Sharing Debugger",
            url: "https://developers.facebook.com/tools/debug/"
          }
        ],
        quickFixes: [
          {
            label: "Komplett Open Graph block",
            snippet: `<meta property="og:title" content="${ogData.title}">
<meta property="og:description" content="${ogData.description}">
<meta property="og:url" content="${ogData.url}">
<meta property="og:type" content="website">
<meta property="og:image" content="${ogData.image}">
<meta property="og:site_name" content="${domain}">
<meta name="twitter:card" content="summary_large_image">`
          }
        ]
      });
    }

    // 5. Missing Schema Markup
    if (!result.structuredData || result.structuredData.length === 0) {
      const schemaType = this.detectSchemaType(result, targetUrl);
      
      issues.push({
        id: `missing-schema-${ulid()}`,
        title: "Saknar Schema.org strukturerad data",
        severity: "optional",
        foundOn: ["/"],
        howTo: [
          "Lägg till JSON-LD schema markup i <head>-sektionen.",
          "Välj rätt schema-typ baserat på innehållstyp (Organization, WebSite, etc).",
          "Inkludera viktiga fält som namn, beskrivning, url och kontaktinfo.",
          "Validera med Google Rich Results Test."
        ],
        links: [
          {
            label: "Schema.org documentation",
            url: "https://schema.org/"
          },
          {
            label: "Google Rich Results Test",
            url: "https://search.google.com/test/rich-results"
          },
          {
            label: "JSON-LD generator",
            url: "https://technicalseo.com/tools/schema-markup-generator/"
          }
        ],
        quickFixes: [
          {
            label: `${schemaType.type} Schema`,
            snippet: schemaType.snippet
          }
        ]
      });
    }

    // 6. Security Headers Issues (NEW)
    if (result.security) {
      const SecurityAnalyzer = require('../../lib/security-analyzer');
      const securityIssues = SecurityAnalyzer.generateSecurityIssues(result.security, targetUrl);
      issues.push(...securityIssues);
    }

    // 7. Social Media Issues (NEW)
    if (result.social) {
      const SocialAnalyzer = require('../../lib/social-analyzer');
      const socialIssues = SocialAnalyzer.generateSocialIssues(result.social, targetUrl);
      issues.push(...socialIssues);
    }

    // 8. Schema.org Issues (NEW)
    if (result.schema) {
      const SchemaAnalyzer = require('../../lib/schema-analyzer');
      const schemaIssues = SchemaAnalyzer.generateSchemaIssues(result.schema, targetUrl);
      issues.push(...schemaIssues);
    }

    // 9. DNS Security Issues (NEW)
    if (result.dns) {
      const DNSAnalyzer = require('../../lib/dns-analyzer');
      const dnsIssues = DNSAnalyzer.generateDNSIssues(result.dns, targetUrl);
      issues.push(...dnsIssues);
    }

    return issues;
  }

  /**
   * Extract fixable issues from Crawl analysis results
   * @param {Object} result - Crawl analysis result
   * @param {string} targetUrl - Analyzed URL
   * @returns {Array} Array of structured issues
   */
  static extractCrawlIssues(result, targetUrl) {
    const issues = [];
    const domain = new URL(targetUrl).hostname;
    const pages = result.pages || [];
    const summary = result.summary || {};
    const crawlIssues = summary.issues || {};

    // 1. Broken Links Issue
    if (crawlIssues.brokenLinks && crawlIssues.brokenLinks.length > 0) {
      const brokenLinks = crawlIssues.brokenLinks.slice(0, 10); // Top 10
      
      issues.push({
        id: `broken-links-${ulid()}`,
        title: `${crawlIssues.brokenLinks.length} trasiga länkar hittade`,
        severity: "critical",
        foundOn: brokenLinks.map(link => link.sourceUrl || link.foundOn || '/').slice(0, 5),
        howTo: [
          "Kontrollera att alla länkade sidor existerar och är tillgängliga.",
          "Uppdatera eller ta bort länkar som pekar på 404-sidor.",
          "Använd 301-omdirigeringar för flyttade sidor.",
          "Testa alla externa länkar regelbundet."
        ],
        links: [
          {
            label: "Google: Fix broken links",
            url: "https://support.google.com/webmasters/answer/9044175"
          },
          {
            label: "Moz: Broken link building guide",
            url: "https://moz.com/link-building/broken-link-building"
          }
        ],
        quickFixes: [
          {
            label: "Redirect till startsida",
            snippet: `# .htaccess redirect för ${brokenLinks[0]?.targetUrl || 'broken-url'}
Redirect 301 ${brokenLinks[0]?.targetUrl?.replace(targetUrl, '') || '/broken-page'} /`
          },
          {
            label: "Hitta och ersätt script",
            snippet: `// JavaScript för att hitta och uppdatera trasiga länkar
document.querySelectorAll('a[href="${brokenLinks[0]?.targetUrl || ''}"]').forEach(link => {
  link.href = '/'; // Eller korrekt URL
  link.style.borderLeft = '3px solid green'; // Markera som fixad
});`
          }
        ]
      });
    }

    // 2. Missing Titles Issue
    if (crawlIssues.missingTitles && crawlIssues.missingTitles.length > 0) {
      issues.push({
        id: `missing-titles-${ulid()}`,
        title: `${crawlIssues.missingTitles.length} sidor saknar title`,
        severity: "critical",
        foundOn: crawlIssues.missingTitles.slice(0, 5),
        howTo: [
          "Lägg till unik <title> för varje sida.",
          "Använd 50-60 tecken för optimal visning i sökresultat.",
          "Inkludera viktiga nyckelord tidigt i titeln.",
          "Varje sida ska ha sin egen unika title."
        ],
        links: [
          {
            label: "Google: Title best practices",
            url: "https://developers.google.com/search/docs/appearance/title-link"
          },
          {
            label: "Moz: Title tag guide",
            url: "https://moz.com/learn/seo/title-tag"
          }
        ],
        quickFixes: [
          {
            label: "Grundläggande title mall",
            snippet: `<title>Sidnamn - ${domain.replace('www.', '')}</title>`
          },
          {
            label: "SEO-optimerad title",
            snippet: `<title>Huvudnyckelord | Beskrivning - ${domain.replace('www.', '')}</title>`
          }
        ]
      });
    }

    // 3. Missing H1 Tags Issue
    if (crawlIssues.missingH1 && crawlIssues.missingH1.length > 0) {
      issues.push({
        id: `missing-h1-crawl-${ulid()}`,
        title: `${crawlIssues.missingH1.length} sidor saknar H1`,
        severity: "important",
        foundOn: crawlIssues.missingH1.slice(0, 5),
        howTo: [
          "Lägg till exakt en H1-rubrik per sida.",
          "H1 ska beskriva sidans huvudsyfte och innehåll.",
          "Använd 20-70 tecken för optimal SEO-effekt.",
          "Placera H1 ovanför huvudinnehållet."
        ],
        links: [
          {
            label: "MDN: Heading elements",
            url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements"
          },
          {
            label: "W3C: Headings guide", 
            url: "https://www.w3.org/WAI/tutorials/page-structure/headings/"
          }
        ],
        quickFixes: [
          {
            label: "H1 mall",
            snippet: `<h1>Sidans huvudrubrik</h1>`
          },
          {
            label: "H1 med nyckelord",
            snippet: `<h1>Nyckelord - Beskrivande rubrik</h1>`
          }
        ]
      });
    }

    // 4. Images without Alt Text Issue
    if (crawlIssues.imagesWithoutAlt && crawlIssues.imagesWithoutAlt.length > 0) {
      issues.push({
        id: `missing-alt-crawl-${ulid()}`,
        title: `${crawlIssues.imagesWithoutAlt.length} bilder saknar alt-text`,
        severity: "important",
        foundOn: [...new Set(crawlIssues.imagesWithoutAlt.map(img => img.pageUrl))].slice(0, 5),
        howTo: [
          "Lägg till beskrivande alt-attribut för alla innehållsbilder.",
          "Beskriv vad som visas i bilden, inte bara 'bild' eller 'foto'.",
          "Använd 125 tecken eller mindre.",
          "För dekorativa bilder, använd tom alt-text: alt=''"
        ],
        links: [
          {
            label: "WebAIM: Alt text guide",
            url: "https://webaim.org/articles/images/"
          },
          {
            label: "Google: Image best practices",
            url: "https://developers.google.com/search/docs/appearance/google-images"
          }
        ],
        quickFixes: [
          {
            label: "Alt-text mall",
            snippet: `alt="Beskrivande text som förklarar vad bilden visar"`
          },
          {
            label: "Batch alt-text script",
            snippet: `// Lägg till alt-text för alla bilder utan
document.querySelectorAll('img:not([alt])').forEach((img, index) => {
  const src = img.src.split('/').pop().split('.')[0];
  img.alt = src.replace(/-|_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
});`
          }
        ]
      });
    }

    // 5. Missing Sitemap Issue
    if (!summary.sitemapFound) {
      issues.push({
        id: `missing-sitemap-${ulid()}`,
        title: "Sitemap.xml saknas",
        severity: "important",
        foundOn: ["/"],
        howTo: [
          "Skapa en XML-sitemap som listar alla viktiga sidor.",
          "Placera sitemap.xml i webbplatsens rot: /sitemap.xml",
          "Inkludera lastmod datum för varje URL.",
          "Registrera sitemap i Google Search Console."
        ],
        links: [
          {
            label: "Google: Sitemap guide",
            url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap"
          },
          {
            label: "XML Sitemap generator",
            url: "https://www.xml-sitemaps.com/"
          }
        ],
        quickFixes: [
          {
            label: "Grundläggande sitemap",
            snippet: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${targetUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
          }
        ]
      });
    }

    // 10. Linkmap Issues (NEW)
    if (result.linkmap || result.summary?.linkmap) {
      const LinkmapAnalyzer = require('../../lib/linkmap-analyzer');
      const linkmap = result.linkmap || result.summary.linkmap;
      const linkmapIssues = LinkmapAnalyzer.generateLinkmapIssues(linkmap, targetUrl);
      issues.push(...linkmapIssues);
    }

    return issues;
  }

  /**
   * Extract fixable issues from Lighthouse analysis results
   * @param {Object} result - Lighthouse analysis result
   * @param {string} targetUrl - Analyzed URL
   * @returns {Array} Array of structured issues
   */
  static extractLighthouseIssues(result, targetUrl) {
    const issues = [];
    const domain = new URL(targetUrl).hostname;
    const opportunities = result.opportunities || {};
    const coreWebVitals = result.coreWebVitals || {};

    // 1. Unused JavaScript Issue
    if (opportunities.unusedJavaScript && opportunities.unusedJavaScript.score < 0.9) {
      const savings = opportunities.unusedJavaScript.displayValue || 'betydande';
      
      issues.push({
        id: `unused-javascript-${ulid()}`,
        title: "Oanvänd JavaScript upptäckt",
        severity: "important",
        foundOn: ["/"],
        howTo: [
          "Ta bort eller dela upp JavaScript-kod som inte används.",
          "Implementera code splitting för att ladda kod vid behov.",
          "Använd dynamic imports för icke-kritisk funktionalitet.",
          "Minifiera och komprimera JavaScript-filer."
        ],
        links: [
          {
            label: "Google: Reduce unused JavaScript",
            url: "https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/"
          },
          {
            label: "Web.dev: Code splitting guide",
            url: "https://web.dev/reduce-unused-javascript/"
          }
        ],
        quickFixes: [
          {
            label: "Lazy loading script",
            snippet: `// Lazy load non-critical JavaScript
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

// Load when needed
document.addEventListener('DOMContentLoaded', () => {
  if (someCondition) {
    loadScript('/path/to/optional-script.js');
  }
});`
          },
          {
            label: "Remove unused imports",
            snippet: `// Remove or comment out unused imports
// import { unusedFunction } from './module.js';
import { onlyUsedFunction } from './module.js';`
          }
        ]
      });
    }

    // 2. Unused CSS Issue
    if (opportunities.unusedCSS && opportunities.unusedCSS.score < 0.9) {
      issues.push({
        id: `unused-css-${ulid()}`,
        title: "Oanvänd CSS upptäckt",
        severity: "important", 
        foundOn: ["/"],
        howTo: [
          "Ta bort CSS-regler som inte används på sidan.",
          "Använd critical CSS för above-the-fold innehåll.",
          "Ladda icke-kritisk CSS asynkront.",
          "Använd verktyg som PurgeCSS för att rensa bort oanvänd kod."
        ],
        links: [
          {
            label: "Google: Remove unused CSS",
            url: "https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/"
          },
          {
            label: "Web.dev: Critical CSS",
            url: "https://web.dev/extract-critical-css/"
          }
        ],
        quickFixes: [
          {
            label: "Async CSS loading",
            snippet: `<!-- Load non-critical CSS asynchronously -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>`
          },
          {
            label: "Critical CSS inline",
            snippet: `<!-- Inline critical CSS in <head> -->
<style>
  /* Critical above-the-fold CSS here */
  body { font-family: sans-serif; }
  header { background: #fff; padding: 1rem; }
</style>`
          }
        ]
      });
    }

    // 3. Render Blocking Resources Issue
    if (opportunities.renderBlocking && opportunities.renderBlocking.score < 0.9) {
      issues.push({
        id: `render-blocking-${ulid()}`,
        title: "Render-blockerande resurser",
        severity: "critical",
        foundOn: ["/"],
        howTo: [
          "Lägg till async eller defer attribut till script-taggar.",
          "Inline kritisk CSS i <head> sektionen.",
          "Flytta icke-kritisk JavaScript till slutet av <body>.",
          "Använd resource hints som preload för viktiga resurser."
        ],
        links: [
          {
            label: "Google: Eliminate render-blocking resources",
            url: "https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/"
          },
          {
            label: "Web.dev: Resource loading guide",
            url: "https://web.dev/efficiently-load-third-party-javascript/"
          }
        ],
        quickFixes: [
          {
            label: "Defer JavaScript",
            snippet: `<!-- Defer non-critical JavaScript -->
<script src="script.js" defer></script>

<!-- Async for independent scripts -->
<script src="analytics.js" async></script>`
          },
          {
            label: "Preload critical resources",
            snippet: `<!-- Preload important resources -->
<link rel="preload" href="critical-font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="hero-image.jpg" as="image">`
          }
        ]
      });
    }

    // 4. Poor Core Web Vitals Issue
    const lcp = coreWebVitals.lcp;
    const cls = coreWebVitals.cls;
    const fid = coreWebVitals.fid;

    if ((lcp && lcp.score < 0.75) || (cls && cls.score < 0.75) || (fid && fid.score < 0.75)) {
      issues.push({
        id: `core-web-vitals-${ulid()}`,
        title: "Core Web Vitals behöver förbättras",
        severity: "critical",
        foundOn: ["/"],
        howTo: [
          "Optimera Largest Contentful Paint (LCP) genom att förbättra serverresponstider.",
          "Minska Cumulative Layout Shift (CLS) genom att ange storlek på bilder och ads.",
          "Förbättra First Input Delay (FID) genom att minska JavaScript-blockeringar.",
          "Använd Google PageSpeed Insights för detaljerade rekommendationer."
        ],
        links: [
          {
            label: "Web.dev: Core Web Vitals",
            url: "https://web.dev/vitals/"
          },
          {
            label: "Google PageSpeed Insights",
            url: "https://pagespeed.web.dev/"
          }
        ],
        quickFixes: [
          {
            label: "LCP optimization",
            snippet: `<!-- Optimize LCP with preload -->
<link rel="preload" href="hero-image.jpg" as="image">

<!-- Optimize server response -->
<meta http-equiv="Cache-Control" content="max-age=3600">`
          },
          {
            label: "CLS prevention",
            snippet: `/* Prevent layout shifts */
img, video {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9; /* Set proper aspect ratio */
}

.ad-container {
  min-height: 250px; /* Reserve space for ads */
}`
          }
        ]
      });
    }

    // 5. Image Optimization Issue  
    if (opportunities.offscreenImages && opportunities.offscreenImages.score < 0.9) {
      issues.push({
        id: `image-optimization-${ulid()}`,
        title: "Bilder kan optimeras",
        severity: "important",
        foundOn: ["/"],
        howTo: [
          "Implementera lazy loading för bilder under scrolling.",
          "Använd moderna bildformat som WebP eller AVIF.",
          "Komprimera bilder utan kvalitetsförlust.",
          "Använd responsiva bilder med srcset attribut."
        ],
        links: [
          {
            label: "Google: Image optimization",
            url: "https://developers.google.com/speed/docs/insights/OptimizeImages"
          },
          {
            label: "Web.dev: Lazy loading images", 
            url: "https://web.dev/lazy-loading-images/"
          }
        ],
        quickFixes: [
          {
            label: "Lazy loading",
            snippet: `<!-- Native lazy loading -->
<img src="image.jpg" alt="Description" loading="lazy">

<!-- Intersection Observer fallback -->
<script>
if ('IntersectionObserver' in window) {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        imageObserver.unobserve(img);
      }
    });
  });
  images.forEach(img => imageObserver.observe(img));
}
</script>`
          },
          {
            label: "Responsive images",
            snippet: `<!-- Responsive images with srcset -->
<img 
  srcset="image-320w.jpg 320w, image-768w.jpg 768w, image-1200w.jpg 1200w"
  sizes="(max-width: 320px) 280px, (max-width: 768px) 728px, 1200px"
  src="image-768w.jpg"
  alt="Description"
>`
          }
        ]
      });
    }

    return issues;
  }

  /**
   * Generate a suitable page title
   */
  static generateTitle(result, domain) {
    if (result.title && result.title.length > 10) {
      return TextNormalizer.normalizeText(result.title).substring(0, 60);
    }
    return `${domain.replace('www.', '').split('.')[0]} - Professional Services`;
  }

  /**
   * Generate optimized meta description
   */
  static generateMetaDescription(result, domain) {
    const baseDesc = TextNormalizer.normalizeText(result.metaDescription || '');
    const keyword = TextNormalizer.normalizeText(result.primaryKeyword || '');
    
    if (baseDesc && baseDesc.length >= 120 && baseDesc.length <= 160) {
      return baseDesc;
    }
    
    // Generate new description
    const companyName = domain.replace('www.', '').split('.')[0];
    let description = '';
    
    if (keyword) {
      description = `${keyword} - Professional services from ${companyName}. `;
    } else {
      description = `Welcome to ${companyName} - `;
    }
    
    // Add relevant content
    if (result.wordCount > 100) {
      description += 'Discover our expertise and solutions tailored for your needs.';
    } else {
      description += 'Your trusted partner for quality services and solutions.';
    }
    
    return description.substring(0, 155) + (description.length > 155 ? '...' : '');
  }

  /**
   * Generate alt text for images
   */
  static generateAltText(image, domain) {
    if (!image.src) return 'Image';
    
    const fileName = image.src.split('/').pop().split('.')[0];
    const cleanName = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return cleanName.length > 5 ? cleanName : `${domain} image`;
  }

  /**
   * Generate Open Graph data
   */
  static generateOpenGraphData(result, targetUrl, domain) {
    return {
      title: TextNormalizer.normalizeText(result.title) || this.generateTitle(result, domain),
      description: this.generateMetaDescription(result, domain),
      url: targetUrl,
      image: `https://${domain}/og-image.jpg` // Default OG image path
    };
  }

  /**
   * Detect appropriate schema type and generate markup
   */
  static detectSchemaType(result, targetUrl) {
    const domain = new URL(targetUrl).hostname;
    const companyName = domain.replace('www.', '').split('.')[0];
    
    // Default to Organization schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": companyName,
      "url": targetUrl,
      "description": this.generateMetaDescription(result, domain),
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service"
      }
    };

    return {
      type: 'Organization',
      snippet: `<script type="application/ld+json">
${JSON.stringify(organizationSchema, null, 2)}
</script>`
    };
  }
}

module.exports = IssueExtractor;