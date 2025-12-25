import React from 'react';

const SeoTabSocial = ({ result }) => {
  if (!result?.social) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon social"></div>
          <div className="card-title">Social Media & Open Graph</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: Social media-data kunde inte analyseras
        </p>
      </div>
    );
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon social"></div>
        <div className="card-title">Social Media & Open Graph</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Poäng</span>
        <span className={`stat-value ${(result.social.score || 0) >= 70 ? 'score-good' : (result.social.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
          {result.social.score || 0}/100 (Grade {result.social.grade || 'N/A'})
        </span>
      </div>
      
      <h4 style={{marginTop: '20px', marginBottom: '10px'}}>Open Graph</h4>
      <div className="stats-row">
        <span className="stat-label">Titel</span>
        <span className="stat-value">{result.social.openGraph?.title || 'Saknas'}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Beskrivning</span>
        <span className="stat-value">{result.social.openGraph?.description || 'Saknas'}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Bild</span>
        <span className={`stat-value ${result.social.openGraph?.image ? 'score-good' : 'score-poor'}`}>
          {result.social.openGraph?.image ? 'Finns' : 'Saknas'}
        </span>
      </div>
      
      <h4 style={{marginTop: '20px', marginBottom: '10px'}}>Twitter Cards</h4>
      <div className="stats-row">
        <span className="stat-label">Card Type</span>
        <span className="stat-value">{result.social.twitterCards?.card || 'Saknas'}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Titel</span>
        <span className="stat-value">{result.social.twitterCards?.title || 'Saknas'}</span>
      </div>
      
      {/* Social Preview */}
      <div style={{marginTop: '20px'}}>
        <h4 style={{marginBottom: '10px'}}>Förhandsvisning</h4>
        <div className="social-preview" style={{border: '1px solid #e1e5e9', borderRadius: '8px', padding: '12px'}}>
          <div style={{fontSize: '16px', fontWeight: 'bold', color: '#1d2129', marginBottom: '4px'}}>
            {result.social.openGraph?.title || result.title || 'Titel saknas'}
          </div>
          <div style={{fontSize: '14px', color: '#606770', marginBottom: '8px', lineHeight: '1.3'}}>
            {(result.social.openGraph?.description || result.metaDescription || 'Beskrivning saknas').substring(0, 160)}
            {(result.social.openGraph?.description || result.metaDescription || '').length > 160 && '...'}
          </div>
          <div style={{fontSize: '12px', color: '#90949c'}}>
            {result.url || 'URL saknas'}
          </div>
          {!result.social.openGraph?.image && (
            <div style={{background: '#f5f6f7', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#8a8d91', marginTop: '8px'}}>
              Ingen bild (1200×630px rekommenderas)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeoTabSocial;