'use client';
import React, { useEffect, useRef, useState } from 'react';

const ScoreRing = ({ label, score, color, size = 80 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef();
  const startTimeRef = useRef();

  // Check if score is null/undefined (not tested)
  const isNotTested = score === null || score === undefined;

  useEffect(() => {
    // Don't animate if not tested
    if (isNotTested) return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const duration = 800; // 800ms animation

      if (elapsed < duration) {
        const progress = elapsed / duration;
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimatedScore(score * easeOutQuart);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedScore(score);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score, isNotTested]);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    },
    svgContainer: {
      position: 'relative',
      display: 'inline-block'
    },
    svg: {
      transform: 'rotate(-90deg)',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
    },
    backgroundCircle: {
      fill: 'none',
      stroke: '#f1f5f9',
      strokeWidth: '4'
    },
    progressCircle: {
      fill: 'none',
      stroke: color,
      strokeWidth: '4',
      strokeLinecap: 'round',
      transition: 'stroke-dashoffset 0.1s ease'
    },
    scoreText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '18px',
      fontWeight: '600',
      color: color,
      userSelect: 'none'
    },
    label: {
      fontSize: '14px',
      color: '#64748b',
      textAlign: 'center',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container} title={isNotTested ? `${label}: Ej testad` : `${label}: ${score}/100`}>
      <div style={styles.svgContainer}>
        <svg width={size} height={size} style={styles.svg}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            style={styles.backgroundCircle}
          />
          {/* Progress circle - only show if tested */}
          {!isNotTested && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              style={{
                ...styles.progressCircle,
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          )}
        </svg>
        <div style={styles.scoreText}>
          {isNotTested ? 'N/A' : Math.round(animatedScore)}
        </div>
      </div>
      <div style={styles.label}>{label}</div>
    </div>
  );
};

export default ScoreRing;