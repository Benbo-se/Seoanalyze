import React, { useState, useEffect } from 'react';

const FixThisPanel = ({ issue, isOpen, onClose, onStatusUpdate }) => {
  const [status, setStatus] = useState(issue?.status || 'open');
  const [copied, setCopied] = useState('');

  const handleClose = () => {
    onClose();
  };

  const handleCopy = async (snippet, label) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    onStatusUpdate(issue.id, newStatus);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'important': return '#f59e0b';
      case 'minor': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div className="fix-this-overlay">
      <div className="fix-this-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="issue-info">
            <div className="issue-title">{issue.title}</div>
            <div className="issue-meta">
              <span 
                className="severity-badge" 
                style={{ backgroundColor: getSeverityColor(issue.severity) }}
              >
                {issue.severity}
              </span>
            </div>
          </div>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        {/* Content */}
        <div className="panel-content">
          
          {/* How to fix */}
          {issue.howTo && issue.howTo.length > 0 && (
            <div className="section">
              <h3>🔧 Hur du fixar detta</h3>
              <ul className="how-to-list">
                {issue.howTo.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick fixes */}
          {issue.quickFixes && issue.quickFixes.length > 0 && (
            <div className="section">
              <h3>⚡ Snabbfixar</h3>
              <div className="quick-fixes">
                {issue.quickFixes.map((fix, index) => (
                  <div key={index} className="quick-fix">
                    <div className="fix-label">{fix.label}</div>
                    <div className="code-snippet">
                      <code>{fix.snippet}</code>
                      <button
                        className={`copy-button ${copied === fix.label ? 'copied' : ''}`}
                        onClick={() => handleCopy(fix.snippet, fix.label)}
                      >
                        {copied === fix.label ? '✓' : 'Kopiera'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {issue.links && issue.links.length > 0 && (
            <div className="section">
              <h3>🔗 Läs mer</h3>
              <div className="links">
                {issue.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="section">
            <h3>📋 Status</h3>
            <div className="status-buttons">
              <button
                className={`status-button ${status === 'open' ? 'active' : ''}`}
                onClick={() => handleStatusChange('open')}
              >
                Öppen
              </button>
              <button
                className={`status-button ${status === 'in_progress' ? 'active' : ''}`}
                onClick={() => handleStatusChange('in_progress')}
              >
                Pågår
              </button>
              <button
                className={`status-button ${status === 'fixed' ? 'active' : ''}`}
                onClick={() => handleStatusChange('fixed')}
              >
                Fixad
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .fix-this-overlay {
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

        .fix-this-panel {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .issue-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .issue-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .severity-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-transform: uppercase;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .panel-content {
          padding: 20px;
        }

        .section {
          margin-bottom: 24px;
        }

        .section h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #111827;
        }

        .how-to-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .how-to-list li {
          padding: 8px 12px;
          margin-bottom: 6px;
          background: #f9fafb;
          border-radius: 6px;
          position: relative;
          padding-left: 28px;
        }

        .how-to-list li::before {
          content: '•';
          position: absolute;
          left: 12px;
          color: #6b7280;
        }

        .quick-fixes {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quick-fix {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .fix-label {
          background: #f9fafb;
          padding: 8px 12px;
          font-weight: 500;
          font-size: 14px;
          color: #374151;
        }

        .code-snippet {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: #111827;
          color: #e5e7eb;
        }

        .code-snippet code {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          flex-grow: 1;
          overflow-x: auto;
        }

        .copy-button {
          background: #374151;
          border: 1px solid #4b5563;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-left: 12px;
          flex-shrink: 0;
        }

        .copy-button:hover {
          background: #4b5563;
        }

        .copy-button.copied {
          background: #16a34a;
          border-color: #16a34a;
        }

        .links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .external-link {
          color: #2563eb;
          text-decoration: none;
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .external-link:hover {
          background: #eff6ff;
          border-color: #2563eb;
        }

        .status-buttons {
          display: flex;
          gap: 8px;
        }

        .status-button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .status-button:hover {
          border-color: #9ca3af;
        }

        .status-button.active {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default FixThisPanel;