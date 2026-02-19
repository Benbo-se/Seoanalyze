import React from 'react';
import SmartTable from '../../common/SmartTable';

export default function CrawlIssuesTable({ issues=[] }) {
  const columns = [
    { key:'severity', title:'Allvar', render:(v)=>v ?? '—' },
    { key:'category', title:'Kategori' },
    { key:'message',  title:'Beskrivning', render:(v,row)=>(<a href={`#issue-${row.id||row.code}`} className="link">{v}</a>) },
    { key:'count',    title:'Antal', alignRight:true },
  ];
  const rows = issues.map((it, i)=>({ 
    id: it.id || `${it.code || 'c'}-${i}`, 
    severity: it.severity || 'medel', 
    category: it.category || 'Allmänt', 
    message: it.title || it.message, 
    count: it.count ?? 1,
    code: it.code || it.id || `c-${i}`,
    page: it.page || it.url || ''
  }));

  const quickFilters = [
    { label: 'Hög', query: 'allvar:hög', description: 'Visa endast höga problem' },
    { label: 'Säkerhet', query: 'kategori:säkerhet', description: 'Visa säkerhetsproblem' },
    { label: 'HSTS', query: 'kod:HSTS', description: 'Visa HSTS-problem' },
    { label: 'Alt-text', query: 'kod:ALT_TEXT', description: 'Visa alt-text problem' }
  ];

  return <SmartTable 
    rows={rows} 
    columns={columns} 
    pageSize={25}
    placeholder="Filtrera… t.ex. allvar:hög kategori:säkerhet kod:HSTS"
    quickFilters={quickFilters}
  />;
}