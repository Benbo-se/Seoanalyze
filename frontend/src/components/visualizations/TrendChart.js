import React from 'react';
import './TrendChart.css';

// CSS-based Trend Chart
function TrendChart({ trendData }) {
  if (!trendData || trendData.length < 2) {
    return (
      <div className="trend-chart">
        <div className="chart-header">
          <h3>SEO Trend</h3>
        </div>
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <div className="no-data-text">Behöver minst 2 analyser för att visa trend</div>
        </div>
        
        <style jsx>{`
          .trend-chart {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            min-height: 300px;
          }
          
          .chart-header h3 {
            margin: 0 0 20px 0;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
          }
          
          .no-data {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
          }
          
          .no-data-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }
          
          .no-data-text {
            font-size: 14px;
            color: #6b7280;
          }
        `}</style>
      </div>
    );
  }

  // Process trend data
  const processedData = trendData
    .map(item => ({
      date: new Date(item.createdAt),
      score: item.seoScore || item.score || 0,
      id: item.id
    }))
    .sort((a, b) => a.date - b.date)
    .slice(-10); // Show last 10 data points

  // Calculate trend direction
  const firstScore = processedData[0].score;
  const lastScore = processedData[processedData.length - 1].score;
  const trendDirection = lastScore > firstScore ? 'up' : lastScore < firstScore ? 'down' : 'stable';
  const trendValue = Math.abs(lastScore - firstScore);

  const getTrendColor = () => {
    if (trendDirection === 'up') return '#16a34a';
    if (trendDirection === 'down') return '#ef4444';
    return '#6b7280';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return '📈';
    if (trendDirection === 'down') return '📉';
    return '➖';
  };

  const getTrendLabel = () => {
    if (trendDirection === 'up') return `+${trendValue} poäng`;
    if (trendDirection === 'down') return `-${trendValue} poäng`;
    return 'Stabil';
  };

  // Create a simple line chart with CSS
  const maxScore = Math.max(...processedData.map(d => d.score));
  const minScore = Math.min(...processedData.map(d => d.score));
  const scoreRange = maxScore - minScore || 1;
  
  return (
    <div className="trend-chart">
      <div className="chart-header">
        <h3>SEO Trend</h3>
        <div className="data-count">{processedData.length} analyser</div>
      </div>
      
      <div className="chart-container">
        <div className="trend-summary">
          <div className="trend-direction" style={{ color: getTrendColor() }}>
            <span className="trend-icon">{getTrendIcon()}</span>
            <span className="trend-text">{getTrendLabel()}</span>
          </div>
        </div>
        
        {/* Simple sparkline visualization */}
        <div className="sparkline-container">
          <svg width="100%" height="80" viewBox="0 0 300 80">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Data line */}
            {processedData.length > 1 && (
              <polyline
                points={processedData
                  .map((d, i) => {
                    const x = (i / (processedData.length - 1)) * 280 + 10;
                    const y = 70 - ((d.score - minScore) / scoreRange) * 50;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                stroke={getTrendColor()}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Data points */}
            {processedData.map((d, i) => {
              const x = (i / (processedData.length - 1)) * 280 + 10;
              const y = 70 - ((d.score - minScore) / scoreRange) * 50;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={getTrendColor()}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
        
        {/* Score range */}
        <div className="score-range">
          <span className="min-score">{minScore}</span>
          <span className="current-score">Nuvarande: {lastScore}</span>
          <span className="max-score">{maxScore}</span>
        </div>
      </div>
      
      <style jsx>{`
        .trend-chart {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-height: 300px;
        }
        
        .chart-header h3 {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }
        
        .data-count {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .chart-container {
          margin: 20px 0;
        }
        
        .trend-summary {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .trend-direction {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
        }
        
        .trend-icon {
          font-size: 20px;
        }
        
        .sparkline-container {
          margin: 20px 0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .score-range {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #6b7280;
          margin-top: 10px;
        }
        
        .current-score {
          font-weight: 600;
          color: #374151;
        }
        
        .min-score, .max-score {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

export default TrendChart;