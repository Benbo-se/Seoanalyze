const he = require('he'); // HTML entity decoder

/**
 * Centraliserad text-normaliseringsfunktion
 * Hanterar HTML entities, Unicode normalisering och svenska tecken
 */
class TextNormalizer {
  
  /**
   * Normaliserar text för SEO/crawl-analys
   * @param {string} text - Raw text som kan innehålla entities
   * @returns {string} - Normaliserad, ren text
   */
  static normalizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    try {
      // 1. Decode HTML entities (&amp; → &, &ouml; → ö, etc.)
      let normalized = he.decode(text);
      
      // 2. Unicode normalisering (NFC - sammansatta tecken)
      normalized = normalized.normalize('NFC');
      
      // 3. Trim whitespace
      normalized = normalized.trim();
      
      // 4. Ersätt multipla whitespace med single space
      normalized = normalized.replace(/\s+/g, ' ');
      
      return normalized;
    } catch (error) {
      console.warn('Text normalization failed:', error.message, 'for text:', text.substring(0, 100));
      return text; // Fallback till original text
    }
  }
  
  /**
   * Normaliserar keyword för SEO-analys
   * @param {string} keyword - Raw keyword
   * @returns {string} - Normaliserad keyword
   */
  static normalizeKeyword(keyword) {
    if (!keyword) return '';
    
    const normalized = this.normalizeText(keyword);
    
    // Ytterligare keyword-specifik rensning
    return normalized
      .toLowerCase()
      .replace(/[^\w\såäöÅÄÖ-]/g, '') // Behåll bara bokstäver, siffror, whitespace och svenska tecken
      .trim();
  }
  
  /**
   * Normaliserar URL för konsistent hantering
   * @param {string} url - Raw URL
   * @returns {string} - Normaliserad URL
   */
  static normalizeUrl(url) {
    if (!url) return '';
    
    try {
      // Decode entities i URL
      let normalized = he.decode(url);
      
      // Trim och ta bort onödiga tecken
      normalized = normalized.trim();
      
      return normalized;
    } catch (error) {
      console.warn('URL normalization failed:', error.message);
      return url;
    }
  }
  
  /**
   * Normaliserar meta description/title för SEO
   * @param {string} meta - Raw meta content
   * @returns {string} - Normaliserad meta content
   */
  static normalizeMeta(meta) {
    if (!meta) return '';
    
    const normalized = this.normalizeText(meta);
    
    // Ta bort extra line breaks som kan förstöra meta tags
    return normalized.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');
  }
  
  /**
   * Extraherar och normaliserar keywords från text
   * @param {string} text - Raw text
   * @param {number} minLength - Minimum ord-längd (default: 3)
   * @returns {Array<string>} - Array av normaliserade keywords
   */
  static extractKeywords(text, minLength = 3) {
    if (!text) return [];
    
    const normalized = this.normalizeText(text);
    
    // Dela upp i ord
    const words = normalized
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= minLength)
      .filter(word => /[a-zA-ZåäöÅÄÖ]/.test(word)) // Måste innehålla minst en bokstav
      .map(word => word.replace(/[^\w\såäöÅÄÖ]/g, '')) // Ta bort specialtecken
      .filter(word => word.length >= minLength); // Filter igen efter cleaning
    
    // Ta bort duplikater och returnera
    return [...new Set(words)];
  }
  
  /**
   * Normaliserar alt text för bilder
   * @param {string} altText - Raw alt text
   * @returns {string} - Normaliserad alt text
   */
  static normalizeAltText(altText) {
    if (!altText) return '';
    
    const normalized = this.normalizeText(altText);
    
    // Alt text ska vara beskrivande, inte för lång
    if (normalized.length > 125) {
      return normalized.substring(0, 125).trim() + '...';
    }
    
    return normalized;
  }
  
  /**
   * Normaliserar H1/H2/H3 text
   * @param {string} heading - Raw heading text
   * @returns {string} - Normaliserad heading
   */
  static normalizeHeading(heading) {
    if (!heading) return '';
    
    const normalized = this.normalizeText(heading);
    
    // Headings ska inte ha line breaks
    return normalized.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ');
  }
  
  /**
   * Bulk normalisering av object properties
   * @param {Object} obj - Object med text properties
   * @param {Array<string>} textFields - Fields som ska normaliseras
   * @returns {Object} - Object med normaliserade fields
   */
  static normalizeObject(obj, textFields = []) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const normalized = { ...obj };
    
    textFields.forEach(field => {
      if (normalized[field]) {
        normalized[field] = this.normalizeText(normalized[field]);
      }
    });
    
    return normalized;
  }
  
  /**
   * Validerar om text innehåller svenska tecken
   * @param {string} text - Text att validera
   * @returns {boolean} - True om svenska tecken finns
   */
  static hasSwedishChars(text) {
    if (!text) return false;
    return /[åäöÅÄÖ]/.test(text);
  }
  
  /**
   * Debug-funktion för att se vad som normaliseras
   * @param {string} original - Original text
   * @returns {Object} - Före och efter normalisering
   */
  static debugNormalization(original) {
    return {
      original,
      normalized: this.normalizeText(original),
      hasEntities: /&[a-zA-Z0-9#]+;/.test(original),
      hasSwedish: this.hasSwedishChars(original),
      length: {
        before: original?.length || 0,
        after: this.normalizeText(original).length
      }
    };
  }
}

module.exports = TextNormalizer;