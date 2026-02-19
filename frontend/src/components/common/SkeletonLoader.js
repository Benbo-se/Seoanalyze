import React from 'react';

// Skeleton loading component for better UX
const SkeletonLoader = ({ type = 'default', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'analysis':
        return (
          <div className="skeleton-analysis">
            <div className="skeleton-header">
              <div className="skeleton-line short"></div>
              <div className="skeleton-line medium"></div>
            </div>
            <div className="skeleton-stats">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-stat">
                  <div className="skeleton-circle"></div>
                  <div className="skeleton-line short"></div>
                </div>
              ))}
            </div>
            <div className="skeleton-tabs">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-tab"></div>
              ))}
            </div>
            <div className="skeleton-content">
              <div className="skeleton-line full"></div>
              <div className="skeleton-line long"></div>
              <div className="skeleton-line medium"></div>
              <div className="skeleton-line long"></div>
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className="skeleton-cards">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line long"></div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="skeleton-list">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="skeleton-list-item">
                <div className="skeleton-circle small"></div>
                <div className="skeleton-text">
                  <div className="skeleton-line medium"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="skeleton-default">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="skeleton-line full"></div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="skeleton-container">
      {renderSkeleton()}
      
      <style jsx>{`
        .skeleton-container {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .skeleton-line {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .skeleton-line.short {
          height: 16px;
          width: 60%;
        }

        .skeleton-line.medium {
          height: 16px;
          width: 80%;
        }

        .skeleton-line.long {
          height: 16px;
          width: 95%;
        }

        .skeleton-line.full {
          height: 16px;
          width: 100%;
        }

        .skeleton-circle {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          flex-shrink: 0;
        }

        .skeleton-circle.small {
          width: 40px;
          height: 40px;
        }

        .skeleton-analysis {
          padding: 20px;
        }

        .skeleton-header {
          margin-bottom: 32px;
        }

        .skeleton-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
          justify-content: center;
        }

        .skeleton-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .skeleton-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          justify-content: center;
        }

        .skeleton-tab {
          height: 36px;
          width: 120px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 6px;
        }

        .skeleton-content {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .skeleton-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .skeleton-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .skeleton-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skeleton-list-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: white;
          border-radius: 8px;
        }

        .skeleton-text {
          flex: 1;
        }

        .skeleton-default {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

export default SkeletonLoader;