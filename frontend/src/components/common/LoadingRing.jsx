'use client';
import React from 'react';

const LoadingRing = ({ size = 60, text = "Analyserar..." }) => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    },
    spinner: {
      animation: 'rotate 1.4s linear infinite'
    },
    pathBg: {
      fill: 'none',
      strokeWidth: 6,
      opacity: 0.2
    },
    path: {
      fill: 'none',
      strokeWidth: 6,
      strokeLinecap: 'round',
      strokeDasharray: '90, 150',
      strokeDashoffset: 0,
      animation: 'dash 1.4s ease-in-out infinite'
    },
    label: {
      fontSize: '14px',
      color: '#64748b',
      textAlign: 'center',
      fontWeight: 500
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>

      <div style={styles.container}>
        <svg
          className="spinner"
          viewBox="0 0 50 50"
          width={size}
          height={size}
          role="status"
          aria-label="Laddar"
          style={styles.spinner}
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b6b"/>
              <stop offset="100%" stopColor="#f78fb3"/>
            </linearGradient>
          </defs>
          <circle
            className="path-bg"
            cx="25"
            cy="25"
            r="20"
            stroke="url(#gradient)"
            style={styles.pathBg}
          />
          <circle
            className="path"
            cx="25"
            cy="25"
            r="20"
            stroke="url(#gradient)"
            style={styles.path}
          />
        </svg>
        <div style={styles.label}>
          {text}
        </div>
      </div>
    </>
  );
};

export default LoadingRing;