import React, { useMemo } from 'react';
import styles from './quickWinsPanel.module.css';

export default function QuickWinsPanel({ result }) {
  const url = result?.url || result?.targetUrl || '';
  const title = result?.meta?.title || result?.title || '';
  const description = result?.metaDescription || result?.meta?.description || '';
  const titleLen = title ? title.length : null;
  const descLen = description ? description.length : null;
  const h1Count = result?.headings?.h1?.count ?? result?.headings?.h1?.length ?? result?.h1Count ?? null;
  const wordCount = result?.content?.wordCount ?? result?.wordCount ?? null;
  const indexable = (typeof result?.indexable === 'boolean')
    ? result.indexable
    : (result?.metaRobots ? !result.metaRobots.includes('noindex') : null);
  const canonical = result?.canonicalUrl || result?.canonical?.href || result?.meta?.canonical || null;
  const hasStructured = Array.isArray(result?.structuredData)
    ? result.structuredData.length > 0
    : (typeof result?.technical?.hasSchema === 'boolean' ? result.technical.hasSchema
    : (typeof result?.structuredData === 'boolean' ? result.structuredData : null));

  const wins = useMemo(() => {
    const list = [];
    if (titleLen != null && (titleLen < 30 || titleLen > 70)) {
      list.push({
        title: `Justera titel-längd`,
        description: `Optimera <title> till 30–70 tecken (nu: ${titleLen} tecken)`,
        points: 8,
        time: '2 min',
        impact: 'HIGH'
      });
    }
    if (descLen == null || descLen === 0 || descLen < 120 || descLen > 160) {
      list.push({
        title: 'Skriv/trimma meta description',
        description: 'Optimera meta description till 120–160 tecken för bättre klickfrekvens',
        points: 6,
        time: '5 min',
        impact: 'HIGH'
      });
    }
    if (h1Count != null && h1Count !== 1) {
      list.push({
        title: `Fixa H1-struktur`,
        description: `Ha exakt en H1 per sida (nu: ${h1Count} st)`,
        points: 4,
        time: '3 min',
        impact: 'MEDIUM'
      });
    }
    if (indexable === false) {
      list.push({
        title: 'Ta bort noindex',
        description: 'Sidan är noindex – gör indexerbar om den ska ranka i Google',
        points: 10,
        time: '1 min',
        impact: 'CRITICAL'
      });
    }
    if (!canonical) {
      list.push({
        title: 'Lägg till canonical URL',
        description: 'Lägg till självpekande rel="canonical" för att undvika dublettinnehåll',
        points: 3,
        time: '2 min',
        impact: 'MEDIUM'
      });
    }
    if (wordCount != null && wordCount < 300) {
      list.push({
        title: 'Utöka innehåll',
        description: `Öka brödtexten till minst 300 ord (nu: ${wordCount} ord)`,
        points: 5,
        time: '15 min',
        impact: 'MEDIUM'
      });
    }
    if (hasStructured === false) {
      list.push({
        title: 'Lägg till strukturerad data',
        description: 'Implementera Schema.org markup (Organization, BreadcrumbList)',
        points: 4,
        time: '10 min',
        impact: 'MEDIUM'
      });
    }
    return list.slice(0, 3); // Top 3 quick wins
  }, [titleLen, descLen, h1Count, indexable, canonical, wordCount, hasStructured]);

  const totalPoints = wins.reduce((sum, win) => sum + win.points, 0);
  const estimatedTime = wins.length > 0 ? Math.max(...wins.map(w => parseInt(w.time))) + 5 : 0;

  return (
    <section className={styles.panel} aria-label="Quick Wins">
      <noscript data-testid="quick-wins-ssr" />
      <div className={styles.header}>
        <h3 className={styles.title}>Quick Wins - Snabba förbättringar</h3>
        <span className={styles.subtitle}>Högst prioriterade åtgärder för {url || 'din sida'}</span>
      </div>

      {wins.length === 0 ? (
        <div className={styles.empty}>Inga uppenbara snabba vinster hittades - bra jobbat!</div>
      ) : (
        <div>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>+{totalPoints}</span>
              <span className={styles.summaryLabel}>poäng möjliga</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>~{estimatedTime}</span>
              <span className={styles.summaryLabel}>minuter totalt</span>
            </div>
          </div>

          <div className={styles.winsList}>
            {wins.map((win, i) => (
              <div key={i} className={styles.winItem}>
                <div className={styles.winHeader}>
                  <h4 className={styles.winTitle}>{i + 1}. {win.title}</h4>
                  <div className={styles.winMeta}>
                    <span className={`${styles.impactBadge} ${styles[win.impact.toLowerCase()]}`}>
                      {win.impact}
                    </span>
                    <span className={styles.points}>+{win.points}</span>
                  </div>
                </div>
                <p className={styles.winDescription}>{win.description}</p>
                <div className={styles.winTime}>{win.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}