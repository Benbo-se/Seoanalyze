/**
 * Merges and prioritizes issues from different analysis types
 * Creates unified issue list with weighted scoring for better prioritization
 */
class IssueMerger {
  
  /**
   * Merge issues from SEO, Lighthouse, and Crawl analyses
   * @param {Object} seoResult - SEO analysis result
   * @param {Object} lighthouseResult - Lighthouse analysis result  
   * @param {Object} crawlResult - Crawl analysis result (optional)
   * @param {string} targetUrl - Target URL for context
   * @returns {Object} Merged and prioritized issues
   */
  static mergeAllIssues(seoResult, lighthouseResult, crawlResult, targetUrl) {
    const mergedAnalysis = {
      prioritizedIssues: [],
      issuesByCategory: {
        performance: [],
        seo: [],
        accessibility: [],
        bestPractices: [],
        technical: []
      },
      overallScore: 0,
      criticalCount: 0,
      importantCount: 0,
      recommendations: []
    };

    const allIssues = [];

    // Extract SEO issues with weights
    if (seoResult) {
      const seoIssues = this.extractSeoIssues(seoResult, targetUrl);
      allIssues.push(...seoIssues);
    }

    // Extract Lighthouse issues with weights
    if (lighthouseResult) {
      const lighthouseIssues = this.extractLighthouseIssues(lighthouseResult, targetUrl);
      allIssues.push(...lighthouseIssues);
    }

    // Extract Crawl issues with weights (if available)
    if (crawlResult) {
      const crawlIssues = this.extractCrawlIssues(crawlResult, targetUrl);
      allIssues.push(...crawlIssues);
    }

    // Sort issues by new priority calculation
    allIssues.sort((a, b) => (b.priority || b.weightedScore || 0) - (a.priority || a.weightedScore || 0));

    // Take top 15 issues to avoid overwhelming users
    mergedAnalysis.prioritizedIssues = allIssues.slice(0, 15);

    // Group issues by category
    mergedAnalysis.prioritizedIssues.forEach(issue => {
      const category = issue.category || 'technical';
      if (mergedAnalysis.issuesByCategory[category]) {
        mergedAnalysis.issuesByCategory[category].push(issue);
      } else {
        mergedAnalysis.issuesByCategory.technical.push(issue);
      }
    });

    // Calculate counts
    mergedAnalysis.criticalCount = mergedAnalysis.prioritizedIssues.filter(i => i.severity === 'critical').length;
    mergedAnalysis.importantCount = mergedAnalysis.prioritizedIssues.filter(i => i.severity === 'important').length;

    // Calculate overall score based on weighted issues
    mergedAnalysis.overallScore = this.calculateOverallScore(allIssues);

    // Generate combined recommendations
    mergedAnalysis.recommendations = this.generateCombinedRecommendations(mergedAnalysis.prioritizedIssues);

    return mergedAnalysis;
  }

