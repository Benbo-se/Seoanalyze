import React from 'react';

const SeoTabDNS = ({ result }) => {
  if (!result || !result.dns) {
    return null;
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon dns"></div>
        <div className="card-title">DNS Säkerhet</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Poäng</span>
        <span className={`stat-value ${result.dns.score >= 70 ? 'score-good' : result.dns.score >= 50 ? 'score-warning' : 'score-poor'}`}>
          {result.dns.score}/100 (Grade {result.dns.grade})
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">SPF Record</span>
        <span className={`stat-value ${result.dns.spf.present && result.dns.spf.valid ? 'score-good' : result.dns.spf.present ? 'score-warning' : 'score-poor'}`}>
          {result.dns.spf.present ? (result.dns.spf.valid ? 'Giltig' : 'Ogiltig') : 'Saknas'}
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">DMARC Record</span>
        <span className={`stat-value ${result.dns.dmarc.present && result.dns.dmarc.valid ? 'score-good' : result.dns.dmarc.present ? 'score-warning' : 'score-poor'}`}>
          {result.dns.dmarc.present ? (result.dns.dmarc.valid ? 'Giltig' : 'Ogiltig') : 'Saknas'}
        </span>
      </div>
      <div className="stats-row">
        <span className="stat-label">MX Records</span>
        <span className={`stat-value ${result.dns.mx.present ? 'score-good' : 'score-poor'}`}>
          {result.dns.mx.present ? `${result.dns.mx.records.length} record(s)` : 'Saknas'}
        </span>
      </div>
      {result.dns.recommendations.length > 0 && (
        <div style={{marginTop: '15px'}}>
          <strong>Rekommendationer:</strong>
          {result.dns.recommendations.slice(0, 2).map((rec, idx) => (
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

export default SeoTabDNS;