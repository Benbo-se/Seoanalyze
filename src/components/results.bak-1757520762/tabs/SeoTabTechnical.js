import React from 'react';

const SeoTabTechnical = ({ result, setActiveTab }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="content-grid">
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
        <div className="stats-row">
          <span className="stat-label">Schema markup</span>
          <span className={`stat-value ${result.hasSchema ? 'score-good' : 'score-poor'}`}>
            {result.hasSchema ? 'Ja' : 'Nej'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Security Score</span>
          <span className={`stat-value ${result.security ? (result.security.score >= 70 ? 'score-good' : result.security.score >= 50 ? 'score-warning' : 'score-poor') : ''}`}>
            {result.security ? `${result.security.score}/100 (Grade ${result.security.grade})` : 'Ej analyserad'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Social Score</span>
          <span className={`stat-value ${result.social ? (result.social.score >= 70 ? 'score-good' : result.social.score >= 50 ? 'score-warning' : 'score-poor') : ''}`}>
            {result.social ? `${result.social.score}/100 (Grade ${result.social.grade})` : 'Ej analyserad'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Open Graph</span>
          <span className={`stat-value ${result.openGraph?.title || result.social?.openGraph?.title ? 'score-good' : 'score-poor'}`}>
            {result.openGraph?.title ? 'Ja' : 'Nej'}
            {result.openGraph?.title && result.openGraph?.image === 'Missing' && ' (bild saknas)'}
          </span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Twitter Cards</span>
          <span className={`stat-value ${result.twitter?.card && result.twitter?.card !== 'Missing' ? 'score-good' : 'score-poor'}`}>
            {result.twitter?.card && result.twitter?.card !== 'Missing' ? 'Ja' : 'Nej'}
            {result.twitter?.card && result.twitter?.card !== 'Missing' && result.twitter?.image === 'Missing' && ' (bild saknas)'}
          </span>
        </div>
      </div>

      <div className="info-card">
        <div className="card-header">
          <div className="card-icon breakdown"></div>
          <div className="card-title">Länkar</div>
        </div>
        <div className="stats-row">
          <span className="stat-label">Interna länkar</span>
          <span className="stat-value">{result.links?.internal || 0}</span>
        </div>
        <div className="stats-row">
          <span className="stat-label">Externa länkar</span>
          <span className="stat-value">{result.links?.external || 0}</span>
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

      {/* Security Headers Details */}
      {result.security && (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon security"></div>
            <div className="card-title">Security Headers</div>
          </div>
          <div className="stats-row">
            <span className="stat-label">Overall Grade</span>
            <span className={`stat-value ${result.security.score >= 70 ? 'score-good' : result.security.score >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.security.grade} ({result.security.score}/100)
            </span>
          </div>
          {Object.entries(result.security.details).map(([headerName, detail]) => (
            <div key={headerName} className="stats-row">
              <span className="stat-label">{headerName}</span>
              <span className={`stat-value ${detail.valid ? 'score-good' : detail.applicable === false ? '' : 'score-poor'}`}>
                {detail.applicable === false ? 'N/A' : detail.valid ? '✓' : '✗'}
                {detail.applicable === false && detail.reason && ` (${detail.reason})`}
              </span>
            </div>
          ))}
          {result.security.issues.length > 0 && (
            <div style={{marginTop: '10px', fontSize: '14px', color: '#e53e3e'}}>
              Issues: {result.security.issues.slice(0, 2).map(issue => issue.split(' - ')[0]).join(', ')}
              {result.security.issues.length > 2 && ` +${result.security.issues.length - 2} more`}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Social Media Details */}
      {(result.social || result.openGraph || result.twitter) && (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon social"></div>
            <div className="card-title">Social Media Detaljer</div>
          </div>
          {result.social?.score && (
            <div className="stats-row">
              <span className="stat-label">Overall Grade</span>
              <span className={`stat-value ${result.social.score >= 70 ? 'score-good' : result.social.score >= 50 ? 'score-warning' : 'score-poor'}`}>
                {result.social.grade} ({result.social.score}/100)
              </span>
            </div>
          )}
          
          {/* Open Graph section - use new or fallback to old */}
          {(result.social?.openGraph || result.openGraph) && (
            <>
              <h4 style={{marginTop: '15px', marginBottom: '10px', fontSize: '16px', color: '#4a5568'}}>Open Graph</h4>
              {(() => {
                const og = result.social?.openGraph || result.openGraph;
                return (
                  <>
                    <div className="stats-row">
                      <span className="stat-label">Title</span>
                      <span className={`stat-value ${og.title && og.title !== 'Missing' ? '' : 'score-poor'}`}>
                        {og.title && og.title !== 'Missing' ? og.title : 'Saknas'}
                      </span>
                    </div>
                    <div className="stats-row">
                      <span className="stat-label">Description</span>
                      <span className={`stat-value ${og.description && og.description !== 'Missing' ? '' : 'score-poor'}`}>
                        {og.description && og.description !== 'Missing' ? 
                          (og.description.length > 50 ? og.description.substring(0, 50) + '...' : og.description) 
                          : 'Saknas'}
                      </span>
                    </div>
                    <div className="stats-row">
                      <span className="stat-label">Image</span>
                      <span className={`stat-value ${og.image && og.image !== 'Missing' ? 'score-good' : 'score-poor'}`}>
                        {og.image && og.image !== 'Missing' ? 'Finns' : 'Saknas'}
                      </span>
                    </div>
                  </>
                );
              })()}
            </>
          )}
          {result.twitter && (
            <>
              <h4 style={{marginTop: '15px', marginBottom: '10px', fontSize: '16px', color: '#4a5568'}}>Twitter Cards</h4>
              <div className="stats-row">
                <span className="stat-label">Card Type</span>
                <span className={`stat-value ${result.twitter.card && result.twitter.card !== 'Missing' ? '' : 'score-poor'}`}>
                  {result.twitter.card && result.twitter.card !== 'Missing' ? result.twitter.card : 'Saknas'}
                </span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Title</span>
                <span className={`stat-value ${result.twitter.title && result.twitter.title !== 'Missing' ? '' : 'score-poor'}`}>
                  {result.twitter.title && result.twitter.title !== 'Missing' ? 
                    (result.twitter.title.length > 50 ? result.twitter.title.substring(0, 50) + '...' : result.twitter.title)
                    : 'Saknas'}
                </span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Image</span>
                <span className={`stat-value ${result.twitter.image && result.twitter.image !== 'Missing' ? 'score-good' : 'score-poor'}`}>
                  {result.twitter.image && result.twitter.image !== 'Missing' ? 'Finns' : 'Saknas'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Schema.org Structured Data Details */}
      {result.schema && (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon schema"></div>
            <div className="card-title">Schema.org Strukturerad Data</div>
          </div>
          <div className="stats-row">
            <span className="stat-label">Overall Grade</span>
            <span className={`stat-value ${result.schema.score >= 70 ? 'score-good' : result.schema.score >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.schema.grade} ({result.schema.score}/100)
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">Schema Types Found</span>
            <span className="stat-value">
              {result.schema.types.length > 0 ? result.schema.types.join(', ') : 'Inga'}
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">Valid Schemas</span>
            <span className={`stat-value ${result.schema.schemas.filter(s => s.valid).length > 0 ? 'score-good' : 'score-poor'}`}>
              {result.schema.schemas.filter(s => s.valid).length} av {result.schema.schemas.length}
            </span>
          </div>
          {result.schema.issues.length > 0 && (
            <div style={{marginTop: '10px', fontSize: '14px', color: '#e53e3e'}}>
              Issues: {result.schema.issues.slice(0, 2).join(', ')}
              {result.schema.issues.length > 2 && ` +${result.schema.issues.length - 2} more`}
            </div>
          )}
        </div>
      )}

      {/* DNS Security Details */}
      {result.dns && (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon dns"></div>
            <div className="card-title">DNS & Email Security</div>
          </div>
          <div className="stats-row">
            <span className="stat-label">Overall Grade</span>
            <span className={`stat-value ${result.dns.score >= 70 ? 'score-good' : result.dns.score >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.dns.grade} ({result.dns.score}/100)
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">SPF Record</span>
            <span className={`stat-value ${result.dns.spf.present && result.dns.spf.valid ? 'score-good' : result.dns.spf.present ? 'score-warning' : 'score-poor'}`}>
              {result.dns.spf.present ? (result.dns.spf.valid ? '✓ Valid' : '⚠️ Present but invalid') : '✗ Missing'}
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">DMARC Record</span>
            <span className={`stat-value ${result.dns.dmarc.present && result.dns.dmarc.valid ? 'score-good' : result.dns.dmarc.present ? 'score-warning' : 'score-poor'}`}>
              {result.dns.dmarc.present ? (result.dns.dmarc.valid ? '✓ Valid' : '⚠️ Present but invalid') : '✗ Missing'}
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">MX Records</span>
            <span className={`stat-value ${result.dns.mx.present ? 'score-good' : 'score-poor'}`}>
              {result.dns.mx.present ? `✓ ${result.dns.mx.records.length} record(s)` : '✗ Missing'}
            </span>
          </div>
          {result.dns.issues.length > 0 && (
            <div style={{marginTop: '10px', fontSize: '14px', color: '#e53e3e'}}>
              Issues: {result.dns.issues.slice(0, 2).join(', ')}
              {result.dns.issues.length > 2 && ` +${result.dns.issues.length - 2} more`}
            </div>
          )}
        </div>
      )}
      
      {/* Swedish Content Grading (90-day feature) */}
      {result.readability && (
        <div className="info-card">
          <div className="card-header">
            <div className="card-icon content"></div>
            <div className="card-title">Läsbarhet (Svenska)</div>
          </div>
          <div className="stats-row">
            <span className="stat-label">LIX-värde</span>
            <span className={`stat-value ${result.readability.lix <= 50 ? 'score-good' : result.readability.lix <= 60 ? 'score-warning' : 'score-poor'}`}>
              {result.readability.lix} ({result.readability.level})
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">Läsbarhet</span>
            <span className={`stat-value ${result.readability.score >= 70 ? 'score-good' : result.readability.score >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.readability.grade} ({result.readability.score}/100)
            </span>
          </div>
          <div className="stats-row">
            <span className="stat-label">SEO-poäng</span>
            <span className={`stat-value ${result.readability.seoScore >= 70 ? 'score-good' : result.readability.seoScore >= 50 ? 'score-warning' : 'score-poor'}`}>
              {result.readability.seoScore}/100
            </span>
          </div>
          {result.readability.metrics && (
            <>
              <div className="stats-row">
                <span className="stat-label">Ord per mening</span>
                <span className={`stat-value ${result.readability.metrics.avgSentenceLength <= 20 ? 'score-good' : 'score-warning'}`}>
                  {result.readability.metrics.avgSentenceLength}
                </span>
              </div>
              <div className="stats-row">
                <span className="stat-label">Långa meningar</span>
                <span className={`stat-value ${result.readability.metrics.longSentences === 0 ? 'score-good' : result.readability.metrics.longSentences <= 2 ? 'score-warning' : 'score-poor'}`}>
                  {result.readability.metrics.longSentences}
                </span>
              </div>
            </>
          )}
          {result.readability.description && (
            <div style={{marginTop: '10px', fontSize: '14px', color: '#92400e'}}>
              {result.readability.description}
            </div>
          )}
          {result.readability.recommendations && result.readability.recommendations.length > 0 && (
            <div style={{marginTop: '10px', fontSize: '14px'}}>
              <strong>Rekommendationer:</strong>
              <ul style={{marginLeft: '20px', marginTop: '5px'}}>
                {result.readability.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} style={{color: rec.type === 'critical' ? '#e53e3e' : rec.type === 'warning' ? '#d69e2e' : '#38a169'}}>
                    {rec.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* 90-dagars: Visa detaljer länk */}
          <button 
            className="details-link"
            onClick={() => setActiveTab('readability')}
          >
            Visa detaljer →
          </button>
        </div>
      )}
    </div>
  );
};

export default SeoTabTechnical;