const TextNormalizer = require('../src/utils/text-normalizer');

/**
 * Analyzes social media meta tags (Open Graph, Twitter Cards)
 * Provides validation and recommendations for better social sharing
 */
class SocialAnalyzer {
  
  /**
   * Analyze social media meta tags from HTML
   * @param {CheerioAPI} $ - Cheerio loaded HTML
   * @param {string} targetUrl - URL being analyzed
   * @returns {Object} Social media analysis
   */
  static analyzeSocialTags($, targetUrl) {
    const analysis = {
      openGraph: this.analyzeOpenGraph($),
      twitterCards: this.analyzeTwitterCards($),
      score: 0,
      grade: '',
      issues: [],
      recommendations: []
    };

    // Calculate score and provide recommendations
    const ogScore = this.scoreOpenGraph(analysis.openGraph);
    const twitterScore = this.scoreTwitterCards(analysis.twitterCards);
    
    analysis.score = Math.round((ogScore + twitterScore) / 2);
    analysis.grade = this.getSocialGrade(analysis.score);

    // Collect issues and recommendations
    if (ogScore < 80) {
      analysis.issues.push(...this.getOpenGraphIssues(analysis.openGraph, targetUrl));
    }
    
    if (twitterScore < 80) {
      analysis.issues.push(...this.getTwitterIssues(analysis.twitterCards, targetUrl));
    }

    return analysis;
  }

  /**
   * Analyze Open Graph meta tags
   */
  static analyzeOpenGraph($) {
    const og = {
      title: null,
      description: null,
      image: null,
      url: null,
      type: null,
      siteName: null,
      locale: null,
      imageAlt: null,
      imageWidth: null,
      imageHeight: null
    };

    // Extract all OG meta tags
    $('meta[property^="og:"]').each((i, el) => {
      const property = $(el).attr('property');
      const content = TextNormalizer.normalizeText($(el).attr('content') || '');
      
      switch (property) {
        case 'og:title':
          og.title = content;
          break;
        case 'og:description':
          og.description = content;
          break;
        case 'og:image':
          og.image = content;
          break;
        case 'og:url':
          og.url = content;
          break;
        case 'og:type':
          og.type = content;
          break;
        case 'og:site_name':
          og.siteName = content;
          break;
        case 'og:locale':
          og.locale = content;
          break;
        case 'og:image:alt':
          og.imageAlt = content;
          break;
        case 'og:image:width':
          og.imageWidth = parseInt(content) || null;
          break;
        case 'og:image:height':
          og.imageHeight = parseInt(content) || null;
          break;
      }
    });

    return og;
  }

  /**
   * Analyze Twitter Card meta tags
   */
  static analyzeTwitterCards($) {
    const twitter = {
      card: null,
      title: null,
      description: null,
      image: null,
      imageAlt: null,
      site: null,
      creator: null
    };

    // Extract all Twitter meta tags
    $('meta[name^="twitter:"]').each((i, el) => {
      const name = $(el).attr('name');
      const content = TextNormalizer.normalizeText($(el).attr('content') || '');
      
      switch (name) {
        case 'twitter:card':
          twitter.card = content;
          break;
        case 'twitter:title':
          twitter.title = content;
          break;
        case 'twitter:description':
          twitter.description = content;
          break;
        case 'twitter:image':
          twitter.image = content;
          break;
        case 'twitter:image:alt':
          twitter.imageAlt = content;
          break;
        case 'twitter:site':
          twitter.site = content;
          break;
        case 'twitter:creator':
          twitter.creator = content;
          break;
      }
    });

    return twitter;
  }

  /**
   * Score Open Graph implementation
   */
  static scoreOpenGraph(og) {
    let score = 0;
    const maxScore = 100;

    // Essential fields (60 points)
    if (og.title && og.title.length >= 15 && og.title.length <= 60) {
      score += 20;
    } else if (og.title) {
      score += 10; // Has title but wrong length
    }

    if (og.description && og.description.length >= 50 && og.description.length <= 160) {
      score += 20;
    } else if (og.description) {
      score += 10; // Has description but wrong length
    }

    if (og.image) {
      score += 20;
    }

    // Good practice fields (40 points)
    if (og.url) score += 10;
    if (og.type) score += 10;
    if (og.siteName) score += 5;
    if (og.locale) score += 5;
    if (og.imageAlt && og.image) score += 5;
    if (og.imageWidth && og.imageHeight) score += 5;

    return score;
  }

  /**
   * Score Twitter Cards implementation
   */
  static scoreTwitterCards(twitter) {
    let score = 0;
    const maxScore = 100;

    // Card type (essential - 30 points)
    if (twitter.card) {
      const validCards = ['summary', 'summary_large_image', 'app', 'player'];
      if (validCards.includes(twitter.card)) {
        score += 30;
      } else {
        score += 15; // Has card but invalid type
      }
    }

    // Content fields (50 points)
    if (twitter.title && twitter.title.length >= 15 && twitter.title.length <= 70) {
      score += 20;
    } else if (twitter.title) {
      score += 10;
    }

    if (twitter.description && twitter.description.length >= 50 && twitter.description.length <= 200) {
      score += 20;
    } else if (twitter.description) {
      score += 10;
    }

    if (twitter.image) {
      score += 10;
    }

    // Attribution fields (20 points)
    if (twitter.site) score += 10;
    if (twitter.creator) score += 5;
    if (twitter.imageAlt && twitter.image) score += 5;

    return score;
  }

