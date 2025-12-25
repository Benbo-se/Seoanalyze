import React, { useState, useEffect } from 'react';
import FixThisPanel from '../common/FixThisPanel';
import MergedIssuesPanel from '../common/MergedIssuesPanel';
import TextNormalizer from '../../utils/textNormalizer';
import ScoreRing from '../lighthouse/ScoreRing';
import PriorityMatrix from '../lighthouse/PriorityMatrix';

const LighthouseResultsDisplay = ({ lighthouseData, onNewAnalysis, isSharedView = false, ffPriority }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [fixableIssues, setFixableIssues] = useState([]);
  const [issueStatuses, setIssueStatuses] = useState({});
  const [showMergedIssues, setShowMergedIssues] = useState(false);
  
  // Feature flags
  const useScoreRings = process.env.NEXT_PUBLIC_FEATURE_LIGHTHOUSE_SCORE_RING === 'true';
  // Ta flagga från prop (SSR-beslut). Fallback till env om prop saknas.
  const usePriorityMatrix = (typeof ffPriority === 'boolean')
    ? ffPriority
    : (process.env.NEXT_PUBLIC_FEATURE_LH_PRIORITY === 'true');
  
  // Null-säkra källor – förhindra .map/.filter på undefined
  const ruleEngineList = Array.isArray(lighthouseData?.summary?.ruleEngine?.actionableList)
    ? lighthouseData.summary.ruleEngine.actionableList : [];
  const improvementsList = Array.isArray(lighthouseData?.improvements)
    ? lighthouseData.improvements : [];
  const diagnosticsList = Array.isArray(lighthouseData?.diagnostics)
    ? lighthouseData.diagnostics : [];

  // Normalisera till en enkel issues-lista som PriorityMatrix kan visa
  const normalizedIssues = [
    ...ruleEngineList.map((it) => ({
      id: String(it?.id ?? it?.ruleId ?? 'rule'),
      title: String(it?.title ?? it?.message ?? 'Rekommendation'),
    })),
    ...improvementsList.map((it) => ({
      id: String(it?.id ?? 'improvement'),
      title: String(it?.title ?? it?.heading ?? it?.description ?? 'Förbättring'),
    })),
    ...diagnosticsList.map((it) => ({
      id: String(it?.id ?? 'diagnostic'),
      title: String(it?.title ?? it?.heading ?? it?.description ?? 'Diagnostik'),
    })),
  ].filter(Boolean);
  
  // SSR-probe: antal issues som skickas till matrisen
  const ssrIssueCount = normalizedIssues.length;

  const handleStatusChange = async (issueId, newStatus, note = '') => {
    try {
      setIssueStatuses(prev => ({
        ...prev,
        [issueId]: newStatus
      }));
    } catch (error) {
      console.error('Failed to update issue status:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#16a34a';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };
  
  // Core Web Vitals thresholds
  const webVitalsThresholds = {
    lcp: { good: 2500, needs: 4000, unit: 's' },
    fid: { good: 100, needs: 300, unit: 'ms' },
    cls: { good: 0.1, needs: 0.25, unit: '' },
    fcp: { good: 1800, needs: 3000, unit: 's' },
    ttfb: { good: 800, needs: 1800, unit: 'ms' },
    tbt: { good: 200, needs: 600, unit: 'ms' },
    tti: { good: 3800, needs: 7300, unit: 's' },
    si: { good: 3400, needs: 5800, unit: 's' }
  };
  
  const getMetricStatus = (metric, value) => {
    const threshold = webVitalsThresholds[metric];
    if (!threshold || value === null || value === undefined) return { status: 'unknown', icon: '❔' };
    
    if (value <= threshold.good) return { status: 'good', icon: '🟢' };
    if (value <= threshold.needs) return { status: 'needs-improvement', icon: '🟡' };
    return { status: 'poor', icon: '🔴' };
  };

  const formatMetricValue = (metric, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    const threshold = webVitalsThresholds[metric];
    if (!threshold) return value.toString();
    
    if (threshold.unit === 's') {
      return `${(value / 1000).toFixed(1)}s`;
    } else if (threshold.unit === 'ms') {
      return `${Math.round(value)}ms`;
    } else {
      return value.toString();
    }
  };

  if (!lighthouseData) {
    return <div>No Lighthouse data available</div>;
  }

  // Extract scores with fallbacks
  const performanceScore = lighthouseData.performance ?? lighthouseData.performanceScore ?? 0;
  const accessibilityScore = lighthouseData.accessibility ?? lighthouseData.accessibilityScore ?? 0;
  const bestPracticesScore = lighthouseData.bestPractices ?? lighthouseData.bestPracticesScore ?? 0;
  const seoScore = lighthouseData.seo ?? lighthouseData.seoScore ?? 0;

  // Extract metrics with fallbacks - check both old format and new coreWebVitals format
  const cwv = lighthouseData.coreWebVitals || lighthouseData.results?.coreWebVitals || {};
  
  // Debug logging
  console.log('LighthouseResultsDisplay - lighthouseData keys:', Object.keys(lighthouseData));
  console.log('LighthouseResultsDisplay - coreWebVitals:', lighthouseData.coreWebVitals);
  console.log('LighthouseResultsDisplay - cwv:', cwv);
  
  const metrics = {
    lcp: cwv.lcp?.value ?? lighthouseData.largestContentfulPaint ?? null,
    fid: cwv.fid?.value ?? lighthouseData.firstInputDelay ?? null,
    cls: cwv.cls?.value ?? lighthouseData.cumulativeLayoutShift ?? null,
    fcp: cwv.fcp?.value ?? lighthouseData.firstContentfulPaint ?? null,
    ttfb: cwv.ttfb?.value ?? lighthouseData.timeToFirstByte ?? null,
    tbt: cwv.tbt?.value ?? lighthouseData.totalBlockingTime ?? null,
    tti: cwv.tti?.value ?? lighthouseData.timeToInteractive ?? null,
    si: cwv.speedIndex?.value ?? lighthouseData.speedIndex ?? null
  };

  const coreWebVitals = [
    { key: 'lcp', name: 'Largest Contentful Paint', value: metrics.lcp },
    { key: 'fid', name: 'First Input Delay', value: metrics.fid },
    { key: 'cls', name: 'Cumulative Layout Shift', value: metrics.cls }
  ];

  const otherMetrics = [
    { key: 'fcp', name: 'First Contentful Paint', value: metrics.fcp },
    { key: 'ttfb', name: 'Time to First Byte', value: metrics.ttfb },
    { key: 'tbt', name: 'Total Blocking Time', value: metrics.tbt },
    { key: 'tti', name: 'Time to Interactive', value: metrics.tti },
    { key: 'si', name: 'Speed Index', value: metrics.si }
  ];

  return (
    <div className="results-display lighthouse-results">
      {/* Effektiv flagg-probe för BEVIS */}
      <div
        data-testid="ff-lh-priority-effective"
        data-val={String(usePriorityMatrix)}
        hidden
      />
      <div className="results-header">
        <h2>Lighthouse Resultat</h2>
        <p className="results-summary">
          Prestanda- och användarupplevelsanalys av din webbplats
        </p>

        {/* Action buttons */}
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={onNewAnalysis}
          >
            Ny Analys
          </button>
          {lighthouseData.analysisId && !isSharedView && (
            <>
              <button 
                className="action-btn secondary"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/v1/analyses/${lighthouseData.analysisId}/pdf`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `lighthouse-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }
                  } catch (error) {
                    console.error('PDF download error:', error);
                  }
                }}
              >
                Ladda ner PDF
              </button>
              
              <button 
                className="action-btn secondary" 
                onClick={() => {
                  const jsonData = {
                    analysisId: lighthouseData.analysisId,
                    timestamp: new Date().toISOString(),
                    type: 'lighthouse',
                    url: lighthouseData.url,
                    scores: {
                      performance: performanceScore,
                      accessibility: accessibilityScore,
                      bestPractices: bestPracticesScore,
                      seo: seoScore
                    },
                    coreWebVitals: metrics,
                    fullData: lighthouseData
                  };
                  
                  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `lighthouse-analysis-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
              >
                Ladda ner JSON
              </button>

              <button 
                className="action-btn secondary" 
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/v1/analyses/${lighthouseData.analysisId}/share`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      const shareUrl = `${window.location.origin}/share/${result.shareId}`;
                      
                      if (navigator.share) {
                        await navigator.share({
                          title: 'Lighthouse Analys Resultat',
                          text: `Lighthouse analys av ${lighthouseData.url}`,
                          url: shareUrl,
                        });
                      } else {
                        await navigator.clipboard.writeText(shareUrl);
                        alert('Delningslänk kopierad till urklipp!');
                      }
                    } else {
                      throw new Error('Failed to create share link');
                    }
                  } catch (error) {
                    console.error('Share error:', error);
                    alert('Kunde inte skapa delningslänk');
                  }
                }}
              >
                Dela analys
              </button>
              
              <button 
                className="action-btn secondary"
                onClick={() => setShowMergedIssues(true)}
              >
                🔀 Prioriterade åtgärder
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lighthouse Scores */}
      <div className="quick-stats">
        {useScoreRings ? (
          <>
            <div className="quick-stat-item">
              <ScoreRing 
                label="Prestanda" 
                score={performanceScore} 
                color={getScoreColor(performanceScore)} 
                size={80}
              />
            </div>
            <div className="quick-stat-item">
              <ScoreRing 
                label="Tillgänglighet" 
                score={accessibilityScore} 
                color={getScoreColor(accessibilityScore)} 
                size={80}
              />
            </div>
            <div className="quick-stat-item">
              <ScoreRing 
                label="Bästa praxis" 
                score={bestPracticesScore} 
                color={getScoreColor(bestPracticesScore)} 
                size={80}
              />
            </div>
            <div className="quick-stat-item">
              <ScoreRing 
                label="SEO" 
                score={seoScore} 
                color={getScoreColor(seoScore)} 
                size={80}
              />
            </div>
          </>
        ) : (
          <>
            <div className="quick-stat-item">
              <div className="stat-value" style={{ color: getScoreColor(performanceScore) }}>
                {performanceScore}
              </div>
              <div className="stat-label">Prestanda</div>
            </div>
            <div className="quick-stat-item">
              <div className="stat-value" style={{ color: getScoreColor(accessibilityScore) }}>
                {accessibilityScore}
              </div>
              <div className="stat-label">Tillgänglighet</div>
            </div>
            <div className="quick-stat-item">
              <div className="stat-value" style={{ color: getScoreColor(bestPracticesScore) }}>
                {bestPracticesScore}
              </div>
              <div className="stat-label">Bästa praxis</div>
            </div>
            <div className="quick-stat-item">
              <div className="stat-value" style={{ color: getScoreColor(seoScore) }}>
                {seoScore}
              </div>
              <div className="stat-label">SEO</div>
            </div>
          </>
        )}
      </div>

      {/* Priority Matrix – endast när flagga på, och räkna issues för BEVIS */}
      {usePriorityMatrix && (
        <>
          <div data-testid="lh-priority-issues-count" data-count={ssrIssueCount} hidden />
          <PriorityMatrix issues={normalizedIssues} />
        </>
      )}

      {/* Tabs */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Översikt
        </button>
        <button 
          className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Core Web Vitals
        </button>
        <button 
          className={`tab-btn ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          Förbättringar
        </button>
        <button 
          className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          Diagnostik
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          Detaljerade Poäng
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="metrics-grid">
              <div className="metrics-section">
                <h3>🎯 Core Web Vitals</h3>
                <p className="section-description">
                  Google&apos;s standarder för användarupplevelse
                </p>
                <div className="metrics-list">
                  {coreWebVitals.map((metric) => {
                    const status = getMetricStatus(metric.key, metric.value);
                    return (
                      <div key={metric.key} className="metric-item">
                        <div className="metric-info">
                          <div className="metric-name">{metric.name}</div>
                          <div className="metric-value">
                            <span className="status-icon">{status.icon}</span>
                            {formatMetricValue(metric.key, metric.value)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="metrics-section">
                <h3>⏱️ Övriga mätvärden</h3>
                <p className="section-description">
                  Ytterligare prestandamätningar
                </p>
                <div className="metrics-list">
                  {otherMetrics.map((metric) => {
                    const status = getMetricStatus(metric.key, metric.value);
                    return (
                      <div key={metric.key} className="metric-item">
                        <div className="metric-info">
                          <div className="metric-name">{metric.name}</div>
                          <div className="metric-value">
                            <span className="status-icon">{status.icon}</span>
                            {formatMetricValue(metric.key, metric.value)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-content">
            <div className="cwv-explanation">
              <h3>Core Web Vitals förklarat</h3>
              <p>
                Core Web Vitals är Googles standarder för att mäta användarupplevelsen på webben.
                Dessa mätvärden påverkar din ranking i Googles sökresultat.
              </p>
            </div>
            
            <div className="cwv-details">
              {coreWebVitals.map((metric) => {
                const status = getMetricStatus(metric.key, metric.value);
                const threshold = webVitalsThresholds[metric.key];
                
                return (
                  <div key={metric.key} className="cwv-item">
                    <div className="cwv-header">
                      <h4>{metric.name}</h4>
                      <div className="cwv-status">
                        <span className="status-icon">{status.icon}</span>
                        <span className="status-value">
                          {formatMetricValue(metric.key, metric.value)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="cwv-thresholds">
                      <div className="threshold-item good">
                        <span>Bra: ≤{formatMetricValue(metric.key, threshold.good)}</span>
                      </div>
                      <div className="threshold-item needs">
                        <span>Behöver förbättring: ≤{formatMetricValue(metric.key, threshold.needs)}</span>
                      </div>
                      <div className="threshold-item poor">
                        <span>Dålig: &gt;{formatMetricValue(metric.key, threshold.needs)}</span>
                      </div>
                    </div>
                    
                    <div className="cwv-description">
                      {metric.key === 'lcp' && 'Mäter hur lång tid det tar för den största synliga delen av sidan att laddas.'}
                      {metric.key === 'fid' && 'Mäter tiden från första användarinteraktion till webbläsarens respons.'}
                      {metric.key === 'cls' && 'Mäter visuell stabilitet - hur mycket sidan "hoppar" under laddning.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="opportunities-content">
            <div className="opportunities-explanation">
              <h3>💡 Prestanda-förbättringar</h3>
              <p>
                Dessa rekommendationer kan hjälpa dig att förbättra sidans prestanda och användarupplevelse.
              </p>
            </div>

            {lighthouseData.opportunities && lighthouseData.opportunities.length > 0 ? (
              <div className="opportunities-list">
                {lighthouseData.opportunities.map((opportunity, index) => (
                  <div key={index} className="opportunity-item">
                    <div className="opportunity-header">
                      <h4>{opportunity.title}</h4>
                      {opportunity.estimatedSavings && (
                        <div className="estimated-savings">
                          Potentiell besparing: {opportunity.estimatedSavings}s
                        </div>
                      )}
                    </div>
                    {opportunity.description && (
                      <p className="opportunity-description">{opportunity.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-opportunities">
                <div className="no-opportunities-icon">🎉</div>
                <h3>Fantastiskt!</h3>
                <p>Lighthouse hittade inga större prestandaförbättringar för din webbplats.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="diagnostics-content">
            <div className="diagnostics-explanation">
              <h3>🔍 Diagnostisk information</h3>
              <p>
                Teknisk information och potentiella problem som kan påverka prestanda.
              </p>
            </div>

            {lighthouseData.diagnostics && lighthouseData.diagnostics.length > 0 ? (
              <div className="diagnostics-list">
                {lighthouseData.diagnostics.map((diagnostic, index) => (
                  <div key={index} className="diagnostic-item">
                    <div className="diagnostic-header">
                      <h4>{diagnostic.title}</h4>
                      {diagnostic.score !== undefined && (
                        <div className={`diagnostic-score ${getScoreColor(diagnostic.score * 100)}`}>
                          {Math.round(diagnostic.score * 100)}
                        </div>
                      )}
                    </div>
                    {diagnostic.description && (
                      <p className="diagnostic-description">{diagnostic.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-diagnostics">
                <div className="no-diagnostics-icon">✅</div>
                <h3>Alla diagnostik godkänd</h3>
                <p>Lighthouse hittade inga diagnostiska problem med din webbplats.</p>
              </div>
            )}
          </div>
        )}

        {/* Scores Tab */}
        {activeTab === 'scores' && (
          <div className="scores-content">
            <div className="scores-explanation">
              <h3>Detaljerad poängfördelning</h3>
              <p>
                Visualisering av alla Lighthouse-poäng i ett stapeldiagram.
              </p>
            </div>
            
            <div className="score-chart-container">
              <div className="score-chart">
                <div className="chart-bar">
                  <div 
                    className="bar-fill" 
                    style={{
                      height: `${performanceScore}%`,
                      backgroundColor: getScoreColor(performanceScore)
                    }}
                  >
                    <div className="bar-value">{performanceScore}</div>
                  </div>
                  <div className="bar-label">Prestanda</div>
                </div>
                
                <div className="chart-bar">
                  <div 
                    className="bar-fill" 
                    style={{
                      height: `${accessibilityScore}%`,
                      backgroundColor: getScoreColor(accessibilityScore)
                    }}
                  >
                    <div className="bar-value">{accessibilityScore}</div>
                  </div>
                  <div className="bar-label">Tillgänglighet</div>
                </div>
                
                <div className="chart-bar">
                  <div 
                    className="bar-fill" 
                    style={{
                      height: `${bestPracticesScore}%`,
                      backgroundColor: getScoreColor(bestPracticesScore)
                    }}
                  >
                    <div className="bar-value">{bestPracticesScore}</div>
                  </div>
                  <div className="bar-label">Bästa praxis</div>
                </div>
                
                <div className="chart-bar">
                  <div 
                    className="bar-fill" 
                    style={{
                      height: `${seoScore}%`,
                      backgroundColor: getScoreColor(seoScore)
                    }}
                  >
                    <div className="bar-value">{seoScore}</div>
                  </div>
                  <div className="bar-label">SEO</div>
                </div>
              </div>
            </div>
            
            <div className="score-details">
              <h4>Vad betyder poängen?</h4>
              <div className="score-ranges">
                <div className="score-range good">
                  <span className="range-icon">🟢</span>
                  <span className="range-label">90-100: Utmärkt</span>
                </div>
                <div className="score-range warning">
                  <span className="range-icon">🟡</span>
                  <span className="range-label">50-89: Behöver förbättring</span>
                </div>
                <div className="score-range poor">
                  <span className="range-icon">🔴</span>
                  <span className="range-label">0-49: Dålig</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Merged Issues Panel */}
      {showMergedIssues && (
        <MergedIssuesPanel
          seoResult={null}
          lighthouseResult={lighthouseData}
          crawlResult={null}
          targetUrl={lighthouseData.requestedUrl || lighthouseData.finalUrl}
          onClose={() => setShowMergedIssues(false)}
        />
      )}

      {/* Fix This Panel */}
      <FixThisPanel
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleStatusChange}
      />

      <style jsx>{`
        .results-display {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .results-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .results-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .results-summary {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
        }

        .action-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: #2563eb;
          color: white;
        }

        .action-btn.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .lighthouse-scores {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .score-item {
          text-align: center;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          margin: 0 auto 12px auto;
          background: rgba(255, 255, 255, 0.1);
          border: 3px solid currentColor;
        }

        .score-label {
          font-weight: 600;
          color: #374151;
        }

        .tab-navigation {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin: 40px 0 20px 0;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }

        .tab-btn {
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .tab-content {
          min-height: 400px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
        }

        .metrics-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .metrics-section h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .section-description {
          margin: 0 0 20px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric-item {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-name {
          font-weight: 500;
          color: #374151;
        }

        .metric-value {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #111827;
        }

        .status-icon {
          font-size: 16px;
        }

        .cwv-explanation {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .cwv-explanation h3 {
          margin: 0 0 12px 0;
          color: #111827;
        }

        .cwv-details {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cwv-item {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .cwv-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .cwv-header h4 {
          margin: 0;
          color: #111827;
        }

        .cwv-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .cwv-thresholds {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .threshold-item {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .threshold-item.good {
          background: #dcfce7;
          color: #166534;
        }

        .threshold-item.needs {
          background: #fef3c7;
          color: #92400e;
        }

        .threshold-item.poor {
          background: #fecaca;
          color: #991b1b;
        }

        .cwv-description {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .opportunities-explanation, .diagnostics-explanation {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .opportunities-explanation h3, .diagnostics-explanation h3 {
          margin: 0 0 12px 0;
          color: #111827;
        }

        .opportunities-list, .diagnostics-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .opportunity-item, .diagnostic-item {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .opportunity-header, .diagnostic-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .opportunity-header h4, .diagnostic-header h4 {
          margin: 0;
          color: #111827;
          flex: 1;
        }

        .estimated-savings {
          background: #dcfce7;
          color: #166534;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .opportunity-description, .diagnostic-description {
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        .no-opportunities, .no-diagnostics {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .no-opportunities-icon, .no-diagnostics-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .no-opportunities h3, .no-diagnostics h3 {
          color: #16a34a;
          margin-bottom: 12px;
        }

        /* Scores Tab Styles */
        .scores-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .scores-explanation {
          margin-bottom: 32px;
        }

        .scores-explanation h3 {
          color: #111827;
          margin: 0 0 12px 0;
        }

        .score-chart-container {
          background: #f9fafb;
          border-radius: 8px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .score-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 200px;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          margin: 0 12px;
        }

        .bar-fill {
          width: 60px;
          min-height: 20px;
          border-radius: 4px 4px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 8px;
          position: relative;
          transition: height 0.3s ease;
        }

        .bar-value {
          color: white;
          font-weight: 700;
          font-size: 18px;
        }

        .bar-label {
          margin-top: 12px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }

        .score-details {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 20px;
        }

        .score-details h4 {
          color: #334155;
          margin: 0 0 16px 0;
        }

        .score-ranges {
          display: flex;
          gap: 20px;
        }

        .score-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .range-icon {
          font-size: 16px;
        }

        .range-label {
          color: #475569;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default LighthouseResultsDisplay;