  /**
   * Extract and weight SEO issues
   */
  static extractSeoIssues(seoResult, targetUrl) {
    const issues = [];
    
    // Missing H1 (High SEO impact)
    if (!seoResult.headings?.h1 || seoResult.headings.h1.length === 0 || seoResult.headings.h1.count === 0) {
      issues.push(this.createWeightedIssue({
        id: 'seo-missing-h1',
        title: 'Saknar H1-tagg',
        description: 'Sidan har ingen huvudrubrik (H1). Detta gör det svårare för sökmotorer och användare att förstå sidans innehåll.',
        severity: 'critical',
        category: 'seo',
        impact: 'Hög',
        impact_score: 135,
        confidence: 0.98,
        source: 'SEO-analys',
        estimated_time_min: 10
      }));
    }

    // Missing meta description (High SEO impact) 
    if (!seoResult.metaDescription || seoResult.metaDescription.length === 0 || seoResult.metaDescription === 'Missing') {
      issues.push(this.createWeightedIssue({
        id: 'seo-missing-meta-desc',
        title: 'Saknar meta-description',
        description: 'Ingen <meta name="description"> funnen. Påverkar hur utdraget i SERP ser ut och därmed CTR.',
        severity: 'medium',
        category: 'seo',
        impact: 'Medel',
        impact_score: 70,
        confidence: 0.9,
        source: 'SEO-analys',
        estimated_time_min: 10
      }));
    }

    // Poor title optimization
    if (seoResult.titleLength > 60 || seoResult.titleLength < 30) {
      issues.push(this.createWeightedIssue({
        id: 'seo-title-length',
        title: 'Titelns längd inte optimal',
        description: `Sidans <title> är ${seoResult.titleLength} tecken. Rekommenderad längd är 30–60 tecken för bäst synlighet i SERP.`,
        severity: 'high',
        category: 'seo',
        impact: 'Medel',
        impact_score: 105,
        confidence: 0.95,
        source: 'SEO-analys',
        estimated_time_min: 10
      }));
    }

    // Missing alt text
    if (seoResult.images?.withoutAlt?.length > 0) {
      issues.push(this.createWeightedIssue({
        id: 'seo-missing-alt',
        title: `Bilder saknar alt-texter`,
        description: `${seoResult.images.withoutAlt.length} bilder utan beskrivande alt-attribut. Påverkar tillgänglighet och bildsök.`,
        severity: 'medium',
        category: 'content',
        impact: 'Medel',
        impact_score: 65,
        confidence: 0.92,
        source: 'SEO-analys',
        estimated_time_min: 30
      }));
    }

    return issues;
  }

  /**
   * Extract and weight Lighthouse issues
   */
  static extractLighthouseIssues(lighthouseResult, targetUrl) {
    const issues = [];
    
    // Poor Largest Contentful Paint (High performance impact)
    if (lighthouseResult.coreWebVitals?.lcp) {
      const lcpValue = parseFloat(lighthouseResult.coreWebVitals.lcp.value) || 0;
      if (lcpValue > 2.5) {
        issues.push(this.createWeightedIssue({
          id: 'perf-poor-lcp',
          title: `Långsam Largest Contentful Paint (${lcpValue.toFixed(1)}s)`,
          description: 'LCP över 2.5s påverkar användarupplevelse och Core Web Vitals negativt',
          severity: 'critical',
          category: 'performance',
          impact: 'Hög',
          impact_score: 120,
          confidence: 0.9,
          source: 'Lighthouse',
          estimated_time_min: 180
        }));
      }
    }

    // Poor Cumulative Layout Shift
    if (lighthouseResult.coreWebVitals?.cls) {
      const clsValue = parseFloat(lighthouseResult.coreWebVitals.cls.value) || 0;
      if (clsValue > 0.1) {
        issues.push(this.createWeightedIssue({
          id: 'perf-poor-cls',
          title: `Hög Cumulative Layout Shift (${clsValue.toFixed(3)})`,
          description: 'CLS över 0.1 orsakar visuell instabilitet och dålig användarupplevelse',
          severity: 'critical',
          category: 'performance',
          impact: 'Hög',
          impact_score: 90,
          confidence: 0.92,
          source: 'Lighthouse',
          estimated_time_min: 120
        }));
      }
    }

    // Unused JavaScript (Performance opportunity)
    if (lighthouseResult.opportunities?.unusedJavaScript) {
      const savings = lighthouseResult.opportunities.unusedJavaScript.estimatedSavings || 0;
      if (savings > 1000) { // > 1KB savings
        issues.push(this.createWeightedIssue({
          id: 'perf-unused-js',
          title: 'Oanvänd JavaScript upptäckt',
          description: `Ta bort ${(savings/1000).toFixed(1)}KB oanvänd JavaScript`,
          severity: 'important',
          category: 'performance',
          impact: 'Medel',
          impact_score: 80,
          confidence: 0.88,
          source: 'Lighthouse',
          estimated_time_min: 90
        }));
      }
    }

    // Render-blocking resources
    if (lighthouseResult.opportunities?.renderBlockingResources) {
      const savings = lighthouseResult.opportunities.renderBlockingResources.estimatedSavings || 0;
      if (savings > 500) { // > 0.5s savings
        issues.push(this.createWeightedIssue({
          id: 'perf-render-blocking',
          title: 'Renderblockande resurser funna',
          description: `Eliminera renderblockande resurser för att spara ${(savings/1000).toFixed(1)}s`,
          severity: 'important',
          category: 'performance',
          impact: 'Hög',
          impact_score: 85,
          confidence: 0.9,
          source: 'Lighthouse',
          estimated_time_min: 45
        }));
      }
    }

    // Poor accessibility score
    if (lighthouseResult.accessibility < 90) {
      issues.push(this.createWeightedIssue({
        id: 'a11y-poor-score',
        title: `Låg tillgänglighetspoäng (${lighthouseResult.accessibility}/100)`,
        description: 'Tillgänglighetsförbättringar behövs för bättre användarupplevelse',
        severity: 'important',
        category: 'accessibility',
        impact: 'Medel',
        impact_score: 70,
        confidence: 0.85,
        source: 'Lighthouse',
        estimated_time_min: 90
      }));
    }

    return issues;
  }

