import React from 'react';

const SeoTabSecurity = ({ result }) => {
  if (!result?.security) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon security"></div>
          <div className="card-title">Säkerhetsrubriker</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: Säkerhetsdata kunde inte analyseras
        </p>
      </div>
    );
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon security"></div>
        <div className="card-title">Säkerhetsrubriker</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Poäng</span>
        <span className={`stat-value ${(result.security.score || 0) >= 70 ? 'score-good' : (result.security.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
          {result.security.score || 0}/100 (Grade {result.security.grade || 'N/A'})
        </span>
      </div>
      
      {Object.entries(result.security.details || {}).map(([header, info]) => (
        <div key={header} className="stats-row">
          <span className="stat-label">{header}</span>
          <span className={`stat-value ${info?.present && info?.valid ? 'score-good' : info?.present ? 'score-warning' : 'score-poor'}`}>
            {info?.present ? (info?.valid ? 'Aktiv' : 'Ogiltig') : 'Saknas'}
          </span>
        </div>
      ))}
      
      {Array.isArray(result.security.recommendations) && result.security.recommendations.length > 0 && (
        <div style={{marginTop: '15px'}}>
          <strong>Rekommendationer:</strong>
          {result.security.recommendations.slice(0, 3).map((rec, idx) => (
            <div key={idx} style={{marginTop: '8px'}}>
              <p style={{fontSize: '14px', marginBottom: '4px'}}>{rec?.fix || 'Rekommendation saknas'}</p>
              <div className="copy-snippet">
                <code>{rec?.code || ''}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoTabSecurity;