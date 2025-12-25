import React, { useMemo } from 'react';
import styles from './quickWinsPanel.module.css';

export default function QuickWinsPanel({ result }) {
  const url = result?.url || result?.targetUrl || '';
  const title = result?.meta?.title || result?.title || '';
  const description = result?.meta?.description || '';
  const titleLen = title ? title.length : null;
  const descLen = description ? description.length : null;
  const h1Count = result?.headings?.h1?.length ?? result?.h1Count ?? null;
  const wordCount = result?.content?.wordCount ?? result?.wordCount ?? null;
  const indexable = (typeof result?.indexable === 'boolean')
    ? result.indexable
    : (result?.robots?.noindex === true ? false : null);
  const canonical = result?.canonical?.href || result?.meta?.canonical || null;
  const hasStructured = Array.isArray(result?.structuredData)
    ? result.structuredData.length > 0
    : (typeof result?.structuredData === 'boolean' ? result.structuredData : null);

  const wins = useMemo(() => {
    const list = [];
    if (titleLen != null && (titleLen < 30 || titleLen > 60)) {
      list.push(`Justera <title> till 30–60 tecken (nu: ${titleLen}).`);
    }
    if (descLen == null || descLen < 80 || descLen > 160) {
      list.push('Skriv/trimma meta description till 80–160 tecken.');
    }
    if (h1Count != null && h1Count !== 1) {
      list.push(`Ha exakt en H1 på sidan (nu: ${h1Count}).`);
    }
    if (indexable === false) {
      list.push('Sidan är noindex – gör indexerbar om den ska ranka.');
    }
    if (!canonical) {
      list.push('Lägg en självpekande rel="canonical".');
    }
    if (wordCount != null && wordCount < 300) {
      list.push(`Öka brödtexten (minst ~300 ord rekommenderas, nu: ${wordCount}).`);
    }
    if (hasStructured === false) {
      list.push('Lägg till relevant strukturerad data (Organization, BreadcrumbList, etc.).');
    }
    return list.slice(0, 5);
  }, [titleLen, descLen, h1Count, indexable, canonical, wordCount, hasStructured]);

  return (
    <section className={styles.panel} aria-label="Quick Wins">
      <noscript data-testid="quick-wins-ssr" />
      <div className={styles.header}>
        <h3 className={styles.title}>Quick Wins</h3>
        <span className={styles.subtitle}>Snabba förbättringar för {url || 'din sida'}</span>
      </div>
      {wins.length === 0 ? (
        <div className={styles.empty}>Inga uppenbara snabba vinster hittades.</div>
      ) : (
        <ol className={styles.list}>
          {wins.map((w, i) => (<li key={i} className={styles.item}>{w}</li>))}
        </ol>
      )}
    </section>
  );
}