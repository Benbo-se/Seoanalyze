const TextNormalizer = require('../src/utils/text-normalizer');

/**
 * Analyzes internal and external link structure
 * Creates link graph for identifying orphan pages and link juice distribution
 */
class LinkmapAnalyzer {
  
  /**
   * Analyze link structure from crawl results or single page
   * @param {Object} crawlData - Crawl results containing pages array
   * @param {string} baseUrl - Base URL of the website
   * @returns {Object} Link analysis results
   */
  static analyzeLinkmap(crawlData, baseUrl) {
    const analysis = {
      internalLinks: [],
      externalLinks: [],
      linkGraph: {},
      orphanPages: [],
      topLinkedPages: [],
      linkDistribution: {},
      score: 0,
      grade: '',
      issues: [],
      recommendations: []
    };

    const domain = new URL(baseUrl).hostname;
    const pages = crawlData.pages || [];
    
    if (pages.length === 0) {
      analysis.issues.push('No pages found for link analysis');
      return analysis;
    }

    // Initialize link graph structure
    const linkGraph = {};
    const internalLinkCounts = {};
    const externalLinkCounts = {};
    const allInternalUrls = new Set();
    
    // Collect all internal URLs from crawled pages
    pages.forEach(page => {
      if (page.url) {
        const normalizedUrl = this.normalizeUrl(page.url);
        allInternalUrls.add(normalizedUrl);
        linkGraph[normalizedUrl] = {
          url: normalizedUrl,
          title: page.title || 'Untitled',
          inboundLinks: [],
          outboundLinks: [],
          internalOutbound: 0,
          externalOutbound: 0,
          totalInbound: 0
        };
      }
    });

    // Process links from each page
    pages.forEach(page => {
      if (!page.url || !page.links) return;
      
      const sourceUrl = this.normalizeUrl(page.url);
      const sourceNode = linkGraph[sourceUrl];
      
      if (!sourceNode) return;

      // Process each link on the page
      page.links.forEach(link => {
        if (!link.href || link.href.startsWith('#') || link.href.startsWith('mailto:') || link.href.startsWith('tel:')) {
          return; // Skip anchors, mail and tel links
        }

        try {
          const targetUrl = this.resolveUrl(link.href, page.url);
          const normalizedTarget = this.normalizeUrl(targetUrl);
          const targetDomain = new URL(targetUrl).hostname;
          
          const linkData = {
            source: sourceUrl,
            target: normalizedTarget,
            text: TextNormalizer.normalizeText(link.text || ''),
            rel: link.rel || null,
            isInternal: targetDomain === domain,
            isNoFollow: link.rel && link.rel.includes('nofollow')
          };

          if (linkData.isInternal) {
            // Internal link
            analysis.internalLinks.push(linkData);
            sourceNode.outboundLinks.push(linkData);
            sourceNode.internalOutbound++;
            
            // Count inbound links to target
            if (!internalLinkCounts[normalizedTarget]) {
              internalLinkCounts[normalizedTarget] = 0;
            }
            internalLinkCounts[normalizedTarget]++;
            
            // Add to target's inbound links if target is in our crawl
            if (linkGraph[normalizedTarget]) {
              linkGraph[normalizedTarget].inboundLinks.push(linkData);
              linkGraph[normalizedTarget].totalInbound++;
            }
          } else {
            // External link
            analysis.externalLinks.push(linkData);
            sourceNode.outboundLinks.push(linkData);
            sourceNode.externalOutbound++;
            
            // Count external links by domain
            if (!externalLinkCounts[targetDomain]) {
              externalLinkCounts[targetDomain] = 0;
            }
            externalLinkCounts[targetDomain]++;
          }
        } catch (error) {
          // Skip malformed URLs
          console.debug('Skipping malformed URL:', link.href);
        }
      });
    });

    // Store the complete link graph
    analysis.linkGraph = linkGraph;
    
    // Find orphan pages (pages with no inbound internal links, except homepage)
    const homepageUrl = this.normalizeUrl(baseUrl);
    analysis.orphanPages = Object.values(linkGraph)
      .filter(node => node.totalInbound === 0 && node.url !== homepageUrl)
      .map(node => ({
        url: node.url,
        title: node.title
      }));

    // Find top linked pages (most inbound internal links)
    analysis.topLinkedPages = Object.values(linkGraph)
      .sort((a, b) => b.totalInbound - a.totalInbound)
      .slice(0, 10)
      .map(node => ({
        url: node.url,
        title: node.title,
        inboundLinks: node.totalInbound,
        outboundLinks: node.internalOutbound + node.externalOutbound
      }));

    // Calculate link distribution metrics
    analysis.linkDistribution = {
      totalInternal: analysis.internalLinks.length,
      totalExternal: analysis.externalLinks.length,
      averageInternalPerPage: pages.length > 0 ? (analysis.internalLinks.length / pages.length).toFixed(1) : 0,
      averageExternalPerPage: pages.length > 0 ? (analysis.externalLinks.length / pages.length).toFixed(1) : 0,
      topExternalDomains: Object.entries(externalLinkCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([domain, count]) => ({ domain, count })),
      orphanCount: analysis.orphanPages.length,
      pagesCrawled: pages.length
    };

    // Calculate score and generate issues
    analysis.score = this.calculateLinkmapScore(analysis);
    analysis.grade = this.getLinkmapGrade(analysis.score);
    analysis.issues = this.getLinkmapIssues(analysis);
    analysis.recommendations = this.getLinkmapRecommendations(analysis, baseUrl);

    return analysis;
  }

