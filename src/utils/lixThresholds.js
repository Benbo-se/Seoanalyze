/**
 * Centrala LIX-trösklar för konsistent användning i UI, PDF och beräkningar
 * Fryst efter 90-dagars implementation (2025-08-22)
 */

const LIX_THRESHOLDS = {
  VERY_EASY: 30,    // ≤ 30
  EASY: 40,         // 31-40  
  MEDIUM: 50,       // 41-50
  HARD: 60,         // 51-60
  VERY_HARD: Infinity // > 60
};

const LIX_CATEGORIES = {
  VERY_EASY: {
    threshold: LIX_THRESHOLDS.VERY_EASY,
    emoji: '🏆',
    textBadge: 'Mycket lätt',
    level: 'Barnbok',
    cssClass: 'badge-excellent',
    description: 'Texten är mycket lättläst, lämplig för barn och nybörjare'
  },
  EASY: {
    threshold: LIX_THRESHOLDS.EASY,
    emoji: '🌟',
    textBadge: 'Lätt',
    level: 'Skönlitteratur',
    cssClass: 'badge-good',
    description: 'Texten är lättläst, typisk för skönlitteratur och populärpress'
  },
  MEDIUM: {
    threshold: LIX_THRESHOLDS.MEDIUM,
    emoji: '✅',
    textBadge: 'Medel',
    level: 'Normaltext',
    cssClass: 'badge-medium',
    description: 'Normal svårighetsgrad, lämplig för bred publik'
  },
  HARD: {
    threshold: LIX_THRESHOLDS.HARD,
    emoji: '⚠️',
    textBadge: 'Svår',
    level: 'Facktext',
    cssClass: 'badge-hard',
    description: 'Texten är svårläst, typisk för facktexter och myndigheter'
  },
  VERY_HARD: {
    threshold: LIX_THRESHOLDS.VERY_HARD,
    emoji: '❌',
    textBadge: 'Mycket svår',
    level: 'Vetenskaplig text',
    cssClass: 'badge-very-hard',
    description: 'Texten är mycket svårläst, typisk för juridiska och vetenskapliga texter'
  }
};

/**
 * Få LIX-kategori baserat på LIX-värde
 * @param {number} lix - LIX-värde
 * @returns {Object} LIX-kategori med emoji, textBadge, level, etc.
 */
function getLixCategory(lix) {
  // Edge case: Ingen giltig text
  if (!lix || lix === 0 || !isFinite(lix)) {
    return {
      threshold: 0,
      emoji: 'ℹ️',
      textBadge: 'Info',
      level: 'Ej tillräcklig text',
      cssClass: 'badge-info',
      description: 'För lite text för tillförlitlig LIX-beräkning'
    };
  }

  if (lix <= LIX_THRESHOLDS.VERY_EASY) return LIX_CATEGORIES.VERY_EASY;
  if (lix <= LIX_THRESHOLDS.EASY) return LIX_CATEGORIES.EASY;
  if (lix <= LIX_THRESHOLDS.MEDIUM) return LIX_CATEGORIES.MEDIUM;
  if (lix <= LIX_THRESHOLDS.HARD) return LIX_CATEGORIES.HARD;
  return LIX_CATEGORIES.VERY_HARD;
}

/**
 * Beräkna LIX-bidrag till Content-pelaren (max ±5p)
 * @param {number} lix - LIX-värde
 * @returns {number} Poäng-påverkan (-5 till +5)
 */
function calculateLixContentContribution(lix) {
  if (!lix || !isFinite(lix)) return 0;
  
  const optimalLix = 45; // Optimal för svensk webbtext
  const deviation = Math.abs(lix - optimalLix);
  
  // Max ±5 poäng påverkan
  const impact = Math.max(-5, Math.min(5, 5 - (deviation / 5)));
  return Math.round(impact * 10) / 10; // Avrunda till 1 decimal
}

/**
 * Kontrollera om LIX genererar actionable recommendations
 * @param {number} lix - LIX-värde
 * @returns {boolean} True om LIX >50 (kräver åtgärd)
 */
function requiresLixAction(lix) {
  return lix && isFinite(lix) && lix > 50;
}

/**
 * PDF-vänlig formatering (fallback för gradients/emojis)
 * @param {Object} category - LIX-kategori
 * @returns {Object} PDF-anpassad kategori
 */
function getPdfFriendlyCategory(category) {
  return {
    ...category,
    emoji: `[${category.textBadge}]`, // Text fallback för PDF
    cssClass: category.cssClass.replace('badge-', 'pdf-badge-')
  };
}

module.exports = {
  LIX_THRESHOLDS,
  LIX_CATEGORIES,
  getLixCategory,
  calculateLixContentContribution,
  requiresLixAction,
  getPdfFriendlyCategory
};