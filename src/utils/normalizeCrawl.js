// src/utils/normalizeCrawl.js
// Normaliserar crawl-resultatet till en stabil view-model (vm) som UI:t använder.

function asArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
const isHttpOk = (s) => typeof s === 'number' && s >= 200 && s < 300;
const isHttpLike = u => typeof u === 'string' && /^https?:\/\//i.test(u);
const isBadScheme = u => /^(data:|blob:|mailto:|tel:|javascript:)/i.test(u);
const isHashOnly = u => typeof u === 'string' && u.trim().startsWith('#');

function absolutize(u, origin) {
  if (!u || !origin) return null;
  try {
    const abs = new URL(u, origin).href;
    return isHttpLike(abs) ? abs : null;
  } catch {
    return null;
  }
}

function pickUrl(p) {
  return (
    p?.url || p?.href || p?.pageUrl || p?.link || p?.target || p?.source || null
  );
}
function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function titleOf(p) {
  return p?.title ?? p?.metaTitle ?? p?.documentTitle ?? '';
}
function metaDescOf(p) {
  return p?.metaDescription ?? p?.description ?? '';
}
function linkObjsFromPage(p) {
  const links = asArray(p?.links ?? p?.outbound ?? p?.outboundUrls ?? p?.aTags);
  return links
    .map(l => {
      const href = l?.href ?? l?.url ?? l?.target ?? l;
      if (!href) return null;
      return {
        source: pickUrl(p),
        target: href,
        isInternal: !!(l?.isInternal ?? l?.internal),
        status: l?.status ?? l?.statusCode,
      };
    })
    .filter(Boolean);
}

function buildLinkmapFallback(pages, originHost) {
  const internal = [];
  const external = [];
  for (const p of pages) {
    for (const l of linkObjsFromPage(p)) {
      const t = l.target;
      let kind = 'external';
      try {
        const u = new URL(t, pickUrl(p));
        kind = u.host === originHost ? 'internal' : 'external';
        l.target = u.href;
      } catch {}
      if (kind === 'internal') internal.push({ source: l.source, target: l.target, status: l.status });
      else external.push({ source: l.source, target: l.target, status: l.status });
    }
  }
  // Orphans = sidor utan inkommande interna länkar
  const pagesSet = new Set(pages.map(p => pickUrl(p)));
  const indeg = new Map();
  for (const e of internal) {
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }
  const orphanPages = [...pagesSet].filter(u => (indeg.get(u) ?? 0) === 0).map(u => ({ url: u }));
  return { internalLinks: internal, externalLinks: external, brokenLinks: [], redirectChains: [], orphanPages };
}

