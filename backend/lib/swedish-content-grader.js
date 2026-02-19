/**
 * Swedish Content Grader
 * Analyzes readability of Swedish text using LIX (Läsbarhetsindex)
 * Provides unique value for Swedish market SEO analysis
 */

class SwedishContentGrader {
  
  /**
   * Calculate LIX (Läsbarhetsindex) for Swedish text
   * LIX = (antal ord / antal meningar) + (antal långa ord * 100 / antal ord)
   * @param {string} text - Text to analyze
   * @returns {number} LIX value
   */
  static calculateLIX(text) {
    if (!text || text.trim().length === 0) {
      return null; // Indikerar insufficient text
    }

    // Clean text from HTML tags and extra whitespace
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();

    // Split into sentences (. ! ? and Swedish abbreviations)
    // Handle common Swedish abbreviations that shouldn't split sentences
    const abbrevs = ['t.ex', 'bl.a', 'd.v.s', 'o.s.v', 'fr.o.m', 't.o.m', 'm.m', 'e.kr', 'f.kr'];
    let processedText = cleanText;
    abbrevs.forEach(abbr => {
      const regex = new RegExp(abbr.replace('.', '\\.'), 'gi');
      processedText = processedText.replace(regex, abbr.replace(/\./g, ''));
    });

    // Split sentences on . ! ? (Swedish uses these)
    const sentences = processedText
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 0);

    if (sentences.length === 0) {
      return 0;
    }

    // Split into words
    const words = cleanText
      .split(/\s+/)
      .filter(w => w.length > 0 && /[a-zåäöA-ZÅÄÖ]/.test(w)); // Must contain at least one letter

    if (words.length === 0) {
      return 0;
    }

    // Count long words (> 6 characters in Swedish)
    const longWords = words.filter(w => {
      // Remove punctuation for accurate count
      const cleanWord = w.replace(/[^a-zåäöA-ZÅÄÖ]/g, '');
      return cleanWord.length > 6;
    });

    // Calculate LIX components
    const avgWordsPerSentence = words.length / sentences.length;
    const percentLongWords = (longWords.length * 100) / words.length;

    // LIX formula
    const lix = avgWordsPerSentence + percentLongWords;
    
