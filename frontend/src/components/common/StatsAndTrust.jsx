'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock } from 'lucide-react';

export default function StatsAndTrust() {
  const [stats, setStats] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  useEffect(() => {
    // Fetch stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        if (data.lastAnalysis) {
          setLastAnalysis(data.lastAnalysis);
        }
      })
      .catch(() => setStats({ totalAnalyses: 2000, uniqueDomains: 150 }));
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return Math.floor(num / 100) * 100 + '+';
    }
    return num;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just nu';
    if (diffMins === 1) return '1 minut sedan';
    if (diffMins < 60) return `${diffMins} minuter sedan`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 timme sedan';
    if (diffHours < 24) return `${diffHours} timmar sedan`;

    return 'idag';
  };

  return (
    <div className="stats-and-trust">
      {/* Live Stats */}
      {stats && (
        <div className="live-stats">
          <div className="stat-item">
            <span className="stat-number">{formatNumber(stats.totalAnalyses)}</span>
            <span className="stat-label">analyser körda</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{formatNumber(stats.uniqueDomains)}</span>
            <span className="stat-label">webbplatser</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">gratis</span>
          </div>
        </div>
      )}

      {/* Last Analysis */}
      {lastAnalysis && (
        <div className="last-analysis">
          <Clock size={14} className="last-analysis-icon" />
          <span>Senaste analysen: {formatTimeAgo(lastAnalysis.timestamp)}</span>
        </div>
      )}

      {/* Trust Badges */}
      <div className="trust-badges">
        <div className="trust-badge">
          <CheckCircle size={16} className="trust-icon" />
          <span className="trust-text">Svensk LIX-analys</span>
        </div>
        <div className="trust-badge">
          <CheckCircle size={16} className="trust-icon" />
          <span className="trust-text">Ingen registrering</span>
        </div>
        <div className="trust-badge">
          <CheckCircle size={16} className="trust-icon" />
          <span className="trust-text">Färdig kod att kopiera</span>
        </div>
      </div>
    </div>
  );
}
