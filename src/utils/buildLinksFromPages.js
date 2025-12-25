// src/utils/buildLinksFromPages.js
export function buildLinksFromPages(pages = [], origin) {
  const norm = (u) => {
    try { return new URL(u, origin).href; } catch { return null; }
  };
  const host = (() => {
    try { return new URL(origin || pages[0]?.url || pages[0]?.href || '').host; } catch { return ''; }
  })();

  const seen = new Set();
  const edges = [];

  for (const p of pages) {
    const src = norm(p.url || p.href || p.pageUrl);
    if (!src) continue;

    // samla möjliga fält för utgående länkar
    const outs = new Set([
      ...(p.outbound || []),
      ...(p.outboundUrls || []),
      ...(p.links || []),
      ...(p.hrefs || []),
    ].filter(Boolean));

    for (const t of outs) {
      const dst = norm(t);
      if (!dst) continue;
      const key = `${src}>>${dst}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const type = (host && new URL(dst).host === host) ? 'internal' : 'external';
      edges.push({ source: src, target: dst, type, status: undefined });
    }
  }
  return edges;
}