export function normalizeCrawl(result) {
  const crawl = result?.crawl ?? result ?? {};
  const url = crawl?.url ?? result?.url ?? crawl?.targetUrl ?? null;
  let originHost = '';
  try { originHost = new URL(url).host; } catch {}

  // pages
  const rawPages = asArray(crawl.pages ?? crawl.pageResults);
  const pages = rawPages.map(p => ({
    url: pickUrl(p),
    status: num(p?.status ?? p?.statusCode ?? 0, 0),
    title: titleOf(p),
    metaDescription: metaDescOf(p),
    h1Count: num(p?.h1Count ?? p?.h1s ?? p?.h1 ?? 0, 0),
    wordCount: num(p?.wordCount ?? p?.words ?? 0, 0),
    pageSize: num(p?.pageSize ?? p?.transferSize ?? p?.size ?? 0, 0),
    images: asArray(p?.images ?? p?.img ?? []).map(i => ({
      url: i?.src ?? i?.url ?? i,
      alt: i?.alt ?? '',
      status: num(i?.status ?? i?.statusCode ?? 0, 0),
      kb: num((i?.bytes ?? i?.size ?? 0) / 1024, 0),
      lcpMs: num(i?.lcpMs ?? i?.lcp ?? 0, 0),
    })),
    links: linkObjsFromPage(p),
    brokenLinks: asArray(p?.brokenLinks),
    brokenImages: asArray(p?.brokenImages),
    noindex: !!(p?.noindex),
    robotsBlocked: !!(p?.robotsBlocked),
    canonical: p?.canonical ?? '',
  })).filter(p => !!p.url);

  // summary & sitemap
  const summary = crawl.summary ?? {};
  const sitemap = (crawl.sitemap ?? crawl.sitemapHealth ?? {});
  const sitemapUrls = asArray(sitemap?.urls ?? sitemap?.allUrls ?? sitemap?.entries).map(u => (typeof u === 'string' ? u : (u?.url || u?.loc))).filter(Boolean);

  // linkmap - bygg kanter från flera källor
  let internalLinks = [];
  let externalLinks = [];
  let brokenLinks = [];
  let redirectChains = [];

  // Helper för att normalisera en kant
  const normalizeEdge = (edge, type = null) => {
    const rawTarget = edge.target || edge.to || edge.targetUrl || edge.href || edge.url;
    
    // Filtrera bort dåliga scheman direkt
    if (isBadScheme(rawTarget) || isHashOnly(rawTarget)) return null;
    
    const source = absolutize(edge.source || edge.from || edge.sourceUrl, url);
    const target = absolutize(rawTarget, url);
    if (!source || !target) return null;
    
    return {
      source,
      target,
      status: num(edge.status || edge.statusCode, 0),
      type: type || edge.type || 'unknown'
    };
  };

  // Deduplicering
  const addEdge = (edges, edge) => {
    if (!edge) {
      console.log('EDGE REJECTED: null/undefined edge');
      return;
    }
    const key = `${edge.source}\n${edge.target}\n${edge.type}\n${edge.status || ''}`;
    if (!edges.keySet) edges.keySet = new Set();
    if (!edges.keySet.has(key)) {
      edges.keySet.add(key);
      edges.push(edge);
      console.log('EDGE ADDED:', edge.type, 'from', edge.source?.slice(0, 30), 'to', edge.target?.slice(0, 30));
    } else {
      console.log('EDGE DUPLICATE:', edge.type);
    }
  };

  // DEBUG: Log what we're receiving
  console.log('NORMALIZE CRAWL INPUT:', JSON.stringify({
    hasLinkmap: !!result?.linkmap,
    hasSummaryLinkmap: !!result?.summary?.linkmap,
    keys: Object.keys(result || {}),
    linkmapKeys: Object.keys(result?.linkmap || {}),
    internalLinksCount: result?.linkmap?.internalLinks?.length || 0
  }, null, 2));

  // 1. Primär källa: result.linkmap (från queue-workers.js enrichedResult)
  const lm0 = result?.linkmap || {};
  console.log('LM0 processing:', {
    internalCount: asArray(lm0.internalLinks).length,
    externalCount: asArray(lm0.externalLinks).length,
    firstInternal: asArray(lm0.internalLinks)[0]
  });
  asArray(lm0.internalLinks).forEach(e => addEdge(internalLinks, normalizeEdge(e, 'internal')));
  asArray(lm0.externalLinks).forEach(e => addEdge(externalLinks, normalizeEdge(e, 'external')));
  asArray(lm0.brokenLinks).forEach(e => addEdge(brokenLinks, normalizeEdge(e, 'broken')));

  // 2. Fallback: result.summary?.linkmap
  const lm1 = result?.summary?.linkmap || {};
  if (internalLinks.length === 0) {
    asArray(lm1.internalLinks).forEach(e => addEdge(internalLinks, normalizeEdge(e, 'internal')));
  }
  if (externalLinks.length === 0) {
    asArray(lm1.externalLinks).forEach(e => addEdge(externalLinks, normalizeEdge(e, 'external')));
  }
  if (brokenLinks.length === 0) {
    asArray(lm1.brokenLinks).forEach(e => addEdge(brokenLinks, normalizeEdge(e, 'broken')));
  }

  // 3. Alternativ: result.crawl?.summary?.linkmap
  const lm2 = crawl?.summary?.linkmap || {};
  if (internalLinks.length === 0) {
    asArray(lm2.internalLinks).forEach(e => addEdge(internalLinks, normalizeEdge(e, 'internal')));
  }
  if (externalLinks.length === 0) {
    asArray(lm2.externalLinks).forEach(e => addEdge(externalLinks, normalizeEdge(e, 'external')));
  }
  if (brokenLinks.length === 0) {
    asArray(lm2.brokenLinks).forEach(e => addEdge(brokenLinks, normalizeEdge(e, 'broken')));
  }

  // 3. Från pages[].links[] - Always try this as fallback
  pages.forEach(page => {
    const pageUrl = page.url;
    asArray(page.links || []).forEach(link => {
      const rawTarget = link.href || link.url || link.target || link;

      // If link is just a string, try to parse it
      if (typeof link === 'string') {
        const target = absolutize(link, url);
        if (target && target !== pageUrl && !isBadScheme(target) && !isHashOnly(target)) {
          // Determine if internal or external
          const isInternal = target.startsWith(url) || target.includes(new URL(url).hostname);
          const edge = { source: pageUrl, target, status: 200, type: isInternal ? 'internal' : 'external' };

          if (isInternal) {
            addEdge(internalLinks, edge);
          } else {
            addEdge(externalLinks, edge);
          }
        }
        return;
      }

      // Filtrera bort dåliga scheman
      if (isBadScheme(rawTarget) || isHashOnly(rawTarget)) return;

      const target = absolutize(rawTarget, url);
      if (!target || target === pageUrl) return;

      // Use various methods to determine if internal
      const isInternalLink = link.isInternal === true ||
                            link.internal === true ||
                            (target.startsWith(url) || target.includes(new URL(url).hostname));

      const edge = { source: pageUrl, target, status: link.status || 200, type: isInternalLink ? 'internal' : 'external' };

      if (isInternalLink) {
        addEdge(internalLinks, edge);
      } else {
        addEdge(externalLinks, edge);
      }

      // Brutna länkar (duplikat om status >= 400)
      if ((link.status || link.statusCode) >= 400) {
        addEdge(brokenLinks, { ...edge, type: 'broken' });
      }
    });
  });

  // 4. Från result.summary?.linkGraph?.edges
  const edges = asArray(result?.summary?.linkGraph?.edges || []);
  if (internalLinks.length === 0 && externalLinks.length === 0 && edges.length > 0) {
    edges.forEach(e => {
      const normalized = normalizeEdge(e);
      if (normalized) {
        // Gissa typ baserat på domän
        try {
          const sourceHost = new URL(normalized.source).host;
          const targetHost = new URL(normalized.target).host;
          const isInternal = sourceHost === targetHost;
          normalized.type = isInternal ? 'internal' : 'external';
          
          if (isInternal) {
            addEdge(internalLinks, normalized);
          } else {
            addEdge(externalLinks, normalized);
          }
        } catch {}
      }
    });
  }

  // Redirects - flera källor
  const redirectSources = [
    result?.linkmap?.redirectChains,
    result?.summary?.linkmap?.redirectChains,
    crawl?.summary?.linkmap?.redirectChains,
    result?.redirectChains,
    result?.links?.redirectChains
  ];

  for (const source of redirectSources) {
    if (redirectChains.length === 0 && source) {
      asArray(source).forEach(chain => {
        const start = absolutize(chain.start, url);
        const end = absolutize(chain.end, url);
        const hops = asArray(chain.hops || []).map(h => absolutize(h, url)).filter(Boolean);
        
        if (start && end) {
          redirectChains.push({
            start,
            hops,
            end,
            finalStatus: chain.finalStatus || chain.status || 200
          });
        }
      });
      break;
    }
  }

  // Rensa keySet från arrays
  delete internalLinks.keySet;
  delete externalLinks.keySet; 
  delete brokenLinks.keySet;

  // Rensa orphanPages - bara http(s) URL:er som strängar
  const rawOrphans = asArray(lm0.orphanPages || lm1.orphanPages || lm2.orphanPages || []);
  const orphanPages = [...new Set(rawOrphans
    .map(o => typeof o === 'string' ? o : o?.url)
    .map(url => absolutize(url, url))
    .filter(url => isHttpLike(url))
  )];

  const linkmap = {
    internalLinks,
    externalLinks,
    brokenLinks,
    redirectChains,
    orphanPages,
    topLinkedPages: asArray(lm0.topLinkedPages || lm1.topLinkedPages || lm2.topLinkedPages),
    linkDistribution: lm0.linkDistribution || lm1.linkDistribution || lm2.linkDistribution || {},
    score: lm0.score || lm1.score || lm2.score || null,
    grade: lm0.grade || lm1.grade || lm2.grade || null,
    sitemapUrls,
  };

  // status buckets
  const statusBuckets = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
  for (const p of pages) {
    const s = p.status;
    if (s >= 200 && s <= 299) statusBuckets['2xx']++;
    else if (s >= 300 && s <= 399) statusBuckets['3xx']++;
    else if (s >= 400 && s <= 499) statusBuckets['4xx']++;
    else if (s >= 500 && s <= 599) statusBuckets['5xx']++;
    else statusBuckets.other++;
  }

  // issues (härledda) - med datarensning
  const missingTitle = pages.filter(p => !p.title?.trim());
  const missingMeta = pages.filter(p => !p.metaDescription?.trim());
  const missingH1 = pages.filter(p => p.h1Count === 0);
  const thinContent = pages.filter(p => p.wordCount > 0 && p.wordCount < 300);
  
  // Rensa brutna länkar (använd linkmap om möjligt, annars pages)
  let issueBrokenLinks = linkmap.brokenLinks.length ? linkmap.brokenLinks : [];
  if (issueBrokenLinks.length === 0) {
    issueBrokenLinks = pages.flatMap(p => 
      asArray(p.brokenLinks || [])
        .map(l => ({ url: l.url || l.src || l, status: l.status || l.statusCode }))
        .filter(l => isHttpLike(l.url))
    );
  }
  
  // Rensa bilder - bara http(s) bilder
  const brokenImages = [...new Set(pages.flatMap(p => 
    asArray(p.brokenImages || [])
      .map(i => ({ url: i.url || i.src || i, status: i.status || i.statusCode }))
      .filter(i => isHttpLike(i.url))
      .map(i => JSON.stringify(i))
  ))].map(s => JSON.parse(s));
  
  const imagesWithoutAlt = [...new Set(pages.flatMap(p => 
    asArray(p.images || [])
      .filter(i => (!i.alt || !i.alt.trim()) && isHttpLike(i.url || i.src))
      .map(i => ({ url: i.url || i.src }))
      .map(i => i.url)
  ))].map(url => ({ url }));

  // indexation (bästa möjliga gissning från feldatan)
  const robotsBlocked = pages.filter(p => p.robotsBlocked);
  const noindex = pages.filter(p => p.noindex);
  const canonicalConflicts = []; // kan beräknas vid behov

  // prestanda/RUM
  const rum = crawl.rum ?? null;

  // error stats & quick actions
  const errorStats = summary?.errorStats ?? null;
  const quickActions = summary?.quickActions ?? crawl?.ruleEngine ?? null;

  // duration & depth
  const durationMs = num(summary?.durationMs ?? crawl?.durationMs ?? crawl?.duration ?? 0, 0);
  const avgDepth = summary?.avgDepth ?? crawl?.avgDepth ?? null;

  // Debug logging för datarensning
  console.debug('NORMALIZED CRAWL DATA', {
    linkmap: {
      internal: linkmap.internalLinks.length,
      external: linkmap.externalLinks.length,  
      broken: linkmap.brokenLinks.length,
      redirects: linkmap.redirectChains.length,
      orphans: linkmap.orphanPages.length
    },
    issues: {
      missingTitle: missingTitle.length,
      missingMeta: missingMeta.length,
      missingH1: missingH1.length,
      thinContent: thinContent.length,
      brokenLinks: issueBrokenLinks.length,
      brokenImages: brokenImages.length,
      imagesWithoutAlt: imagesWithoutAlt.length
    },
    sampleUrls: {
      internal: linkmap.internalLinks.slice(0, 2).map(l => l.target),
      external: linkmap.externalLinks.slice(0, 2).map(l => l.target),
      images: imagesWithoutAlt.slice(0, 2).map(i => i.url)
    }
  });

  // Technical SEO - improved detection
  const sitemapFound = summary?.sitemapFound ||
                       crawl?.sitemapFound ||
                       sitemap?.present ||
                       sitemap?.found ||
                       sitemapUrls.length > 0 ||
                       pages.some(p => p.url?.includes('/sitemap.xml') || p.url?.includes('/sitemap_index.xml'));

  const robotsFound = summary?.robotsFound ||
                      crawl?.robotsFound ||
                      crawl?.robotsTxt?.present ||
                      pages.some(p => p.url?.includes('/robots.txt'));

  const technical = {
    sitemap: {
      present: sitemapFound,
      urls: sitemapUrls,
      urlCount: sitemap?.urlCount || sitemapUrls.length,
      crawledCount: sitemap?.crawledCount || 0,
      missingCount: sitemap?.missingCount || 0,
      isIndex: sitemap?.isIndex || false
    },
    robotsTxt: {
      present: robotsFound
    }
  };

  return {
    url,
    pages,
    statusBuckets,
    sitemap: technical.sitemap,
    robotsTxt: technical.robotsTxt,
    linkmap,
    summary: {
      durationMs,
      avgDepth,
      startTime: summary?.startTime || crawl?.startTime,
      maxDepth: summary?.maxDepth || crawl?.maxDepth,
      concurrency: summary?.concurrency || crawl?.concurrency || 5,
      userAgent: summary?.userAgent || crawl?.userAgent,
      seedUrls: summary?.seedUrls || 1,
      discoveredByLinks: linkmap.internalLinks.length
    },
    technical,
    issues: {
      missingTitle,
      missingMeta,
      missingH1,
      thinContent,
      brokenLinks: issueBrokenLinks,
      brokenImages,
      imagesWithoutAlt,
    },
    indexation: { robotsBlocked, noindex, canonicalConflicts },
    rum,
    errorStats,
    quickActions,
  };
}