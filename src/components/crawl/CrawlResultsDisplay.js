'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { normalizeCrawl } from '../../utils/normalizeCrawl';
import LinkGraph from './parts/LinkGraph';
import PaginatedTable from '../common/PaginatedTable';

const fmtNum = (n) => {
  if (n == null) return '—';
  try {
    return new Intl.NumberFormat('sv-SE').format(n);
  } catch { return String(n); }
};
const fmtMs = (ms) => {
  if (!ms) return '—';
  if (ms < 1000) return `${fmtNum(ms)} ms`;
  return `${(ms/1000).toFixed(1).replace('.', ',')} s`;
};

function Section({ id, title, children }) {
  return (
    <section id={id} className="result-section">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

// Helper för att rendera URL som länk
const renderUrl = (url) => {
  if (!url) return '—';
  const displayUrl = url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 80);
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
      {displayUrl}
    </a>
  );
};

export default function CrawlResultsDisplay({ result }) {
  const vm = useMemo(() => normalizeCrawl(result), [result]);

  const [onlyData, setOnlyData] = useState(true);
  const show = (rows) => !onlyData || (Array.isArray(rows) && rows.length > 0);

  useEffect(() => {
    // Markera aktuell sektion i nav (samma som SEO-sidan)
    const sections = Array.from(document.querySelectorAll('.result-section[id]'));
    const links = Array.from(document.querySelectorAll('.section-nav .nav-link'));
    const map = new Map(sections.map(s => [s.id, links.find(l => l.getAttribute('href') === `#${s.id}`)]));
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const link = map.get(e.target.id);
        if (!link) return;
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // Scrolla till hash på initial load så offset respekteras
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.location.hash?.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  // Lägg fade-hint i kanterna när raden är horisontellt scrollbar
  useEffect(() => {
    const nav = document.querySelector('.section-nav.section-nav--row');
    const inner = document.querySelector('.section-nav .nav-inner--row');
    if (!nav || !inner) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = inner;
      nav.classList.toggle('has-left-fade', scrollLeft > 1);
      nav.classList.toggle('has-right-fade', scrollLeft + clientWidth < scrollWidth - 1);
    };
    update();
    inner.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      inner.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const { url, pages, statusBuckets, linkmap, sitemap, issues, indexation, summary, rum, errorStats, quickActions } = vm;

  // Förbered alla rader en gång
  const rows = useMemo(() => {
    return {
      missingTitle: issues.missingTitle.map(p => ({ url: p.url })),
      missingMeta: issues.missingMeta.map(p => ({ url: p.url })),
      missingH1: issues.missingH1.map(p => ({ url: p.url })),
      thinContent: issues.thinContent.map(p => ({ url: p.url, ord: p.wordCount })),
      brokenLinks: issues.brokenLinks.map(b => ({
        source: b.source, target: b.target, status: b.status ?? b.statusCode
      })),
      brokenImages: issues.brokenImages.map(x => ({ url: x.url ?? x.src, status: x.status ?? x.statusCode })),
      imagesWithoutAlt: issues.imagesWithoutAlt.map(x => ({ url: x.url })),
      rowsOrphans: linkmap.orphanPages.map(url => ({ url: typeof url === 'string' ? url : url.url })),
      rowsLmBroken: linkmap.brokenLinks.map(b => ({
        source: b.source, target: b.target, status: b.status ?? b.statusCode
      })),
      rowsRedirects: linkmap.redirectChains.map(c => ({
        start: c.start, 
        hops: (Array.isArray(c.hops) ? c.hops.length : (c.hops ?? 0)), 
        finalStatus: c.finalStatus ?? c.status
      })),
      rowsLargeImages: pages.flatMap(p => (p.images||[]).filter(i => i.kb >= 150)).map(i => ({ url: i.url, kb: Math.round(i.kb) })),
      rowsSlowImages: pages.flatMap(p => (p.images||[]).filter(i => i.lcpMs > 0)).map(i => ({ url: i.url, lcpMs: i.lcpMs })),
      rowsNoAlt: issues.imagesWithoutAlt.map(x => ({ url: x.url }))
    };
  }, [issues, linkmap, pages]);

  // Sektionsflags
  const hasIssues = rows.missingTitle.length + rows.missingMeta.length + rows.missingH1.length + 
                   rows.thinContent.length + rows.brokenLinks.length + rows.brokenImages.length + 
                   rows.imagesWithoutAlt.length > 0;
  const hasSitemap = sitemap.urls.length > 0 || rows.rowsOrphans.length > 0;
  const hasLinks = (linkmap.internalLinks.length + linkmap.externalLinks.length + linkmap.brokenLinks.length + linkmap.redirectChains.length) > 0;
  const hasImages = rows.rowsNoAlt.length + rows.rowsLargeImages.length + rows.rowsSlowImages.length > 0;

  const totals = [
    { label: 'Sidor', value: pages.length },
    { label: '2xx', value: statusBuckets['2xx'] },
    { label: '3xx', value: statusBuckets['3xx'] },
    { label: '4xx', value: statusBuckets['4xx'] },
    { label: '5xx', value: statusBuckets['5xx'] },
    { label: 'Interna länkar', value: linkmap.internalLinks.length },
    { label: 'Externa länkar', value: linkmap.externalLinks.length },
    { label: 'Brutna', value: linkmap.brokenLinks.length },
    { label: 'Kedjor', value: linkmap.redirectChains.length },
    { label: 'Orphan-sidor', value: linkmap.orphanPages.length },
    { label: 'Snittdjup', value: summary.avgDepth ?? '—' },
    { label: 'Körtid', value: fmtMs(summary.durationMs) },
  ];

  return (
    <div className="results-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Crawl-resultat</h1>
        <p className="page-subtitle">Genomsökning av {url ?? '—'}</p>
      </div>

      {/* Sticky nav – horisontell rad */}
      <nav className="section-nav section-nav--row">
        <div className="nav-inner nav-inner--row">
          <a href="#overview" className="nav-link">Översikt</a>
          <a href="#issues" className="nav-link">Fel & varningar</a>
          <a href="#sitemap" className="nav-link">Sitemap-hälsa</a>
          <a href="#links" className="nav-link">Länkar & kedjor</a>
          <a href="#indexing" className="nav-link">Indexering</a>
          <a href="#images" className="nav-link">Bilder</a>
          {rum && <a href="#performance" className="nav-link">Prestanda</a>}
          {quickActions && <a href="#actions" className="nav-link">Rekommendationer</a>}
          {errorStats && <a href="#errors" className="nav-link">Felstatistik</a>}
        </div>
      </nav>

      {/* Toolbar för filtrering */}
      <div className="filter-toolbar">
        <label className="filter-checkbox">
          <input 
            type="checkbox" 
            checked={onlyData} 
            onChange={(e) => setOnlyData(e.target.checked)} 
          />
          <span>Visa endast med data</span>
        </label>
      </div>

      {/* Översikt */}
      <Section id="overview" title="Översikt">
        <div className="card-grid">
          {totals.map((t, i) => (
            <div className="info-card" key={i}>
              <div className="card-header"><div className="card-title">{t.label}</div></div>
              <div className="stats-row">
                <span className="stat-label"></span>
                <span className="stat-value">{typeof t.value === 'number' ? fmtNum(t.value) : t.value}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Fel & varningar */}
      {(!onlyData || hasIssues) && (
        <Section id="issues" title="Fel & varningar">
          <div className="card-grid">
            {show(rows.missingTitle) && (
              <PaginatedTable
                title="Saknar titel"
                rows={rows.missingTitle}
                columns={[{key:'url', title:'Sida', render: renderUrl}]}
                csvFilename="missing-titles.csv"
                initialLimit={50}
              />
            )}
            {show(rows.missingMeta) && (
              <PaginatedTable
                title="Saknar meta-beskrivning"
                rows={rows.missingMeta}
                columns={[{key:'url', title:'Sida', render: renderUrl}]}
                csvFilename="missing-meta-descriptions.csv"
                initialLimit={50}
              />
            )}
            {show(rows.missingH1) && (
              <PaginatedTable
                title="Saknar H1"
                rows={rows.missingH1}
                columns={[{key:'url', title:'Sida', render: renderUrl}]}
                csvFilename="missing-h1.csv"
                initialLimit={50}
              />
            )}
            {show(rows.thinContent) && (
              <PaginatedTable
                title="Tunt innehåll (<300 ord)"
                rows={rows.thinContent}
                columns={[
                  {key:'url', title:'Sida', render: renderUrl}, 
                  {key:'ord', title:'Ord', right:true}
                ]}
                csvFilename="thin-content.csv"
                initialLimit={50}
              />
            )}
            {show(rows.brokenLinks) && (
              <PaginatedTable
                title="Brutna länkar"
                rows={rows.brokenLinks}
                columns={[
                  {key:'source', title:'Källa', render: renderUrl},
                  {key:'target', title:'Mål', render: renderUrl},
                  {key:'status', title:'Status', right:true},
                ]}
                csvFilename="broken-links.csv"
                initialLimit={50}
              />
            )}
            {show(rows.brokenImages) && (
              <PaginatedTable
                title="Brutna bilder"
                rows={rows.brokenImages}
                columns={[
                  {key:'url', title:'Bild', render: renderUrl}, 
                  {key:'status', title:'Status', right:true}
                ]}
                csvFilename="broken-images.csv"
                initialLimit={50}
              />
            )}
            {show(rows.imagesWithoutAlt) && (
              <PaginatedTable
                title="Bilder utan alt-text"
                rows={rows.imagesWithoutAlt}
                columns={[{key:'url', title:'Bild', render: renderUrl}]}
                csvFilename="images-missing-alt.csv"
                initialLimit={50}
              />
            )}
          </div>
        </Section>
      )}

      {/* Sitemap-hälsa */}
      {(!onlyData || hasSitemap) && (
        <Section id="sitemap" title="Sitemap-hälsa">
          <div className="card-grid">
            <div className="info-card">
              <div className="card-header"><div className="card-title">Översikt</div></div>
              <div className="stats-row"><span className="stat-label">URL:er i sitemap</span><span className="stat-value">{fmtNum(sitemap.urls.length)}</span></div>
              <div className="stats-row"><span className="stat-label">Orphan-sidor</span><span className="stat-value">{fmtNum(linkmap.orphanPages.length)}</span></div>
            </div>
            {show(rows.rowsOrphans) && (
              <PaginatedTable
                title="Orphan-sidor"
                rows={rows.rowsOrphans}
                columns={[{key:'url', title:'Sida', render: renderUrl}]}
                csvFilename="orphan-pages.csv"
                initialLimit={50}
              />
            )}
          </div>
        </Section>
      )}

      {/* Länkar & kedjor */}
      {(!onlyData || hasLinks) && (
        <Section id="links" title="Länkar & kedjor">
          {(linkmap.internalLinks.length + linkmap.externalLinks.length + linkmap.brokenLinks.length + linkmap.redirectChains.length) > 0 && (
            <LinkGraph
              internal={linkmap.internalLinks}
              outbound={linkmap.externalLinks}
              broken={linkmap.brokenLinks}
              redirects={linkmap.redirectChains}
              pages={pages}
              sitemapUrls={linkmap.sitemapUrls ?? sitemap.urls}
              origin={url}
            />
          )}

          <div className="card-grid">
            {show(rows.rowsLmBroken) && (
              <PaginatedTable
                title="Brutna länkar"
                rows={rows.rowsLmBroken}
                columns={[
                  {key:'source', title:'Källa', render: renderUrl},
                  {key:'target', title:'Mål', render: renderUrl},
                  {key:'status', title:'Status', right:true},
                ]}
                csvFilename="broken-links-linkmap.csv"
                initialLimit={50}
              />
            )}
            {show(rows.rowsRedirects) && (
              <PaginatedTable
                title="Omdirigeringskedjor"
                rows={rows.rowsRedirects}
                columns={[
                  {key:'start', title:'Start', render: renderUrl},
                  {key:'hops', title:'Hopp', right:true},
                  {key:'finalStatus', title:'Slutstatus', right:true},
                ]}
                csvFilename="redirect-chains.csv"
                initialLimit={50}
              />
            )}
          </div>
        </Section>
      )}

      {/* Indexering */}
      {(!onlyData || (indexation.robotsBlocked.length + indexation.noindex.length + indexation.canonicalConflicts.length) > 0) && (
        <Section id="indexing" title="Indexering">
          <div className="card-grid">
            <div className="info-card">
              <div className="card-header"><div className="card-title">Robots/Meta</div></div>
              <div className="stats-row"><span className="stat-label">Blockerad av robots.txt</span><span className="stat-value">{fmtNum(indexation.robotsBlocked.length)}</span></div>
              <div className="stats-row"><span className="stat-label">Noindex</span><span className="stat-value">{fmtNum(indexation.noindex.length)}</span></div>
              <div className="stats-row"><span className="stat-label">Kanoniska konflikter</span><span className="stat-value">{fmtNum(indexation.canonicalConflicts.length)}</span></div>
            </div>
          </div>
        </Section>
      )}

      {/* Bilder */}
      {(!onlyData || hasImages) && (
        <Section id="images" title="Bilder">
          <div className="card-grid">
            {show(rows.rowsNoAlt) && (
              <PaginatedTable
                title="Saknar alt-text"
                rows={rows.rowsNoAlt}
                columns={[{key:'url', title:'Bild', render: renderUrl}]}
                csvFilename="images-no-alt-detailed.csv"
                initialLimit={50}
              />
            )}
            {show(rows.rowsLargeImages) && (
              <PaginatedTable
                title="Stora bilder"
                rows={rows.rowsLargeImages}
                columns={[
                  {key:'url', title:'Bild', render: renderUrl}, 
                  {key:'kb', title:'KB', right:true}
                ]}
                csvFilename="large-images.csv"
                initialLimit={50}
              />
            )}
            {show(rows.rowsSlowImages) && (
              <PaginatedTable
                title="Långsam inläsning"
                rows={rows.rowsSlowImages}
                columns={[
                  {key:'url', title:'Resurs', render: renderUrl}, 
                  {key:'lcpMs', title:'LCP (ms)', right:true}
                ]}
                csvFilename="slow-loading-images.csv"
                initialLimit={50}
              />
            )}
          </div>
        </Section>
      )}

      {/* Prestanda (valfritt) */}
      {rum && (
        <Section id="performance" title="Prestanda (RUM)">
          <div className="card-grid">
            <div className="info-card">
              <div className="card-header"><div className="card-title">p75</div></div>
              <div className="stats-row"><span className="stat-label">LCP</span><span className="stat-value">{fmtNum(rum.lcp_p75)} ms</span></div>
              <div className="stats-row"><span className="stat-label">CLS</span><span className="stat-value">{rum.cls_p75 ?? '—'}</span></div>
              <div className="stats-row"><span className="stat-label">INP</span><span className="stat-value">{fmtNum(rum.inp_p75)} ms</span></div>
              <div className="stats-row"><span className="stat-label">Antal mätningar</span><span className="stat-value">{fmtNum(rum.samples)}</span></div>
            </div>
          </div>
        </Section>
      )}

      {/* Rekommendationer (valfritt) */}
      {quickActions && Array.isArray(quickActions) && quickActions.length > 0 && (
        <Section id="actions" title="Rekommendationer">
          <div className="info-card">
            <ul>
              {quickActions.slice(0,5).map((a, i) => (
                <li key={i}>{a.title ?? a.message ?? a}</li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* Felstatistik (valfritt) */}
      {errorStats && (
        <Section id="errors" title="Felstatistik">
          <div className="info-card">
            <div className="stats-row"><span className="stat-label">Totala förfrågningar</span><span className="stat-value">{fmtNum(errorStats.totalRequests)}</span></div>
            <div className="stats-row"><span className="stat-label">Totala fel</span><span className="stat-value">{fmtNum(errorStats.totalErrors)}</span></div>
            <div className="stats-row"><span className="stat-label">Lyckandefrekvens</span><span className="stat-value">{errorStats.successRate != null ? `${errorStats.successRate}%` : '—'}</span></div>
          </div>
        </Section>
      )}
    </div>
  );
}