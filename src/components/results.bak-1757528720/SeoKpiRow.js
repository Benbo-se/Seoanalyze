import React from 'react';
import styles from './seoKpiRow.module.css';
import { formatWordCount } from '../../utils/formatNumber';

export default function SeoKpiRow({ result }) {
  // SSR-markör för curl-verifiering
  // (obs: även om komponenten är client-renderad får vi med markup i SSR HTML)
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
  const sitemap = typeof result?.sitemap?.present === 'boolean' ? result.sitemap.present : null;
  const robotsTxt = typeof result?.robotsTxt?.present === 'boolean' ? result.robotsTxt.present : null;
  const hasStructured = Array.isArray(result?.structuredData)
    ? result.structuredData.length > 0
    : (typeof result?.structuredData === 'boolean' ? result.structuredData : null);

  const chip = (label, value, state='') => (
    <span className={[styles.chip, state && styles[state]].filter(Boolean).join(' ')} aria-label={label}>
      <strong>{label}:</strong>&nbsp;<span>{value ?? '—'}</span>
    </span>
  );

  // states (ok/warn/bad) för några centrala KPI:er
  const titleState = titleLen == null ? '' : (titleLen < 30 || titleLen > 60 ? 'warn' : 'ok');
  const descState  = descLen == null ? '' : (descLen < 80 || descLen > 160 ? 'warn' : 'ok');
  const h1State    = h1Count == null ? '' : (h1Count === 1 ? 'ok' : 'warn');
  const idxState   = indexable == null ? '' : (indexable ? 'ok' : 'bad');

  return (
    <section className={styles.row} aria-label="SEO KPI">
      <noscript data-testid="seo-kpi-ssr" />
      {chip('URL', url || '—')}
      {chip('Title', titleLen != null ? `${titleLen} tecken` : null, titleState)}
      {chip('Meta desc', descLen != null ? `${descLen} tecken` : null, descState)}
      {chip('H1', h1Count, h1State)}
      {chip('Word count', wordCount ? formatWordCount(wordCount).replace(' ord', '') : null)}
      {chip('Indexable', indexable == null ? null : (indexable ? 'Ja' : 'Nej'), idxState)}
      {chip('Canonical', canonical ? 'Ja' : (canonical === null ? '—' : 'Nej'))}
      {chip('Sitemap', sitemap == null ? '—' : (sitemap ? 'Ja' : 'Nej'))}
      {chip('robots.txt', robotsTxt == null ? '—' : (robotsTxt ? 'Ja' : 'Nej'))}
      {chip('Structured data', hasStructured == null ? '—' : (hasStructured ? 'Ja' : 'Nej'))}
    </section>
  );
}