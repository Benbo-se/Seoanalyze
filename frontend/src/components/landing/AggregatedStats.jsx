'use client';

import { AlertTriangle } from 'lucide-react';

export default function AggregatedStats() {
  // Dessa siffror kan senare hämtas från API
  const stats = [
    { value: '73%', label: 'saknar minst en meta-tagg' },
    { value: '42%', label: 'sätter cookies före consent' },
    { value: '31%', label: 'saknar viktiga security headers' },
    { value: '28%', label: 'har säkerhetsproblem' }
  ];

  return (
    <section className="aggregated-stats">
      <div className="section-container">
        <h2 className="section-title">Vad våra analyser hittar</h2>
        <p className="section-subtitle">
          Baserat på de senaste 1000 analyserna
        </p>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="stats-summary">
          <AlertTriangle size={20} className="stats-summary-icon" />
          <span>En genomsnittlig sajt har 12 problem vi kan hitta</span>
        </div>
      </div>
    </section>
  );
}
