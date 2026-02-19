'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, ChevronRight, Shield, Clock, AlertCircle } from 'lucide-react';
import ResultsTopbar from '@/components/results/ResultsTopbar';
import '@/styles/gdpr-results.css';

const GdprResultsDisplay = ({ result, analysisId }) => {
  const [expandedSections, setExpandedSections] = useState({
    cookies: true,
    violations: true,
    recommendations: true,
    aiReport: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Extract data from result
  const cookiesBeforeConsent = result?.cookiesBeforeConsent || [];
  const trackingScripts = result?.trackingScripts || [];
  const violations = result?.violations || [];
  const compliant = result?.compliant || [];
  const aiReport = result?.aiReport || {};
  const complianceScore = result?.complianceScore || 0;
  const riskLevel = result?.riskLevel || 'unknown';
  const banner = result?.banner || {};

  // Get risk level styling
  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'critical': return 'gdpr-risk-badge gdpr-risk-critical';
      case 'high': return 'gdpr-risk-badge gdpr-risk-high';
      case 'medium': return 'gdpr-risk-badge gdpr-risk-medium';
      case 'low': return 'gdpr-risk-badge gdpr-risk-low';
      default: return 'gdpr-risk-badge gdpr-risk-unknown';
    }
  };

  const getRiskLabel = (level) => {
    switch (level) {
      case 'critical': return 'KRITISK RISK';
      case 'high': return 'HÖG RISK';
      case 'medium': return 'MEDIUM RISK';
      case 'low': return 'LÅG RISK';
      default: return 'OKÄND RISK';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Prepare result object for topbar
  const topbarResult = {
    url: result?.url || '',
    score: complianceScore,
    criticalCount: violations.length,
    warningCount: 0,
    okCount: compliant.length
  };

  const handleNewAnalysis = () => {
    window.location.href = '/';
  };

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gdpr-analysis-${analysisId || 'result'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="gdpr-results-container">
      <ResultsTopbar
        result={topbarResult}
        analysisId={analysisId}
        onNewAnalysis={handleNewAnalysis}
        onDownloadJson={handleDownloadJson}
      />

      <div className="gdpr-results">
        {/* Hero Section with Score */}
        <div className="gdpr-hero">
          <div className="gdpr-score-section">
            <div
              className="gdpr-score-circle"
              style={{ borderColor: getScoreColor(complianceScore) }}
            >
              <span className="gdpr-score-number">{complianceScore}</span>
              <span className="gdpr-score-label">GDPR Score</span>
            </div>
            <span className={getRiskBadgeClass(riskLevel)}>
              {getRiskLabel(riskLevel)}
            </span>
          </div>

          {aiReport?.summary && (
            <div className="gdpr-summary">
              <p>{aiReport.summary}</p>
            </div>
          )}
        </div>

        {/* Cookie Banner Status */}
        <div className="gdpr-section gdpr-banner-status">
          <h2>Cookie-banner Status</h2>
          <div className="gdpr-banner-grid">
            <div className={`gdpr-status-card ${banner?.exists ? 'gdpr-status-ok' : 'gdpr-status-error'}`}>
              {banner?.exists ? <CheckCircle size={20} className="icon-ok" /> : <XCircle size={20} className="icon-error" />}
              <span className="gdpr-status-label">Cookie-banner</span>
              <span className="gdpr-status-value">{banner?.exists ? 'Hittad' : 'Saknas'}</span>
            </div>
            <div className={`gdpr-status-card ${banner?.hasAcceptAll ? 'gdpr-status-ok' : 'gdpr-status-warning'}`}>
              {banner?.hasAcceptAll ? <CheckCircle size={20} className="icon-ok" /> : <AlertTriangle size={20} className="icon-warning" />}
              <span className="gdpr-status-label">"Acceptera alla"</span>
              <span className="gdpr-status-value">{banner?.hasAcceptAll ? 'Finns' : 'Saknas'}</span>
            </div>
            <div className={`gdpr-status-card ${banner?.hasRejectAll ? 'gdpr-status-ok' : 'gdpr-status-warning'}`}>
              {banner?.hasRejectAll ? <CheckCircle size={20} className="icon-ok" /> : <AlertTriangle size={20} className="icon-warning" />}
              <span className="gdpr-status-label">"Neka alla"-knapp</span>
              <span className="gdpr-status-value">{banner?.hasRejectAll ? 'Finns' : 'Saknas'}</span>
            </div>
            {result?.cmpProvider && (
              <div className="gdpr-status-card gdpr-status-info">
                <Info size={20} className="icon-info" />
                <span className="gdpr-status-label">CMP-leverantör</span>
                <span className="gdpr-status-value">{result.cmpProvider}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cookies Before Consent */}
        <div className="gdpr-section">
          <button
            className="gdpr-section-header"
            onClick={() => toggleSection('cookies')}
          >
            <h2>Cookies innan samtycke ({cookiesBeforeConsent.length})</h2>
            {expandedSections.cookies ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>

          {expandedSections.cookies && (
            <div className="gdpr-section-content">
              {cookiesBeforeConsent.length === 0 ? (
                <div className="gdpr-empty-state gdpr-empty-good">
                  <CheckCircle size={24} className="icon-ok" />
                  <p>Inga cookies hittades innan samtycke - bra!</p>
                </div>
              ) : (
                <table className="gdpr-cookie-table">
                  <thead>
                    <tr>
                      <th>Cookie</th>
                      <th>Kategori</th>
                      <th>Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookiesBeforeConsent.map((cookie, i) => (
                      <tr key={i} className={cookie.isTracking ? 'gdpr-row-violation' : ''}>
                        <td className="gdpr-cookie-name">{cookie.name}</td>
                        <td>
                          <span className={`gdpr-category-badge gdpr-cat-${cookie.category || 'unknown'}`}>
                            {cookie.category || 'Okänd'}
                          </span>
                        </td>
                        <td>
                          {cookie.isTracking ? (
                            <span className="gdpr-tracking-yes">Tracking</span>
                          ) : (
                            <span className="gdpr-tracking-no">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Tracking Scripts */}
        {trackingScripts.length > 0 && (
          <div className="gdpr-section">
            <h2>Tracking-skript ({trackingScripts.length})</h2>
            <div className="gdpr-scripts-list">
              {trackingScripts.map((script, i) => (
                <div key={i} className="gdpr-script-item">
                  <span className="gdpr-script-name">{script.name}</span>
                  <span className="gdpr-script-type">{script.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Violations */}
        {violations.length > 0 && (
          <div className="gdpr-section">
            <button
              className="gdpr-section-header"
              onClick={() => toggleSection('violations')}
            >
              <h2>Överträdelser ({violations.length})</h2>
              {expandedSections.violations ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>

            {expandedSections.violations && (
              <div className="gdpr-section-content">
                {violations.map((violation, i) => (
                  <div key={i} className={`gdpr-violation-card gdpr-severity-${violation.severity || 'medium'}`}>
                    <div className="gdpr-violation-header">
                      {(violation.severity === 'critical' || violation.severity === 'high')
                        ? <XCircle size={18} className="icon-error" />
                        : <AlertTriangle size={18} className="icon-warning" />}
                      <h4>{violation.issue || (typeof violation === 'string' ? violation : 'Överträdelse')}</h4>
                      {violation.gdprArticle && (
                        <span className="gdpr-article-badge">{violation.gdprArticle}</span>
                      )}
                    </div>
                    {violation.description && (
                      <p className="gdpr-violation-description">{violation.description}</p>
                    )}
                    {violation.action && (
                      <div className="gdpr-violation-action">
                        <strong>Åtgärd:</strong> {violation.action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Critical Issues from AI */}
        {aiReport?.criticalIssues?.length > 0 && (
          <div className="gdpr-section">
            <h2>Kritiska problem</h2>
            <div className="gdpr-issues-list">
              {aiReport.criticalIssues.map((issue, i) => (
                <div key={i} className="gdpr-issue-card gdpr-issue-critical">
                  <div className="gdpr-issue-header">
                    <h3>{issue.issue}</h3>
                    {issue.gdprArticle && (
                      <span className="gdpr-article-badge">{issue.gdprArticle}</span>
                    )}
                  </div>
                  <p className="gdpr-issue-description">{issue.description}</p>
                  <div className="gdpr-issue-action">
                    <strong>Åtgärd:</strong> {issue.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {aiReport?.recommendations?.length > 0 && (
          <div className="gdpr-section">
            <button
              className="gdpr-section-header"
              onClick={() => toggleSection('recommendations')}
            >
              <h2>Rekommendationer ({aiReport.recommendations.length})</h2>
              {expandedSections.recommendations ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>

            {expandedSections.recommendations && (
              <div className="gdpr-section-content">
                <div className="gdpr-recommendations-list">
                  {aiReport.recommendations.map((rec, i) => (
                    <div key={i} className={`gdpr-recommendation-card gdpr-priority-${rec.priority}`}>
                      <div className="gdpr-rec-header">
                        <span className={`gdpr-priority-badge gdpr-priority-${rec.priority}`}>
                          {rec.priority === 'high' ? 'Hög prioritet' : rec.priority === 'medium' ? 'Medium' : 'Låg prioritet'}
                        </span>
                        <h4>{rec.title}</h4>
                      </div>
                      <p>{rec.description}</p>
                      {rec.estimatedTime && (
                        <span className="gdpr-rec-time">Uppskattad tid: {rec.estimatedTime}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliant Aspects */}
        {(compliant.length > 0 || aiReport?.compliantAspects?.length > 0) && (
          <div className="gdpr-section">
            <h2>Vad som fungerar bra</h2>
            <div className="gdpr-compliant-list">
              {[...compliant, ...(aiReport?.compliantAspects || [])].map((item, i) => (
                <div key={i} className="gdpr-compliant-item">
                  <CheckCircle size={16} className="icon-ok" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Potential Fine Risk */}
        {aiReport?.potentialFineRisk && (
          <div className="gdpr-section gdpr-fine-section">
            <h2>Uppskattad bötrisk</h2>
            <div className="gdpr-fine-card">
              <p>{aiReport.potentialFineRisk}</p>
            </div>
          </div>
        )}

        {/* Action Plan */}
        {aiReport?.actionPlan && (
          <div className="gdpr-section">
            <h2>Handlingsplan</h2>
            <div className="gdpr-action-plan">
              {aiReport.actionPlan.immediate && (
                <div className="gdpr-action-step gdpr-action-immediate">
                  <h4>Omedelbart (1 vecka)</h4>
                  <p>{aiReport.actionPlan.immediate}</p>
                </div>
              )}
              {aiReport.actionPlan.shortTerm && (
                <div className="gdpr-action-step gdpr-action-short">
                  <h4>Kortsiktigt (1 månad)</h4>
                  <p>{aiReport.actionPlan.shortTerm}</p>
                </div>
              )}
              {aiReport.actionPlan.longTerm && (
                <div className="gdpr-action-step gdpr-action-long">
                  <h4>Långsiktigt</h4>
                  <p>{aiReport.actionPlan.longTerm}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="gdpr-disclaimer">
          <p>
            <strong>Disclaimer:</strong> Denna analys är vägledande och ersätter inte juridisk rådgivning.
            Kontakta en GDPR-expert för en fullständig compliance-granskning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GdprResultsDisplay;
