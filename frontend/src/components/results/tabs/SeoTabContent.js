import React from 'react';
import { formatWordCount } from '../../../utils/formatNumber';
import SmartTable from '../../common/SmartTable';

const SeoTabContent = ({ result }) => {
  if (!result) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon stats"></div>
          <div className="card-title">Innehållsanalys</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: Innehållsdata kunde inte analyseras
        </p>
      </div>
    );
  }

  // Prepare image data for detailed analysis
  const imagesWithoutAlt = result.images?.details?.filter(img => !img.alt || img.alt === '') || [];
  const oversizedImages = result.images?.details?.filter(img => img.width && img.height && (img.width > 1920 || img.height > 1080)) || [];

  const imageRows = imagesWithoutAlt.map((img, i) => ({
    id: `img-${i}`,
    url: img.src || img.url || 'Okänd URL',
    alt: img.alt || 'Saknas',
    width: img.width || 'Okänd',
    height: img.height || 'Okänd',
    loading: img.loading || 'Ej specificerad',
    format: img.src ? img.src.split('.').pop()?.toLowerCase() : 'okänd'
  }));

  return (
    <div className="card-grid">
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon stats"></div>
          <div className="card-title">Innehållsanalys</div>
        </div>
        <div className="stats-row">
          <span className="stat-label">Antal ord</span>
          <span className={`stat-value ${(result.wordCount || 0) >= 300 ? 'score-good' : 'score-poor'}`}>
            {formatWordCount(result.wordCount)}
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
            {Math.max(0, (result.images?.total || 0) - (result.images?.withoutAlt || 0))} av {result.images?.total || 0}
          </span>
        </div>
      </div>

      {Array.isArray(result.keywordDensity) && result.keywordDensity.length > 0 ? (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon focus"></div>
            <div className="card-title">Nyckelordstäthet</div>
          </div>
          {result.keywordDensity.slice(0, 10).map((keyword, index) => (
            <div key={keyword?.word || index} className="stats-row">
              <span className="stat-label">{keyword?.word || 'N/A'}</span>
              <span className="stat-value">{keyword?.density ? parseFloat(keyword.density).toFixed(1) : '0'}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon focus"></div>
            <div className="card-title">Nyckelordstäthet</div>
          </div>
          <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
            Saknas: Ingen nyckelordstäthet kunde analyseras
          </p>
        </div>
      )}

    </div>
  );
};

export default SeoTabContent;