  /**
   * Get Open Graph issues
   */
  static getOpenGraphIssues(og, targetUrl) {
    const issues = [];

    if (!og.title) {
      issues.push('Missing og:title - social shares will use page title');
    } else if (og.title.length < 15 || og.title.length > 60) {
      issues.push(`OG title length: ${og.title.length} chars (recommended: 15-60)`);
    }

    if (!og.description) {
      issues.push('Missing og:description - social shares will use meta description');
    } else if (og.description.length < 50 || og.description.length > 160) {
      issues.push(`OG description length: ${og.description.length} chars (recommended: 50-160)`);
    }

    if (!og.image) {
      issues.push('Missing og:image - social shares will not have preview image');
    } else {
      if (!og.imageWidth || !og.imageHeight) {
        issues.push('Missing og:image:width/height - may cause rendering issues');
      } else if (og.imageWidth < 1200 || og.imageHeight < 630) {
        issues.push(`OG image too small: ${og.imageWidth}x${og.imageHeight} (min: 1200x630)`);
      }
      
      if (!og.imageAlt) {
        issues.push('Missing og:image:alt - accessibility issue');
      }
    }

    if (!og.url) {
      issues.push('Missing og:url - may cause URL canonicalization issues');
    }

    if (!og.type) {
      issues.push('Missing og:type - defaults to "website"');
    }

    return issues;
  }

  /**
   * Get Twitter Cards issues
   */
  static getTwitterIssues(twitter, targetUrl) {
    const issues = [];

    if (!twitter.card) {
      issues.push('Missing twitter:card - Twitter will not show rich preview');
    } else {
      const validCards = ['summary', 'summary_large_image', 'app', 'player'];
      if (!validCards.includes(twitter.card)) {
        issues.push(`Invalid twitter:card "${twitter.card}" (valid: ${validCards.join(', ')})`);
      }
    }

    if (!twitter.title) {
      issues.push('Missing twitter:title - will fallback to og:title or page title');
    } else if (twitter.title.length < 15 || twitter.title.length > 70) {
      issues.push(`Twitter title length: ${twitter.title.length} chars (recommended: 15-70)`);
    }

    if (!twitter.description) {
      issues.push('Missing twitter:description - will fallback to og:description');
    } else if (twitter.description.length < 50 || twitter.description.length > 200) {
      issues.push(`Twitter description length: ${twitter.description.length} chars (recommended: 50-200)`);
    }

    if (!twitter.image) {
      issues.push('Missing twitter:image - will fallback to og:image');
    } else if (!twitter.imageAlt) {
      issues.push('Missing twitter:image:alt - accessibility issue');
    }

    if (!twitter.site) {
      issues.push('Missing twitter:site - Twitter handle not attributed');
    }

    return issues;
  }

  /**
   * Get social media grade
   */
  static getSocialGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate social media issues for Fix This panel
   */
  static generateSocialIssues(socialAnalysis, targetUrl) {
    const issues = [];
    const domain = new URL(targetUrl).hostname;

    // Check if social analysis data exists
    if (!socialAnalysis?.openGraph && !socialAnalysis?.twitterCards) {
      return issues;
    }

    // Open Graph issues
    const og = socialAnalysis.openGraph || {};
    if (!og.title || !og.description || !og.image) {
      issues.push({
        id: `social-og-missing`,
        title: 'Ofullständiga Open Graph tags',
        severity: 'important',
        description: 'Saknade eller ofullständiga Open Graph meta tags för social sharing',
        foundOn: [new URL(targetUrl).pathname],
        howTo: [
          'Lägg till Open Graph meta tags i <head> sektionen',
          'Inkludera minst og:title, og:description och og:image',
          'Testa med Facebook Sharing Debugger',
          'Se till att bilden är minst 1200x630 pixlar'
        ],
        links: [
          {
            label: 'Open Graph Protocol',
            url: 'https://ogp.me/'
          },
          {
            label: 'Facebook Sharing Debugger',
            url: 'https://developers.facebook.com/tools/debug/'
          }
        ],
        quickFixes: [
          {
            label: 'Grundläggande Open Graph',
            snippet: `<meta property="og:title" content="${og.title || 'Sidtitel'}" />
<meta property="og:description" content="${og.description || 'Sidbeskrivning'}" />
<meta property="og:image" content="https://${domain}/og-image.jpg" />
<meta property="og:url" content="${targetUrl}" />`
          }
        ],
        status: 'open'
      });
    }

    // Twitter Cards issues
    const twitter = socialAnalysis.twitterCards || {};
    if (!twitter.card) {
      issues.push({
        id: `social-twitter-missing`,
        title: 'Saknar Twitter Card',
        severity: 'important',
        description: 'Twitter Card meta tags saknas - tweets kommer inte visa rich preview',
        foundOn: [new URL(targetUrl).pathname],
        howTo: [
          'Lägg till Twitter Card meta tags',
          'Använd "summary_large_image" för bäst resultat',
          'Testa med Twitter Card Validator',
          'Inkludera @username för attribution'
        ],
        links: [
          {
            label: 'Twitter Cards Guide',
            url: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards'
          },
          {
            label: 'Twitter Card Validator',
            url: 'https://cards-dev.twitter.com/validator'
          }
        ],
        quickFixes: [
          {
            label: 'Twitter Card Setup',
            snippet: `<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${twitter.title || og.title || 'Sidtitel'}" />
<meta name="twitter:description" content="${twitter.description || og.description || 'Sidbeskrivning'}" />
<meta name="twitter:image" content="https://${domain}/twitter-image.jpg" />`
          }
        ],
        status: 'open'
      });
    }

    return issues;
  }
}

module.exports = SocialAnalyzer;