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
      {Array.isArray(result.recommendations) && result.recommendations.map((rec, index) => {
        // Handle different recommendation formats
        const recText = typeof rec === 'string' ? rec :
                       rec?.text || rec?.title ||
                       (typeof rec?.issue === 'string' ? rec.issue : (rec?.issue?.issue || rec?.issue?.title)) ||
                       rec?.message || 'Rekommendation saknas';
        const recDescription = rec?.description ||
                               (typeof rec?.fix === 'string' ? rec.fix : (rec?.fix?.description || rec?.fix?.text)) ||
                               null;
        const impact = rec?.impact || rec?.priority || 'HIGH';

        return (
          <div key={index} className="recommendation-item">
            <div className="recommendation-title">{decodeHtml(recText)}</div>
            <div className="recommendation-impact">{typeof impact === 'string' ? impact.toUpperCase() : 'HIGH'} IMPACT</div>
            {recDescription && (
              <p style={{marginTop: '8px', fontSize: '14px', color: '#92400e'}}>
                {typeof recDescription === 'string' ? recDescription :
                 typeof recDescription === 'object' ? JSON.stringify(recDescription) :
                 String(recDescription)}
              </p>
            )}
          </div>
        );
      })}
      {(!result.recommendations || result.recommendations.length === 0) && (
        <p style={{color: '#666', fontSize: '14px'}}>
          Inga specifika rekommendationer just nu. Din webbplats verkar vara väloptimerad!
        </p>
      )}
    </div>
  );
};

export default SeoTabRecommendations;