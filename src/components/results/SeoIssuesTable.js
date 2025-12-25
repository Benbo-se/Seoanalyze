import React, { useState, useMemo } from 'react';
import styles from './seoIssuesTable.module.css';
import mapSeoIssues from './mapSeoIssues';
import { CATEGORY_SV } from '../../utils/i18nCategories';

export default function SeoIssuesTable({ result }) {
  const [query, setQuery] = useState('');
  const [severityFilters, setSeverityFilters] = useState(new Set());
  const [categoryFilters, setCategoryFilters] = useState(new Set());
  const [sortKey, setSortKey] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleCount, setVisibleCount] = useState(100);

  const allIssues = useMemo(() => mapSeoIssues(result), [result]);

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const categories = ['Meta', 'Innehåll', 'Tekniskt', 'Säkerhet', 'Schema', 'Social'];
  const severities = ['critical', 'high', 'medium', 'low'];

  const filteredAndSorted = useMemo(() => {
    let filtered = allIssues;

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(q) ||
        issue.description?.toLowerCase().includes(q) ||
        issue.category.toLowerCase().includes(q)
      );
    }

    // Severity filters
    if (severityFilters.size > 0) {
      filtered = filtered.filter(issue => severityFilters.has(issue.severity));
    }

    // Category filters
    if (categoryFilters.size > 0) {
      filtered = filtered.filter(issue => categoryFilters.has(issue.category));
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      if (sortKey === 'severity') {
        aVal = severityOrder[a.severity] || 0;
        bVal = severityOrder[b.severity] || 0;
      } else if (sortKey === 'impact') {
        aVal = a.impact || 0;
        bVal = b.impact || 0;
      } else if (sortKey === 'category') {
        aVal = a.category || '';
        bVal = b.category || '';
      } else {
        aVal = a[sortKey] || '';
        bVal = b[sortKey] || '';
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allIssues, query, severityFilters, categoryFilters, sortKey, sortDir]);

  const visibleIssues = filteredAndSorted.slice(0, visibleCount);
  const hasMore = filteredAndSorted.length > visibleCount;

  const toggleFilter = (set, setter, value) => {
    const newSet = new Set(set);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setter(newSet);
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      critical: 'Kritisk',
      high: 'Hög',
      medium: 'Medium',
      low: 'Låg'
    };
    return labels[severity] || severity;
  };

  if (allIssues.length === 0) {
    return (
      <section className={styles.container} aria-label="SEO Issues">
        <noscript data-testid="seo-issues-ssr" />
        <div className={styles.empty}>
          <h3>Inga problem hittades</h3>
          <p>Grattis! Din sida verkar vara väloptimerad.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-label="SEO Issues" role="region">
      <noscript data-testid="seo-issues-ssr" />
      
      <div className={styles.header}>
        <h3 className={styles.title}>Alla fynd ({filteredAndSorted.length})</h3>
        <p className={styles.subtitle}>Sorteras efter allvarlighetsgrad</p>
      </div>

      {/* Search and filters */}
      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Sök i problem..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.search}
          aria-label="Sök problem"
        />
        
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Allvar:</span>
            {severities.map(severity => (
              <button
                key={severity}
                onClick={() => toggleFilter(severityFilters, setSeverityFilters, severity)}
                className={`${styles.filterChip} ${styles[`severity-${severity}`]} ${
                  severityFilters.has(severity) ? styles.active : ''
                }`}
                aria-pressed={severityFilters.has(severity)}
              >
                {getSeverityLabel(severity)}
              </button>
            ))}
          </div>
          
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Kategori:</span>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => toggleFilter(categoryFilters, setCategoryFilters, category)}
                className={`${styles.filterChip} ${
                  categoryFilters.has(category) ? styles.active : ''
                }`}
                aria-pressed={categoryFilters.has(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer} role="table" aria-label="SEO Issues Table">
        <div className={styles.tableHeader} role="rowgroup">
          <div className={styles.headerRow} role="row">
            <button
              className={`${styles.headerCell} ${sortKey === 'category' ? styles.sorted : ''}`}
              onClick={() => handleSort('category')}
              aria-sort={sortKey === 'category' ? sortDir : 'none'}
              role="columnheader"
            >
              Kategori {sortKey === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`${styles.headerCell} ${sortKey === 'title' ? styles.sorted : ''}`}
              onClick={() => handleSort('title')}
              aria-sort={sortKey === 'title' ? sortDir : 'none'}
              role="columnheader"
            >
              Problem {sortKey === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`${styles.headerCell} ${sortKey === 'severity' ? styles.sorted : ''}`}
              onClick={() => handleSort('severity')}
              aria-sort={sortKey === 'severity' ? sortDir : 'none'}
              role="columnheader"
            >
              Allvar {sortKey === 'severity' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <button
              className={`${styles.headerCell} ${sortKey === 'impact' ? styles.sorted : ''}`}
              onClick={() => handleSort('impact')}
              aria-sort={sortKey === 'impact' ? sortDir : 'none'}
              role="columnheader"
            >
              Påverkan {sortKey === 'impact' && (sortDir === 'asc' ? '↑' : '↓')}
            </button>
            <div className={styles.headerCell} role="columnheader">Berörda</div>
            <div className={styles.headerCell} role="columnheader">Läs mer</div>
          </div>
        </div>

        <div className={styles.tableBody} role="rowgroup">
          {visibleIssues.map((issue, index) => (
            <div key={issue.id} className={styles.tableRow} role="row">
              <div className={styles.cell} role="cell">
                <span className={styles.categoryChip}>
                  {CATEGORY_SV[issue.category] ?? issue.category}
                </span>
              </div>
              <div className={styles.cell} role="cell">
                <div className={styles.issueTitle}>{issue.title}</div>
                {issue.description && (
                  <div className={styles.issueDescription}>{issue.description}</div>
                )}
              </div>
              <div className={styles.cell} role="cell">
                <span className={`${styles.severityChip} ${styles[`severity-${issue.severity}`]}`}>
                  {getSeverityLabel(issue.severity)}
                </span>
              </div>
              <div className={styles.cell} role="cell">
                {issue.impact || '—'}
              </div>
              <div className={styles.cell} role="cell">
                {issue.affected || '—'}
              </div>
              <div className={styles.cell} role="cell">
                {issue.anchorId ? (
                  <a href={issue.anchorId} className={styles.link}>
                    Gå till
                  </a>
                ) : (
                  '—'
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasMore && (
        <div className={styles.loadMore}>
          <button
            onClick={() => setVisibleCount(prev => prev + 50)}
            className={styles.loadMoreBtn}
          >
            Visa fler ({filteredAndSorted.length - visibleCount} kvar)
          </button>
        </div>
      )}
    </section>
  );
}