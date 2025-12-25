/**
 * Swedish tokenization and LIX calculation
 * Handles Swedish abbreviations and stopwords properly
 */

const SV_STOPWORDS = new Set([
  'och','att','det','som','en','i','på','för','är','med','till','av','från','eller','men','om','vi','ni','de','han','hon','den','detta','dessa','ett','samt'
]);

function tokenizeSv(text) {
  const cleaned = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[0-9]+([.,][0-9]+)?/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/g, ' ')
    .replace(/\S+@\S+\.\S+/g, ' ');
  return cleaned.split(/[^a-zåäö\-]+/i).filter(w => w && w.length >= 3 && !SV_STOPWORDS.has(w));
}

function computeLix(text) {
  const SAFE = text.replace(/\b(t\.ex|bl\.a|m\.m|dvs|m\.a\.o)\./gi, m => m.replace('.', '∯'));
  const sentences = SAFE.split(/[.!?;:]+/).map(s => s.replace(/∯/g,'.')).filter(s => s.trim());
  const words = tokenizeSv(text);
  const longWords = words.filter(w => w.replace(/-/g,'').length > 6);
  const lix = (words.length / Math.max(1, sentences.length)) + (longWords.length * 100 / Math.max(1, words.length));
  return { lix: +lix.toFixed(2), words: words.length, sentences: sentences.length, longWords: longWords.length };
}

module.exports = {
  SV_STOPWORDS,
  tokenizeSv,
  computeLix
};