'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { normalizeCrawl } from '../../utils/normalizeCrawl';

// Helper functions
const fmtNum = (n) => {
  if (n == null) return '—';
  try {
    return new Intl.NumberFormat('sv-SE').format(n);
  } catch { return String(n); }
};

const fmtMs = (ms) => {
  if (!ms) return '—';
  if (ms < 1000) return `${fmtNum(ms)} ms`;
  return `${(ms/1000).toFixed(1).replace('.', ',')} s`;
};

const fmtBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Grade color mapping
const getGradeColor = (grade) => {
  const gradeColors = {
    'A': '#16a34a', 'B': '#65a30d', 'C': '#ca8a04',
    'D': '#ea580c', 'E': '#dc2626', 'F': '#dc2626'
  };
  return gradeColors[grade] || '#6b7280';
};

// Priority colors
const getPriorityColor = (priority) => {
  switch(priority?.toLowerCase()) {
    case 'high': case 'critical': return '#dc2626';
    case 'medium': return '#ea580c';
    case 'low': return '#16a34a';
    default: return '#6b7280';
  }
};

// Hero Section Component
function HeroSection({ vm }) {
  const { linkmap, pages, statusBuckets, rum, summary } = vm;

  const totalPages = pages.length;
  const healthyPages = statusBuckets['2xx'] || 0;
  const healthPercent = totalPages > 0 ? Math.round((healthyPages / totalPages) * 100) : 0;

  const grade = linkmap.grade || 'N/A';
  const score = linkmap.score || 0;

  return (
    <div className="hero-section">
      <div className="hero-grid">
        {/* Main Score */}
        <div className="hero-score-card">
          <div className="score-display">
            <div
              className="grade-circle"
              style={{ backgroundColor: getGradeColor(grade) }}
            >
              {grade}
            </div>
            <div className="score-details">
              <div className="score-number">{score}/100</div>
              <div className="score-label">Crawl Score</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="hero-metrics">
          <div className="metric-card">
            <div className="metric-value">{fmtNum(totalPages)}</div>
            <div className="metric-label">Sidor crawlade</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{healthPercent}%</div>
            <div className="metric-label">Friska sidor</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{fmtNum(linkmap.internalLinks.length)}</div>
            <div className="metric-label">Interna länkar</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{fmtMs(summary.durationMs)}</div>
            <div className="metric-label">Crawl-tid</div>
          </div>
        </div>

        {/* RUM Performance (if available) */}
        {rum && (
          <div className="hero-rum">
            <h3>Real User Metrics</h3>
            <div className="rum-metrics">
              <div className="rum-metric">
                <span className="rum-value">{fmtNum(rum.p75?.lcp_p75)}ms</span>
                <span className="rum-label">LCP (P75)</span>
              </div>
              <div className="rum-metric">
                <span className="rum-value">{rum.p75?.cls_p75 || '—'}</span>
                <span className="rum-label">CLS (P75)</span>
              </div>
              <div className="rum-metric">
                <span className="rum-value">{fmtNum(rum.p75?.inp_p75)}ms</span>
                <span className="rum-label">INP (P75)</span>
              </div>
            </div>
            <div className="rum-info">
              {fmtNum(rum.samples)} mätningar från {rum.days} dagar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Priority Issues Component
function PriorityIssues({ vm, quickActions, ruleEngine }) {
  const { issues } = vm;

  // Calculate total issues by severity
  const criticalIssues = [
    ...issues.missingTitle,
    ...issues.brokenLinks,
    ...issues.brokenImages
  ];

  const mediumIssues = [
    ...issues.missingMeta,
    ...issues.missingH1,
    ...issues.thinContent
  ];

  const lowIssues = [
    ...issues.imagesWithoutAlt
  ];

  return (
    <div className="priority-section">
      <h2 className="section-title">🎯 Prioriterade åtgärder</h2>

      {/* Quick Actions from AI */}
      {quickActions && quickActions.length > 0 && (
        <div className="quick-actions-grid">
          {quickActions.slice(0, 3).map((action, index) => (
            <div
              key={index}
              className="action-card"
              style={{ borderLeftColor: getPriorityColor(action.priority) }}
            >
              <div className="action-header">
                <span className="action-icon">{action.icon || '⚡'}</span>
                <span className="action-title">{action.title}</span>
              </div>
              <div className="action-description">{action.description}</div>
              <div className="action-priority">
                Prioritet: <span style={{ color: getPriorityColor(action.priority) }}>
                  {action.priority || 'Medium'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Severity Overview */}
      <div className="severity-overview">
        <div className="severity-card critical">
          <div className="severity-count">{criticalIssues.length}</div>
          <div className="severity-label">Kritiska problem</div>
          <div className="severity-description">Behöver omedelbar åtgärd</div>
        </div>
        <div className="severity-card medium">
          <div className="severity-count">{mediumIssues.length}</div>
          <div className="severity-label">Viktiga problem</div>
          <div className="severity-description">Bör åtgärdas snart</div>
        </div>
        <div className="severity-card low">
          <div className="severity-count">{lowIssues.length}</div>
          <div className="severity-label">Mindre problem</div>
          <div className="severity-description">Kan vänta</div>
        </div>
      </div>
    </div>
  );
}

// Link Intelligence Component
function LinkIntelligence({ vm }) {
  const { linkmap, pages } = vm;

  const topPages = linkmap.topLinkedPages || [];
  const orphans = linkmap.orphanPages || [];
  const distribution = linkmap.linkDistribution || {};

  return (
    <div className="link-intelligence">
      <h2 className="section-title">🔗 Link Intelligence</h2>

      <div className="link-grid">
        {/* Link Distribution */}
        <div className="link-card">
          <h3>Länkfördelning</h3>
          <div className="link-stats">
            <div className="link-stat">
              <span className="stat-value">{fmtNum(distribution.totalInternal)}</span>
              <span className="stat-label">Totalt interna</span>
            </div>
            <div className="link-stat">
              <span className="stat-value">{distribution.averageInternalPerPage}</span>
              <span className="stat-label">Per sida (snitt)</span>
            </div>
            <div className="link-stat">
              <span className="stat-value">{fmtNum(distribution.totalExternal)}</span>
              <span className="stat-label">Externa länkar</span>
            </div>
          </div>
        </div>

        {/* Top Linked Pages */}
        {topPages.length > 0 && (
          <div className="link-card">
            <h3>Mest länkade sidor</h3>
            <div className="top-pages-list">
              {topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="top-page-item">
                  <div className="page-url" title={page.url}>
                    {page.url?.replace(/^https?:\/\/[^\/]+/, '') || page.url}
                  </div>
                  <div className="page-links">{page.inboundLinks} länkar</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orphan Pages */}
        {orphans.length > 0 && (
          <div className="link-card orphan-card">
            <h3>⚠️ Orphan-sidor ({orphans.length})</h3>
            <div className="orphan-description">
              Sidor utan inkommande interna länkar
            </div>
            {orphans.slice(0, 3).map((orphan, index) => (
              <div key={index} className="orphan-item">
                {orphan.url || orphan}
              </div>
            ))}
            {orphans.length > 3 && (
              <div className="orphan-more">...och {orphans.length - 3} till</div>
            )}
          </div>
        )}
      </div>

      {/* Link Recommendations */}
      {linkmap.recommendations && linkmap.recommendations.length > 0 && (
        <div className="link-recommendations">
          <h3>💡 Länkrekommendationer</h3>
          {linkmap.recommendations.slice(0, 2).map((rec, index) => (
            <div key={index} className="recommendation-item">
              <div className="rec-issue">{rec.issue}</div>
              <div className="rec-fix">{rec.fix}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Technical Health Component
function TechnicalHealth({ vm }) {
  const { issues, statusBuckets, pages, sitemap, robotsTxt } = vm;

  const totalIssues = Object.values(issues).reduce((sum, issueArray) =>
    sum + (Array.isArray(issueArray) ? issueArray.length : 0), 0
  );

  return (
    <div className="technical-health">
      <h2 className="section-title">🔧 Teknisk hälsa</h2>

      <div className="tech-grid">
        {/* Status Codes Overview */}
        <div className="tech-card">
          <h3>HTTP Status</h3>
          <div className="status-chart">
            {Object.entries(statusBuckets).map(([status, count]) => (
              count > 0 && (
                <div key={status} className={`status-bar status-${status}`}>
                  <span className="status-label">{status}</span>
                  <span className="status-count">{fmtNum(count)}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Technical Issues */}
        <div className="tech-card">
          <h3>SEO-grundläggande</h3>
          <div className="issue-list">
            <div className="issue-item">
              <span className="issue-label">Saknar titel</span>
              <span className={`issue-count ${issues.missingTitle.length > 0 ? 'error' : 'success'}`}>
                {issues.missingTitle.length}
              </span>
            </div>
            <div className="issue-item">
              <span className="issue-label">Saknar meta description</span>
              <span className={`issue-count ${issues.missingMeta.length > 0 ? 'warning' : 'success'}`}>
                {issues.missingMeta.length}
              </span>
            </div>
            <div className="issue-item">
              <span className="issue-label">Saknar H1</span>
              <span className={`issue-count ${issues.missingH1.length > 0 ? 'error' : 'success'}`}>
                {issues.missingH1.length}
              </span>
            </div>
            <div className="issue-item">
              <span className="issue-label">Tunt innehåll</span>
              <span className={`issue-count ${issues.thinContent.length > 0 ? 'warning' : 'success'}`}>
                {issues.thinContent.length}
              </span>
            </div>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="tech-card">
          <h3>Infrastruktur</h3>
          <div className="infra-list">
            <div className="infra-item">
              <span className="infra-label">Sitemap.xml</span>
              <span className={`infra-status ${sitemap.present ? 'success' : 'error'}`}>
                {sitemap.present ? '✓ Hittad' : '✗ Saknas'}
              </span>
            </div>
            <div className="infra-item">
              <span className="infra-label">Robots.txt</span>
              <span className={`infra-status ${robotsTxt.present ? 'success' : 'error'}`}>
                {robotsTxt.present ? '✓ Hittad' : '✗ Saknas'}
              </span>
            </div>
            {sitemap.present && sitemap.urls && (
              <div className="infra-item">
                <span className="infra-label">URLs i sitemap</span>
                <span className="infra-count">{fmtNum(sitemap.urls.length)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Performance Insights Component
function PerformanceInsights({ vm }) {
  const { pages, rum } = vm;

  // Calculate page performance stats
  const pageSizes = pages.map(p => p.pageSize).filter(Boolean);
  const avgPageSize = pageSizes.length > 0 ?
    pageSizes.reduce((sum, size) => sum + size, 0) / pageSizes.length : 0;

  const largePages = pages.filter(p => p.pageSize > 1024 * 1024); // > 1MB

  return (
    <div className="performance-insights">
      <h2 className="section-title">⚡ Prestanda-insikter</h2>

      <div className="perf-grid">
        {/* Page Size Analysis */}
        <div className="perf-card">
          <h3>Sidstorlekar</h3>
          <div className="perf-stats">
            <div className="perf-stat">
              <span className="stat-value">{fmtBytes(avgPageSize)}</span>
              <span className="stat-label">Genomsnitt</span>
            </div>
            <div className="perf-stat">
              <span className="stat-value">{largePages.length}</span>
              <span className="stat-label">Stora sidor (&gt;1MB)</span>
            </div>
            <div className="perf-stat">
              <span className="stat-value">{fmtBytes(Math.max(...pageSizes) || 0)}</span>
              <span className="stat-label">Största sida</span>
            </div>
          </div>
        </div>

        {/* RUM Performance Data */}
        {rum && (
          <div className="perf-card rum-card">
            <h3>Verklig användardata</h3>
            <div className="rum-stats">
              <div className="rum-stat">
                <span className="rum-metric">LCP</span>
                <span className="rum-value">{fmtMs(rum.p75?.lcp_p75)}</span>
                <span className={`rum-grade ${getRumGrade(rum.p75?.lcp_p75, 'lcp')}`}>
                  {getRumGrade(rum.p75?.lcp_p75, 'lcp')}
                </span>
              </div>
              <div className="rum-stat">
                <span className="rum-metric">CLS</span>
                <span className="rum-value">{rum.p75?.cls_p75?.toFixed(3) || '—'}</span>
                <span className={`rum-grade ${getRumGrade(rum.p75?.cls_p75, 'cls')}`}>
                  {getRumGrade(rum.p75?.cls_p75, 'cls')}
                </span>
              </div>
              <div className="rum-stat">
                <span className="rum-metric">INP</span>
                <span className="rum-value">{fmtMs(rum.p75?.inp_p75)}</span>
                <span className={`rum-grade ${getRumGrade(rum.p75?.inp_p75, 'inp')}`}>
                  {getRumGrade(rum.p75?.inp_p75, 'inp')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for RUM grading
function getRumGrade(value, metric) {
  if (!value) return 'N/A';

  switch(metric) {
    case 'lcp':
      if (value <= 2500) return 'Bra';
      if (value <= 4000) return 'OK';
      return 'Dålig';
    case 'cls':
      if (value <= 0.1) return 'Bra';
      if (value <= 0.25) return 'OK';
      return 'Dålig';
    case 'inp':
      if (value <= 200) return 'Bra';
      if (value <= 500) return 'OK';
      return 'Dålig';
    default:
      return 'N/A';
  }
}

// Main Component
export default function EnhancedCrawlResultsDisplay({ result, isSharedView = false }) {
  const vm = useMemo(() => normalizeCrawl(result), [result]);

  // Extract additional data that wasn't in the normalized version
  const quickActions = result?.summary?.quickActions || result?.quickActions || [];
  const ruleEngine = result?.ruleEngine || {};
  const errorStats = result?.summary?.errorStats || result?.errorStats;

  useEffect(() => {
    // Auto-scroll to sections based on priority
    const criticalIssues = vm.issues.missingTitle.length + vm.issues.brokenLinks.length;
    if (criticalIssues > 0) {
      // Highlight critical issues section
      setTimeout(() => {
        const prioritySection = document.querySelector('.priority-section');
        if (prioritySection) {
          prioritySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1000);
    }
  }, [vm]);

  return (
    <div className="enhanced-crawl-results">
      {/* Shared View Banner */}
      {isSharedView && (
        <div className="shared-banner">
          <div className="shared-content">
            <span className="shared-icon">🔗</span>
            <div className="shared-text">
              <div className="shared-title">Delad crawl-analys</div>
              <div className="shared-subtitle">Denna rapport har delats med dig</div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection vm={vm} />

      {/* Priority Issues */}
      <PriorityIssues vm={vm} quickActions={quickActions} ruleEngine={ruleEngine} />

      {/* Link Intelligence */}
      <LinkIntelligence vm={vm} />

      {/* Technical Health */}
      <TechnicalHealth vm={vm} />

      {/* Performance Insights */}
      <PerformanceInsights vm={vm} />

      {/* Error Stats (if available) */}
      {errorStats && (
        <div className="error-stats">
          <h2 className="section-title">📊 Felstatistik</h2>
          <div className="error-overview">
            <div className="error-metric">
              <span className="error-value">{errorStats.successRate}</span>
              <span className="error-label">Lyckandegard</span>
            </div>
            <div className="error-metric">
              <span className="error-value">{fmtNum(errorStats.totalErrors)}</span>
              <span className="error-label">Totala fel</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-crawl-results {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background: #fafbfc;
        }

        /* Shared View Banner */
        .shared-banner {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
          color: white;
        }

        .shared-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .shared-icon {
          font-size: 32px;
          opacity: 0.9;
        }

        .shared-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .shared-subtitle {
          font-size: 13px;
          opacity: 0.8;
        }

        /* Hero Section */
        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 30px;
          color: white;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 40px;
          align-items: center;
        }

        .hero-score-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 30px;
          backdrop-filter: blur(10px);
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .grade-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: white;
          border: 3px solid rgba(255, 255, 255, 0.3);
        }

        .score-details {
          text-align: left;
        }

        .score-number {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .score-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 20px;
        }

        .metric-card {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 20px;
          backdrop-filter: blur(5px);
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .metric-label {
          font-size: 12px;
          opacity: 0.9;
        }

        .hero-rum {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .hero-rum h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        .rum-metrics {
          display: flex;
          gap: 15px;
          margin-bottom: 10px;
        }

        .rum-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .rum-value {
          font-size: 18px;
          font-weight: bold;
        }

        .rum-label {
          font-size: 11px;
          opacity: 0.8;
        }

        .rum-info {
          font-size: 12px;
          opacity: 0.8;
          text-align: center;
        }

        /* Priority Section */
        .priority-section {
          background: white;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 25px 0;
          color: #1f2937;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .action-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border-left: 4px solid #6b7280;
          transition: transform 0.2s ease;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .action-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .action-icon {
          font-size: 20px;
        }

        .action-title {
          font-weight: 600;
          color: #1f2937;
        }

        .action-description {
          color: #6b7280;
          margin-bottom: 10px;
          line-height: 1.5;
        }

        .action-priority {
          font-size: 12px;
          color: #374151;
        }

        .severity-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .severity-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          border: 2px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .severity-card.critical {
          border-color: #fecaca;
          background: #fef2f2;
        }

        .severity-card.medium {
          border-color: #fed7aa;
          background: #fff7ed;
        }

        .severity-card.low {
          border-color: #bbf7d0;
          background: #f0fdf4;
        }

        .severity-count {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .severity-card.critical .severity-count {
          color: #dc2626;
        }

        .severity-card.medium .severity-count {
          color: #ea580c;
        }

        .severity-card.low .severity-count {
          color: #16a34a;
        }

        .severity-label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #1f2937;
        }

        .severity-description {
          font-size: 12px;
          color: #6b7280;
        }

        /* Link Intelligence */
        .link-intelligence {
          background: white;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .link-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .link-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
        }

        .link-card h3 {
          margin: 0 0 15px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .link-stats {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .link-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-label {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }

        .top-pages-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .top-page-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          font-size: 13px;
        }

        .page-url {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #374151;
        }

        .page-links {
          color: #6b7280;
          font-weight: 500;
        }

        .orphan-card {
          border-left: 4px solid #f59e0b;
        }

        .orphan-description {
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 15px;
        }

        .orphan-item {
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 5px;
          font-size: 12px;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .orphan-more {
          color: #6b7280;
          font-style: italic;
          font-size: 12px;
          text-align: center;
          margin-top: 10px;
        }

        .link-recommendations {
          margin-top: 20px;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 12px;
        }

        .link-recommendations h3 {
          margin: 0 0 15px 0;
          color: #1f2937;
        }

        .recommendation-item {
          margin-bottom: 15px;
          padding: 15px;
          background: white;
          border-radius: 8px;
        }

        .rec-issue {
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 5px;
        }

        .rec-fix {
          color: #374151;
          font-size: 14px;
        }

        /* Technical Health */
        .technical-health {
          background: white;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .tech-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
        }

        .tech-card h3 {
          margin: 0 0 15px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .status-chart {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .status-bar.status-2xx {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-bar.status-3xx {
          background: #fef3c7;
          color: #d97706;
        }

        .status-bar.status-4xx,
        .status-bar.status-5xx {
          background: #fecaca;
          color: #dc2626;
        }

        .issue-list,
        .infra-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .issue-item,
        .infra-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .issue-item:last-child,
        .infra-item:last-child {
          border-bottom: none;
        }

        .issue-label,
        .infra-label {
          color: #374151;
          font-size: 13px;
        }

        .issue-count {
          font-weight: 600;
          font-size: 13px;
        }

        .issue-count.success,
        .infra-status.success {
          color: #16a34a;
        }

        .issue-count.warning {
          color: #d97706;
        }

        .issue-count.error,
        .infra-status.error {
          color: #dc2626;
        }

        .infra-count {
          color: #374151;
          font-weight: 500;
        }

        /* Performance Insights */
        .performance-insights {
          background: white;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .perf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .perf-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
        }

        .perf-card h3 {
          margin: 0 0 15px 0;
          color: #1f2937;
          font-size: 16px;
        }

        .perf-stats {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .perf-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .rum-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }

        .rum-stats {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .rum-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
        }

        .rum-metric {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }

        .rum-value {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 3px;
        }

        .rum-grade {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .rum-grade:contains('Bra') {
          background: #dcfce7;
          color: #16a34a;
        }

        .rum-grade:contains('OK') {
          background: #fef3c7;
          color: #d97706;
        }

        .rum-grade:contains('Dålig') {
          background: #fecaca;
          color: #dc2626;
        }

        /* Error Stats */
        .error-stats {
          background: white;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .error-overview {
          display: flex;
          gap: 40px;
          justify-content: center;
        }

        .error-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .error-value {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
        }

        .error-label {
          color: #6b7280;
          margin-top: 5px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .enhanced-crawl-results {
            padding: 15px;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            text-align: center;
          }

          .quick-actions-grid,
          .severity-overview,
          .link-grid,
          .tech-grid,
          .perf-grid {
            grid-template-columns: 1fr;
          }

          .hero-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .link-stats,
          .perf-stats,
          .rum-stats {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}