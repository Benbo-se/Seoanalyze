import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ForceGraph2D without SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px' }}>Loading visualization...</div>
});

function CrawlMapLight({ crawlData, targetUrl }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [isClient, setIsClient] = useState(false);
  const graphRef = useRef();
  const containerRef = useRef();

  // Ensure we're client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (crawlData && crawlData.pages) {
      const data = processCrawlData(crawlData, targetUrl);
      setGraphData(data);
    }
  }, [crawlData, targetUrl]);

  // Handle container resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(300, Math.min(800, rect.width - 32)); // Padding adjustment
        const height = Math.max(300, Math.min(500, width * 0.6)); // 16:10 aspect ratio
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const processCrawlData = (crawlData, rootUrl) => {
    if (!crawlData?.pages?.length) return { nodes: [], links: [] };

    const byUrl = new Map();
    const pages = crawlData.pages.slice(0, 100); // Begränsa till 100 noder för prestanda
    
    pages.forEach((p, idx) => {
      // Normalize URLs for comparison (remove trailing slashes)
      const normalizedPageUrl = p.url?.replace(/\/$/, '');
      const normalizedRootUrl = rootUrl?.replace(/\/$/, '');
      
      byUrl.set(p.url, {
        id: p.url,
        label: (p.title || p.url).slice(0, 60),
        status: p.status || p.statusCode || 200,
        isRoot: normalizedPageUrl === normalizedRootUrl || idx === 0, // First page as fallback
        idx
      });
    });

    const nodes = Array.from(byUrl.values()).map(n => ({
      id: n.id,
      name: n.label,
      status: n.status,
      val: n.isRoot ? 4 : 1.5, // storlek
      url: n.id,
      title: n.label,
      isRoot: n.isRoot,
      size: n.isRoot ? 12 : 8
    }));

    const links = [];
    
    // First, try to get links from crawl data structure
    pages.forEach(p => {
      // Try multiple possible link structures
      const outLinks = p.outLinks || 
                      p.links?.internal || 
                      p.internalLinks || 
                      p.links || 
                      [];
      
      // console.log(`Processing links for ${p.url}:`, outLinks);
      
      if (Array.isArray(outLinks)) {
        outLinks.forEach(dst => {
          // Handle both string URLs and objects with URL property
          const targetUrl = typeof dst === 'string' ? dst : dst?.url || dst?.href;
          if (targetUrl && byUrl.has(targetUrl)) {
            links.push({ 
              source: p.url, 
              target: targetUrl,
              strength: byUrl.get(p.url).isRoot ? 2 : 1
            });
          }
        });
      }
    });
    
    // If no links found, create some basic connections from root to other pages
    if (links.length === 0 && pages.length > 1) {
      const rootPage = pages.find(p => p.url === rootUrl) || pages[0];
      pages.slice(0, Math.min(8, pages.length - 1)).forEach(p => {
        if (p.url !== rootPage.url) {
          links.push({
            source: rootPage.url,
            target: p.url,
            strength: 0.5
          });
        }
      });
    }

    return { nodes, links };
  };

  const getNodeColor = (node) => {
    if (node.isRoot) return '#4f46e5'; // Purple for root
    
    switch (node.status) {
      case 200: return '#16a34a'; // Green for OK
      case 301:
      case 302: return '#f59e0b'; // Orange for redirects
      case 404: return '#ef4444'; // Red for not found
      default: return '#64748b'; // Gray for other
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 200: return 'OK';
      case 301: return 'Redirect';
      case 302: return 'Temp Redirect';
      case 404: return 'Not Found';
      default: return 'Other';
    }
  };

  const truncateUrl = (url, maxLength = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleNodeHover = (node) => {
    setHoveredNode(node);
  };

  // Custom node rendering
  const paintNode = (node, ctx, globalScale) => {
    const size = node.size;
    const color = getNodeColor(node);
    
    // Draw main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Add border for selected/hovered nodes
    if (selectedNode?.id === node.id || hoveredNode?.id === node.id) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Add text label for root node or when zoomed in
    if (node.isRoot || globalScale > 2) {
      const label = node.isRoot ? 'HOME' : truncateUrl(new URL(node.url).pathname, 15);
      const fontSize = node.isRoot ? 10 : 8;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, node.x, node.y + size + 12);
    }
  };

  if (!crawlData || !crawlData.pages || crawlData.pages.length === 0) {
    return (
      <div className="crawl-map-light">
        <div className="map-header">
          <h3>Crawl Map</h3>
          <div className="map-subtitle">Interaktiv webbplats-karta</div>
        </div>
        <div className="no-crawl-data">
          <div className="no-data-icon">🗺️</div>
          <div className="no-data-text">Ingen crawl-data tillgänglig</div>
          <div className="no-data-hint">Kör en crawl-analys för att se webbplats-kartan</div>
        </div>
      </div>
    );
  }

  // Show a loading message if we have pages but no graph data yet
  if (!graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="crawl-map-light">
        <div className="map-header">
          <h3>Crawl Map</h3>
          <div className="map-subtitle">Processar {crawlData.pages.length} sidor...</div>
        </div>
        <div className="no-crawl-data">
          <div className="no-data-icon">⚙️</div>
          <div className="no-data-text">Bygger webbplats-karta</div>
          <div className="no-data-hint">Detta kan ta en stund för större webbplatser</div>
        </div>
      </div>
    );
  }

  return (
    <div className="crawl-map-light">
      <div className="map-header">
        <h3>Crawl Map</h3>
        <div className="map-subtitle">
          {graphData.nodes.length} sidor • {graphData.links.length} länkar
        </div>
      </div>
      
      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#16a34a'}}></div>
          <span>200 OK</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#f59e0b'}}></div>
          <span>Redirects</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#ef4444'}}></div>
          <span>404 Error</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{backgroundColor: '#4f46e5'}}></div>
          <span>Homepage</span>
        </div>
      </div>

      {/* Force Graph - Only render client-side */}
      <div className="graph-container" ref={containerRef}>
        {isClient ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeRelSize={1}
            nodeCanvasObject={paintNode}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            linkColor={() => '#cbd5e1'}
            linkWidth={1}
            linkOpacity={0.6}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="#f8fafc"
            enableZoomInteraction={true}
            enablePanInteraction={true}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        ) : (
          <div style={{ width: dimensions.width, height: dimensions.height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '8px' }}>
            Loading crawl map...
          </div>
        )}
      </div>

      {/* Node details sidebar */}
      {selectedNode && (
        <div className="node-details">
          <div className="details-header">
            <div className="details-title">Siddetaljer</div>
            <button 
              className="close-details"
              onClick={() => setSelectedNode(null)}
            >
              ×
            </button>
          </div>
          
          <div className="details-content">
            <div className="detail-row">
              <div className="detail-label">Status</div>
              <div className={`detail-value status-${selectedNode.status}`}>
                {selectedNode.status} {getStatusLabel(selectedNode.status)}
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Titel</div>
              <div className="detail-value">{selectedNode.title}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">URL</div>
              <div className="detail-value url">
                <a 
                  href={selectedNode.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {truncateUrl(selectedNode.url, 50)}
                </a>
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Interna länkar</div>
              <div className="detail-value">{selectedNode.internalLinks?.length || 0}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Controls hint */}
      <div className="graph-controls">
        <div className="control-hint">
          🖱️ Drag to pan • 🔍 Scroll to zoom • 👆 Click nodes for details
        </div>
      </div>
    </div>
  );
}

export default CrawlMapLight;