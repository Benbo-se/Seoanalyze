'use client';

import React, { useState, useEffect } from 'react';
import styles from './FixThisPanel.module.css';

const FixThisPanel = ({ issue, isOpen, onClose, onStatusUpdate }) => {
  const [status, setStatus] = useState(issue?.status || 'open');
  const [copied, setCopied] = useState('');

  // Track panel open/close
  useEffect(() => {
    if (isOpen && issue) {
      // Track panel open
      fetch(`/api/v1/issues/${issue.id}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'panel_open',
          data: { severity: issue.severity, title: issue.title }
        })
      }).catch(err => console.warn('Panel open telemetry failed:', err));
    }
  }, [isOpen, issue]);

  const handleClose = () => {
    if (issue) {
      // Track panel close
      fetch(`/api/v1/issues/${issue.id}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'panel_close',
          data: { duration: Date.now() } // Could calculate duration if needed
        })
      }).catch(err => console.warn('Panel close telemetry failed:', err));
    }
    onClose();
  };

  const handleCopy = async (snippet, label) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(label);
      
      // Track telemetry to backend API
      await fetch(`/api/v1/issues/${issue.id}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy',
          data: { fix_type: label, snippet_length: snippet.length }
        })
      }).catch(err => console.warn('Telemetry failed:', err));
      
      // Track Google Analytics
      if (window.gtag) {
        window.gtag('event', 'fix_this_copy', {
          issue_id: issue.id,
          fix_type: label,
          issue_severity: issue.severity
        });
      }
      
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    
    // Update backend
    try {
      const response = await fetch(`/api/v1/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        onStatusUpdate(issue.id, newStatus);
        
        // Track telemetry
        if (window.gtag) {
          window.gtag('event', 'fix_this_status', {
            issue_id: issue.id,
            new_status: newStatus,
            issue_severity: issue.severity
          });
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'important': return '#fd7e14'; 
      case 'optional': return '#198754';
      default: return '#6c757d';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'important': return '⚠️';
      case 'optional': return 'ℹ️';
      default: return '📋';
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div className={styles.fixPanelOverlay} onClick={handleClose}>
      <div className={styles.fixPanel} onClick={e => e.stopPropagation()}>
        <div className={styles.fixPanelHeader}>
          <div className={styles.fixPanelTitleRow}>
            <span className={styles.severityBadge} style={{ backgroundColor: getSeverityColor(issue.severity) }}>
              {getSeverityIcon(issue.severity)} {issue.severity.toUpperCase()}
            </span>
            <button className={styles.fixPanelClose} onClick={handleClose}>×</button>
          </div>
          <h3 className={styles.fixPanelTitle}>{issue.title}</h3>
          {issue.foundOn && issue.foundOn.length > 0 && (
            <div className={styles.foundOn}>
              <strong>Hittades på:</strong> {issue.foundOn.join(', ')}
            </div>
          )}
        </div>

        <div className={styles.fixPanelContent}>
          {/* Status Controls */}
          <div className={styles.statusSection}>
            <h4>Status</h4>
            <div className={styles.statusButtons}>
              <button 
                className={`${styles.statusBtn} ${status === 'open' ? styles.active : ''}`}
                onClick={() => handleStatusChange('open')}
              >
                Öppen
              </button>
              <button 
                className={`${styles.statusBtn} ${status === 'in_progress' ? styles.active : ''}`}
                onClick={() => handleStatusChange('in_progress')}
              >
                Pågår
              </button>
              <button 
                className={`${styles.statusBtn} ${status === 'fixed' ? styles.active : ''}`}
                onClick={() => handleStatusChange('fixed')}
              >
                Fixad
              </button>
              <button 
                className={`${styles.statusBtn} ${status === 'ignored' ? styles.active : ''}`}
                onClick={() => handleStatusChange('ignored')}
              >
                Ignorerad
              </button>
            </div>
          </div>

          {/* How To Fix */}
          {issue.howTo && (
            <div className={styles.howToSection}>
              <h4>Hur du fixar detta:</h4>
              <ol className={styles.howToList}>
                {issue.howTo.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Quick Fixes */}
          {issue.quickFixes && issue.quickFixes.length > 0 && (
            <div className={styles.quickFixesSection}>
              <h4>Snabbfixar - Kopiera kod:</h4>
              {issue.quickFixes.map((fix, index) => (
                <div key={index} className={styles.quickFixItem}>
                  <div className={styles.quickFixHeader}>
                    <span className={styles.quickFixLabel}>{fix.label}</span>
                    <button 
                      className={`${styles.copyBtn} ${copied === fix.label ? styles.copied : ''}`}
                      onClick={() => handleCopy(fix.snippet, fix.label)}
                    >
                      {copied === fix.label ? '✓ Kopierad' : 'Kopiera'}
                    </button>
                  </div>
                  <pre className={styles.codeSnippet}>{fix.snippet}</pre>
                </div>
              ))}
            </div>
          )}

          {/* Helpful Links */}
          {issue.links && issue.links.length > 0 && (
            <div className={styles.linksSection}>
              <h4>Läs mer:</h4>
              <div className={styles.linksList}>
                {issue.links.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.guideLink}
                    onClick={async () => {
                      // Track guide click telemetry
                      await fetch(`/api/v1/issues/${issue.id}/telemetry`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'guide_click',
                          data: { guide_url: link.url, guide_label: link.label }
                        })
                      }).catch(err => console.warn('Guide click telemetry failed:', err));

                      // Track Google Analytics
                      if (window.gtag) {
                        window.gtag('event', 'fix_this_guide', {
                          issue_id: issue.id,
                          guide_url: link.url,
                          guide_label: link.label
                        });
                      }
                    }}
                  >
                    📖 {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixThisPanel;