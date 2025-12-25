import React from 'react';
import './SEOHealthGauge.css';

// CSS-based SEO Health Gauge without external dependencies
function SEOHealthGauge({ score }) {
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Bra';
    if (score >= 50) return 'OK';
    return 'Behöver förbättras';
  };

  const getScoreEmoji = (score) => {
    if (score >= 75) return '🟢';
    if (score >= 50) return '🟡';
    return '🔴';
  };

  // Calculate percentage for CSS circle
  const percentage = Math.min(100, Math.max(0, score));
  
  return (
    <div className="seo-health-gauge">
      <div className="gauge-header">
        <h3>SEO-poäng</h3>
      </div>
      
      <div className="gauge-wrapper">
        <div className="gauge-chart">
          <div className="circular-gauge">
            {/* CSS-based circular progress bar */}
            <svg role="img" aria-label={`SEO-poäng ${score} av 100`} width="200" height="200" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - percentage / 100)}`}
                transform="rotate(-90 100 100)"
              />
              {/* ENDA centertexten = siffran */}
              <text className="gauge-value" x="100" y="100" dy="0.35em" textAnchor="middle" 
                    fontSize="28" fontWeight="700" fill={getScoreColor(score)}>
                {score}
              </text>
            </svg>
          </div>
        </div>
        {/* etikett under cirkeln */}
        <p className="gauge-caption">SEO-poäng</p>
        
        {/* valfri rad med nivå */}
        {(() => {
          const label = score >= 80 ? 'Bra' : score >= 50 ? 'Medel' : 'Låg';
          return <p className="gauge-meta">{score}/100 – {label}</p>;
        })()}
        
        {/* badge borttagen */}
        {/* <div className="gauge-footer">
          <div className={`score-status ${score >= 75 ? 'good' : score >= 50 ? 'ok' : 'poor'}`}>
            <span className="status-emoji">{getScoreEmoji(score)}</span>
            <span className="status-text">{getScoreLabel(score)}</span>
          </div>
        </div> */}
      </div>
      
      <style jsx>{`
        .seo-health-gauge {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          min-height: 300px;
        }
        
        .gauge-header h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }
        
        .gauge-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .gauge-chart {
          position: relative;
          display: inline-block;
        }
        
        .circular-gauge {
          position: relative;
        }
        
        .gauge-value {
          font-weight: 700;
          font-size: 28px;
        }
        
        .gauge-caption {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0 0;
        }
        
        .gauge-footer {
          margin-top: 15px;
        }
        
        .score-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 500;
        }
        
        .score-status.good {
          color: #16a34a;
        }
        
        .score-status.ok {
          color: #f59e0b;
        }
        
        .score-status.poor {
          color: #ef4444;
        }
        
        .status-emoji {
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}

export default SEOHealthGauge;