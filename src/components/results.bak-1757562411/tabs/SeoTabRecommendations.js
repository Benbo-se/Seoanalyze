import React from 'react';
import TextNormalizer from '../../../utils/textNormalizer';

const SeoTabRecommendations = ({ result }) => {
  const decodeHtml = (text) => {
    try {
      return TextNormalizer.normalizeText(text || '');
    } catch (error) {
      return text || '';
    }
  };

  if (!result) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon recommendations"></div>
          <div className="card-title">Alla Rekommendationer</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: Rekommendationsdata kunde inte analyseras
        </p>
      </div>
    );
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon recommendations"></div>
        <div className="card-title">Alla Rekommendationer</div>
      </div>
      {Array.isArray(result.recommendations) && result.recommendations.map((rec, index) => (
        <div key={index} className="recommendation-item">
          <div className="recommendation-title">{decodeHtml(rec?.text || rec?.title || 'Rekommendation saknas')}</div>
          <div className="recommendation-impact">{rec?.impact ? rec.impact.toUpperCase() : 'HIGH'} IMPACT</div>
          {rec?.description && (
            <p style={{marginTop: '8px', fontSize: '14px', color: '#92400e'}}>
              {rec.description}
            </p>
          )}
        </div>
      ))}
      {(!result.recommendations || result.recommendations.length === 0) && (
        <p style={{color: '#666', fontSize: '14px'}}>
          Inga specifika rekommendationer just nu. Din webbplats verkar vara väloptimerad!
        </p>
      )}
    </div>
  );
};

export default SeoTabRecommendations;