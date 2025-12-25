// Note: Next.js doesn't have 'he' package by default, need to install or create alternative
// For now, create basic text normalization without external dependency

/**
 * Frontend text normalization utility
 * Hanterar HTML entities, Unicode normalisering och svenska tecken
 */
class TextNormalizer {
  
  /**
   * Normaliserar text för visning i UI
   * @param {string} text - Raw text som kan innehålla entities
   * @returns {string} - Normaliserad, ren text
   */
  static normalizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    try {
      // 1. Basic HTML entity decoding (manual for most common ones)
      let normalized = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&ouml;/g, 'ö')
        .replace(/&aring;/g, 'å')
        .replace(/&auml;/g, 'ä')
        .replace(/&Ouml;/g, 'Ö')
        .replace(/&Aring;/g, 'Å')
        .replace(/&Auml;/g, 'Ä');
      
      // 2. Unicode normalisering (NFC - sammansatta tecken)
      normalized = normalized.normalize('NFC');
      
      // 3. Trim whitespace
      normalized = normalized.trim();
      
      // 4. Ersätt multipla whitespace med single space
      normalized = normalized.replace(/\s+/g, ' ');
      
      return normalized;
    } catch (error) {
      console.warn('Text normalization failed:', error.message);
      return text; // Fallback till original text
    }
  }
  
  /**
   * Normaliserar arrays av text
   * @param {Array} items - Array av strings eller objekt
   * @param {string} textField - Om objekt, vilket fält som innehåller text
   * @returns {Array} - Normaliserad array
   */
  static normalizeArray(items, textField = null) {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => {
      if (typeof item === 'string') {
        return this.normalizeText(item);
      } else if (item && textField && item[textField]) {
        return {
          ...item,
          [textField]: this.normalizeText(item[textField])
        };
      }
      return item;
    });
  }
  
  /**
   * Normaliserar objekt med text-fält
   * @param {Object} obj - Objekt med text-fält
   * @param {Array<string>} fields - Lista av fält att normalisera
   * @returns {Object} - Normaliserat objekt
   */
  static normalizeObject(obj, fields) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const normalized = { ...obj };
    fields.forEach(field => {
      if (normalized[field]) {
        normalized[field] = this.normalizeText(normalized[field]);
      }
    });
    
    return normalized;
  }
}

export default TextNormalizer;