    return Math.round(lix);
  }

  /**
   * Grade content based on LIX value
   * @param {number} lix - LIX value
   * @returns {Object} Grade information
   */
  static gradeFromLIX(lix) {
    let grade, level, description;
    
    // Handle insufficient text
    if (lix === null || lix === 0 || !isFinite(lix)) {
      grade = 'Info';
      level = 'Ej tillräcklig text';
      description = 'För lite text för tillförlitlig LIX-beräkning (minst 30 ord rekommenderas)';
    } else if (lix < 30) {
      grade = 'Mycket lätt';
      level = 'Barnbok';
      description = 'Texten är mycket lättläst, lämplig för barn och nybörjare';
    } else if (lix < 40) {
      grade = 'Lätt';
      level = 'Skönlitteratur';
      description = 'Texten är lättläst, typisk för skönlitteratur och populärpress';
    } else if (lix < 50) {
      grade = 'Medel';
      level = 'Normaltext';
      description = 'Normal svårighetsgrad, lämplig för bred publik';
    } else if (lix < 60) {
      grade = 'Svår';
      level = 'Facktext';
      description = 'Texten är svårläst, typisk för facktexter och myndigheter';
    } else {
      grade = 'Mycket svår';
      level = 'Byråkratsvenska';
      description = 'Texten är mycket svårläst, typisk för juridiska och vetenskapliga texter';
    }
    
    // Calculate score (0-100) - optimal LIX is around 40-45 for web content
    const optimalLIX = 42.5; // Middle of optimal range for web
    const deviation = Math.abs(lix - optimalLIX);
    const score = Math.max(0, Math.min(100, 100 - deviation * 2));
    
    return {
      grade,
      level,
      description,
      score: Math.round(score)
    };
  }

  /**
   * Analyze content readability
   * @param {string} text - Text to analyze
   * @returns {Object} Complete readability analysis
   */
  static analyzeContent(text) {
    const lix = this.calculateLIX(text);
    const grading = this.gradeFromLIX(lix);
    
    // Handle insufficient text early
    if (lix === null || lix === 0 || !isFinite(lix)) {
      return {
        lix: 0,
        ...grading,
        metrics: {
          totalWords: 0,
          totalSentences: 0,
          totalParagraphs: 0,
          longWords: 0,
          longWordsPercent: 0,
          longSentences: 0,
          avgSentenceLength: 0,
          avgWordsPerParagraph: 0
        },
        recommendations: [{
          type: 'info',
          text: 'Lägg till mer innehåll (minst 30 ord) för meningsfull läsbarhetsanalys.',
          impact: 'low'
        }]
      };
    }
    
    // Additional metrics
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const sentences = cleanText
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 0);
    
    const words = cleanText
      .split(/\s+/)
      .filter(w => w.length > 0 && /[a-zåäöA-ZÅÄÖ]/.test(w));
    
    const longWords = words.filter(w => {
      const cleanWord = w.replace(/[^a-zåäöA-ZÅÄÖ]/g, '');
      return cleanWord.length > 6;
    });
    
    // Find very long sentences (>25 words is considered long in Swedish)
    const longSentences = sentences.filter(s => {
      const sentenceWords = s.split(/\s+/).filter(w => w.length > 0);
      return sentenceWords.length > 25;
    });
    
    // Calculate average sentence length
    const avgSentenceLength = words.length > 0 && sentences.length > 0 
      ? Math.round(words.length / sentences.length) 
      : 0;
    
    // Analyze paragraph structure
    const paragraphs = text
      .split(/\n\n+/)
      .filter(p => p.trim().length > 0);
    
    return {
      lix,
      ...grading,
      metrics: {
        totalWords: words.length,
        totalSentences: sentences.length,
        totalParagraphs: paragraphs.length,
        longWords: longWords.length,
        longWordsPercent: words.length > 0 ? Math.round((longWords.length * 100) / words.length) : 0,
        longSentences: longSentences.length,
        avgSentenceLength,
        avgWordsPerParagraph: paragraphs.length > 0 ? Math.round(words.length / paragraphs.length) : 0
      },
      recommendations: this.generateRecommendations(lix, avgSentenceLength, longSentences.length, words.length)
    };
  }

  /**
   * Generate recommendations based on analysis
   * @private
   */
  static generateRecommendations(lix, avgSentenceLength, longSentenceCount, totalWords) {
    const recommendations = [];
    
    // LIX recommendations
    if (lix > 55) {
      recommendations.push({
        type: 'critical',
        text: 'Texten är för svårläst för webben. Förenkla meningar och använd kortare ord.',
        impact: 'high'
      });
    } else if (lix > 50) {
      recommendations.push({
        type: 'warning',
        text: 'Texten kan vara svår för vissa läsare. Överväg att förenkla språket.',
        impact: 'medium'
      });
    } else if (lix < 30) {
      recommendations.push({
        type: 'info',
        text: 'Texten är mycket enkel. Detta kan vara bra för vissa målgrupper men kan uppfattas som oseriöst för andra.',
        impact: 'low'
      });
    }
    
    // Sentence length recommendations
    if (avgSentenceLength > 20) {
      recommendations.push({
        type: 'warning',
        text: `Genomsnittlig meningslängd är ${avgSentenceLength} ord. Sikta på 15-17 ord för bättre läsbarhet.`,
        impact: 'medium'
      });
    }
    
    if (longSentenceCount > 0) {
      recommendations.push({
        type: 'warning',
        text: `${longSentenceCount} mening${longSentenceCount > 1 ? 'ar' : ''} har över 25 ord. Dela upp långa meningar.`,
        impact: 'medium'
      });
    }
    
    // Content length recommendations
    if (totalWords < 300) {
      recommendations.push({
        type: 'warning',
        text: 'Innehållet har mindre än 300 ord. Överväg att utöka för bättre SEO.',
        impact: 'high'
      });
    } else if (totalWords > 3000) {
      recommendations.push({
        type: 'info',
        text: 'Långt innehåll (>3000 ord). Överväg att dela upp i flera sidor eller lägga till innehållsförteckning.',
        impact: 'low'
      });
    }
    
    // If no issues found
    if (recommendations.length === 0 && lix >= 35 && lix <= 50) {
      recommendations.push({
        type: 'success',
        text: 'Texten har god läsbarhet för svensk webbpublik!',
        impact: 'positive'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate readability score for SEO (0-100)
   * Optimized for Swedish web content
   */
  static calculateSEOScore(analysis) {
    let score = 100;
    
    // LIX penalty (optimal is 35-50 for web)
    if (analysis.lix < 35) {
      score -= (35 - analysis.lix) * 1.5; // Too simple
    } else if (analysis.lix > 50) {
      score -= (analysis.lix - 50) * 2; // Too complex (higher penalty)
    }
    
    // Sentence length penalty
    if (analysis.metrics.avgSentenceLength > 20) {
      score -= (analysis.metrics.avgSentenceLength - 20) * 2;
    }
    
    // Long sentences penalty
    if (analysis.metrics.longSentences > 0) {
      score -= analysis.metrics.longSentences * 3;
    }
    
    // Content length bonus/penalty
    if (analysis.metrics.totalWords < 300) {
      score -= 15; // Too short for SEO
    } else if (analysis.metrics.totalWords >= 600 && analysis.metrics.totalWords <= 1500) {
      score += 5; // Optimal length bonus
    }
    
    // Paragraph structure bonus
    if (analysis.metrics.avgWordsPerParagraph >= 40 && analysis.metrics.avgWordsPerParagraph <= 100) {
      score += 5; // Good paragraph length
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

module.exports = SwedishContentGrader;