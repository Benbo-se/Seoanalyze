/**
 * URL normalization for crawl analysis
 * Eliminates false duplicates by treating / and root without slash as same page
 */

function normalizeUrl(u) {
  const url = new URL(u);
  url.hash = '';
  if (url.port === '80' || url.port === '443') url.port = '';
  url.pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
  return url.origin + url.pathname;
}

module.exports = {
  normalizeUrl
};