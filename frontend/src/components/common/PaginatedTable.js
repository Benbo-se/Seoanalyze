'use client';

import React, { useState } from 'react';

const fmtNum = (n) => {
  if (n == null) return '—';
  try {
    return new Intl.NumberFormat('sv-SE').format(n);
  } catch { return String(n); }
};

function exportToCsv(data, columns, filename) {
  const headers = columns.map(c => c.title);
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (col.render && typeof col.render === 'function') {
        // För render funktioner, extrahera bara text
        const rendered = col.render(value, row);
        if (typeof rendered === 'string') return `"${rendered.replace(/"/g, '""')}"`;
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }
      return `"${String(value || '').replace(/"/g, '""')}"`;
    })
  );
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function copyToClipboard(data, columns) {
  const text = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (col.render && typeof col.render === 'function') {
        const rendered = col.render(value, row);
        if (typeof rendered === 'string') return rendered;
        return String(value || '');
      }
      return String(value || '');
    }).join('\t')
  ).join('\n');
  
  navigator.clipboard.writeText(text).then(() => {
    // Minimal feedback
    console.log('Kopierat till urklipp');
  });
}

export default function PaginatedTable({ 
  rows = [], 
  columns = [], 
  initialLimit = 50, 
  emptyText = 'Inget att visa',
  csvFilename = 'export.csv',
  title
}) {
  const [showAll, setShowAll] = useState(false);
  const [limit] = useState(initialLimit);

  const displayRows = showAll ? rows : rows.slice(0, limit);
  const hasMore = rows.length > limit;

  const handleExport = () => {
    exportToCsv(rows, columns, csvFilename);
  };

  const handleCopy = () => {
    copyToClipboard(rows, columns);
  };

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-title">
          {title} {rows.length > 0 && `(${fmtNum(rows.length)})`}
        </div>
        {rows.length > 0 && (
          <div className="card-actions">
            <button className="btn btn-sm" onClick={handleCopy} title="Kopiera till urklipp">
              Kopiera
            </button>
            <button className="btn btn-sm" onClick={handleExport} title="Exportera som CSV">
              CSV
            </button>
          </div>
        )}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} style={{textAlign: c.right ? 'right':'left'}}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="muted">{emptyText}</td>
              </tr>
            )}
            {displayRows.map((r, i) => (
              <tr key={r.id || r.url || r.target || r.source || i}>
                {columns.map(c => (
                  <td key={c.key} className={c.right ? 'num' : ''} style={{ wordBreak: 'break-all' }}>
                    {c.render ? c.render(r[c.key], r) : (r[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="table-footer" style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-light)' }}>
          <button 
            className="btn btn-sm" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? `Visa färre (${fmtNum(limit)})` : `Visa alla (${fmtNum(rows.length)})`}
          </button>
        </div>
      )}
    </div>
  );
}