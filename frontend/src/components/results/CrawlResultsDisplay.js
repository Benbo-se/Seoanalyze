import React, { useState, useEffect } from 'react';
import FixThisPanel from '../common/FixThisPanel';
import TextNormalizer from '../../utils/textNormalizer';
import CrawlMapLight from '../visualizations/CrawlMapLight';
import TableOfContents from './TableOfContents';
import ResultsTopbar from './ResultsTopbar';

// Hjälpkomponent för statistik
function Stat({ label, value, color }) {
  return (
    <div className="quick-stat-item">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const CrawlResultsDisplay = ({ crawlData, onNewAnalysis, isSharedView = false }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [fixableIssues, setFixableIssues] = useState([]);
  const [issueStatuses, setIssueStatuses] = useState({});

  const handleStatusChange = async (issueId, newStatus) => {
    setIssueStatuses(prev => ({
      ...prev,
      [issueId]: newStatus
    }));
  };

  // Topbar handlers
  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${crawlData.analysisId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crawl-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('PDF download failed. Please try again.');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF download failed. Please try again.');
    }
  };

  const handleDownloadJson = () => {
    const jsonData = {
      analysisId: crawlData.analysisId,
      timestamp: new Date().toISOString(),
      type: 'crawl',
      url: crawlData.targetUrl,
      fullData: crawlData
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawl-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${crawlData.analysisId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 90 })
      });
      if (response.ok) {
        const shareData = await response.json();
        if (navigator.share) {
          await navigator.share({
            title: 'Crawl Analys Resultat',
            text: `Crawl analys av ${crawlData.targetUrl}`,
            url: shareData.shareUrl,
          });
        } else {
          navigator.clipboard.writeText(shareData.shareUrl).then(() => {
            alert(`Delningslänk kopierad till urklipp!\n\nLänken är giltig till: ${new Date(shareData.expiresAt).toLocaleDateString('sv-SE')}`);
          }).catch(() => {
            alert(`Delningslänk skapad:\n${shareData.shareUrl}\n\nGiltig till: ${new Date(shareData.expiresAt).toLocaleDateString('sv-SE')}`);
          });
        }
      } else {
        alert('Delning misslyckades. Försök igen.');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Kunde inte skapa delningslänk');
    }
  };

  if (!crawlData) {
    return <div>No crawl data available</div>;
  }

  // Extract data with fallbacks
  const pages = crawlData.pages || [];
  const pagesCount = crawlData.pagesCount || pages.length;
  const score = crawlData.score || crawlData.summary?.totalScore || 0;
  const issues = crawlData.issues || crawlData.summary?.issues || 0;

  // Extract broken links from pages array
  const allBrokenLinks = pages.flatMap(page =>
    (page.brokenLinks || []).map(link => ({...link, sourcePage: page.url}))
  );

  // Extract broken images from pages array
  const allBrokenImages = pages.flatMap(page =>
    (page.brokenImages || []).map(img => ({...img, sourcePage: page.url}))
  );

  // Extract technical issues
  const technicalIssues = {
    missingTitles: pages.filter(page => !page.title || page.title.trim() === ''),
    missingMetaDescriptions: pages.filter(page => !page.metaDescription),
    missingH1: pages.filter(page => page.h1Count === 0),
    duplicateTitles: pages.filter((page, index, arr) =>
      arr.findIndex(p => p.title === page.title) !== index
    ),
    oversizedPages: pages.filter(page => page.pageSize > 1000000) // > 1MB
  };

  // Extract images without alt text from pages
  const imagesWithoutAlt = pages.flatMap(page =>
    (page.images || []).filter(img => !img.alt || img.alt.trim() === '').map(img => ({...img, sourcePage: page.url}))
  );

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'score-good';
    if (status >= 300 && status < 400) return 'score-warning';
    return 'score-poor';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="results-display crawl-results">
      {/* ResultsTopbar - same as SEO and Lighthouse */}
      <ResultsTopbar
        result={{
          ...crawlData,
          targetUrl: crawlData.targetUrl || crawlData.url,
          score: score
        }}
        analysisId={crawlData.analysisId}
        onDownloadPdf={handleDownloadPdf}
        onDownloadJson={handleDownloadJson}
        onShare={handleShare}
        onNewAnalysis={onNewAnalysis}
      />

      <div className="results-container">
        {/* Table of Contents */}
        <TableOfContents result={{
          overview: true,
          pages: pages.length > 0,
          technical: true,
          broken: allBrokenLinks.length > 0 || allBrokenImages.length > 0,
          images: imagesWithoutAlt.length > 0,
          performance: true,
          linkmap: pages.length > 0
        }} />

        {/* Action buttons */}
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={onNewAnalysis}
          >
            Ny Analys
          </button>
          {crawlData.analysisId && !isSharedView && (
            <>
              <button
                className="action-btn secondary"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/v1/analyses/${crawlData.analysisId}/pdf`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `crawl-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }
                  } catch (error) {
                    console.error('PDF download error:', error);
                  }
                }}
              >
                Ladda ner PDF
              </button>
              <button
                className="action-btn secondary"
                onClick={() => {
                  const jsonData = {
                    analysisId: crawlData.analysisId,
                    timestamp: new Date().toISOString(),
                    type: 'crawl',
                    url: crawlData.url,
                    summary: {
                      pagesCount,
                      score,
                      issues,
                      brokenLinks: allBrokenLinks.length,
                      brokenImages: allBrokenImages.length,
                      technicalIssues: Object.values(technicalIssues).reduce((sum, arr) => sum + arr.length, 0)
                    },
                    brokenLinks: allBrokenLinks,
                    brokenImages: allBrokenImages,
                    technicalIssues,
                    imagesWithoutAlt,
                    fullData: crawlData
                  };

                  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `crawl-analysis-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
              >
                Ladda ner JSON
              </button>

              <button
                className="action-btn secondary"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/v1/analyses/${crawlData.analysisId}/share`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ expiresInDays: 90 })
                    });
                    if (response.ok) {
                      const shareData = await response.json();
                      navigator.clipboard.writeText(shareData.shareUrl);
                      alert('Delningslänk kopierad till urklipp!');
                    }
                  } catch (error) {
                    console.error('Share creation error:', error);
                  }
                }}
              >
                Dela analys
              </button>

              <button
                className="action-btn secondary"
                onClick={() => {
                  // Skapa prioriterade åtgärder baserat på crawl data
                  const priorityActions = [];

                  if (allBrokenLinks.length > 0) {
                    priorityActions.push({
                      priority: 'high',
                      title: `Fixa ${allBrokenLinks.length} brutna länkar`,
                      description: 'Brutna länkar skadar användarupplevelse och SEO',
                      action: 'Kontrollera och uppdatera alla brutna länkar',
                      impact: 'Hög - påverkar crawlbarhet och användarupplevelse'
                    });
                  }

                  if (technicalIssues.missingTitles.length > 0) {
                    priorityActions.push({
                      priority: 'high',
                      title: `Lägg till title-taggar för ${technicalIssues.missingTitles.length} sidor`,
                      description: 'Saknade title-taggar är kritiska för SEO',
                      action: 'Lägg till unika, beskrivande title-taggar',
                      impact: 'Hög - påverkar sökresultat direkt'
                    });
                  }

                  if (technicalIssues.missingMetaDescriptions.length > 0) {
                    priorityActions.push({
                      priority: 'medium',
                      title: `Lägg till meta descriptions för ${technicalIssues.missingMetaDescriptions.length} sidor`,
                      description: 'Meta descriptions förbättrar klickfrekvens i sökresultat',
                      action: 'Skriv unika, lockande meta descriptions (150-160 tecken)',
                      impact: 'Medium - påverkar klickfrekvens från sökresultat'
                    });
                  }

                  if (allBrokenImages.length > 0) {
                    priorityActions.push({
                      priority: 'medium',
                      title: `Fixa ${allBrokenImages.length} brutna bilder`,
                      description: 'Brutna bilder skadar användarupplevelse',
                      action: 'Kontrollera och uppdatera bildlänkar',
                      impact: 'Medium - påverkar användarupplevelse'
                    });
                  }

                  if (imagesWithoutAlt.length > 0) {
                    priorityActions.push({
                      priority: 'medium',
                      title: `Lägg till alt-text för ${imagesWithoutAlt.length} bilder`,
                      description: 'Alt-text är viktigt för tillgänglighet och SEO',
                      action: 'Skriv beskrivande alt-text för alla bilder',
                      impact: 'Medium - förbättrar tillgänglighet och SEO'
                    });
                  }

                  // Visa prioriterade åtgärder i en modal
                  const modal = document.createElement('div');
                  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';

                  const content = document.createElement('div');
                  content.style.cssText = 'background: white; border-radius: 20px; padding: 30px; max-width: 800px; max-height: 80vh; overflow-y: auto; position: relative;';

                  content.innerHTML = `
                    <h2 style="margin-bottom: 20px; color: var(--text-dark);">🔀 Prioriterade åtgärder</h2>
                    <p style="margin-bottom: 30px; color: var(--text-medium);">Rekommenderade åtgärder baserat på din crawl-analys, sorterade efter prioritet:</p>
                    ${priorityActions.map(action => `
                      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${action.priority === 'high' ? '#ef4444' : '#f59e0b'};">
                        <h3 style="margin: 0 0 8px 0; color: var(--text-dark); font-size: 1.1rem;">${action.title}</h3>
                        <p style="margin: 0 0 10px 0; color: var(--text-medium); font-size: 0.95rem;">${action.description}</p>
                        <div style="background: #f9fafb; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                          <strong>Åtgärd:</strong> ${action.action}
                        </div>
                        <div style="color: #6b7280; font-size: 0.9rem;">
                          <strong>Impact:</strong> ${action.impact}
                        </div>
                      </div>
                    `).join('')}
                    <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
                    <div style="text-align: center; margin-top: 20px;">
                      <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: var(--primary-color); color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        Stäng
                      </button>
                    </div>
                  `;

                  modal.appendChild(content);
                  document.body.appendChild(modal);

                  // Close on backdrop click
                  modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                      modal.remove();
                    }
                  });
                }}
              >
                🔀 Prioriterade åtgärder
              </button>
            </>
          )}
        </div>
      </div>

      {/* Score section */}
      <div className="score-section">
        <div className="score-text" style={{ color: getScoreColor(score) }}>
          {score}
        </div>
        <div className="score-label">Crawl Score</div>
      </div>

      {/* Quick stats */}
      <div className="quick-stats">
        <Stat label="Sidor crawlade" value={pagesCount} color="#2563eb" />
        <Stat label="Problem funna" value={issues} color={issues > 0 ? "#ef4444" : "#16a34a"} />
        <Stat label="Brutna länkar" value={allBrokenLinks.length} color={allBrokenLinks.length > 0 ? "#ef4444" : "#16a34a"} />
        <Stat label="Brutna bilder" value={allBrokenImages.length} color={allBrokenImages.length > 0 ? "#ef4444" : "#16a34a"} />
        <Stat label="Bilder utan alt-text" value={imagesWithoutAlt.length} color={imagesWithoutAlt.length > 0 ? "#f59e0b" : "#16a34a"} />
      </div>

      {/* Overview Section */}
      <section id="overview" className="result-section">
        <h2 className="section-title">Översikt</h2>
        <div className="overview-content">
          <div className="info-cards">
            <div className="info-card">
              <h3>Crawl Sammanfattning</h3>
              <div className="card-stats">
                <div className="stat-row">
                  <span>Totalt sidor:</span>
                  <span>{pagesCount}</span>
                </div>
                <div className="stat-row">
                  <span>Genomsnittlig laddningstid:</span>
                  <span>{pages.length > 0 ?
                    (pages.reduce((sum, p) => sum + (p.loadTime || 0), 0) / pages.length).toFixed(2) : 0}ms
                  </span>
                </div>
                <div className="stat-row">
                  <span>Genomsnittlig sidstorlek:</span>
                  <span>{pages.length > 0 ?
                    Math.round(pages.reduce((sum, p) => sum + (p.pageSize || 0), 0) / pages.length / 1024) : 0} KB
                  </span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>SEO Status</h3>
              <div className="card-stats">
                <div className="stat-row">
                  <span>Sidor utan titel:</span>
                  <span className={technicalIssues.missingTitles.length > 0 ? 'stat-poor' : 'stat-good'}>
                    {technicalIssues.missingTitles.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Sidor utan meta beskrivning:</span>
                  <span className={technicalIssues.missingMetaDescriptions.length > 0 ? 'stat-poor' : 'stat-good'}>
                    {technicalIssues.missingMetaDescriptions.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Sidor utan H1:</span>
                  <span className={technicalIssues.missingH1.length > 0 ? 'stat-poor' : 'stat-good'}>
                    {technicalIssues.missingH1.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pages Section */}
      {pages.length > 0 && (
        <section id="pages" className="result-section">
          <h2 className="section-title">Alla sidor</h2>
          <div className="pages-content">
            <div className="pages-list">
              {pages.slice(0, 50).map((page, index) => (
                <div key={index} className="page-item">
                  <div className="page-header">
                    <a href={page.url} target="_blank" rel="noopener noreferrer" className="page-url">
                      {page.url}
                    </a>
                    <span className={`status-code ${getStatusColor(page.statusCode)}`}>
                      {page.statusCode}
                    </span>
                  </div>
                  <div className="page-details">
                    <div className="page-title">{page.title || 'Ingen titel'}</div>
                    <div className="page-stats">
                      <span>Storlek: {Math.round((page.pageSize || 0) / 1024)} KB</span>
                      <span>Laddningstid: {page.loadTime || 0}ms</span>
                      <span>H1: {page.h1Count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
              {pages.length > 50 && (
                <div className="pages-more">
                  Visar första 50 av {pages.length} sidor
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Technical Section */}
      <section id="technical" className="result-section">
        <h2 className="section-title">Tekniska Problem</h2>
        <div className="technical-content">
          <div className="info-cards">
            <div className="info-card">
              <h3>SEO Grundläggande</h3>
              <div className="card-stats">
                <div className="stat-row">
                  <span>Sidor utan titel:</span>
                  <span className={technicalIssues.missingTitles.length > 0 ? 'stat-poor' : 'stat-good'}>
                    {technicalIssues.missingTitles.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Sidor utan meta beskrivning:</span>
                  <span className={technicalIssues.missingMetaDescriptions.length > 0 ? 'stat-poor' : 'stat-good'}>
                    {technicalIssues.missingMetaDescriptions.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Sidor utan H1:</span>
                  <span className={technicalIssues.missingH1.length > 0 ? 'stat-poor' : 'stat-good'}>
                    {technicalIssues.missingH1.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Dubbletter av titlar:</span>
                  <span className={technicalIssues.duplicateTitles.length > 0 ? 'stat-poor' : 'stat-good'}>
                    {technicalIssues.duplicateTitles.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Stora sidor (&gt;1MB):</span>
                  <span className={technicalIssues.oversizedPages.length > 0 ? 'stat-warning' : 'stat-good'}>
                    {technicalIssues.oversizedPages.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Bilder utan alt-text:</span>
                  <span className={imagesWithoutAlt.length > 0 ? 'stat-warning' : 'stat-good'}>
                    {imagesWithoutAlt.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Prestanda</h3>
              <div className="card-stats">
                <div className="stat-row">
                  <span>Snabbaste sida:</span>
                  <span className="stat-good">
                    {pages.length > 0 ? Math.min(...pages.map(p => p.loadTime || 0)) : 0}ms
                  </span>
                </div>
                <div className="stat-row">
                  <span>Långsammaste sida:</span>
                  <span className="stat-warning">
                    {pages.length > 0 ? Math.max(...pages.map(p => p.loadTime || 0)) : 0}ms
                  </span>
                </div>
                <div className="stat-row">
                  <span>Mediantid:</span>
                  <span>
                    {pages.length > 0 ?
                      Math.round(pages.reduce((sum, p) => sum + (p.loadTime || 0), 0) / pages.length) : 0}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Broken Links Section */}
      {(allBrokenLinks.length > 0 || allBrokenImages.length > 0) && (
        <section id="broken" className="result-section">
          <h2 className="section-title">Trasiga länkar</h2>
          <div className="info-card">
            <div className="card-header">
              <div className="card-title">Trasiga länkar och bilder</div>
            </div>

            {allBrokenLinks.length > 0 && (
              <div className="issue-section">
                <h4>Trasiga länkar ({allBrokenLinks.length})</h4>
                <div className="broken-links-table">
                  {allBrokenLinks.map((link, index) => (
                    <div key={index} className="broken-link-row">
                      <div className="broken-url">
                        <span className="status-code error">{link.status || 'Fel'}</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                      </div>
                      <div className="source-page">
                        Hittad på: <a href={link.sourcePage} target="_blank" rel="noopener noreferrer">{link.sourcePage}</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allBrokenImages.length > 0 && (
              <div className="issue-section">
                <h4>Trasiga bilder ({allBrokenImages.length})</h4>
                <div className="broken-links-table">
                  {allBrokenImages.map((img, index) => (
                    <div key={index} className="broken-link-row">
                      <div className="broken-url">
                        <span className="status-code error">{img.status || 'Fel'}</span>
                        <span className="image-url">{img.src}</span>
                      </div>
                      <div className="source-page">
                        Hittad på: <a href={img.sourcePage} target="_blank" rel="noopener noreferrer">{img.sourcePage}</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Images Section */}
      {imagesWithoutAlt.length > 0 && (
        <section id="images" className="result-section">
          <h2 className="section-title">Bilder</h2>
          <div className="info-card">
            <div className="card-header">
              <div className="card-title">Bildanalys</div>
            </div>

            <div className="issue-section">
              <h4>Bilder utan alt-text ({imagesWithoutAlt.length})</h4>
              <div className="images-table">
                {imagesWithoutAlt.slice(0, 20).map((img, index) => (
                  <div key={index} className="image-row">
                    <div className="image-src">{img.src}</div>
                    <div className="source-page">
                      På sida: <a href={img.sourcePage} target="_blank" rel="noopener noreferrer">{img.sourcePage}</a>
                    </div>
                  </div>
                ))}
                {imagesWithoutAlt.length > 20 && (
                  <div className="more-items">... och {imagesWithoutAlt.length - 20} till</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Performance Section */}
      <section id="performance" className="result-section">
        <h2 className="section-title">Prestanda</h2>
        <div className="info-card">
          <div className="card-header">
            <div className="card-title">Prestandaanalys</div>
          </div>

          <div className="performance-metrics">
            <div className="metric-card">
              <h4>Laddningstider</h4>
              <div className="metric-stats">
                <div className="stat-row">
                  <span>Snabbaste sida:</span>
                  <span className="stat-good">
                    {pages.length > 0 ? Math.min(...pages.map(p => p.loadTime || 0)) : 0}ms
                  </span>
                </div>
                <div className="stat-row">
                  <span>Långsammaste sida:</span>
                  <span className="stat-warning">
                    {pages.length > 0 ? Math.max(...pages.map(p => p.loadTime || 0)) : 0}ms
                  </span>
                </div>
                <div className="stat-row">
                  <span>Genomsnitt:</span>
                  <span>
                    {pages.length > 0 ?
                      Math.round(pages.reduce((sum, p) => sum + (p.loadTime || 0), 0) / pages.length) : 0}ms
                  </span>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <h4>Sidstorlekar</h4>
              <div className="metric-stats">
                <div className="stat-row">
                  <span>Minsta sida:</span>
                  <span className="stat-good">
                    {pages.length > 0 ? Math.round(Math.min(...pages.map(p => p.pageSize || 0)) / 1024) : 0} KB
                  </span>
                </div>
                <div className="stat-row">
                  <span>Största sida:</span>
                  <span className="stat-warning">
                    {pages.length > 0 ? Math.round(Math.max(...pages.map(p => p.pageSize || 0)) / 1024) : 0} KB
                  </span>
                </div>
                <div className="stat-row">
                  <span>Genomsnitt:</span>
                  <span>
                    {pages.length > 0 ?
                      Math.round(pages.reduce((sum, p) => sum + (p.pageSize || 0), 0) / pages.length / 1024) : 0} KB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {technicalIssues.oversizedPages.length > 0 && (
            <div className="issue-section">
              <h4>Stora sidor (&gt;1MB)</h4>
              <ul className="url-list">
                {technicalIssues.oversizedPages.slice(0, 10).map((page, index) => (
                  <li key={index}>
                    <a href={page.url} target="_blank" rel="noopener noreferrer">{page.url}</a>
                    <span className="page-size"> - {Math.round(page.pageSize / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Link Map Section */}
      {pages.length > 0 && (
        <section id="linkmap" className="result-section">
          <h2 className="section-title">Link Map</h2>
          <div className="info-card">
            <div className="card-header">
              <div className="card-title">Link Map Visualisering</div>
            </div>
            <div className="linkmap-container">
              <CrawlMapLight crawlData={crawlData} targetUrl={crawlData.targetUrl} />
            </div>
          </div>
        </section>
      )}

      {/* Fix This Panel */}
      <FixThisPanel
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleStatusChange}
      />

      <style jsx>{`
        .results-display {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }


        .results-summary {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
        }

        .action-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .action-btn.primary {
          background: #2563eb;
          color: white;
        }

        .action-btn.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .action-btn:hover {
          transform: translateY(-1px);
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .info-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .info-card h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .card-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-good { color: #16a34a; font-weight: 600; }
        .stat-warning { color: #f59e0b; font-weight: 600; }
        .stat-poor { color: #ef4444; font-weight: 600; }

        .pages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .page-item {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .page-url {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }

        .page-url:hover {
          text-decoration: underline;
        }

        .status-code {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-code.score-good {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-code.score-warning {
          background: #fef3c7;
          color: #d97706;
        }

        .status-code.score-poor {
          background: #fecaca;
          color: #dc2626;
        }

        .page-title {
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }

        .page-stats {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #6b7280;
        }

        .issue-section {
          margin-bottom: 30px;
        }

        .issue-section h3 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
        }

        .issue-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .issue-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .issue-details {
          flex: 1;
        }

        .broken-url {
          font-weight: 500;
          color: #374151;
          word-break: break-all;
        }

        .source-page {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .no-issues {
          text-align: center;
          padding: 60px 20px;
        }

        .no-issues-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .no-issues h3 {
          color: #16a34a;
          margin-bottom: 12px;
        }

        .pages-more {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default CrawlResultsDisplay;