'use client';
import React from 'react';

export default function PriorityMatrix({ opportunities = [], diagnostics = [] }) {
  // Kombinera opportunities och diagnostics för prioritering
  const allIssues = [
    ...(Array.isArray(opportunities) ? opportunities : []),
    ...(Array.isArray(diagnostics) ? diagnostics : [])
  ];

  // Effort heuristik baserat på audit ID
  const getEffort = (auditId) => {
    const lowEffort = [
      'uses-rel-preconnect', 'font-display', 'minify-css', 'minify-js',
      'unused-css-rules', 'legacy-javascript'
    ];
    const mediumEffort = [
      'uses-rel-preload-fonts', 'modern-image-formats', 'offscreen-images',
      'efficient-animated-content', 'preload-lcp-image'
    ];
    // Allt annat är high effort

    if (lowEffort.some(id => auditId?.includes(id))) return { level: 'Låg', score: 1, time: '≤30 min' };
    if (mediumEffort.some(id => auditId?.includes(id))) return { level: 'Medel', score: 2, time: '≤2 tim' };
    return { level: 'Hög', score: 3, time: '>2 tim' };
  };

  // Beräkna impact från savings eller score
  const getImpact = (item) => {
    // Försök hitta savings från olika källor
    const savings = item?.overallSavingsMs ||
                   item?.details?.overallSavingsMs ||
                   item?.numericValue ||
                   (item?.details?.items?.[0]?.wastedMs) ||
                   0;

    // Om vi har savings, använd det
    if (savings > 0) {
      if (savings >= 1000) return { level: 'Hög', score: 10 };
      if (savings >= 500) return { level: 'Medel', score: 6 };
      if (savings >= 100) return { level: 'Låg', score: 3 };
    }

    // Annars använd score (0-1 där lägre är sämre)
    const score = item?.score ?? 1;
    if (score <= 0.5) return { level: 'Hög', score: 8 };
    if (score <= 0.89) return { level: 'Medel', score: 5 };
    return { level: 'Minimal', score: 1 };
  };

  // Konkreta åtgärder baserat på audit ID
  const getActionableAdvice = (auditId, title, description) => {
    const actions = {
      'uses-rel-preconnect': 'Lägg till <link rel="preconnect"> för externa domäner som Google Fonts',
      'font-display': 'Använd font-display: swap för alla webbtypsnitt',
      'minify-css': 'Minifiera CSS-filer för att minska filstorlek',
      'unused-css-rules': 'Ta bort oanvänd CSS för snabbare laddning',
      'unusedJavaScript': 'Ta bort oanvänd JavaScript för snabbare laddning',
      'unused-javascript': 'Minska oanvänd JavaScript-kod',
      'offscreen-images': 'Lazy-load bilder som inte syns direkt',
      'modern-image-formats': 'Använd WebP eller AVIF istället för JPEG/PNG',
      'preload-lcp-image': 'Preloada hero-bilden för snabbare LCP',
      'render-blocking-resources': 'Flytta kritisk CSS inline och defer icke-kritisk JS',
      'third-party-summary': 'Optimera tredjepartsskript',
      'bootup-time': 'Minska JavaScript-exekveringstid',
      'mainthread-work-breakdown': 'Minska huvudtrådsbelastning'
    };

    // Använd vår action om vi har en, annars extrahera från description
    if (actions[auditId]) return actions[auditId];

    // Försök att vara smart med description
    if (description?.includes('unused')) return 'Ta bort oanvänd kod';
    if (description?.includes('JavaScript')) return 'Optimera JavaScript-laddning';
    if (description?.includes('CSS')) return 'Optimera CSS-laddning';
    if (description?.includes('image')) return 'Optimera bildladdning';

    return title || 'Optimera webbplatsens prestanda';
  };

  // Prioriterade åtgärder - sortera på impact/effort ratio
  const prioritizedActions = allIssues
    .filter(item => item && item.score !== undefined && item.score < 1) // Bara visa förbättringsområden
    .map(item => {
      const effort = getEffort(item.id);
      const impact = getImpact(item);
      const ratio = impact.score / effort.score;

      // Extrahera rätt titel från olika källor
      const title = item.title ||
                   item.displayValue ||
                   (item.description?.split('.')[0]) ||
                   item.id;

      // Hitta savings från olika källor
      const savings = item?.overallSavingsMs ||
                     item?.details?.overallSavingsMs ||
                     item?.numericValue ||
                     (item?.details?.items?.[0]?.wastedMs) ||
                     0;

      return {
        ...item,
        effort,
        impact,
        ratio,
        action: getActionableAdvice(item.id, title, item.description),
        savings,
        displayTitle: title
      };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 8); // Top 8 åtgärder

  if (prioritizedActions.length === 0) {
    return (
      <div
        data-testid="lh-priority-matrix"
        style={{
          marginTop: 16, padding: 20, borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.08)', background: '#fff'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Prioriterade åtgärder</div>
        <div style={{ color: '#16a34a', fontWeight: 500 }}>
          🎉 Utmärkt! Inga större optimeringar behövs just nu.
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="lh-priority-matrix"
      style={{
        marginTop: 16, padding: 20, borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)', background: '#fff'
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
        Prioriterade åtgärder
      </div>
      <div style={{ color: '#64748b', marginBottom: 16, fontSize: 14 }}>
        Sorterade efter störst förbättring för minst arbete
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {prioritizedActions.map((action, idx) => (
          <div
            key={idx}
            style={{
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fafafa'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  {action.action}
                </div>
                {action.savings > 0 && (
                  <div style={{ color: '#16a34a', fontSize: 14, fontWeight: 500 }}>
                    ⚡ Sparar ~{Math.round(action.savings)}ms laddningstid
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    background: action.impact.level === 'Hög' ? '#dcfce7' :
                               action.impact.level === 'Medel' ? '#fef3c7' : '#f1f5f9',
                    color: action.impact.level === 'Hög' ? '#166534' :
                           action.impact.level === 'Medel' ? '#92400e' : '#475569'
                  }}
                >
                  Impact: {action.impact.level}
                </span>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    background: action.effort.level === 'Låg' ? '#dcfce7' :
                               action.effort.level === 'Medel' ? '#fef3c7' : '#fee2e2',
                    color: action.effort.level === 'Låg' ? '#166534' :
                           action.effort.level === 'Medel' ? '#92400e' : '#dc2626'
                  }}
                >
                  {action.effort.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 16,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 8,
        fontSize: 14,
        color: '#64748b'
      }}>
        💡 Börja uppifrån för bästa resultat per investerad tid
      </div>
    </div>
  );
}