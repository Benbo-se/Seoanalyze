import React from 'react';

const SeoTabDNS = ({ result }) => {
  if (!result?.dns) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon dns"></div>
          <div className="card-title">DNS Säkerhet</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: DNS-säkerhetsdata kunde inte analyseras
        </p>
      </div>
    );
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon dns"></div>
        <div className="card-title">DNS Säkerhet</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Poäng</span>
        <span className={`stat-value ${(result.dns.score || 0) >= 70 ? 'score-good' : (result.dns.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
          Betyg: {result.dns.grade || 'N/A'} ({result.dns.score || 0}/100)
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">SPF-post</span>
        <span className={`stat-value ${result.dns.spf?.present && result.dns.spf?.valid ? 'score-good' : result.dns.spf?.present ? 'score-warning' : 'score-poor'}`}>
          {result.dns.spf?.present ? (result.dns.spf?.valid ? 'Giltig' : 'Ogiltig') : 'Saknas'}
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">DMARC-policy</span>
        <span className={`stat-value ${result.dns.dmarc?.present && result.dns.dmarc?.valid ? 'score-good' : result.dns.dmarc?.present ? 'score-warning' : 'score-poor'}`}>
          {result.dns.dmarc?.present ? (result.dns.dmarc?.valid ? 'Giltig' : 'Ogiltig') : 'Saknas'}
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">MX-poster</span>
        <span className={`stat-value ${result.dns.mx?.present ? 'score-good' : 'score-poor'}`}>
          {result.dns.mx?.present ? `${result.dns.mx?.records?.length || 0} record(s)` : 'Saknas'}
        </span>
      </div>
      {Array.isArray(result.dns.recommendations) && result.dns.recommendations.length > 0 && (
        <div style={{marginTop: '15px'}}>
          <strong>Rekommendationer:</strong>
          {result.dns.recommendations.slice(0, 2).map((rec, idx) => (
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

export default SeoTabDNS;