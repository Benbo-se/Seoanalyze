import React from 'react';
import SmartTable from '../../common/SmartTable';

export default function CrawlImagesPanel({ missingAlt=[], large=[], slow=[] }) {
  // Normalize image data
  const altRows = missingAlt.map((img, i) => ({
    ...img,
    id: img.id || `alt-${i}`,
    alt: 'saknas',
    format: img.url ? img.url.split('.').pop()?.toLowerCase() : 'okänd'
  }));

  const largeRows = large.map((img, i) => ({
    ...img,
    id: img.id || `large-${i}`,
    kb: img.kb || img.size || img.bytes ? Math.round((img.bytes || img.size * 1024) / 1024) : 0,
    format: img.url ? img.url.split('.').pop()?.toLowerCase() : 'okänd'
  }));

  const slowRows = slow.map((img, i) => ({
    ...img,
    id: img.id || `slow-${i}`,
    lcpMs: img.lcpMs || img.lcp || img.loadTime || 0,
    format: img.url ? img.url.split('.').pop()?.toLowerCase() : 'okänd'
  }));

  const altQuickFilters = [
    { label: 'PNG', query: 'format:png', description: 'Visa PNG-bilder' },
    { label: 'JPG', query: 'format:jpg', description: 'Visa JPG-bilder' }
  ];

  const sizeQuickFilters = [
    { label: '>150 KB', query: 'kb:>150', description: 'Visa bilder större än 150 KB' },
    { label: '>500 KB', query: 'kb:>500', description: 'Visa bilder större än 500 KB' },
    { label: 'PNG', query: 'format:png', description: 'Visa PNG-bilder' }
  ];

  const perfQuickFilters = [
    { label: '>2.5s', query: 'lcpMs:>2500', description: 'Visa bilder med LCP över 2.5s' },
    { label: '>4s', query: 'lcpMs:>4000', description: 'Visa bilder med LCP över 4s' }
  ];

  return (
    <div className="card-grid">
      <div className="info-card">
        <div className="card-header"><div className="card-title">Saknar alt-text</div></div>
        <SmartTable 
          rows={altRows} 
          columns={[
            {key:'url',title:'Bild'},
            {key:'page',title:'Sida'},
            {key:'format',title:'Format'}
          ]} 
          pageSize={10}
          placeholder="Filtrera… t.ex. format:png sida:/produkter"
          quickFilters={altQuickFilters}
        />
      </div>
      <div className="info-card">
        <div className="card-header"><div className="card-title">Stora bilder</div></div>
        <SmartTable 
          rows={largeRows} 
          columns={[
            {key:'url',title:'Bild'},
            {key:'kb',title:'KB',alignRight:true},
            {key:'format',title:'Format'}
          ]} 
          pageSize={10}
          placeholder="Filtrera… t.ex. kb:>150 format:png"
          quickFilters={sizeQuickFilters}
        />
      </div>
      <div className="info-card">
        <div className="card-header"><div className="card-title">Långsam inläsning</div></div>
        <SmartTable 
          rows={slowRows} 
          columns={[
            {key:'url',title:'Bild'},
            {key:'lcpMs',title:'LCP (ms)',alignRight:true},
            {key:'format',title:'Format'}
          ]} 
          pageSize={10}
          placeholder="Filtrera… t.ex. lcpMs:>2500 format:jpg"
          quickFilters={perfQuickFilters}
        />
      </div>
    </div>
  );
}