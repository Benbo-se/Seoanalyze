import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './progressBars.module.css';

const ProgressBars = ({ result }) => {
  // Convert 0-30 scale to 0-100 percentage
  const convertToPercentage = (score) => {
    return Math.round((score / 30) * 100);
  };

  const categories = [
    {
      name: 'Titel & Meta',
      score: convertToPercentage(result?.scoreBreakdown?.title || 0),
      max: 100,
      icon: CheckCircle,
      color: 'blue'
    },
    {
      name: 'Innehåll',
      score: convertToPercentage(result?.scoreBreakdown?.content || 0),
      max: 100,
      icon: TrendingUp,
      color: 'green'
    },
    {
      name: 'Tekniskt',
      score: convertToPercentage(result?.scoreBreakdown?.technical || 0),
      max: 100,
      icon: AlertCircle,
      color: 'orange'
    },
    {
      name: 'Bilder',
      score: convertToPercentage(result?.scoreBreakdown?.images || 0),
      max: 100,
      icon: CheckCircle,
      color: 'purple'
    }
  ];

  const getProgressColor = (score) => {
    if (score >= 80) return styles.progressGood;
    if (score >= 50) return styles.progressWarning;
    return styles.progressPoor;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Poäng per kategori</h3>
      <div className={styles.barsGrid}>
        {categories.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <div key={index} className={styles.barItem}>
              <div className={styles.barHeader}>
                <IconComponent size={16} className={styles.barIcon} />
                <span className={styles.barName}>{category.name}</span>
                <span className={styles.barScore}>{category.score}/100</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${getProgressColor(category.score)}`}
                  style={{ width: `${category.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBars;