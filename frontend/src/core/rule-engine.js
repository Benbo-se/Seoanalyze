// Rule Engine - Impact × Effort prioritering med actionable fix snippets
// Expertens vision: "Gör detta först"-lista med copy-paste lösningar

// SEO Rule definitions med Impact × Effort scoring (1-9 skala)
const SEO_RULES = {
  'missing-h1': {
    impact: 9,        // Kritisk för SEO rankings
    effort: 2,        // Lätt att fixa - lägg till en tag
    priority: 45,     // 9 × 5 = automatiskt beräknad
    category: 'critical-seo',
    title: 'Saknar H1-rubrik',
    description: 'Sidan saknar huvudrubrik som beskriver innehållet för sökmotorer',
    fixSnippet: {
      type: 'html',
      code: `<h1>Huvudrubrik som beskriver sidans syfte</h1>`,
      placement: 'Placera i <main> eller direkt under <header>'
    },
    businessImpact: 'Kan förbättra rankings med 15-30% för målsökord',
    timeToFix: '2-5 minuter'
  },

  'missing-meta-description': {
    impact: 7,
    effort: 2,
    priority: 35,
    category: 'important-seo',
    title: 'Saknar meta description',
    description: 'Metabeskrivning saknas - påverkar klickfrekvens i sökresultat',
    fixSnippet: {
      type: 'html',
      code: `<meta name="description" content="Beskrivande text 150-160 tecken som lockar klick från sökresultat">`,
      placement: 'Placera i <head>-sektionen'
    },
    businessImpact: 'Kan öka CTR med 5-15% från sökresultat',
    timeToFix: '3-10 minuter'
  },

  'title-too-long': {
    impact: 6,
    effort: 3,
    priority: 18,
    category: 'seo-optimization',
    title: 'Title-tag för lång',
    description: 'Title-tag över 60 tecken kapas av i sökresultat',
    fixSnippet: {
      type: 'html',
      code: `<title>Kort beskrivande titel under 60 tecken</title>`,
      placement: 'Ersätt befintlig <title> i <head>'
    },
    businessImpact: 'Förbättrar titel-visning i sökresultat',
    timeToFix: '2-5 minuter'
  },

  'images-missing-alt': {
    impact: 5,
    effort: 4,
    priority: 20,
    category: 'accessibility-seo',
    title: 'Bilder saknar alt-text',
    description: 'Bilder utan alt-attribut är otillgängliga för skärmläsare och sökmotorer',
    fixSnippet: {
      type: 'html',
      code: `<img src="bild.jpg" alt="Beskrivande text för bildens innehåll">`,
      placement: 'Lägg till alt-attribut på alla <img> taggar'
    },
    businessImpact: 'Förbättrar tillgänglighet och bildersökning',
    timeToFix: '1-2 minuter per bild'
  },

  'slow-lcp': {
    impact: 8,
    effort: 7,
    priority: 56,
    category: 'performance-critical',
    title: 'Långsam Largest Contentful Paint',
    description: 'Huvudinnehåll laddar för långsamt - påverkar användarupplevelse och rankings',
    fixSnippet: {
      type: 'optimization',
      code: `// Optimera största elementet
// 1. Komprimera bilder (WebP format)
// 2. Lägg till fetchpriority="high" på hero-bild
<img src="hero.webp" fetchpriority="high" alt="Hero">

// 3. Preload kritiska resurser
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>`,
      placement: 'Implementera i <head> och optimera största synliga element'
    },
    businessImpact: 'Kritisk Core Web Vital - påverkar rankings direkt',
    timeToFix: '30-120 minuter'
  },

  'missing-robots-txt': {
    impact: 4,
    effort: 2,
    priority: 8,
    category: 'technical-seo',
    title: 'Saknar robots.txt',
    description: 'Robots.txt-fil saknas - kan förvirra sökmotorernas crawling',
    fixSnippet: {
      type: 'file',
      code: `User-agent: *
Allow: /

# Sitemap location
Sitemap: https://yourdomain.com/sitemap.xml

# Block admin areas
Disallow: /admin/
Disallow: /wp-admin/`,
      placement: 'Skapa fil på /robots.txt i webbroot'
    },
    businessImpact: 'Förbättrar crawling-effektivitet',
    timeToFix: '5-10 minuter'
  },

  'duplicate-h1': {
    impact: 7,
    effort: 3,
    priority: 21,
    category: 'seo-structure',
    title: 'Flera H1-rubriker på samma sida',
    description: 'Flera H1-taggar förvirrar sökmotorer om sidans huvudämne',
    fixSnippet: {
      type: 'html',
      code: `<!-- Behåll endast en H1 per sida -->
<h1>Huvudrubrik</h1>

<!-- Ändra övriga till H2-H6 -->
<h2>Underrubrik</h2>
<h3>Delrubrik</h3>`,
      placement: 'Ändra extra H1-taggar till H2-H6 baserat på hierarki'
    },
    businessImpact: 'Tydligare innehållsstruktur för sökmotorer',
    timeToFix: '5-15 minuter'
  },

  'poor-cls': {
    impact: 6,
    effort: 8,
    priority: 48,
    category: 'performance-ux',
    title: 'Hög Cumulative Layout Shift',
    description: 'Innehåll hoppar runt när sidan laddar - dålig användarupplevelse',
    fixSnippet: {
      type: 'css',
      code: `/* Reservera utrymme för bilder */
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9; /* Eller faktiska proportioner */
}

/* Reservera utrymme för annonser */
.ad-container {
  width: 300px;
  height: 250px;
  display: block;
}

/* Använd transform istället för att ändra layout */
.animation {
  transform: translateY(20px);
  transition: transform 0.3s ease;
}`,
      placement: 'Lägg till i CSS för element som orsakar layout-shift'
    },
    businessImpact: 'Core Web Vital - kritisk för användarupplevelse',
    timeToFix: '60-180 minuter'
  },

  'missing-structured-data': {
    impact: 6,
    effort: 4,
    priority: 24,
    category: 'seo-enhancement',
    title: 'Saknar strukturerad data (Schema.org)',
    description: 'Strukturerad data hjälper sökmotorer förstå innehållet bättre',
    fixSnippet: {
      type: 'json-ld',
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Företagsnamn",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png",
  "sameAs": [
    "https://www.facebook.com/yourpage",
    "https://www.linkedin.com/company/yourcompany"
  ]
}
</script>

<!-- För artiklar/blogginlägg -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Artikelrubrik",
  "author": {
    "@type": "Person",
    "name": "Författarnamn"
  },
  "datePublished": "2024-01-01",
  "description": "Artikelbeskrivning"
}
</script>`,
      placement: 'Lägg till i <head>-sektionen innan </head>'
    },
    businessImpact: 'Rich snippets i sökresultat - höjer CTR',
    timeToFix: '15-45 minuter'
  },

  'slow-font-loading': {
    impact: 5,
    effort: 3,
    priority: 15,
    category: 'performance',
    title: 'Långsam typsnittsladdning',
    description: 'Externa typsnitt blockerar textrendering',
    fixSnippet: {
      type: 'html',
      code: `<!-- Preload kritiska typsnitt -->
<link rel="preload" href="/fonts/main-font.woff2" as="font" type="font/woff2" crossorigin>

<!-- Använd font-display för bättre laddning -->
<style>
@font-face {
  font-family: 'MainFont';
  src: url('/fonts/main-font.woff2') format('woff2');
  font-display: swap; /* Visar fallback-font medan den laddar */
}

body {
  font-family: 'MainFont', 'Segoe UI', Tahoma, sans-serif;
}
</style>`,
      placement: 'Lägg till i <head> före andra stylesheets'
    },
    businessImpact: 'Snabbare text-rendering förbättrar upplevd prestanda',
    timeToFix: '10-30 minuter'
  },

  'missing-canonical': {
    impact: 8,
    effort: 2,
    priority: 40,
    category: 'critical-seo',
    title: 'Saknar canonical URL',
    description: 'Canonical-taggen förhindrar duplicerat innehåll och stärker sidans auktoritet',
    fixSnippet: {
      type: 'html',
      code: `<link rel="canonical" href="https://yourdomain.com/full-page-url">`,
      placement: 'Lägg till i <head>-sektionen efter <title>'
    },
    businessImpact: 'Förhindrar SEO-duplicering och stärker sidauktoritet',
    timeToFix: '2-5 minuter'
  },

  'mixed-content': {
    impact: 7,
    effort: 5,
    priority: 35,
    category: 'security-seo',
    title: 'HTTP-innehåll på HTTPS-sida',
    description: 'Blandat innehåll (HTTP på HTTPS) skapar säkerhetsvarningar',
    fixSnippet: {
      type: 'html',
      code: `<!-- Ändra alla HTTP-referenser till HTTPS -->

<!-- Före (osäkert) -->
<img src="http://example.com/image.jpg" alt="Bild">
<script src="http://example.com/script.js"></script>

<!-- Efter (säkert) -->
<img src="https://example.com/image.jpg" alt="Bild">
<script src="https://example.com/script.js"></script>

<!-- Eller använd protokoll-relative URLs -->
<img src="//example.com/image.jpg" alt="Bild">`,
      placement: 'Uppdatera alla HTTP-länkar i HTML, CSS och JS'
    },
    businessImpact: 'Eliminerar säkerhetsvarningar och förbättrar trust-signaler',
    timeToFix: '30-90 minuter'
  }
};

// Performance rules för Lighthouse integration
const PERFORMANCE_RULES = {
  'unoptimized-images': {
    impact: 7,
    effort: 5,
    priority: 35,
    category: 'performance',
    title: 'Bilder inte optimerade',
    description: 'Stora bildstorlekar saktar ner sidladdning',
    fixSnippet: {
      type: 'html',
      code: `<!-- Använd moderna bildformat och responsive bilder -->
<picture>
  <source media="(min-width: 800px)" srcset="hero-large.webp" type="image/webp">
  <source media="(min-width: 400px)" srcset="hero-medium.webp" type="image/webp">
  <img src="hero-small.webp" alt="Hero image" loading="lazy" width="400" height="300">
</picture>`,
      placement: 'Ersätt stora img-taggar med optimerade picture-element'
    },
    businessImpact: 'Snabbare laddning = bättre användarupplevelse och SEO',
    timeToFix: '30-90 minuter'
  }
};

// Regel-matchning baserat på analysis data
class RuleEngine {
  
  /**
   * Analysera resultat och returnera prioriterade åtgärder
   * @param {Object} analysisResult - Resultat från SEO/Lighthouse analys
   * @param {string} analysisType - 'seo' | 'lighthouse' | 'merged'
   * @returns {Array} Sorterad lista med prioriterade fixes
   */
  static analyzeAndPrioritize(analysisResult, analysisType = 'seo') {
    const applicableRules = this.findApplicableRules(analysisResult, analysisType);
    const scoredRules = this.calculatePriorityScores(applicableRules);
    
    return this.sortByPriority(scoredRules);
  }

  /**
   * Hitta regler som matchar analysresultaten
   */
  static findApplicableRules(analysisResult, analysisType) {
    const applicableRules = [];
    const rules = analysisType === 'lighthouse' ? PERFORMANCE_RULES : SEO_RULES;

    for (const [ruleId, rule] of Object.entries(rules)) {
      if (this.ruleMatches(ruleId, rule, analysisResult)) {
        applicableRules.push({
          id: ruleId,
          ...rule,
          detectedIssue: this.extractIssueDetails(ruleId, analysisResult)
        });
      }
    }

    return applicableRules;
  }

  /**
   * Kontrollera om regel matchar analysresultat
   */
  static ruleMatches(ruleId, rule, analysisResult) {
    switch (ruleId) {
      case 'missing-h1':
        return !analysisResult.headings?.h1 || analysisResult.headings.h1.length === 0;
      
      case 'missing-meta-description':
        return !analysisResult.metaDescription || analysisResult.metaDescription.length === 0;
      
      case 'title-too-long':
        return analysisResult.title && analysisResult.title.length > 60;
      
      case 'images-missing-alt':
        return analysisResult.images?.some(img => !img.alt);
      
      case 'duplicate-h1':
        return analysisResult.headings?.h1 && analysisResult.headings.h1.length > 1;
        
      case 'slow-lcp':
        return analysisResult.performance?.lcp > 2500;
      
      case 'poor-cls':
        return analysisResult.performance?.cls > 0.1;
      
      case 'missing-robots-txt':
        return !analysisResult.robots || analysisResult.robots.status === 'not_found';
      
      case 'unoptimized-images':
        return analysisResult.images?.some(img => img.sizeKB > 100);
      
      case 'missing-structured-data':
        return !analysisResult.structuredData || analysisResult.structuredData.length === 0;
      
      case 'slow-font-loading':
        return analysisResult.performance?.fonts?.some(font => font.loadTime > 1000);
      
      case 'missing-canonical':
        return !analysisResult.canonical || !analysisResult.canonicalUrl;
      
      case 'mixed-content':
        return analysisResult.security?.mixedContent === true || 
               (analysisResult.resources && analysisResult.resources.some(r => r.protocol === 'http'));
      
      default:
        return false;
    }
  }

  /**
   * Extrahera specifik issue-data för varje regel
   */
  static extractIssueDetails(ruleId, analysisResult) {
    switch (ruleId) {
      case 'title-too-long':
        return {
          currentLength: analysisResult.title?.length,
          currentTitle: analysisResult.title,
          suggestedLength: 60
        };
      
      case 'images-missing-alt':
        const imagesWithoutAlt = analysisResult.images?.filter(img => !img.alt) || [];
        return {
          affectedImages: imagesWithoutAlt.length,
          examples: imagesWithoutAlt.slice(0, 3).map(img => img.src)
        };
      
      case 'slow-lcp':
        return {
          currentLCP: analysisResult.performance?.lcp,
          targetLCP: 2500,
          slowdownFactor: Math.round(analysisResult.performance?.lcp / 2500 * 100) + '%'
        };
      
      default:
        return {};
    }
  }

  /**
   * Beräkna slutlig prioritetscore med Impact × Effort
   */
  static calculatePriorityScores(applicableRules) {
    return applicableRules.map(rule => ({
      ...rule,
      finalScore: rule.impact * (10 - rule.effort), // Högre effort = lägre score
      impactScore: rule.impact,
      effortScore: rule.effort,
      roi: Math.round((rule.impact / rule.effort) * 100) / 100
    }));
  }

  /**
   * Sortera regler efter prioritet (högsta först)
   */
  static sortByPriority(scoredRules) {
    return scoredRules.sort((a, b) => {
      // Primär sortering: Final score (Impact × Anti-Effort)
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      
      // Sekundär sortering: ROI (Impact/Effort)
      return b.roi - a.roi;
    });
  }

  /**
   * Generera "Gör detta först"-lista med copy-paste kod
   */
  static generateActionableList(prioritizedRules, limit = 5) {
    return prioritizedRules.slice(0, limit).map((rule, index) => ({
      priority: index + 1,
      title: rule.title,
      description: rule.description,
      impact: `${rule.impact}/9`,
      effort: `${rule.effort}/9`,
      roi: rule.roi,
      businessValue: rule.businessImpact,
      timeToFix: rule.timeToFix,
      fixSnippet: rule.fixSnippet,
      category: rule.category,
      detectedIssue: rule.detectedIssue || {}
    }));
  }
}

async function analyzeWithRules(analysisId, result) {
  // Enkel wrapper som returnerar dummy data för nu
  return {
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      quickWins: 0,
      averageROI: 0,
      categories: []
    },
    actionableList: [],
    totalActions: 0
  };
}

module.exports = { RuleEngine, analyzeWithRules, SEO_RULES, PERFORMANCE_RULES };