import React from 'react';

const SeoTabContent = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="content-grid">
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon stats"></div>
          <div className="card-title">Innehållsanalys</div>
        </div>
        <div className="stats-row">
          <span className="stat-label">Antal ord</span>
          <span className={`stat-value ${result.wordCount >= 300 ? 'score-good' : 'score-poor'}`}>
            {result.wordCount || 0}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">H1 rubriker</span>
          <span className={`stat-value ${result.headings?.h1?.count === 1 ? 'score-good' : result.headings?.h1?.count > 1 ? 'score-warning' : ''}`}>
            {result.headings?.h1?.count || 0}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">H2 rubriker</span>
          <span className="stat-value">{result.headings?.h2?.count || 0}</span>
        </div>
        <div className="stats-row">
          <span className="stat-label">H3 rubriker</span>
          <span className="stat-value">{result.headings?.h3?.count || 0}</span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Bilder med alt-text</span>
          <span className="stat-value">
            {result.images?.total - result.images?.withoutAlt || 0} av {result.images?.total || 0}
          </span>
        </div>
      </div>

      {result.keywordDensity && result.keywordDensity.length > 0 && (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon focus"></div>
            <div className="card-title">Nyckelordstäthet</div>
          </div>
          {result.keywordDensity.slice(0, 10).map((keyword, index) => (
            <div key={index} className="stats-row">
              <span className="stat-label">{keyword.word}</span>
              <span className="stat-value">{typeof keyword.density === 'number' ? keyword.density.toFixed(1) : keyword.density}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoTabContent;