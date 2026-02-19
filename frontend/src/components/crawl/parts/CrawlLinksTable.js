import React from 'react';
import SmartTable from '../../common/SmartTable';

export default function CrawlLinksTable({ broken=[], redirects=[], outbound=[], internal=[] }) {
  const colsBroken = [
    { key:'source', title:'Källa' },
    { key:'target', title:'Mål' },
    { key:'status', title:'Status', alignRight:true },
    { key:'type', title:'Typ' },
  ];
  const colsRedir = [
    { key:'start', title:'Start' },
    { key:'end',   title:'Slut' },
    { key:'hops',  title:'Hopp', alignRight:true },
    { key:'finalStatus', title:'Slutstatus', alignRight:true },
  ];

  // Normalize broken links data
  const brokenRows = broken.map((link, i) => ({
    ...link,
    id: link.id || `broken-${i}`,
    type: link.type || (link.target?.includes('://') && !link.target?.includes(window?.location?.hostname) ? 'extern' : 'intern'),
    nofollow: link.nofollow ? 'ja' : 'nej'
  }));

  // Normalize redirect data
  const redirectRows = redirects.map((chain, i) => ({
    ...chain,
    id: chain.id || `redirect-${i}`,
    hops: chain.hops || chain.length || 1
  }));

  const brokenQuickFilters = [
    { label: '404', query: 'status:404', description: 'Visa endast 404-fel' },
    { label: '5xx', query: 'status:5xx', description: 'Visa serverfel' },
    { label: 'Extern', query: 'type:extern', description: 'Visa externa länkar' },
    { label: 'PDF', query: 'target:*pdf', description: 'Länkar till PDF-filer' },
    { label: '"Mina sidor"', query: '"mina sidor"', description: 'Innehåller frasen "mina sidor"' }
  ];

  const redirectQuickFilters = [
    { label: 'Hopp >1', query: 'hops:>1', description: 'Visa kedjor med flera hopp' },
    { label: '200 OK', query: 'finalStatus:200', description: 'Slutar med 200 OK' },
    { label: '404', query: 'finalStatus:404', description: 'Slutar med 404' },
    { label: 'Kedjor >2', query: 'hops:>=2', description: 'Långa redirect-kedjor' }
  ];

  // Svensk-Engelsk mappning för filter
  const fieldMappings = {
    'typ': 'type',
    'status': 'status',
    'slutstatus': 'finalStatus',
    'hopp': 'hops',
    'källa': 'source',
    'mål': 'target',
    'start': 'start',
    'slut': 'end'
  };

  return (
    <div className="card-grid">
      <div className="info-card">
        <div className="card-header"><div className="card-title">Brutna länkar</div></div>
        <SmartTable 
          rows={brokenRows} 
          columns={colsBroken} 
          pageSize={10}
          quickFilters={brokenQuickFilters}
          fieldMappings={fieldMappings}
        />
      </div>
      <div className="info-card">
        <div className="card-header"><div className="card-title">Omdirigeringskedjor</div></div>
        <SmartTable 
          rows={redirectRows} 
          columns={colsRedir} 
          pageSize={10}
          quickFilters={redirectQuickFilters}
          fieldMappings={fieldMappings}
        />
      </div>
    </div>
  );
}