  /**
   * Extract and weight Crawl issues
   */
  static extractCrawlIssues(crawlResult, targetUrl) {
    const issues = [];
    
    // Broken links (High technical impact)
    if (crawlResult.brokenLinks?.length > 0) {
      issues.push(this.createWeightedIssue({
        id: 'tech-broken-links',
        title: `${crawlResult.brokenLinks.length} trasiga länkar funna`,
        description: 'Trasiga länkar skadar användarupplevelse och SEO',
        severity: 'critical',
        category: 'technical',
        impact: 'Hög',
        impact_score: 85,
        confidence: 0.95,
        source: 'Webbplats-crawl',
        estimated_time_min: 30
      }));
    }

    // Missing sitemap
    if (crawlResult.sitemap === null || crawlResult.sitemap === 'Not found') {
      issues.push(this.createWeightedIssue({
        id: 'tech-missing-sitemap',
        title: 'XML-sitemap ej funnen',
        description: 'XML-sitemap hjälper sökmotorer att hitta ditt innehåll',
        severity: 'important',
        category: 'technical',
        impact: 'Medel',
        impact_score: 70,
        confidence: 0.9,
        source: 'Webbplats-crawl',
        estimated_time_min: 15
      }));
    }

    return issues;
  }

  /**
   * Get severity weight for priority calculation
   */
  static getSeverityWeight(severity) {
    const weights = {
      'critical': 1.20,
      'high': 1.00,
      'medium': 0.75,
      'low': 0.50
    };
    return weights[severity] || 1.00;
  }

  /**
   * Convert fix time text to minutes
   */
  static parseTimeToMinutes(fixTime) {
    if (typeof fixTime === 'number') return fixTime;
    
    const timeMap = {
      '< 30 minuter': 10,
      '1–2 timmar': 90,
      '> 1 dag': 480,
      '5 minutes': 5,
      '10 minutes': 10,
      '2-4 hours': 180,
      '1-3 hours': 120,
      '30-60 minutes': 45,
      '20 minutes': 20,
      '15 minutes': 15,
      '1-2 hours': 90
    };
    
    return timeMap[fixTime] || 30;
  }

  /**
   * Calculate priority using new formula
   */
  static calculatePriority(impact_score, confidence, severity, estimated_time_min) {
    const severity_weight = this.getSeverityWeight(severity);
    const time_penalty = Math.min(estimated_time_min / 240, 0.25) * impact_score;
    
    return Math.round(impact_score * confidence * severity_weight - time_penalty);
  }

  /**
   * Create weighted issue object (new format)
   */
  static createWeightedIssue(issueData) {
    // Convert old format to new format
    const impact_score = issueData.baseScore || issueData.impact_score || 50;
    const confidence = issueData.confidence || 0.9;
    const estimated_time_min = this.parseTimeToMinutes(issueData.fixTime || issueData.estimated_time_min);
    const severity = issueData.severity;
    
    // Calculate priority using new formula
    const priority = this.calculatePriority(impact_score, confidence, severity, estimated_time_min);
    
    // Keep old weightedScore for backward compatibility
    const weight = issueData.weight || 1.0;
    const weightedScore = impact_score * weight;
    
    return {
      ...issueData,
      impact_score,
      confidence,
      estimated_time_min,
      priority,
      // Backward compatibility
      weightedScore,
      displayScore: Math.round(weightedScore)
    };
  }

