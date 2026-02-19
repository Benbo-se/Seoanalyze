import React from 'react';
import { svStatus } from '../../../utils/svStatus';
import { formatInt } from '../../../utils/formatNumber';

const SeoTabTechnical = ({ result }) => {
  if (!result) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon stats"></div>
          <div className="card-title">Teknisk SEO</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: Teknisk SEO-data kunde inte analyseras
        </p>
      </div>
    );
  }

  return (
    <div className="card-grid">
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon stats"></div>
          <div className="card-title">Teknisk SEO</div>
        </div>
        <div className="stats-row">
          <span className="stat-label">HTTPS</span>
          <span className={`stat-value ${result.technical?.https ? 'score-good' : 'score-poor'}`}>
            {result.technical?.https ? 'Ja' : 'Nej'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Mobilanpassad</span>
          <span className={`stat-value ${result.mobile?.hasViewport ? 'score-good' : 'score-poor'}`}>
            {result.mobile?.hasViewport ? 'Ja' : 'Nej'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Viewport meta tag</span>
          <span className={`stat-value ${result.viewport ? 'score-good' : 'score-poor'}`}>
            {result.viewport ? 'Ja' : 'Nej'}
          </span>
        </div>
        {/* Status indicators with links to detailed sections */}
        {result.security && (
          <div className="stats-row">
            <span className="stat-label">Säkerhet</span>
            <span className={`stat-value ${(result.security.score || 0) >= 70 ? 'score-good' : (result.security.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.security.grade || 'F'} ({result.security.score || 0}/100)
              <a href="#security" style={{marginLeft: '8px', fontSize: '14px'}}>→ Visa detaljer</a>
            </span>
          </div>
        )}
        {result.dns && (
          <div className="stats-row">
            <span className="stat-label">DNS & e-postsäkerhet</span>
            <span className={`stat-value ${(result.dns.score || 0) >= 70 ? 'score-good' : (result.dns.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.dns.grade || 'F'} ({result.dns.score || 0}/100)
              <a href="#dns" style={{marginLeft: '8px', fontSize: '14px'}}>→ Visa detaljer</a>
            </span>
          </div>
        )}
        {result.schema ? (
          <div className="stats-row">
            <span className="stat-label">Schema.org</span>
            <span className={`stat-value ${(result.schema.score || 0) >= 70 ? 'score-good' : (result.schema.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.schema.grade || 'F'} ({result.schema.score || 0}/100)
              <a href="#schema" style={{marginLeft: '8px', fontSize: '14px'}}>→ Visa detaljer</a>
            </span>
          </div>
        ) : (
          <div className="stats-row">
            <span className="stat-label">Schema.org</span>
            <span className="stat-value score-poor">
              ✗ Saknas
              <a href="#schema" style={{marginLeft: '8px', fontSize: '14px'}}>→ Visa detaljer</a>
            </span>
          </div>
        )}
        {result.social ? (
          <div className="stats-row">
            <span className="stat-label">Sociala medier</span>
            <span className={`stat-value ${(result.social.score || 0) >= 70 ? 'score-good' : (result.social.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.social.grade || 'F'} ({result.social.score || 0}/100)
              <a href="#social" style={{marginLeft: '8px', fontSize: '14px'}}>→ Visa detaljer</a>
            </span>
          </div>
        ) : (
          <div className="stats-row">
            <span className="stat-label">Sociala medier</span>
            <span className="stat-value score-poor">
              ✗ Saknas
              <a href="#social" style={{marginLeft: '8px', fontSize: '14px'}}>→ Visa detaljer</a>
            </span>
          </div>
        )}
      </div>

      <div className="info-card">
        <div className="card-header">
          <div className="card-icon breakdown"></div>
          <div className="card-title">Länkar</div>
        </div>
        <div className="stats-row">
          <span className="stat-label">Interna länkar</span>
          <span className="stat-value">{formatInt(result.links?.internal || 0)}</span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Externa länkar</span>
          <span className="stat-value">{formatInt(result.links?.external || 0)}</span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Externa länkar med nofollow</span>
          <span className="stat-value">
            {Array.isArray(result.links?.externalLinks) ? 
              result.links.externalLinks.filter(link => link.rel?.includes('nofollow')).length : 
              'N/A'
            }
          </span>
        </div>
      </div>

      {/* Remove all duplicate cards - they have their own dedicated sections now */}
      
      {/* Swedish Content Grading (90-day feature) */}
      {result.readability && (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon content"></div>
            <div className="card-title">Läsbarhet (Svenska)</div>
          </div>
          <div className="stats-row">
            <span className="stat-label">LIX-värde</span>
            <span className={`stat-value ${(result.readability.lix || 0) <= 50 ? 'score-good' : (result.readability.lix || 0) <= 60 ? 'score-warning' : 'score-poor'}`}>
              {result.readability.lix || 0} ({result.readability.level || 'N/A'})
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">Läsbarhet</span>
            <span className={`stat-value ${(result.readability.score || 0) >= 70 ? 'score-good' : (result.readability.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.readability.grade || 'N/A'} ({result.readability.score || 0}/100)
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">SEO-poäng</span>
            <span className={`stat-value ${(result.readability.seoScore || 0) >= 70 ? 'score-good' : (result.readability.seoScore || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.readability.seoScore || 0}/100
            </span>
          </div>
          {result.readability.metrics && (
            <>
              <div className="stats-row">
                <span className="stat-label">Ord per mening</span>
                <span className={`stat-value ${(result.readability.metrics?.avgSentenceLength || 0) <= 20 ? 'score-good' : 'score-warning'}`}>
                  {result.readability.metrics?.avgSentenceLength || 0}
                </span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Långa meningar</span>
                <span className={`stat-value ${(result.readability.metrics?.longSentences || 0) === 0 ? 'score-good' : (result.readability.metrics?.longSentences || 0) <= 2 ? 'score-warning' : 'score-poor'}`}>
                  {result.readability.metrics?.longSentences || 0}
                </span>
              </div>
            </>
          )}
          {result.readability.description && (
            <div style={{marginTop: '10px', fontSize: '14px', color: '#92400e'}}>
              {result.readability.description}
            </div>
          )}
          {Array.isArray(result.readability.recommendations) && result.readability.recommendations.length > 0 && (
            <div style={{marginTop: '10px', fontSize: '14px'}}>
              <strong>Rekommendationer:</strong>
              <ul style={{marginLeft: '20px', marginTop: '5px'}}>
                {result.readability.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} style={{color: rec?.type === 'critical' ? '#e53e3e' : rec?.type === 'warning' ? '#d69e2e' : '#38a169'}}>
                    {rec?.text || 'Rekommendation saknas'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* 90-dagars: Visa detaljer länk */}
          <a 
            href="#readability"
            className="details-link"
          >
            Visa detaljer →
          </a>
        </div>
      )}
    </div>
  );
};

export default SeoTabTechnical;