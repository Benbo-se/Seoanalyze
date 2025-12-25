import React from 'react';

const SeoTabSchema = ({ result }) => {
  if (!result?.schema) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon schema"></div>
          <div className="card-title">Schema.org Strukturerad Data</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: Schema.org-data kunde inte analyseras
        </p>
      </div>
    );
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon schema"></div>
        <div className="card-title">Schema.org Strukturerad Data</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Poäng</span>
        <span className={`stat-value ${(result.schema.score || 0) >= 70 ? 'score-good' : (result.schema.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
          {result.schema.score || 0}/100 (Grade {result.schema.grade || 'N/A'})
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Schema-typer</span>
        <span className="stat-value">
          {Array.isArray(result.schema.types) && result.schema.types.length > 0 ? result.schema.types.join(', ') : 'Inga'}
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Giltiga scheman</span>
        <span className={`stat-value ${Array.isArray(result.schema.schemas) && result.schema.schemas.filter(s => s?.valid).length > 0 ? 'score-good' : 'score-poor'}`}>
          {Array.isArray(result.schema.schemas) ? result.schema.schemas.filter(s => s?.valid).length : 0} av {Array.isArray(result.schema.schemas) ? result.schema.schemas.length : 0}
        </span>
      </div>
      {Array.isArray(result.schema.issues) && result.schema.issues.length > 0 && (
        <div style={{marginTop: '15px'}}>
          <strong>Issues:</strong>
          <p style={{color: '#dc2626', fontSize: '14px', marginTop: '5px'}}>
            {result.schema.issues.slice(0, 2).join(', ')}
            {result.schema.issues.length > 2 && ` +${result.schema.issues.length - 2} more`}
          </p>
        </div>
      )}
      {Array.isArray(result.schema.recommendations) && result.schema.recommendations.length > 0 && (
        <div style={{marginTop: '15px'}}>
          <strong>Rekommendationer:</strong>
          {result.schema.recommendations.slice(0, 2).map((rec, idx) => (
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

export default SeoTabSchema;