  /**
   * Normalize URL for consistent comparison
   */
  static normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash, hash, and common tracking parameters
      let pathname = urlObj.pathname.replace(/\/$/, '') || '/';
      
      // Remove common tracking parameters
      const cleanParams = new URLSearchParams();
      for (const [key, value] of urlObj.searchParams.entries()) {
        if (!this.isTrackingParameter(key)) {
          cleanParams.append(key, value);
        }
      }
      
      const search = cleanParams.toString();
      return `${urlObj.protocol}//${urlObj.hostname}${pathname}${search ? '?' + search : ''}`;
    } catch (error) {
      return url;
    }
  }

  /**
   * Check if parameter is likely a tracking parameter
   */
  static isTrackingParameter(param) {
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'msclkid', 'ref', 'source', '_gl', '_ga'
    ];
    return trackingParams.includes(param.toLowerCase());
  }

  /**
   * Resolve relative URL against base URL
   */
  static resolveUrl(href, baseUrl) {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    return new URL(href, baseUrl).toString();
  }

  /**
   * Calculate linkmap score based on link structure quality
   */
  static calculateLinkmapScore(analysis) {
    let score = 0;
    const dist = analysis.linkDistribution;
    
    // Base score for having internal links (30 points)
    if (dist.totalInternal > 0) {
      score += 30;
    }
    
    // Good internal linking ratio (25 points)
    const avgInternal = parseFloat(dist.averageInternalPerPage);
    if (avgInternal >= 3 && avgInternal <= 10) {
      score += 25;
    } else if (avgInternal >= 1) {
      score += 15;
    }
    
    // Low orphan page ratio (20 points)
    const orphanRatio = dist.orphanCount / Math.max(dist.pagesCrawled, 1);
    if (orphanRatio === 0) {
      score += 20;
    } else if (orphanRatio <= 0.1) {
      score += 15;
    } else if (orphanRatio <= 0.2) {
      score += 10;
    }
    
    // Balanced external linking (15 points)
    const avgExternal = parseFloat(dist.averageExternalPerPage);
    if (avgExternal >= 1 && avgExternal <= 5) {
      score += 15;
    } else if (avgExternal >= 0.5) {
      score += 10;
    }
    
    // Link distribution quality (10 points)
    if (analysis.topLinkedPages.length > 0) {
      const topPageLinks = analysis.topLinkedPages[0].inboundLinks;
      const avgPageLinks = dist.totalInternal / Math.max(dist.pagesCrawled, 1);
      const distributionRatio = topPageLinks / Math.max(avgPageLinks, 1);
      
      if (distributionRatio < 5) { // Not too concentrated
        score += 10;
      } else if (distributionRatio < 10) {
        score += 5;
      }
    }
    
    return Math.min(score, 100);
  }

  /**
   * Get linkmap grade
   */
  static getLinkmapGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Identify linkmap issues
   */
  static getLinkmapIssues(analysis) {
    const issues = [];
    const dist = analysis.linkDistribution;
    
    if (dist.totalInternal === 0) {
      issues.push('No internal links found - poor site navigation');
      return issues;
    }
    
    const avgInternal = parseFloat(dist.averageInternalPerPage);
    if (avgInternal < 3) {
      issues.push(`Low internal linking: ${avgInternal} links/page (recommended: 3-10)`);
    } else if (avgInternal > 15) {
      issues.push(`Excessive internal linking: ${avgInternal} links/page (recommended: 3-10)`);
    }
    
    if (dist.orphanCount > 0) {
      const orphanRatio = (dist.orphanCount / Math.max(dist.pagesCrawled, 1) * 100).toFixed(1);
      issues.push(`${dist.orphanCount} orphan pages (${orphanRatio}% of site)`);
    }
    
    const avgExternal = parseFloat(dist.averageExternalPerPage);
    if (avgExternal === 0) {
      issues.push('No external links - may appear untrustworthy to search engines');
    } else if (avgExternal > 10) {
      issues.push(`Excessive external linking: ${avgExternal} links/page`);
    }
    
    // Check for link juice concentration
    if (analysis.topLinkedPages.length > 0) {
      const topPageLinks = analysis.topLinkedPages[0].inboundLinks;
      const totalLinks = dist.totalInternal;
      const concentration = (topPageLinks / Math.max(totalLinks, 1) * 100).toFixed(1);
      
      if (concentration > 30) {
        issues.push(`Link juice too concentrated: ${concentration}% to single page`);
      }
    }
    
    return issues;
  }

  /**
   * Generate linkmap recommendations
   */
  static getLinkmapRecommendations(analysis, baseUrl) {
    const recommendations = [];
    const dist = analysis.linkDistribution;
    
    if (dist.orphanCount > 0) {
      recommendations.push({
        issue: `${dist.orphanCount} orphan pages found`,
        fix: 'Add internal links to orphan pages from relevant content',
        action: 'Review orphan pages and create contextual internal links'
      });
    }
    
    const avgInternal = parseFloat(dist.averageInternalPerPage);
    if (avgInternal < 3) {
      recommendations.push({
        issue: 'Low internal linking density',
        fix: 'Add more contextual internal links between related pages',
        action: 'Target 3-10 internal links per page for better navigation'
      });
    }
    
    if (dist.totalExternal === 0) {
      recommendations.push({
        issue: 'No external links found',
        fix: 'Add relevant external links to authoritative sources',
        action: 'Link to industry resources, studies, and trusted sources'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate linkmap issues for Fix This panel
   */
  static generateLinkmapIssues(linkmapAnalysis, targetUrl) {
    const issues = [];
    const dist = linkmapAnalysis.linkDistribution;
    
    if (dist.orphanCount > 0) {
      issues.push({
        id: `linkmap-orphan-pages`,
        title: `${dist.orphanCount} orphan-sidor hittade`,
        severity: 'important',
        description: `${dist.orphanCount} sidor har inga inkommande interna länkar och är svåra att hitta`,
        foundOn: linkmapAnalysis.orphanPages.map(p => new URL(p.url).pathname).slice(0, 5),
        howTo: [
          'Granska orphan-sidor och identifiera relaterat innehåll',
          'Lägg till kontextuella interna länkar från relevanta sidor',
          'Inkludera viktiga orphan-sidor i huvudnavigering eller sitemap',
          'Använd breadcrumbs för bättre intern länkstruktur'
        ],
        links: [
          {
            label: 'Internal Linking Best Practices',
            url: 'https://moz.com/learn/seo/internal-link'
          },
          {
            label: 'Google: Site Navigation',
            url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide#navigation'
          }
        ],
        quickFixes: [
          {
            label: 'Exempel intern länk',
            snippet: `<a href="${linkmapAnalysis.orphanPages[0]?.url || '/example-page'}" title="Beskrivande länktext">Relevant länktext här</a>`
          }
        ],
        status: 'open'
      });
    }
    
    const avgInternal = parseFloat(dist.averageInternalPerPage);
    if (avgInternal < 3) {
      issues.push({
        id: `linkmap-low-internal`,
        title: 'Låg intern länkdensitet',
        severity: 'important',
        description: `Genomsnitt ${avgInternal} interna länkar per sida (rekommenderat: 3-10)`,
        foundOn: [new URL(targetUrl).pathname],
        howTo: [
          'Lägg till kontextuella interna länkar i ditt innehåll',
          'Länka till relaterade artiklar och sidor',
          'Använd beskrivande anchor text med relevanta nyckelord',
          'Implementera "Relaterade artiklar" sektioner'
        ],
        links: [
          {
            label: 'Internal Linking Strategy',
            url: 'https://ahrefs.com/blog/internal-links-for-seo/'
          }
        ],
        quickFixes: [
          {
            label: 'Relaterade artiklar sektion',
            snippet: `<aside class="related-articles">
  <h3>Relaterade artiklar</h3>
  <ul>
    <li><a href="/relaterad-artikel-1">Titel på relaterad artikel</a></li>
    <li><a href="/relaterad-artikel-2">Titel på relaterad artikel</a></li>
  </ul>
</aside>`
          }
        ],
        status: 'open'
      });
    }
    
    return issues;
  }
}

module.exports = LinkmapAnalyzer;