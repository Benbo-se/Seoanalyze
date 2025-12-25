import React from 'react';

export default function CrawlSitemapHealth({ sitemap={}, pages=[] }) {
  const total = Array.isArray(sitemap.urls) ? sitemap.urls.length : 0;
  const in404 = Array.isArray(sitemap.errors) ? sitemap.errors.filter(e=>String(e.status).startsWith('4')).length : 0;
  const in5xx = Array.isArray(sitemap.errors) ? sitemap.errors.filter(e=>String(e.status).startsWith('5')).length : 0;

  return (
    <div className="card-grid">
      <div className="info-card">
        <div className="card-header"><div className="card-icon technical"></div><div className="card-title">Översikt</div></div>
        <div className="stats-row"><span className="stat-label">URLs i sitemap</span><span className="stat-value">{total}</span></div>
        <div className="stats-row"><span className="stat-label">404 i sitemap</span><span className="stat-value">{in404}</span></div>
        <div className="stats-row"><span className="stat-label">5xx i sitemap</span><span className="stat-value">{in5xx}</span></div>
      </div>
      <div className="info-card">
        <div className="card-header"><div className="card-icon link"></div><div className="card-title">Orphan-indikator</div></div>
        <div className="stats-row"><span className="stat-label">Sidor i crawl men inte i sitemap</span><span className="stat-value">{Math.max(0, pages.length - total)}</span></div>
        <p className="muted">Tips: Lägg viktiga sidor i sitemap för bättre täckning.</p>
      </div>
    </div>
  );
}