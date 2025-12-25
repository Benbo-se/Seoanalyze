import React from 'react';

export default function CrawlSummaryCards({ pages, statusStats, depthAvg, durationMs }) {
  const total = pages.length;
  const errors = statusStats['4xx'] + statusStats['5xx'];
  const warns  = statusStats['3xx'];
  return (
    <div className="card-grid">
      <div className="info-card">
        <div className="card-header"><div className="card-icon stats"></div><div className="card-title">Genomsökning</div></div>
        <div className="stats-row"><span className="stat-label">Sidor genomsökta</span><span className="stat-value">{total}</span></div>
        <div className="stats-row"><span className="stat-label">Fel (4xx/5xx)</span><span className="stat-value">{errors}</span></div>
        <div className="stats-row"><span className="stat-label">Omdirigeringar (3xx)</span><span className="stat-value">{warns}</span></div>
        <div className="stats-row"><span className="stat-label">Genomsnittligt djup</span><span className="stat-value">{depthAvg.toFixed(1)}</span></div>
        <div className="stats-row"><span className="stat-label">Körtid</span><span className="stat-value">{Math.round(durationMs/1000)} s</span></div>
      </div>
      <div className="info-card">
        <div className="card-header"><div className="card-icon security"></div><div className="card-title">Status-fördelning</div></div>
        {['2xx','3xx','4xx','5xx'].map(k=>(
          <div className="stats-row" key={k}>
            <span className="stat-label">{k}</span><span className="stat-value">{statusStats[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}