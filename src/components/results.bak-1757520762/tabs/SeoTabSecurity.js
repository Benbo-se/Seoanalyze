import React from 'react';

const SeoTabSecurity = ({ result }) => {
  if (!result || !result.security) {
    return null;
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon security"></div>
        <div className="card-title">Säkerhetsrubriker</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Poäng</span>
        <span className={`stat-value ${result.security.score >= 70 ? 'score-good' : result.security.score >= 50 ? 'score-warning' : 'score-poor'}`}>
          {result.security.score}/100 (Grade {result.security.grade})
        </span>
      </div>
      
      {Object.entries(result.security.details || {}).map(([header, info]) => (
        <div key={header} className="stats-row">
          <span className="stat-label">{header}</span>
          <span className={`stat-value ${info.present && info.valid ? 'score-good' : info.present ? 'score-warning' : 'score-poor'}`}>
            {info.present ? (info.valid ? 'Aktiv' : 'Ogiltig') : 'Saknas'}
          </span>
        </div>
      ))}
      
      {result.security.recommendations.length > 0 && (
        <div style={{marginTop: '15px'}}>
          <strong>Rekommendationer:</strong>
          {result.security.recommendations.slice(0, 3).map((rec, idx) => (
            <div key={idx} style={{marginTop: '8px'}}>
              <p style={{fontSize: '14px', marginBottom: '4px'}}>{rec.fix}</p>
              <div className="copy-snippet">
                <code>{rec.code}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeoTabSecurity;