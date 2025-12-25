import React from 'react';

const SeoTabMeta = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon breakdown"></div>
        <div className="card-title">Meta Tags Analys</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Title</span>
        <span className="stat-value">{result.title || 'Saknas'}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Title längd</span>
        <span className={`stat-value ${result.title ? (result.title.length >= 30 && result.title.length <= 60 ? 'score-good' : 'score-warning') : ''}`}>
          {result.title ? result.title.length : 0} tecken
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Meta Description</span>
        <span className="stat-value">{result.metaDescription || 'Saknas'}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Description längd</span>
        <span className={`stat-value ${result.metaDescription ? (result.metaDescription.length >= 120 && result.metaDescription.length <= 160 ? 'score-good' : 'score-warning') : ''}`}>
          {result.metaDescription ? result.metaDescription.length : 0} tecken
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Canonical URL</span>
        <span className="stat-value">{result.canonicalUrl || 'Saknas'}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Robots meta</span>
        <span className="stat-value">{result.metaRobots && result.metaRobots !== 'Not specified' ? result.metaRobots : 'Inte angiven'}</span>
      </div>
    </div>
  );
};

export default SeoTabMeta;