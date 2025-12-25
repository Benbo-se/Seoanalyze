'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationCircle,
  faChartLine,
  faTachometerAlt,
  faSearch,
  faSpider,
  faUniversalAccess,
  faExclamationTriangle,
  faLightbulb,
  faClock,
  faTrophy,
  faGlobe,
  faCheckCircle,
  faTimesCircle,
  faRocket
} from '@/lib/icons';
import { useAiAnalysis } from '@/hooks/useAiAnalysis';
import ResultsTopbar from '@/components/results/ResultsTopbar';
import ConsultationBanner from '@/components/common/ConsultationBanner';
import '@/styles/ai-results.css';

const AiAnalysisResults = ({ jobId, analysis: providedAnalysis, isSharedView = false }) => {
  const { analysis: fetchedAnalysis, loading, error } = useAiAnalysis(jobId);

  // Use provided analysis for shared view, otherwise use fetched analysis
  const analysis = isSharedView ? providedAnalysis : fetchedAnalysis;

  // Handlers for ResultsTopbar actions
  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${analysis.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('PDF download failed. Please try again.');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF download failed. Please try again.');
    }
  };

  const handleDownloadJson = () => {
    const jsonData = {
      analysisId: analysis.id,
      timestamp: new Date().toISOString(),
      type: 'ai-analysis',
      url: analysis.targetUrl,
      score: analysis.aiReport?.score,
      fullData: analysis
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${analysis.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 90 })
      });
      if (response.ok) {
        const shareData = await response.json();
        if (navigator.share) {
          await navigator.share({
            title: 'AI SEO-Analys Resultat',
            text: `AI SEO-analys av ${analysis.targetUrl}`,
            url: shareData.shareUrl,
          });
        } else {
          navigator.clipboard.writeText(shareData.shareUrl).then(() => {
            alert(`Delningslänk kopierad till urklipp!\n\nLänken är giltig till: ${new Date(shareData.expiresAt).toLocaleDateString('sv-SE')}`);
          }).catch(() => {
            alert(`Delningslänk skapad:\n${shareData.shareUrl}\n\nGiltig till: ${new Date(shareData.expiresAt).toLocaleDateString('sv-SE')}`);
          });
        }
      } else {
        alert('Delning misslyckades. Försök igen.');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Kunde inte skapa delningslänk');
    }
  };

  const handleNewAnalysis = () => {
    window.location.href = '/ai-analys';
  };

  if (!isSharedView && (loading || !analysis)) {
    return (
      <div className="ai-results-loading">
        <div className="loading-spinner"></div>
        <h2>Analyserar din webbplats...</h2>
        <p>Detta tar 5-25 minuter beroende på sidans storlek</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-results-error">
        <FontAwesomeIcon icon={faExclamationCircle} />
        <h2>Något gick fel</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Show progress if still processing (not for shared view)
  if (!isSharedView && analysis?.status !== 'completed') {
    return (
      <div className="ai-results-loading">
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${analysis.progress}%` }}></div>
        </div>
        <h2>{getStatusText(analysis.status)}</h2>
        <p>{analysis.progress}% färdigt</p>
      </div>
    );
  }

  const report = analysis.aiReport || {};
  const score = report.score || 0;

  return (
    <>
      {/* ResultsTopbar - same as SEO, Crawl, and Lighthouse (hide in shared view) */}
      {!isSharedView && (
        <ResultsTopbar
          result={{
            targetUrl: analysis.targetUrl,
            url: analysis.targetUrl,
            score: score,
            seoScore: score
          }}
          analysisId={analysis.id}
          onDownloadPdf={handleDownloadPdf}
          onDownloadJson={handleDownloadJson}
          onShare={handleShare}
          onNewAnalysis={handleNewAnalysis}
        />
      )}

      <div className="ai-results">
        <div className="ai-results-container">
        {/* Hero Section with Score */}
        <div className="ai-results-hero">
          <div className="ai-hero-content">
            <h1>SEO-Analys för {analysis.targetUrl}</h1>
            <p className="ai-hero-subtitle">Professionell AI-genererad rapport</p>

            {/* Links to underlying analyses */}
            <div className="ai-analysis-links">
              {analysis.userAnalysisId && (
                <a href={`/analys/${analysis.userAnalysisId}`} target="_blank" rel="noopener noreferrer" className="ai-analysis-link">
                  <FontAwesomeIcon icon={faChartLine} /> SEO Crawl-analys
                </a>
              )}
              {analysis.userLighthouseId && (
                <a href={`/analys/${analysis.userLighthouseId}`} target="_blank" rel="noopener noreferrer" className="ai-analysis-link">
                  <FontAwesomeIcon icon={faTachometerAlt} /> Lighthouse-analys
                </a>
              )}
            </div>
          </div>

          <div className="ai-score-circle">
            <svg viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="12"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="12"
                strokeDasharray={`${(score / 100) * 565} 565`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="ai-score-text">
              <div className="ai-score-number">{score}</div>
              <div className="ai-score-label">SEO Hälsa</div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        {report.scoreBreakdown && (
          <div className="ai-score-breakdown">
            <h3>Poängfördelning</h3>
            <div className="ai-breakdown-grid">
              {report.scoreBreakdown.performance !== undefined && (
                <div className="ai-breakdown-item">
                  <div className="ai-breakdown-label">
                    <FontAwesomeIcon icon={faTachometerAlt} />
                    Performance (40%)
                  </div>
                  <div className="ai-breakdown-bar">
                    <div
                      className="ai-breakdown-fill"
                      style={{
                        width: `${report.scoreBreakdown.performance}%`,
                        background: getScoreColor(report.scoreBreakdown.performance)
                      }}
                    ></div>
                  </div>
                  <div className="ai-breakdown-score">{report.scoreBreakdown.performance}/100</div>
                </div>
              )}

              {report.scoreBreakdown.seo !== undefined && (
                <div className="ai-breakdown-item">
                  <div className="ai-breakdown-label">
                    <FontAwesomeIcon icon={faSearch} />
                    SEO (30%)
                  </div>
                  <div className="ai-breakdown-bar">
                    <div
                      className="ai-breakdown-fill"
                      style={{
                        width: `${report.scoreBreakdown.seo}%`,
                        background: getScoreColor(report.scoreBreakdown.seo)
                      }}
                    ></div>
                  </div>
                  <div className="ai-breakdown-score">{report.scoreBreakdown.seo}/100</div>
                </div>
              )}

              {report.scoreBreakdown.crawlHealth !== undefined && (
                <div className="ai-breakdown-item">
                  <div className="ai-breakdown-label">
                    <FontAwesomeIcon icon={faSpider} />
                    Crawl Health (20%)
                  </div>
                  <div className="ai-breakdown-bar">
                    <div
                      className="ai-breakdown-fill"
                      style={{
                        width: `${report.scoreBreakdown.crawlHealth}%`,
                        background: getScoreColor(report.scoreBreakdown.crawlHealth)
                      }}
                    ></div>
                  </div>
                  <div className="ai-breakdown-score">{report.scoreBreakdown.crawlHealth}/100</div>
                </div>
              )}

              {report.scoreBreakdown.accessibility !== undefined && (
                <div className="ai-breakdown-item">
                  <div className="ai-breakdown-label">
                    <FontAwesomeIcon icon={faUniversalAccess} />
                    Tillgänglighet (10%)
                  </div>
                  <div className="ai-breakdown-bar">
                    <div
                      className="ai-breakdown-fill"
                      style={{
                        width: `${report.scoreBreakdown.accessibility}%`,
                        background: getScoreColor(report.scoreBreakdown.accessibility)
                      }}
                    ></div>
                  </div>
                  <div className="ai-breakdown-score">{report.scoreBreakdown.accessibility}/100</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Critical Issues */}
        {report.criticalIssues && report.criticalIssues.length > 0 && (
          <div className="ai-section">
            <h2 className="ai-section-title">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              Kritiska Problem att Fixa Nu
            </h2>

            <div className="ai-issues-grid">
              {report.criticalIssues.map((issue, index) => (
                <div key={index} className="ai-issue-card critical">
                  <div className="ai-issue-header">
                    <span className="ai-issue-number">{index + 1}</span>
                    <h3>{issue.issue}</h3>
                  </div>
                  <p className="ai-issue-description">{issue.description}</p>
                  <div className="ai-issue-action">
                    <FontAwesomeIcon icon={faLightbulb} />
                    <strong>Åtgärd:</strong> {issue.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        {report.improvements && report.improvements.length > 0 && (
          <div className="ai-section">
            <h2 className="ai-section-title">
              <FontAwesomeIcon icon={faChartLine} />
              Förbättringsmöjligheter
            </h2>

            <div className="ai-improvements-list">
              {report.improvements.map((improvement, index) => (
                <div key={index} className="ai-improvement-card">
                  <div className="ai-improvement-header">
                    <h3>{improvement.area || improvement.title}</h3>
                    {improvement.priority && (
                      <span className={`ai-priority ${improvement.priority.toLowerCase()}`}>
                        {improvement.priority}
                      </span>
                    )}
                  </div>
                  <p className="ai-improvement-description">{improvement.description || improvement.action}</p>

                  {improvement.action && improvement.action !== improvement.description && (
                    <div className="ai-improvement-action">
                      <strong>Åtgärd:</strong> {improvement.action}
                    </div>
                  )}

                  <div className="ai-improvement-meta">
                    {improvement.estimatedTime && (
                      <span className="ai-meta-item">
                        <FontAwesomeIcon icon={faClock} /> {improvement.estimatedTime}
                      </span>
                    )}
                    {improvement.expectedImpact && (
                      <span className="ai-meta-item">
                        <FontAwesomeIcon icon={faChartLine} /> {improvement.expectedImpact}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitor Comparison */}
        {report.comparison && (
          <div className="ai-section">
            <h2 className="ai-section-title">
              <FontAwesomeIcon icon={faTrophy} />
              Konkurrentjämförelse
            </h2>

            {/* Competitors list */}
            {analysis.competitors && analysis.competitors.length > 0 && (
              <div className="ai-competitors-list">
                <h3>Analyserade konkurrenter:</h3>
                <ul>
                  {analysis.competitors.map((competitor, i) => (
                    <li key={i}>
                      <FontAwesomeIcon icon={faGlobe} />
                      <a href={competitor} target="_blank" rel="noopener noreferrer">{competitor}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ai-comparison-card">
              {report.comparison.summary && (
                <p className="ai-comparison-summary">{report.comparison.summary}</p>
              )}

              <div className="ai-comparison-grid">
                {report.comparison.strengths && report.comparison.strengths.length > 0 && (
                  <div className="ai-comparison-col">
                    <h3><FontAwesomeIcon icon={faCheckCircle} /> Styrkor</h3>
                    <ul>
                      {report.comparison.strengths.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.comparison.weaknesses && report.comparison.weaknesses.length > 0 && (
                  <div className="ai-comparison-col">
                    <h3><FontAwesomeIcon icon={faTimesCircle} /> Svagheter</h3>
                    <ul>
                      {report.comparison.weaknesses.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.comparison.opportunities && report.comparison.opportunities.length > 0 && (
                  <div className="ai-comparison-col">
                    <h3><FontAwesomeIcon icon={faLightbulb} /> Möjligheter</h3>
                    <ul>
                      {report.comparison.opportunities.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expected Impact */}
        {report.impact && (
          <div className="ai-section">
            <h2 className="ai-section-title">
              <FontAwesomeIcon icon={faRocket} />
              Förväntad Effekt
            </h2>

            <div className="ai-impact-grid">
              {report.impact.immediate && (
                <div className="ai-impact-card">
                  <h3>Omedelbar (1-4 veckor)</h3>
                  <p>{report.impact.immediate}</p>
                </div>
              )}

              {report.impact.short_term && (
                <div className="ai-impact-card">
                  <h3>Kort sikt (1-3 månader)</h3>
                  <p>{report.impact.short_term}</p>
                </div>
              )}

              {report.impact.long_term && (
                <div className="ai-impact-card">
                  <h3>Lång sikt (3-12 månader)</h3>
                  <p>{report.impact.long_term}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="ai-results-footer">
          <p>Vill du ha hjälp med att implementera dessa förbättringar?</p>
          <a href="/" className="ai-cta-button">Analysera en annan sajt</a>
        </div>
        </div>
      </div>

      {/* Consultation Banner - only show when analysis is completed and not in shared view */}
      {!isSharedView && analysis?.status === 'completed' && <ConsultationBanner />}
    </>
  );
};

function getStatusText(status) {
  const statusMap = {
    'pending': 'Förbereder analys...',
    'crawling_user': 'Crawlar din webbplats...',
    'finding_competitors': 'Söker konkurrenter...',
    'crawling_competitors': 'Analyserar konkurrenter...',
    'analyzing': 'AI genererar rapport...',
    'failed': 'Analysen misslyckades'
  };
  return statusMap[status] || 'Bearbetar...';
}

function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // Green
  if (score >= 60) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
}

export default AiAnalysisResults;
