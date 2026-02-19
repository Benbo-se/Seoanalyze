import React, { useState, useEffect } from 'react';
import FixThisPanel from '../common/FixThisPanel';
import MergedIssuesPanel from '../common/MergedIssuesPanel';
import TextNormalizer from '../../utils/textNormalizer';
import ScoreRing from '../lighthouse/ScoreRing';
import PriorityMatrix from '../lighthouse/PriorityMatrix';
import ResultsTopbar from './ResultsTopbar';
import TableOfContents from './TableOfContents';
import tocStyles from './tableOfContents.module.css';
import {
  CheckCircle, AlertCircle, XCircle, PartyPopper,
  Zap, Image, FileCode, Server, Globe, Package, Database
} from 'lucide-react';

const LighthouseResultsDisplay = ({ lighthouseData, onNewAnalysis, isSharedView = false, ffPriority }) => {
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
    if (score === null || score === undefined) return '#9ca3af'; // Gray for not tested
    if (score >= 90) return '#16a34a';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreStatus = (score) => {
    if (score === null || score === undefined) return 'Ej testad';
    if (score >= 90) return 'Utmärkt';
    if (score >= 50) return 'Behöver förbättring';
    return 'Dålig, kräver förbättring';
  };

  const getOpportunityIcon = (opportunity) => {
    const id = opportunity.id || '';
    const title = (opportunity.title || '').toLowerCase();

    // JavaScript-relaterade
    if (id.includes('javascript') || id.includes('js') || title.includes('javascript') || title.includes('js')) {
      return <Zap size={16} style={{ color: '#f59e0b' }} />;
    }

    // Bild-relaterade
    if (id.includes('image') || id.includes('img') || title.includes('image') || title.includes('img')) {
      return <Image size={16} style={{ color: '#10b981' }} />;
    }

    // CSS-relaterade
    if (id.includes('css') || title.includes('css') || title.includes('style')) {
      return <FileCode size={16} style={{ color: '#3b82f6' }} />;
    }

    // Server/cache-relaterade
    if (id.includes('cache') || id.includes('server') || id.includes('http') || title.includes('cache') || title.includes('server')) {
      return <Server size={16} style={{ color: '#8b5cf6' }} />;
    }

    // Nätverks-relaterade
    if (id.includes('preconnect') || id.includes('prefetch') || id.includes('redirect') || title.includes('network')) {
      return <Globe size={16} style={{ color: '#ef4444' }} />;
    }

    // Kompression/minifiering
    if (id.includes('compress') || id.includes('minif') || title.includes('compress') || title.includes('minif')) {
      return <Package size={16} style={{ color: '#06b6d4' }} />;
    }

    // DOM/HTML
    if (id.includes('dom') || title.includes('dom') || title.includes('html')) {
      return <Database size={16} style={{ color: '#64748b' }} />;
    }

    // Default
    return <AlertCircle size={16} style={{ color: '#6b7280' }} />;
  };
  
  // Core Web Vitals thresholds (all time values in milliseconds)
  const webVitalsThresholds = {
    lcp: { good: 2500, needs: 4000, unit: 'ms' },
    inp: { good: 200, needs: 500, unit: 'ms' },
    cls: { good: 0.1, needs: 0.25, unit: '' },
    fcp: { good: 1800, needs: 3000, unit: 'ms' },
    ttfb: { good: 800, needs: 1800, unit: 'ms' },
    tbt: { good: 200, needs: 600, unit: 'ms' },
    tti: { good: 3800, needs: 7300, unit: 'ms' },
    si: { good: 3400, needs: 5800, unit: 'ms' }
  };
  
  const getMetricStatus = (metric, value) => {
    const threshold = webVitalsThresholds[metric];
    if (!threshold || value === null || value === undefined) return { status: 'unknown', icon: <AlertCircle size={16} className="text-gray-500" /> };
    
    if (value <= threshold.good) return { status: 'good', icon: <CheckCircle size={16} className="text-green-600" /> };
    if (value <= threshold.needs) return { status: 'needs-improvement', icon: <AlertCircle size={16} className="text-yellow-600" /> };
    return { status: 'poor', icon: <XCircle size={16} className="text-red-600" /> };
  };

  const formatMetricValue = (metric, value) => {
    if (value === null || value === undefined) {
      // Special case for INP which is not available in lab data
      if (metric === 'inp') {
        return 'Lab data';
      }
      return 'N/A';
    }

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
  // Use null instead of 0 for missing scores to differentiate between "not tested" and "score of 0"
  const performanceScore = lighthouseData.performance ?? lighthouseData.performanceScore ?? null;
  const accessibilityScore = lighthouseData.accessibility ?? lighthouseData.accessibilityScore ?? null;
  const bestPracticesScore = lighthouseData.bestPractices ?? lighthouseData.bestPracticesScore ?? null;
  const seoScore = lighthouseData.seo ?? lighthouseData.seoScore ?? null;

  // Extract metrics with fallbacks - check both old format and new coreWebVitals format
  const cwv = lighthouseData.coreWebVitals || lighthouseData.results?.coreWebVitals || {};
  
  // Debug logging (removed for production)
  
  const metrics = {
    lcp: cwv.lcp?.value ?? null,
    inp: cwv.inp?.value ?? null, // Only use INP from analyzer, no fallbacks
    cls: cwv.cls?.value ?? null,
    fcp: cwv.fcp?.value ?? null,
    ttfb: cwv.ttfb?.value ?? null,
    tbt: cwv.tbt?.value ?? null,
    tti: cwv.tti?.value ?? null,
    si: cwv.speedIndex?.value ?? null
  };

  const coreWebVitals = [
    { key: 'lcp', name: 'Largest Contentful Paint', value: metrics.lcp, dataType: 'Lab' },
    { key: 'inp', name: 'Interaction to Next Paint', value: metrics.inp, dataType: 'Lab', labNote: 'Lab data' },
    { key: 'cls', name: 'Cumulative Layout Shift', value: metrics.cls, dataType: 'Lab' }
  ];

  const otherMetrics = [
    { key: 'fcp', name: 'First Contentful Paint', value: metrics.fcp, dataType: 'Lab' },
    { key: 'ttfb', name: 'Time to First Byte', value: metrics.ttfb, dataType: 'Lab' },
    { key: 'tbt', name: 'Total Blocking Time', value: metrics.tbt, dataType: 'Lab' },
    { key: 'tti', name: 'Time to Interactive', value: metrics.tti, dataType: 'Lab' },
    { key: 'si', name: 'Speed Index', value: metrics.si, dataType: 'Lab' }
  ];

  return (
    <div className={`results-page lighthouse-results ${tocStyles.tocContainer}`}>
      {/* Effektiv flagg-probe för BEVIS */}
      <div
        data-testid="ff-lh-priority-effective"
        data-val={String(usePriorityMatrix)}
        hidden
      />
      <ResultsTopbar
          result={(() => {
            const resultData = {
              ...lighthouseData, // Include all lighthouse data
              seoScore: performanceScore, // Override score with performance score
              url: lighthouseData.targetUrl || lighthouseData.url || lighthouseData.requestedUrl || lighthouseData.finalUrl,
              favIconUrl: lighthouseData.favIconUrl || (() => {
                try {
                  const url = lighthouseData.targetUrl || lighthouseData.url || lighthouseData.requestedUrl || lighthouseData.finalUrl;
                  return new URL('/favicon.ico', new URL(url).origin).toString();
                } catch {
                  return null;
                }
              })()
            };
            // Debug logging removed for production
            return resultData;
          })()}
          analysisId={lighthouseData.analysisId}
          onDownloadPdf={!isSharedView ? async () => {
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
          } : null}
          onDownloadJson={!isSharedView ? () => {
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
          } : null}
          onShare={!isSharedView ? async () => {
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
          } : null}
          onNewAnalysis={onNewAnalysis}
        />

      <div className="results-container">
        <div className="page-header">
          <h1 className="page-title">Lighthouse Resultat</h1>
          <p className="page-subtitle">
            Prestanda- och användarupplevelsanalys av din webbplats
          </p>
        </div>

        {/* Status Banner */}
        <div className="status-banner">
          <div className="status-title">Analys Slutförd</div>
          <div className="status-url">{lighthouseData.targetUrl || lighthouseData.url || lighthouseData.requestedUrl || lighthouseData.finalUrl}</div>
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
              <div style={{ fontSize: '12px', color: getScoreColor(performanceScore), marginTop: '8px' }}>
                {getScoreStatus(performanceScore)}
              </div>
            </div>
            <div className="quick-stat-item">
              <ScoreRing
                label="Tillgänglighet"
                score={accessibilityScore}
                color={getScoreColor(accessibilityScore)}
                size={80}
              />
              <div style={{ fontSize: '12px', color: getScoreColor(accessibilityScore), marginTop: '8px' }}>
                {getScoreStatus(accessibilityScore)}
              </div>
            </div>
            <div className="quick-stat-item">
              <ScoreRing
                label="Bästa praxis"
                score={bestPracticesScore}
                color={getScoreColor(bestPracticesScore)}
                size={80}
              />
              <div style={{ fontSize: '12px', color: getScoreColor(bestPracticesScore), marginTop: '8px' }}>
                {getScoreStatus(bestPracticesScore)}
              </div>
            </div>
            <div className="quick-stat-item">
              <ScoreRing
                label="SEO"
                score={seoScore}
                color={getScoreColor(seoScore)}
                size={80}
              />
              <div style={{ fontSize: '12px', color: getScoreColor(seoScore), marginTop: '8px' }}>
                {getScoreStatus(seoScore)}
              </div>
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
          <PriorityMatrix
            opportunities={lighthouseData.opportunities || []}
            diagnostics={lighthouseData.diagnostics || []}
          />
        </>
      )}

      {/* Table of Contents - Navigation Menu */}
      <TableOfContents result={lighthouseData} type="lighthouse" />

      {/* Sections Container */}
      <div className="sections-container">

        <section id="overview" className="result-section">
          <h2 className="section-title">Översikt</h2>
          <div className="overview-content">
            <div className="metrics-grid">
              <div className="metrics-section">
                <h3>Core Web Vitals <span style={{ fontSize: '0.7em', color: '#666', fontWeight: 'normal' }}>(Lab Data)</span></h3>
                <p className="section-description">
                  Google&apos;s standarder för användarupplevelse - mätt i kontrollerad lab-miljö
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
                <h3>Övriga mätvärden <span style={{ fontSize: '0.7em', color: '#666', fontWeight: 'normal' }}>(Lab Data)</span></h3>
                <p className="section-description">
                  Ytterligare prestandamätningar från lab-miljö
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
        </section>

        <section id="metrics" className="result-section">
          <h2 className="section-title">Core Web Vitals</h2>
          <div className="metrics-content">
            <div className="cwv-explanation">
              <h3>Core Web Vitals förklarat (Lab Data)</h3>
              <p>
                Core Web Vitals är Googles standarder för att mäta användarupplevelsen på webben.
                Dessa mätvärden påverkar din ranking i Googles sökresultat.
              </p>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                fontSize: '14px',
                color: '#475569'
              }}>
                <strong>💡 Lab Data:</strong> Dessa värden kommer från kontrollerade tester i Lighthouse lab-miljö.
                Verkliga användarvärden (Field Data) kan variera beroende på användarens enhet, nätverksförhållanden och geografiska plats.
              </div>
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

                    {/* Progress bar visualization */}
                    {threshold && metric.value !== null && metric.value !== 'Lab data' && (
                      <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                        <div style={{
                          position: 'relative',
                          height: '8px',
                          background: 'linear-gradient(to right, #16a34a 0%, #16a34a 33%, #f59e0b 33%, #f59e0b 66%, #ef4444 66%, #ef4444 100%)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: `${Math.min(100, (metric.value / (threshold.needs * 2)) * 100)}%`,
                            top: '-2px',
                            width: '4px',
                            height: '12px',
                            background: '#1e293b',
                            borderRadius: '2px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '10px',
                          color: '#64748b',
                          marginTop: '4px'
                        }}>
                          <span>0</span>
                          <span>Bra: ≤{threshold.good}{threshold.unit}</span>
                          <span>Behöver: ≤{threshold.needs}{threshold.unit}</span>
                          <span>Dålig: &gt;{threshold.needs}{threshold.unit}</span>
                        </div>
                      </div>
                    )}
                    
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
                      {metric.key === 'inp' && 'Mäter responsivitet - tiden från användarinteraktion till nästa visuella uppdatering.'}
                      {metric.key === 'cls' && 'Mäter visuell stabilitet - hur mycket sidan "hoppar" under laddning.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="opportunities" className="result-section">
          <h2 className="section-title">Förbättringar</h2>
          <div className="opportunities-content">
            <div className="opportunities-explanation">
              <h3>Prestanda-förbättringar</h3>
              <p>
                Dessa rekommendationer kan hjälpa dig att förbättra sidans prestanda och användarupplevelse.
              </p>
            </div>

            {lighthouseData.opportunities && lighthouseData.opportunities.length > 0 ? (
              <div className="opportunities-list">
                {lighthouseData.opportunities.map((opportunity, index) => (
                  <div key={index} className="opportunity-item">
                    <div className="opportunity-header">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getOpportunityIcon(opportunity)}
                        {opportunity.title}
                      </h4>
                      {opportunity.estimatedSavings && (
                        <div className="estimated-savings">
                          Potentiell besparing: {opportunity.estimatedSavings}s
                        </div>
                      )}
                    </div>

                    {/* Impact/Effort Classification */}
                    {(opportunity.impact || opportunity.effort || opportunity.timeEstimate) && (
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '8px',
                        fontSize: '14px'
                      }}>
                        {opportunity.impact && (
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: opportunity.impact === 'Hög' ? '#fee2e2' :
                                           opportunity.impact === 'Medel' ? '#fef3c7' : '#ecfdf5',
                            color: opportunity.impact === 'Hög' ? '#dc2626' :
                                   opportunity.impact === 'Medel' ? '#d97706' : '#059669',
                            fontWeight: '500',
                            border: `1px solid ${opportunity.impact === 'Hög' ? '#fecaca' :
                                                opportunity.impact === 'Medel' ? '#fde68a' : '#bbf7d0'}`
                          }}>
                            Impact: {opportunity.impact}
                          </div>
                        )}
                        {opportunity.effort && (
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            fontWeight: '500',
                            border: '1px solid #e2e8f0'
                          }}>
                            Insats: {opportunity.effort}
                          </div>
                        )}
                        {opportunity.timeEstimate && (
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: '500',
                            border: '1px solid #dbeafe'
                          }}>
                            Tid: {opportunity.timeEstimate}
                          </div>
                        )}
                      </div>
                    )}

                    {opportunity.description && (
                      <p className="opportunity-description">{opportunity.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-opportunities">
                <div className="no-opportunities-icon"><PartyPopper size={64} className="text-green-600 mx-auto" /></div>
                <h3>Fantastiskt!</h3>
                <p>Lighthouse hittade inga större prestandaförbättringar för din webbplats.</p>
              </div>
            )}
          </div>
        </section>

        <section id="diagnostics" className="result-section">
          <h2 className="section-title">Diagnostik</h2>
          <div className="diagnostics-content">
            <div className="diagnostics-explanation">
              <h3>Diagnostisk information</h3>
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
                <div className="no-diagnostics-icon"><CheckCircle size={64} className="text-green-600 mx-auto" /></div>
                <h3>Alla diagnostik godkänd</h3>
                <p>Lighthouse hittade inga diagnostiska problem med din webbplats.</p>
              </div>
            )}
          </div>
        </section>

        <section id="scores" className="result-section">
          <h2 className="section-title">Detaljerade Poäng</h2>
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
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="range-label">90-100: Utmärkt</span>
                </div>
                <div className="score-range warning">
                  <AlertCircle size={16} className="text-yellow-600" />
                  <span className="range-label">50-89: Behöver förbättring</span>
                </div>
                <div className="score-range poor">
                  <XCircle size={16} className="text-red-600" />
                  <span className="range-label">0-49: Dålig</span>
                </div>
              </div>
            </div>
          </div>
        </section>

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
          display: inline-flex;
          align-items: center;
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
          color: #111827;
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

        .score-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .range-label {
          color: #475569;
          font-size: 14px;
        }
      `}</style>
      </div> {/* Close results-container */}
    </div>
  );
};

export default LighthouseResultsDisplay;