const TextNormalizer = require('./text-normalizer');

/**
 * Unified H1 Analysis för både SEO och Crawl
 * Säkerställer konsistent H1-detektion mellan alla analystyper
 */
class H1Analyzer {
  
  /**
   * Analyserar H1-taggar på en sida
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {Object} - H1 analysis object
   */
  static analyze($) {
    if (!$) {
      return {
        count: 0,
        texts: [],
        hasH1: false,
        hasMultipleH1: false,
        isEmpty: false,
        issues: ['No DOM provided for H1 analysis']
      };
    }
    
    const h1Elements = $('h1');
    const count = h1Elements.length;
    const texts = [];
    const issues = [];
    
    // Samla alla H1-texter med normalisering
    h1Elements.each((i, elem) => {
      const rawText = $(elem).text();
      const normalizedText = TextNormalizer.normalizeHeading(rawText);
      if (normalizedText) {
        texts.push(normalizedText);
      }
    });
    
    // Identifiera problem
    const hasH1 = count > 0;
    const hasMultipleH1 = count > 1;
    const isEmpty = texts.length === 0;
    
    if (!hasH1) {
      issues.push('Missing H1 tag');
    } else if (hasMultipleH1) {
      issues.push(`Multiple H1 tags found (${count})`);
    }
    
    if (hasH1 && isEmpty) {
      issues.push('H1 tag exists but is empty');
    }
    
    // Kontrollera H1-längd
    texts.forEach((text, index) => {
      if (text.length < 10) {
        issues.push(`H1 #${index + 1} is too short (${text.length} characters)`);
      } else if (text.length > 70) {
        issues.push(`H1 #${index + 1} is too long (${text.length} characters)`);
      }
    });
    
    return {
      count,
      texts,
      hasH1,
      hasMultipleH1,
      isEmpty,
      issues,
      // För bakåtkompatibilitet
      h1Count: count,
      h1Texts: texts
    };
  }
  
  /**
   * Enkel H1-räkning för grundläggande crawl
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {number} - Antal H1-taggar
   */
  static count($) {
    return $('h1').length;
  }
  
  /**
   * Kontrollerar om H1 finns och är användbar
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {boolean} - True om bra H1 finns
   */
  static hasGoodH1($) {
    const analysis = this.analyze($);
    return analysis.hasH1 && !analysis.hasMultipleH1 && !analysis.isEmpty && analysis.issues.length === 0;
  }
  
  /**
   * Extraherar första (primära) H1-text
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {string} - Första H1-text eller tom sträng
   */
  static getPrimaryH1($) {
    const analysis = this.analyze($);
    return analysis.texts[0] || '';
  }
  
  /**
   * Genererar rekommendationer för H1-förbättringar
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {Array<string>} - Array av rekommendationer
   */
  static getRecommendations($) {
    const analysis = this.analyze($);
    const recommendations = [];
    
    if (!analysis.hasH1) {
      recommendations.push('Lägg till en H1-tagg som beskriver sidans huvudinnehåll');
    } else if (analysis.hasMultipleH1) {
      recommendations.push('Använd endast en H1-tagg per sida. Ändra de andra till H2 eller H3');
    }
    
    if (analysis.isEmpty) {
      recommendations.push('Fyll i text i din H1-tagg');
    }
    
    analysis.texts.forEach((text, index) => {
      if (text.length < 10) {
        recommendations.push(`Gör H1 #${index + 1} mer beskrivande (minst 10 tecken)`);
      } else if (text.length > 70) {
        recommendations.push(`Förkorta H1 #${index + 1} för bättre läsbarhet (max 70 tecken)`);
      }
    });
    
    return recommendations;
  }
  
  /**
   * Beräknar H1-poäng för SEO-analys
   * @param {CheerioStatic} $ - Cheerio instance
   * @returns {Object} - Score object med poäng och förklaring
   */
  static calculateScore($) {
    const analysis = this.analyze($);
    let score = 0;
    const maxScore = 15; // H1 är värt 15 poäng i SEO-analys
    const feedback = [];
    
    if (analysis.hasH1) {
      score += 8; // Grundpoäng för att ha H1
      feedback.push('✅ H1 tag found');
      
      if (!analysis.hasMultipleH1) {
        score += 3; // Bonus för bara en H1
        feedback.push('✅ Single H1 tag (recommended)');
      } else {
        feedback.push('⚠️ Multiple H1 tags found');
      }
      
      if (!analysis.isEmpty) {
        score += 2; // Bonus för att H1 inte är tom
        
        const primaryH1 = analysis.texts[0];
        if (primaryH1.length >= 10 && primaryH1.length <= 70) {
          score += 2; // Bonus för bra längd
          feedback.push('✅ H1 has appropriate length');
        } else if (primaryH1.length < 10) {
          feedback.push('⚠️ H1 is too short');
        } else {
          feedback.push('⚠️ H1 is too long');
        }
      } else {
        feedback.push('❌ H1 is empty');
      }
    } else {
      feedback.push('❌ No H1 tag found');
    }
    
    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback
    };
  }
}

module.exports = H1Analyzer;