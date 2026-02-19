import React, { useState, useEffect } from 'react';
import SEOHealthGauge from '../visualizations/SEOHealthGauge';
import IssueBreakdownPie from '../visualizations/IssueBreakdownPie';
import TrendChart from '../visualizations/TrendChart';

function OverviewDashboard({ result, artifactBase }) {
  const [trendData, setTrendData] = useState([]);

  // Svenska översättningar för kategorier
  const CATEGORY_SV = {
    security: 'Säkerhet',
    schema: 'Schema',
    dns: 'DNS',
    social: 'Sociala medier',
    content: 'Innehåll',
    technical: 'Tekniskt',
    meta: 'Meta-taggar',
    performance: 'Prestanda'
  };

  // Fetch trend data for this domain
  useEffect(() => {
    if (result?.url) {
      fetchTrendData(result.url);
    }
  }, [result?.url]);

  const fetchTrendData = async (url) => {
    try {
      // Extract domain from URL
      const domain = new URL(url).hostname;
      const encodedUrl = encodeURIComponent(url);
      
      const response = await fetch(`/api/v1/analyses/history/${encodedUrl}?limit=10`);
      if (response.ok) {
        const history = await response.json();
        // Filter for completed analyses with scores
        const validHistory = history.filter(h => 
          h.status === 'completed' && 
          (h.seoScore > 0 || h.score > 0)
        );
        setTrendData(validHistory);
      }
    } catch (error) {
      console.warn('Could not fetch trend data:', error);
      setTrendData([]);
    }
  };

  // Extract issues from result data
  const extractIssues = (result) => {
    const issues = {};
    
    // Content issues
    let contentIssues = 0;
    if (result.title?.issues) contentIssues += result.title.issues;
    if (result.metaDescription?.issues) contentIssues += result.metaDescription.issues;
    if (result.headings?.issues) contentIssues += result.headings.issues;
    if (result.readability?.recommendations?.length) contentIssues += result.readability.recommendations.length;
    if (contentIssues > 0) issues.content = contentIssues;
    
    // Performance issues
    let performanceIssues = 0;
    if (result.performance?.issues) performanceIssues += result.performance.issues;
    if (performanceIssues > 0) issues.performance = performanceIssues;
    
    // Security issues  
    if (result.security?.issues?.length) {
      issues.security = result.security.issues.length;
    }
    
    // Social media issues
    let socialIssues = 0;
    if (result.social?.issues) socialIssues += result.social.issues;
    if (result.openGraph?.issues) socialIssues += result.openGraph.issues;
    if (result.twitter?.issues) socialIssues += result.twitter.issues;
    if (socialIssues > 0) issues.social = socialIssues;
    
    // Image issues
    let imageIssues = 0;
    if (result.images?.withoutAlt) imageIssues += result.images.withoutAlt;
    if (result.images?.oversized?.length) imageIssues += result.images.oversized.length;
    if (imageIssues > 0) issues.images = imageIssues;
    
    // Technical issues
    let technicalIssues = 0;
    if (result.technical?.issues) technicalIssues += result.technical.issues;
    if (result.structured?.issues) technicalIssues += result.structured.issues;
    if (technicalIssues > 0) issues.technical = technicalIssues;
    
    // Mobile issues
    if (result.mobile?.issues) {
      issues.mobile = result.mobile.issues;
    }
    
    return issues;
  };

  const issues = extractIssues(result);

  // Advanced sections gating
  const showAdvanced =
    !!result?.security ||
    !!result?.dns ||
    !!result?.social ||
    !!result?.schema ||
    (Array.isArray(result?.actionables) && result.actionables.length > 0);

  
  // Helper function to format word count
  const formatWordCount = (count) => {
    const wordCount = count || 0;
    if (wordCount >= 1000) {
      return `${(wordCount / 1000).toFixed(1)}k ord`;
    }
    return `${wordCount} ord`;
  };

  // Quick stats
  const totalIssues = Object.values(issues).reduce((sum, count) => sum + count, 0);
  const quickStats = [
    {
      label: 'SEO-poäng',
      value: `${result.seoScore || 0}`,
      color: result.seoScore >= 75 ? '#16a34a' : result.seoScore >= 50 ? '#f59e0b' : '#ef4444'
    },
    {
      label: 'Problem funna',
      value: totalIssues,
      color: totalIssues === 0 ? '#16a34a' : totalIssues <= 5 ? '#f59e0b' : '#ef4444'
    },
    {
      label: 'Innehåll analyserat',
      value: formatWordCount(result.wordCount || result.content?.wordCount),
      color: '#64748b'
    },
    {
      label: 'Mobilvänlig',
      value: (result.mobile?.hasViewport && result.mobile?.hasResponsiveImages) ? 'Ja' : 'Förbättra',
      color: (result.mobile?.hasViewport && result.mobile?.hasResponsiveImages) ? '#16a34a' : '#f59e0b'
    }
  ];

  return (
    <div className="overview-dashboard">
      {/* Hero Section - Screenshots */}
      {artifactBase && result?.screenshots?.desktop && (
        <>
          <noscript data-testid="seo-hero-ssr" />
          <div className="overview-preview">
            <div className="hero-previews" data-testid="seo-hero">
            <div className="preview-desktop">
              <img
                src={`${artifactBase}/${result.screenshots.desktop}`}
                alt="Förhandsvisning (desktop)"
                loading="eager"
              />
            </div>
            {result?.screenshots?.mobile && (
              <div className="preview-mobile">
                <img
                  src={`${artifactBase}/${result.screenshots.mobile}`}
                  alt="Förhandsvisning (mobil)"
                  loading="lazy"
                />
              </div>
            )}
            </div>
          </div>
        </>
      )}

      {/* Quick Stats Bar */}
      <div className="quick-stats">
        {quickStats.map((stat, index) => (
          <div key={index} className="quick-stat-item">
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* Main visualizations grid */}
      <div className="visualizations-grid">
        <div className="viz-item">
          <SEOHealthGauge score={result.seoScore || 0} />
        </div>
        
        <div className="viz-item">
          <IssueBreakdownPie issues={issues} />
        </div>

        {/* Trend chart - only show if we have trend data */}
        {trendData.length >= 2 && (
          <div className="viz-item">
            <TrendChart trendData={trendData} />
          </div>
        )}
        
        {/* Key insights card */}
        <div className="viz-item insights-card">
          <div className="insights-header">
            <h3>Prioriterade åtgärder</h3>
            <div className="insights-subtitle">Snabbaste vägen till bättre SEO</div>
          </div>
          
          <div className="insights-list">
            {result.seoScore < 50 && (
              <div className="insight-item urgent">
                <div className="insight-icon icon-urgent" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Kritiska SEO-problem</div>
                  <div className="insight-description">Din SEO-score är låg. Fokusera på grundläggande optimering först.</div>
                </div>
              </div>
            )}
            
            {result.title?.length > 60 && (
              <div className="insight-item high">
                <div className="insight-icon icon-title" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Optimera sidtitel</div>
                  <div className="insight-description">Förkorta titeln till under 60 tecken för bättre visning.</div>
                </div>
              </div>
            )}
            
            {result.images?.withoutAlt > 0 && (
              <div className="insight-item medium">
                <div className="insight-icon icon-image" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Lägg till alt-text</div>
                  <div className="insight-description">{result.images.withoutAlt} bilder saknar alt-text för tillgänglighet.</div>
                </div>
              </div>
            )}
            
            {result.readability?.lix > 60 && (
              <div className="insight-item medium">
                <div className="insight-icon icon-read" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Förenkla texten</div>
                  <div className="insight-description">Texten är svårläst. Använd kortare meningar och enklare ord.</div>
                </div>
              </div>
            )}
            
            {/* B1: Security Insights */}
            {result.security && !result.security.hsts?.present && (
              <div className="insight-item high">
                <div className="insight-icon icon-sec" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">HSTS Header saknas</div>
                  <div className="insight-description">Lägg till Strict-Transport-Security för bättre säkerhet.</div>
                </div>
              </div>
            )}
            
            {result.security && !result.security.csp?.present && (
              <div className="insight-item medium">
                <div className="insight-icon icon-sec" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Content Security Policy saknas</div>
                  <div className="insight-description">CSP skyddar mot XSS-attacker och förbättrar säkerheten.</div>
                </div>
              </div>
            )}

            {/* B2: DNS Insights */}
            {result.dns && result.dns.spf?.status === 'missing' && (
              <div className="insight-item medium">
                <div className="insight-icon icon-dns" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">SPF-post saknas</div>
                  <div className="insight-description">Lägg till SPF TXT-post för att förebygga e-postfusk.</div>
                </div>
              </div>
            )}
            
            {result.dns && result.dns.dmarc?.status === 'missing' && (
              <div className="insight-item low">
                <div className="insight-icon icon-dns" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">DMARC-policy saknas</div>
                  <div className="insight-description">DMARC förbättrar e-postautentisering och motverkar phishing.</div>
                </div>
              </div>
            )}

            {/* B3: Social Insights */}
            {result.social && result.social.openGraph?.missing?.length > 0 && (
              <div className="insight-item medium">
                <div className="insight-icon icon-social" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Open Graph-taggar saknas</div>
                  <div className="insight-description">Saknade: {result.social.openGraph.missing.slice(0,2).join(', ')}. Förbättrar delning på sociala medier.</div>
                </div>
              </div>
            )}
            
            {result.social && result.social.twitter?.missing?.length > 0 && (
              <div className="insight-item low">
                <div className="insight-icon icon-social" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Twitter Cards saknas</div>
                  <div className="insight-description">Lägg till Twitter Card-taggar för bättre visning på Twitter.</div>
                </div>
              </div>
            )}

            {/* B4: Schema Insights */}
            {result.schema && !result.schema.present && (
              <div className="insight-item low">
                <div className="insight-icon icon-schema" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Strukturerad data saknas</div>
                  <div className="insight-description">Schema.org markup förbättrar sökresultat med rich snippets.</div>
                </div>
              </div>
            )}
            
            {result.schema && result.schema.errors?.length > 0 && (
              <div className="insight-item medium">
                <div className="insight-icon icon-schema" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Schema-valideringsfel</div>
                  <div className="insight-description">{result.schema.errors.length} fel hittades i strukturerad data.</div>
                </div>
              </div>
            )}

            {/* B5: Actionables Insights */}
            {result.actionables && result.actionables.length > 0 && (
              <div className="insight-item high">
                <div className="insight-icon icon-act" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">{result.actionables.length} åtgärder rekommenderas</div>
                  <div className="insight-description">
                    Prioriterade förbättringar: {result.actionables.filter(a => a.severity === 'high').length} viktiga, 
                    {result.actionables.filter(a => a.severity === 'medium').length} medel.
                  </div>
                </div>
              </div>
            )}

            {totalIssues === 0 && (
              <div className="insight-item success">
                <div className="insight-icon icon-success" aria-hidden="true"></div>
                <div className="insight-content">
                  <div className="insight-title">Bra jobbat!</div>
                  <div className="insight-description">Din webbplats följer de flesta SEO-riktlinjer. Fortsätt övervaka prestanda.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legacy "Avancerade analyser" togs bort – allt visas redan i korten ovan */}
        {false && showAdvanced && (
          <div className="overview-section">
            <h3>Avancerade analyser (DEPRECATED)</h3>
            
            {/* B1: Security Section */}
            {result.security && (
              <>
              <noscript data-testid="seo-security-section-ssr" />
              <div className="insight-card" data-testid="seo-security-section">
                <div className="card-header">
                  <div className="card-icon icon-sec" aria-hidden="true"></div>
                  <div className="card-title">Säkerhetsanalys</div>
                  <div className="card-badge">{result.security.grade || 'N/A'}</div>
                </div>
                <div className="card-content">
                  <div className="security-grid">
                    <div className="security-item">
                      <span className="security-label">HSTS:</span>
                      <span className={`security-status ${result.security.hsts?.present ? 'good' : 'missing'}`}>
                        {result.security.hsts?.present ? 'Aktivt' : 'Saknas'}
                      </span>
                    </div>
                    <div className="security-item">
                      <span className="security-label">CSP:</span>
                      <span className={`security-status ${result.security.csp?.present ? 'good' : 'missing'}`}>
                        {result.security.csp?.present ? `${result.security.csp.directivesCount} direktiv` : 'Saknas'}
                      </span>
                    </div>
                    <div className="security-item">
                      <span className="security-label">X-Frame-Options:</span>
                      <span className={`security-status ${result.security.xFrameOptions?.present ? 'good' : 'missing'}`}>
                        {result.security.xFrameOptions?.present ? `${result.security.xFrameOptions.value}` : 'Saknas'}
                      </span>
                    </div>
                    <div className="security-item">
                      <span className="security-label">Referrer Policy:</span>
                      <span className={`security-status ${result.security.referrerPolicy?.present ? 'good' : 'missing'}`}>
                        {result.security.referrerPolicy?.present ? `${result.security.referrerPolicy.value}` : 'Saknas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* B2: DNS Section */}
            {result.dns && (
              <>
              <noscript data-testid="seo-dns-section-ssr" />
              <div className="insight-card" data-testid="seo-dns-section">
                <div className="card-header">
                  <div className="card-icon icon-dns" aria-hidden="true"></div>
                  <div className="card-title">DNS & E-postsäkerhet</div>
                  <div className="card-badge">{result.dns.checkedDomain}</div>
                </div>
                <div className="card-content">
                  <div className="dns-grid">
                    <div className="dns-item">
                      <span className="dns-label">SPF Record:</span>
                      <span className={`dns-status ${result.dns.spf?.status === 'pass' ? 'good' : 'missing'}`}>
                        {result.dns.spf?.status === 'pass' ? 'Konfigurerad' : 'Saknas'}
                      </span>
                    </div>
                    <div className="dns-item">
                      <span className="dns-label">DMARC Policy:</span>
                      <span className={`dns-status ${result.dns.dmarc?.status === 'pass' ? 'good' : 'missing'}`}>
                        {result.dns.dmarc?.status === 'pass' ? `${result.dns.dmarc.policy}` : 'Saknas'}
                      </span>
                    </div>
                    <div className="dns-item">
                      <span className="dns-label">MX Records:</span>
                      <span className={`dns-status ${result.dns.mx?.status === 'pass' ? 'good' : 'missing'}`}>
                        {result.dns.mx?.status === 'pass' ? `${result.dns.mx.recordsCount} poster` : 'Inga funna'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* B3: Social Section */}
            {result.social && (
              <>
              <noscript data-testid="seo-social-section-ssr" />
              <div className="insight-card" data-testid="seo-social-section">
                <div className="card-header">
                  <div className="card-icon icon-social" aria-hidden="true"></div>
                  <div className="card-title">Sociala medier</div>
                </div>
                <div className="card-content">
                  <div className="social-grid">
                    <div className="social-section">
                      <h4>Open Graph</h4>
                      <div className="social-status">
                        {result.social.openGraph?.present ? (
                          <span className="status-good">Konfigurerad</span>
                        ) : (
                          <span className="status-missing">Saknas: {result.social.openGraph?.missing?.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="social-section">
                      <h4>Twitter Cards</h4>
                      <div className="social-status">
                        {result.social.twitter?.present ? (
                          <span className="status-good">Konfigurerad</span>
                        ) : (
                          <span className="status-missing">Saknas: {result.social.twitter?.missing?.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* B4: Schema Section */}
            {result.schema && (
              <>
              <noscript data-testid="seo-schema-section-ssr" />
              <div className="insight-card" data-testid="seo-schema-section">
                <div className="card-header">
                  <div className="card-icon icon-schema" aria-hidden="true"></div>
                  <div className="card-title">Strukturerad data (Schema.org)</div>
                </div>
                <div className="card-content">
                  <div className="schema-status">
                    {result.schema.present ? (
                      <div>
                        <div className="status-good">Schema.org upptäckt</div>
                        {result.schema.types?.length > 0 && (
                          <div className="schema-types">
                            <strong>Typer:</strong> {result.schema.types.join(', ')}
                          </div>
                        )}
                        {result.schema.errors?.length > 0 && (
                          <div className="schema-errors">
                            <strong>Valideringsfel:</strong> {result.schema.errors.length} fel funna
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="status-missing">Problem: Ingen strukturerad data hittades – missade SEO-möjligheter</div>
                    )}
                  </div>
                </div>
              </div>
              </>
            )}

            {/* B5: Actionables Section */}
            {result.actionables && result.actionables.length > 0 && (
              <>
              <noscript data-testid="seo-actionables-section-ssr" />
              <div className="insight-card" data-testid="seo-actionables-section">
                <div className="card-header">
                  <div className="card-icon icon-act" aria-hidden="true"></div>
                  <div className="card-title">Rekommenderade åtgärder</div>
                  <div className="card-badge">{result.actionables.length} åtgärder</div>
                </div>
                <div className="card-content">
                  <div className="actionables-list">
                    {result.actionables.slice(0, 5).map((action, index) => (
                      <div key={action.id || index} className={`actionable-item severity-${action.severity}`}>
                        <div className="actionable-header">
                          <span className={`severity-dot ${action.severity}`}></span>
                          <strong>{action.title}</strong>
                          {action.category && (
                            <span className="actionable-category">
                              {CATEGORY_SV[action.category] || action.category}
                            </span>
                          )}
                        </div>
                        {action.evidence && (
                          <div className="actionable-evidence">{action.evidence}</div>
                        )}
                        {action.fix && (
                          <div className="actionable-fix">{action.fix}</div>
                        )}
                      </div>
                    ))}
                    {result.actionables.length > 5 && (
                      <div className="actionables-more">
                        ... och {result.actionables.length - 5} till
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OverviewDashboard;