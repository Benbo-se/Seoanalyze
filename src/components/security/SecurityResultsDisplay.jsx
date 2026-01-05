'use client';

import React, { useState } from 'react';
import ResultsTopbar from '@/components/results/ResultsTopbar';
import '@/styles/security-results.css';

const SecurityResultsDisplay = ({ result, analysisId }) => {
  const [expandedSections, setExpandedSections] = useState({
    headers: true,
    ssl: true,
    exposedFiles: true,
    vulnerableLibs: true,
    recommendations: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Extract data from result
  const headers = result?.headers || {};
  const ssl = result?.ssl || {};
  const exposedFiles = result?.exposedFiles || [];
  const vulnerableLibraries = result?.vulnerableLibraries || [];
  const mixedContent = result?.mixedContent || { hasIssues: false };
  const aiReport = result?.aiReport || {};
  const score = result?.score || 0;
  const grade = result?.grade || 'F';
  const riskLevel = result?.riskLevel || 'unknown';

  // Get grade styling
  const getGradeClass = (grade) => {
    switch (grade) {
      case 'A': case 'A+': return 'security-grade security-grade-a';
      case 'B': return 'security-grade security-grade-b';
      case 'C': return 'security-grade security-grade-c';
      case 'D': return 'security-grade security-grade-d';
      default: return 'security-grade security-grade-f';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getHeaderGradeClass = (grade) => {
    if (!grade) return 'security-header-unknown';
    switch (grade.toUpperCase()) {
      case 'A': case 'A+': return 'security-header-a';
      case 'B': return 'security-header-b';
      case 'C': return 'security-header-c';
      case 'D': return 'security-header-d';
      default: return 'security-header-f';
    }
  };

  // Count headers
  const presentHeaders = Object.entries(headers).filter(([_, data]) => data.present);
  const missingHeaders = Object.entries(headers).filter(([_, data]) => !data.present);

  // Prepare result object for topbar
  const topbarResult = {
    url: result?.url || '',
    score: score,
    criticalCount: exposedFiles.filter(f => f.status === 200).length + vulnerableLibraries.filter(v => v.severity === 'critical').length,
    warningCount: vulnerableLibraries.filter(v => v.severity === 'high').length,
    okCount: presentHeaders.length
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
    link.download = `security-analysis-${analysisId || 'result'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="security-results-container">
      <ResultsTopbar
        result={topbarResult}
        analysisId={analysisId}
        onNewAnalysis={handleNewAnalysis}
        onDownloadJson={handleDownloadJson}
      />

      <div className="security-results">
        {/* Hero Section with Grade and Score */}
        <div className="security-hero">
          <div className="security-score-section">
            <div className={getGradeClass(grade)}>
              {grade}
            </div>
            <div
              className="security-score-circle"
              style={{ borderColor: getScoreColor(score) }}
            >
              <span className="security-score-number">{score}</span>
              <span className="security-score-label">/ 100</span>
            </div>
          </div>

          {aiReport?.summary && (
            <div className="security-summary">
              <p>{aiReport.summary}</p>
            </div>
          )}
        </div>

        {/* SSL/TLS Section */}
        <div className="security-section">
          <button
            className="security-section-header"
            onClick={() => toggleSection('ssl')}
          >
            <h2>SSL/TLS-certifikat</h2>
            <span className="security-toggle-icon">{expandedSections.ssl ? '?' : '?'}</span>
          </button>

          {expandedSections.ssl && (
            <div className="security-section-content">
              <div className="security-ssl-grid">
                <div className={`security-ssl-card ${ssl.valid ? 'security-ssl-valid' : 'security-ssl-invalid'}`}>
                  <span className="security-ssl-icon">{ssl.valid ? '?' : '?'}</span>
                  <span className="security-ssl-label">Status</span>
                  <span className="security-ssl-value">{ssl.valid ? 'Giltigt' : 'Ogiltigt/Saknas'}</span>
                </div>
                {ssl.protocol && (
                  <div className="security-ssl-card">
                    <span className="security-ssl-icon">?</span>
                    <span className="security-ssl-label">Protokoll</span>
                    <span className="security-ssl-value">{ssl.protocol}</span>
                  </div>
                )}
                {ssl.issuer && (
                  <div className="security-ssl-card">
                    <span className="security-ssl-icon">?</span>
                    <span className="security-ssl-label">Utfärdare</span>
                    <span className="security-ssl-value">{ssl.issuer}</span>
                  </div>
                )}
                {ssl.daysUntilExpiry !== undefined && (
                  <div className={`security-ssl-card ${ssl.daysUntilExpiry < 30 ? 'security-ssl-warning' : ''}`}>
                    <span className="security-ssl-icon">{ssl.daysUntilExpiry < 30 ? '?' : '?'}</span>
                    <span className="security-ssl-label">Dagar kvar</span>
                    <span className="security-ssl-value">{ssl.daysUntilExpiry} dagar</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security Headers Section */}
        <div className="security-section">
          <button
            className="security-section-header"
            onClick={() => toggleSection('headers')}
          >
            <h2>Security Headers ({presentHeaders.length}/{Object.keys(headers).length})</h2>
            <span className="security-toggle-icon">{expandedSections.headers ? '?' : '?'}</span>
          </button>

          {expandedSections.headers && (
            <div className="security-section-content">
              {/* Present Headers */}
              {presentHeaders.length > 0 && (
                <div className="security-headers-group">
                  <h3>Implementerade headers</h3>
                  <div className="security-headers-list">
                    {presentHeaders.map(([name, data], i) => (
                      <div key={i} className={`security-header-item ${getHeaderGradeClass(data.grade)}`}>
                        <div className="security-header-name">
                          <span className="security-check-icon">?</span>
                          {name}
                        </div>
                        {data.grade && (
                          <span className={`security-header-grade ${getHeaderGradeClass(data.grade)}`}>
                            {data.grade}
                          </span>
                        )}
                        {data.value && (
                          <code className="security-header-value">{data.value.substring(0, 60)}...</code>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Headers */}
              {missingHeaders.length > 0 && (
                <div className="security-headers-group security-headers-missing">
                  <h3>Saknade headers</h3>
                  <div className="security-headers-list">
                    {missingHeaders.map(([name, data], i) => (
                      <div key={i} className="security-header-item security-header-missing">
                        <div className="security-header-name">
                          <span className="security-x-icon">?</span>
                          {name}
                        </div>
                        <span className="security-header-importance">
                          {data.importance || 'Rekommenderad'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exposed Files */}
        {exposedFiles.length > 0 && (
          <div className="security-section">
            <button
              className="security-section-header"
              onClick={() => toggleSection('exposedFiles')}
            >
              <h2>Exponerade filer ({exposedFiles.filter(f => f.status === 200).length} hittade)</h2>
              <span className="security-toggle-icon">{expandedSections.exposedFiles ? '?' : '?'}</span>
            </button>

            {expandedSections.exposedFiles && (
              <div className="security-section-content">
                <div className="security-exposed-list">
                  {exposedFiles.filter(f => f.status === 200).map((file, i) => (
                    <div key={i} className="security-exposed-item security-exposed-critical">
                      <span className="security-warning-icon">?</span>
                      <code>{file.path}</code>
                      <span className="security-exposed-status">TILLGANGLIG</span>
                    </div>
                  ))}
                </div>
                {exposedFiles.filter(f => f.status === 200).length === 0 && (
                  <div className="security-empty-state security-empty-good">
                    <span className="security-empty-icon">?</span>
                    <p>Inga känsliga filer hittades exponerade - bra!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vulnerable Libraries */}
        {vulnerableLibraries.length > 0 && (
          <div className="security-section">
            <button
              className="security-section-header"
              onClick={() => toggleSection('vulnerableLibs')}
            >
              <h2>Sarbara bibliotek ({vulnerableLibraries.length})</h2>
              <span className="security-toggle-icon">{expandedSections.vulnerableLibs ? '?' : '?'}</span>
            </button>

            {expandedSections.vulnerableLibs && (
              <div className="security-section-content">
                <div className="security-vuln-list">
                  {vulnerableLibraries.map((lib, i) => (
                    <div key={i} className={`security-vuln-item security-vuln-${lib.severity}`}>
                      <div className="security-vuln-header">
                        <span className="security-vuln-name">{lib.library}</span>
                        <span className="security-vuln-version">v{lib.version}</span>
                        <span className={`security-severity-badge security-severity-${lib.severity}`}>
                          {lib.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="security-vuln-desc">{lib.vulnerability}</p>
                      {lib.cve && (
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${lib.cve}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="security-cve-link"
                        >
                          {lib.cve}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mixed Content */}
        {mixedContent.hasIssues && (
          <div className="security-section security-mixed-content">
            <h2>Mixed Content</h2>
            <div className="security-mixed-warning">
              <span className="security-warning-icon">?</span>
              <p>HTTP-resurser laddas pa en HTTPS-sida, vilket undergraver sakerhetsskyddet.</p>
            </div>
            {mixedContent.resources?.length > 0 && (
              <div className="security-mixed-list">
                {mixedContent.resources.slice(0, 10).map((res, i) => (
                  <code key={i} className="security-mixed-resource">{res}</code>
                ))}
                {mixedContent.resources.length > 10 && (
                  <p className="security-mixed-more">...och {mixedContent.resources.length - 10} till</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Critical Issues from AI */}
        {aiReport?.criticalIssues?.length > 0 && (
          <div className="security-section">
            <h2>Kritiska problem</h2>
            <div className="security-issues-list">
              {aiReport.criticalIssues.map((issue, i) => (
                <div key={i} className={`security-issue-card security-issue-${issue.severity || 'high'}`}>
                  <div className="security-issue-header">
                    <h3>{issue.issue}</h3>
                    {issue.owaspRef && (
                      <span className="security-owasp-badge">{issue.owaspRef}</span>
                    )}
                  </div>
                  <p className="security-issue-description">{issue.description}</p>
                  <div className="security-issue-action">
                    <strong>Atgärd:</strong> {issue.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {aiReport?.recommendations?.length > 0 && (
          <div className="security-section">
            <button
              className="security-section-header"
              onClick={() => toggleSection('recommendations')}
            >
              <h2>Rekommendationer ({aiReport.recommendations.length})</h2>
              <span className="security-toggle-icon">{expandedSections.recommendations ? '?' : '?'}</span>
            </button>

            {expandedSections.recommendations && (
              <div className="security-section-content">
                <div className="security-recommendations-list">
                  {aiReport.recommendations.map((rec, i) => (
                    <div key={i} className={`security-recommendation-card security-priority-${rec.priority}`}>
                      <div className="security-rec-header">
                        <span className={`security-priority-badge security-priority-${rec.priority}`}>
                          {rec.priority === 'high' ? 'Hog' : rec.priority === 'medium' ? 'Medium' : 'Lag'}
                        </span>
                        <h4>{rec.title}</h4>
                      </div>
                      <p>{rec.description}</p>
                      {rec.implementation && (
                        <div className="security-rec-impl">
                          <strong>Implementation:</strong>
                          <code>{rec.implementation}</code>
                        </div>
                      )}
                      {rec.estimatedTime && (
                        <span className="security-rec-time">? {rec.estimatedTime}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header Recommendations */}
        {aiReport?.headerRecommendations?.length > 0 && (
          <div className="security-section">
            <h2>Header-rekommendationer</h2>
            <div className="security-header-recs">
              {aiReport.headerRecommendations.map((rec, i) => (
                <div key={i} className="security-header-rec-card">
                  <h4>{rec.header}</h4>
                  <code className="security-header-rec-value">{rec.recommended}</code>
                  <p>{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {aiReport?.strengths?.length > 0 && (
          <div className="security-section">
            <h2>Styrkor</h2>
            <div className="security-strengths-list">
              {aiReport.strengths.map((strength, i) => (
                <div key={i} className="security-strength-item">
                  <span className="security-strength-icon">?</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Plan */}
        {aiReport?.actionPlan && (
          <div className="security-section">
            <h2>Handlingsplan</h2>
            <div className="security-action-plan">
              {aiReport.actionPlan.immediate && (
                <div className="security-action-step security-action-immediate">
                  <h4>? Omedelbart (24-48 timmar)</h4>
                  <p>{aiReport.actionPlan.immediate}</p>
                </div>
              )}
              {aiReport.actionPlan.shortTerm && (
                <div className="security-action-step security-action-short">
                  <h4>? Kortsiktigt (1-2 veckor)</h4>
                  <p>{aiReport.actionPlan.shortTerm}</p>
                </div>
              )}
              {aiReport.actionPlan.longTerm && (
                <div className="security-action-step security-action-long">
                  <h4>? Langsiktigt</h4>
                  <p>{aiReport.actionPlan.longTerm}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="security-disclaimer">
          <p>
            <strong>Disclaimer:</strong> Denna analys är vägledande och ersatter inte en professionell
            penetrationstest. Kontakta en säkerhetsexpert för en fullständig granskning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityResultsDisplay;
