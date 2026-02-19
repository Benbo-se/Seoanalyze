/**
 * Clean text extraction for SEO analysis
 * Removes JSON-LD, scripts, hidden elements to get only visible content
 */

/**
 * Extract only visible text content for LIX and keyword analysis
 * @param {CheerioAPI} $ - Cheerio loaded HTML
 * @returns {string} Clean visible text
 */
function extractVisibleText($) {
  // 1) Remove non-visible/non-relevant elements
  $('script,style,noscript,template,meta,link,svg,canvas,head,pre code').remove();
  $('script[type="application/ld+json"]').remove();
  $('script#__NEXT_DATA__').remove();
  $('[hidden],[aria-hidden="true"],[role="presentation"]').remove();
  $('.sr-only,.visually-hidden,.hidden,[style*="display:none"],[style*="visibility:hidden"]').remove();

  // 2) Select main content (prioritize main/article, clean nav/footer/aside)
  const root = $('main').length ? $('main') : ($('article').length ? $('article') : $('body'));
  root.find('header,nav,footer,aside').remove();

  // 3) Add space after block-level elements to prevent word concatenation
  const blockElements = 'p,div,h1,h2,h3,h4,h5,h6,li,td,th,section,article,header,footer,nav,aside,main,br';
  root.find(blockElements).each((i, el) => {
    $(el).after(' ');
  });

  // 4) Return normalized text
  return root.text().replace(/\s+/g, ' ').trim();
}

module.exports = {
  extractVisibleText
};