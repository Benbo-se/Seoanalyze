import React from 'react';

const MergedIssuesPanel = ({ seoResult, lighthouseResult, crawlResult, targetUrl, onClose }) => {
  // Merge issues from all analysis types with priority weighting
  const mergeIssues = () => {
    const issues = [];
    
    // SEO issues (weight: 1.5x)
    if (seoResult?.recommendations) {
      seoResult.recommendations.forEach((rec, index) => {
        issues.push({
          id: `seo-${index}`,
          source: 'SEO',
          title: rec.text || rec.title,
          impact: rec.impact || 'medium',
          priority: (rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1) * 1.5,
          description: rec.description,
          type: 'seo'
        });
      });
    }

    // Lighthouse issues (weight: 2.0x - performance is critical)
    if (lighthouseResult?.recommendations) {
      lighthouseResult.recommendations.forEach((rec, index) => {
        issues.push({
          id: `lighthouse-${index}`,
          source: 'Lighthouse',
          title: rec.text || rec.title,
          impact: rec.impact || 'high',
          priority: (rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1) * 2.0,
          description: rec.description,
          type: 'performance'
        });
      });
    }

    // Crawl issues (weight: 1.0x)
    if (crawlResult?.issues) {
      crawlResult.issues.forEach((issue, index) => {
        issues.push({
          id: `crawl-${index}`,
          source: 'Crawl',
          title: issue.message || issue.title,
          impact: issue.severity || 'medium',
          priority: (issue.severity === 'critical' ? 3 : issue.severity === 'important' ? 2 : 1) * 1.0,
          description: issue.description,
          type: 'crawl'
        });
      });
    }

    // Sort by priority (highest first)
    return issues.sort((a, b) => b.priority - a.priority).slice(0, 10);
  };

  const prioritizedIssues = mergeIssues();

  const getPriorityColor = (priority) => {
    if (priority >= 4.5) return '#ef4444'; // Critical
    if (priority >= 3.0) return '#f59e0b'; // High  
    if (priority >= 1.5) return '#10b981'; // Medium
    return '#6b7280'; // Low
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 4.5) return 'Kritisk';
    if (priority >= 3.0) return 'Hög';
    if (priority >= 1.5) return 'Medel';
    return 'Låg';
  };

  return (
    <div className="merged-issues-overlay">
      <div className="merged-issues-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title">
            <h2>🔀 Prioriterade åtgärder</h2>
            <p>Viktade rekommendationer från alla analyser</p>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {prioritizedIssues.length === 0 ? (
            <div className="no-issues">
              <div className="no-issues-icon">🎉</div>
              <h3>Fantastiskt arbete!</h3>
              <p>Inga större problem funna i dina analyser. Din webbplats följer de flesta bästa praxis.</p>
            </div>
          ) : (
            <div className="issues-list">
              {prioritizedIssues.map((issue, index) => (
                <div key={issue.id} className="issue-item">
                  <div className="issue-rank">#{index + 1}</div>
                  <div className="issue-content">
                    <div className="issue-header">
                      <h4 className="issue-title">{issue.title}</h4>
                      <div className="issue-badges">
                        <span className="source-badge">{issue.source}</span>
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(issue.priority) }}
                        >
                          {getPriorityLabel(issue.priority)}
                        </span>
                      </div>
                    </div>
                    {issue.description && (
                      <p className="issue-description">{issue.description}</p>
                    )}
                    <div className="priority-score">
                      Prioritetspoäng: {issue.priority.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info footer */}
          <div className="panel-footer">
            <div className="weighting-info">
              <h4>🏗️ Viktning av rekommendationer</h4>
              <div className="weight-items">
                <div className="weight-item">
                  <span className="weight-label">SEO:</span>
                  <span className="weight-value">1.5× viktning</span>
                </div>
                <div className="weight-item">
                  <span className="weight-label">Prestanda:</span>
                  <span className="weight-value">2.0× viktning</span>
                </div>
                <div className="weight-item">
                  <span className="weight-label">Crawl:</span>
                  <span className="weight-value">1.0× viktning</span>
                </div>
              </div>
              <p className="weight-explanation">
                Högre viktning = viktigare för användarupplevelse och SEO
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .merged-issues-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .merged-issues-panel {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-title h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }

        .panel-title p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 28px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .no-issues {
          text-align: center;
          padding: 60px 24px;
        }

        .no-issues-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .no-issues h3 {
          margin: 0 0 12px 0;
          font-size: 24px;
          color: #16a34a;
        }

        .no-issues p {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }

        .issues-list {
          padding: 0;
        }

        .issue-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid #f3f4f6;
        }

        .issue-item:hover {
          background: #fafafa;
        }

        .issue-rank {
          background: #e5e7eb;
          color: #374151;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .issue-content {
          flex: 1;
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }

        .issue-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
        }

        .issue-badges {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .source-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .priority-badge {
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .issue-description {
          margin: 0 0 8px 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .priority-score {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .panel-footer {
          border-top: 1px solid #e5e7eb;
          padding: 20px 24px;
          background: #fafafa;
        }

        .weighting-info h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #111827;
        }

        .weight-items {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
        }

        .weight-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .weight-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .weight-value {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }

        .weight-explanation {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default MergedIssuesPanel;