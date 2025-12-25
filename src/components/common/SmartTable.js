import React, { useMemo, useState } from 'react';
import { buildPredicate } from '../../utils/queryFilter';

export default function SmartTable({ rows = [], columns = [], pageSize = 25, rowId = 'id', defaultFilterFields, quickFilters = [], fieldMappings = {} }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ by: columns[0]?.key, dir: 'asc' });
  const [page, setPage] = useState(0);

  // Hjälpfunktion för att komma åt värden (stöd för a.b.c paths och accessors)
  const get = (row, key) => key?.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), row);
  
  const valueAccess = (row, key) => {
    // stöd för custom render/paths: om kolumnen har accessor använd den
    const col = columns.find(c => c.key === key);
    if (col?.accessor) return col.accessor(row);
    return get(row, key);
  };

  const pred = useMemo(
    () => buildPredicate(q, { 
      defaultFields: defaultFilterFields ?? columns.map(c => c.key).filter(Boolean), 
      valueAccess,
      fieldMappings
    }),
    [q, columns, defaultFilterFields, fieldMappings]
  );

  const filtered = useMemo(() => rows.filter(pred), [rows, pred]);

  const sorted = useMemo(() => {
    if (!sort.by) return filtered;
    const dir = sort.dir === 'asc' ? 1 : -1;
    
    // Förbättrad sortering med accessor-stöd
    const col = columns.find(c => c.key === sort.by);
    const getValue = (row) => col?.accessor ? col.accessor(row) : get(row, sort.by);
    
    return [...filtered].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return  1 * dir;
      
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const start = page * pageSize;
  const view = sorted.slice(start, start + pageSize);

  const handleQuickFilter = (filter) => {
    setQ(prev => {
      const current = prev.trim();
      return current ? `${current} ${filter}` : filter;
    });
    setPage(0);
  };

  return (
    <div>
      {quickFilters.length > 0 && (
        <div className="quick-filters">
          {quickFilters.map((filter, idx) => (
            <button 
              key={idx} 
              className="quick-filter-chip"
              onClick={() => handleQuickFilter(filter.query)}
              title={filter.description}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
      <div className="table-tools">
        <input
          className="input"
          placeholder='Filter…  ex: status:>=400 type:broken|redirect target:*pdf "mina sidor" !admin'
          value={q}
          onChange={e => { setPage(0); setQ(e.target.value); }}
        />
        {q && <button className="btn" onClick={() => { setQ(''); setPage(0); }}>Rensa</button>}
        <div className="spacer" />
        <div className="table-pager">
          <span>
            {sorted.length !== rows.length ? `${sorted.length} av ` : ''}{rows.length} rader
          </span>
          <button className="btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Föregående</button>
          <span>{page + 1}/{totalPages}</span>
          <button className="btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}>Nästa</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key || c.title} onClick={() => setSort(s => ({ by: c.key, dir: s.by === c.key && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                  {c.title}{sort.by === c.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((row, i) => (
              <tr key={row[rowId] ?? i}>
                {columns.map(c => (
                  <td key={c.key || c.title} className={c.alignRight ? 'num' : ''}>
                    {c.render ? c.render(row[c.key], row) : (c.accessor ? c.accessor(row) : row[c.key]) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
            {!view.length && (
              <tr><td colSpan={columns.length} className="muted">Inget att visa</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}