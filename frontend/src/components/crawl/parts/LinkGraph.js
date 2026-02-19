'use client';

import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

/**
 * Props:
 *  internal=[{source,target,status}], outbound=[...], broken=[...], redirects=[{start,hops[],end,finalStatus}]
 *  pages=[{url}], sitemapUrls=[string], origin=string
 */
export default function LinkGraph({
  internal = [],
  outbound = [],
  broken = [],
  redirects = [],
  pages = [],
  sitemapUrls = [],
  origin,
}) {
  const fgRef = useRef(null);
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ w: 640, h: 480 });
  const [show, setShow] = useState({ internal: true, external: true, broken: true, redirects: true });
  const [limit, setLimit] = useState(500);
  const [q, setQ] = useState('');

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      const r = wrapRef.current.getBoundingClientRect();
      setDims({ w: Math.max(360, Math.round(r.width)), h: Math.max(320, Math.round(r.height)) });
      requestAnimationFrame(() => fgRef.current?.zoomToFit?.(300));
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const graph = useMemo(() => {
    const nodeMap = new Map();
    const links = [];
    const norm = (u) => {
      try { return new URL(u, origin).href; } catch { return null; }
    };
    const addNode = (url, kind='internal', inSitemap=true) => {
      if (!url) return;
      if (!nodeMap.has(url)) {
        nodeMap.set(url, { id: url, kind, inSitemap, indeg: 0, outdeg: 0 });
      }
      return nodeMap.get(url);
    };
    const addLink = (s, t, type, status) => {
      s = norm(s); t = norm(t);
      if (!s || !t) return;
      const inSitemapT = sitemapUrls.includes(t);
      const kindT = type === 'external' ? 'external' : 'internal';
      const a = addNode(s, 'internal', sitemapUrls.includes(s));
      const b = addNode(t, kindT, inSitemapT);
      a.outdeg++; b.indeg++;
      links.push({ source: s, target: t, type, status });
    };

    if (show.internal) internal.forEach(l => addLink(l.source, l.target, 'internal', l.status));
    if (show.external) outbound.forEach(l => addLink(l.source, l.target, 'external', l.status));
    if (show.broken)   broken.forEach (l => addLink(l.source, l.target, 'broken',   l.status));
    if (show.redirects) {
      redirects.forEach(chain => {
        const seq = [chain.start, ...(Array.isArray(chain.hops) ? chain.hops : []), chain.end].filter(Boolean);
        for (let i = 0; i < seq.length - 1; i++) {
          addLink(seq[i], seq[i+1], 'redirect', chain.finalStatus);
        }
      });
    }

    // Om inga länkar – visa isolerade noder (sidor)
    if (links.length === 0 && pages.length > 0) {
      pages.forEach(p => addNode(p.url, 'internal', sitemapUrls.includes(p.url)));
    }

    // ranka & kapa
    let nodes = Array.from(nodeMap.values()).sort((a,b) => (b.indeg + b.outdeg) - (a.indeg + a.outdeg));
    nodes = nodes.slice(0, limit);
    const allow = new Set(nodes.map(n => n.id));
    let finalLinks = links.filter(l => allow.has(l.source) && allow.has(l.target));

    // textfilter
    const needle = q.trim().toLowerCase();
    if (needle) {
      nodes = nodes.filter(n => n.id.toLowerCase().includes(needle));
      const keep = new Set(nodes.map(n => n.id));
      finalLinks = finalLinks.filter(l => keep.has(l.source) && keep.has(l.target));
    }

    return { nodes, links: finalLinks };
  }, [internal, outbound, broken, redirects, pages, sitemapUrls, show, limit, q, origin]);

  // Debug logging
  React.useEffect(() => {
    console.debug('GRAPH STATS', {
      nodes: graph.nodes.length,
      links: graph.links.length,
      sample: graph.links.slice(0, 5)
    });
  }, [graph]);

  const linkColor = l =>
    l.type === 'broken'   ? '#ef4444' :
    l.type === 'redirect' ? '#f59e0b' :
    l.type === 'external' ? '#3b82f6' : '#10b981';

  const nodeColor = n =>
    !n.inSitemap ? '#a855f7' : (n.kind === 'external' ? '#3b82f6' : '#0ea5e9');

  const exportPng = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return alert('Kunde inte hitta canvas för export.');
    const a = document.createElement('a');
    a.download = `link-graph-${new Date().toISOString().slice(0,10)}.png`;
    a.href = canvas.toDataURL('image/png', 1.0);
    a.click();
  };

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-title">Länk-karta</div>
        <div className="card-actions">
          <button className="btn" onClick={exportPng}>Exportera PNG</button>
        </div>
      </div>

      <div className="table-tools" style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={show.internal}  onChange={e=>setShow(s=>({...s, internal:e.target.checked}))}/> Interna</label>
        <label><input type="checkbox" checked={show.external}  onChange={e=>setShow(s=>({...s, external:e.target.checked}))}/> Externa</label>
        <label><input type="checkbox" checked={show.broken}    onChange={e=>setShow(s=>({...s, broken:e.target.checked}))}/> Brutna</label>
        <label><input type="checkbox" checked={show.redirects} onChange={e=>setShow(s=>({...s, redirects:e.target.checked}))}/> Kedjor</label>
        <span className="spacer" />
        <input className="input" placeholder="Sök URL…" value={q} onChange={e=>setQ(e.target.value)} />
        <input className="input" type="number" min={100} max={2000} step={100} value={limit} onChange={e=>setLimit(+e.target.value)} title="Max noder" style={{width:90}}/>
        <button className="btn" onClick={()=>fgRef.current?.zoomToFit(400)}>Zooma till passform</button>
      </div>

      <div className="link-graph-box" ref={wrapRef}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graph}
          width={dims.w}
          height={dims.h}
          cooldownTicks={80}
          linkDirectionalParticles={0}
          linkColor={linkColor}
          linkWidth={l => (l.type === 'broken' ? 2 : 1)}
          nodeRelSize={5}
          nodeColor={nodeColor}
          nodeLabel={n => `${n.id}\nIn: ${n.indeg}  Ut: ${n.outdeg}${n.inSitemap ? '' : '\n(Orphan)'}`}
          onNodeClick={n => window.open(n.id, '_blank')}
          onEngineStop={() => fgRef.current?.zoomToFit(400)}
          nodeCanvasObject={(node, ctx, scale) => {
            const deg = (node.indeg || 0) + (node.outdeg || 0);
            const r = 4 + Math.log(1 + deg);
            ctx.fillStyle = nodeColor(node);
            ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, 2*Math.PI); ctx.fill();
            if (scale > 1.25 || deg >= 3) {
              const label = node.id.replace(/^https?:\/\/(www\.)?/, '').slice(0, 42);
              ctx.font = `${12/scale}px system-ui`;
              ctx.fillStyle = 'rgba(15,23,42,.9)';
              ctx.fillText(label, node.x + r + 2, node.y + 3);
            }
            if (!node.inSitemap) {
              ctx.strokeStyle = '#a855f7';
              ctx.lineWidth = 1/scale; ctx.beginPath(); ctx.arc(node.x, node.y, r+3, 0, 2*Math.PI); ctx.stroke();
            }
          }}
        />
      </div>

      <div className="muted" style={{marginTop:8}}>
        Färger: <span style={{color:'#10b981'}}>intern</span> · <span style={{color:'#3b82f6'}}>extern</span> · <span style={{color:'#f59e0b'}}>kedja</span> · <span style={{color:'#ef4444'}}>bruten</span> · <span style={{color:'#a855f7'}}>orphan</span>
      </div>
    </div>
  );
}