import React from 'react';
import './IssueBreakdownPie.css';

// CSS-based Issue Breakdown Pie Chart
function IssueBreakdownPie({ issues }) {
  // Colors for different issue categories
  const COLORS = {
    content: '#60a5fa',     // Blue
    performance: '#f59e0b', // Orange
    security: '#ef4444',    // Red
    social: '#8b5cf6',      // Purple
    technical: '#10b981',   // Green
    images: '#f97316',      // Orange-red
    mobile: '#06b6d4'       // Cyan
  };

  // Convert issues to chart data
  const chartData = [];
  let totalIssues = 0;

  if (issues) {
    Object.entries(issues).forEach(([category, count]) => {
      if (count > 0) {
        chartData.push({
          name: getCategoryLabel(category),
          value: count,
          color: COLORS[category] || '#64748b',
          category: category
        });
        totalIssues += count;
      }
    });
  }

  function getCategoryLabel(category) {
    const labels = {
      content: 'Innehåll',
      performance: 'Prestanda',
      security: 'Säkerhet',
      social: 'Sociala medier',
      technical: 'Teknisk SEO',
      images: 'Bilder',
      mobile: 'Mobil'
    };
    return labels[category] || category;
  }

  // Don't render if no issues
  if (chartData.length === 0) {
    return (
      <div className="issue-breakdown-pie">
        <div className="pie-header">
          <h3>Problem breakdown</h3>
        </div>
        <div className="no-issues">
          <div className="no-issues-icon">🎉</div>
          <div className="no-issues-text">Inga större problem funna!</div>
        </div>
        
        <style jsx>{`
          .issue-breakdown-pie {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            min-height: 300px;
          }
          
          .pie-header h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
          }
          
          .no-issues {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
          }
          
          .no-issues-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }
          
          .no-issues-text {
            font-size: 16px;
            color: #16a34a;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  // Find dominant category
  const dominantCategory = chartData.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current
  );
  const dominantPercentage = ((dominantCategory.value / totalIssues) * 100).toFixed(0);

  // Create CSS-based pie segments
  let cumulativePercentage = 0;
  const segments = chartData.map((item, index) => {
    const percentage = (item.value / totalIssues) * 100;
    const segment = {
      ...item,
      percentage: percentage.toFixed(1),
      startAngle: cumulativePercentage * 3.6, // Convert to degrees
      endAngle: (cumulativePercentage + percentage) * 3.6
    };
    cumulativePercentage += percentage;
    return segment;
  });

  return (
    <div className="issue-breakdown-pie">
      <div className="pie-header">
        <h3>Problem breakdown</h3>
        <div className="total-count">{totalIssues} problem totalt</div>
      </div>
      
      <div className="pie-container">
        {/* Simple list-based visualization instead of actual pie chart */}
        <div className="pie-list">
          {segments.map((segment, index) => (
            <div key={index} className="pie-item">
              <div 
                className="pie-color" 
                style={{ backgroundColor: segment.color }}
              ></div>
              <div className="pie-label">{segment.name}</div>
              <div className="pie-value">
                <span className="pie-count">{segment.value}</span>
                <span className="pie-percentage">({segment.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pie-footer">
        <div className="dominant-insight">
          <strong>{dominantPercentage}%</strong> av problemen är <strong>{dominantCategory.name.toLowerCase()}</strong>-relaterade
        </div>
      </div>
      
      <style jsx>{`
        .issue-breakdown-pie {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-height: 300px;
        }
        
        .pie-header h3 {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          text-align: center;
        }
        
        .total-count {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .pie-container {
          margin: 20px 0;
        }
        
        .pie-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 280px;
          margin: 0 auto;
        }
        
        .pie-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }
        
        .pie-item:hover {
          background-color: #f9fafb;
        }
        
        .pie-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .pie-label {
          flex-grow: 1;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          text-align: left;
        }
        
        .pie-value {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 12px;
        }
        
        .pie-count {
          font-weight: 600;
          color: #111827;
        }
        
        .pie-percentage {
          color: #6b7280;
        }
        
        .pie-footer {
          margin-top: 20px;
          text-align: center;
        }
        
        .dominant-insight {
          font-size: 14px;
          color: #374151;
          background-color: #f3f4f6;
          padding: 10px 15px;
          border-radius: 8px;
          border-left: 4px solid ${dominantCategory.color};
        }
      `}</style>
    </div>
  );
}

export default IssueBreakdownPie;