  /**
   * Calculate overall score from all weighted issues
   */
  static calculateOverallScore(allIssues) {
    if (allIssues.length === 0) return 100;
    
    const maxPossibleScore = 100;
    let totalDeduction = 0;
    
    allIssues.forEach(issue => {
      // Deduct score based on severity and impact
      let deduction = 0;
      const weight = issue.weight || 1.0;
      const severity_weight = this.getSeverityWeight(issue.severity);
      
      if (issue.severity === 'critical') {
        deduction = 15 * severity_weight;
      } else if (issue.severity === 'high') {
        deduction = 10 * severity_weight;
      } else if (issue.severity === 'medium') {
        deduction = 6 * severity_weight;
      } else if (issue.severity === 'low') {
        deduction = 3 * severity_weight;
      } else if (issue.severity === 'important') {
        deduction = 8 * weight; // Backward compatibility
      } else {
        deduction = 3 * weight; // Backward compatibility
      }
      totalDeduction += deduction;
    });
    
    const score = Math.max(0, maxPossibleScore - totalDeduction);
    return Math.round(score);
  }

  /**
   * Generate combined recommendations from top issues
   */
  static generateCombinedRecommendations(prioritizedIssues) {
    const recommendations = [];
    
    // Group by estimated time to create actionable phases
    const quickFixes = prioritizedIssues.filter(i => {
      const timeMin = i.estimated_time_min || this.parseTimeToMinutes(i.fixTime);
      return timeMin <= 30;
    });
    const mediumFixes = prioritizedIssues.filter(i => {
      const timeMin = i.estimated_time_min || this.parseTimeToMinutes(i.fixTime);
      return timeMin > 30 && timeMin <= 120;
    });
    const longFixes = prioritizedIssues.filter(i => {
      const timeMin = i.estimated_time_min || this.parseTimeToMinutes(i.fixTime);
      return timeMin > 120;
    });
    
    if (quickFixes.length > 0) {
      recommendations.push({
        phase: 'Snabba vinster (< 30 min)',
        impact: 'Medel–Hög',
        timeSpan: '< 30 min',
        issues: quickFixes.slice(0, 5).map(i => i.title),
        description: 'Börja med dessa högeffektiva, lågenergi-förbättringar'
      });
    }
    
    if (mediumFixes.length > 0) {
      recommendations.push({
        phase: 'Medellångfristen (30 min–2 timmar)',
        impact: 'Hög',
        timeSpan: '30–120 min', 
        issues: mediumFixes.slice(0, 3).map(i => i.title),
        description: 'Åtgärda dessa för betydande prestanda- och SEO-förbättringar'
      });
    }
    
    if (longFixes.length > 0) {
      recommendations.push({
        phase: 'Långsiktiga förbättringar (> 2 timmar)',
        impact: 'Mycket Hög',
        timeSpan: '> 120 min',
        issues: longFixes.slice(0, 2).map(i => i.title),
        description: 'Stora förbättringar som kräver utvecklingstid'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate merged issues for Fix This panel
   */
  static generateMergedIssues(mergedAnalysis, targetUrl) {
    // Return top 5 prioritized issues formatted for Fix This panel
    return mergedAnalysis.prioritizedIssues.slice(0, 5).map((issue, index) => ({
      id: `merged-${issue.id}-${index}`,
      title: issue.title,
      severity: issue.severity,
      description: `${issue.description} (Source: ${issue.source})`,
      foundOn: [new URL(targetUrl).pathname],
      howTo: [
        `Fix Time: ${issue.fixTime}`,
        `Impact: ${issue.impact}`,
        'See specific analyzer for detailed instructions'
      ],
      links: [
        {
          label: `View ${issue.source} details`,
          url: '#'
        }
      ],
      quickFixes: [],
      status: 'open',
      weightedScore: issue.weightedScore,
      category: issue.category
    }));
  }
}

module.exports = IssueMerger;