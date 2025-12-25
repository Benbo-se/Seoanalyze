import React from 'react';
import styles from './resultsTopbar.module.css';

const ResultsTopbar = ({ 
  result, 
  analysisId, 
  onDownloadPdf, 
  onDownloadJson, 
  onShare, 
  onNewAnalysis 
}) => {
  // Fallback-safe data extraction
  const url = result?.targetUrl || result?.url || '';
  const score = Number.isFinite(result?.score) ? Math.round(result.score) : 0;
  
  // Check if we have sufficient data for operations
  const hasValidUrl = Boolean(url);
  const hasValidResult = Boolean(result && (result.url || result.targetUrl));
  
  // För enkelhets skull: summera issues om de finns, annars 0
  const criticalsCount = result?.issues?.critical?.length ?? result?.criticalCount ?? 0;
  const warningsCount = result?.issues?.warning?.length ?? result?.warningCount ?? 0;
  const okCount = result?.issues?.ok?.length ?? result?.okCount ?? 0;
  
  // Favicon fallback
  let favicon = result?.favIconUrl;
  if (!favicon && url) {
    try { 
      favicon = new URL('/favicon.ico', new URL(url).origin).toString(); 
    } catch {}
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Safe click handlers
  const handleShare = () => {
    if (!hasValidResult) return;
    try {
      onShare?.();
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleDownloadPdf = () => {
    if (!hasValidResult) return;
    try {
      onDownloadPdf?.();
    } catch (error) {
      console.error('PDF download failed:', error);
    }
  };

  const handleDownloadJson = () => {
    if (!hasValidResult) return;
    try {
      onDownloadJson?.();
    } catch (error) {
      console.error('JSON download failed:', error);
    }
  };

  const handleNewAnalysis = () => {
    try {
      onNewAnalysis?.();
    } catch (error) {
      console.error('New analysis failed:', error);
    }
  };

  return (
    <div className={styles.bar}>
      <noscript data-testid="results-topbar-ssr" />
      <div className={styles.row}>
        {/* Left: Favicon + URL */}
        <div className={styles.left}>
          {favicon && (
            <img 
              src={favicon} 
              alt="" 
              className={styles.favicon}
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.url}
            title={url}
          >
            {url}
          </a>
        </div>

        {/* Middle: Score + Chips */}
        <div className={styles.mid}>
          <div 
            className={styles.scorePill}
            style={{ backgroundColor: getScoreColor(score), color: 'white' }}
          >
            {score}
          </div>
          <div className={styles.chips}>
            {criticalsCount > 0 && (
              <span className={`${styles.chip} ${styles.critical}`}>
                Kritiska {criticalsCount}
              </span>
            )}
            {warningsCount > 0 && (
              <span className={`${styles.chip} ${styles.warning}`}>
                Varningar {warningsCount}
              </span>
            )}
            {okCount > 0 && (
              <span className={`${styles.chip} ${styles.ok}`}>
                OK {okCount}
              </span>
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className={styles.right}>
          <button 
            className={styles.btn} 
            onClick={handleShare} 
            disabled={!hasValidResult}
            title={hasValidResult ? "Dela analys" : "Data saknas - kan inte dela"}
          >
            Dela
          </button>
          <button 
            className={styles.btn} 
            onClick={handleDownloadPdf} 
            disabled={!hasValidResult}
            title={hasValidResult ? "Ladda ner PDF" : "Data saknas - kan inte ladda ner PDF"}
          >
            PDF
          </button>
          <button 
            className={styles.btn} 
            onClick={handleDownloadJson} 
            disabled={!hasValidResult}
            title={hasValidResult ? "Ladda ner JSON" : "Data saknas - kan inte ladda ner JSON"}
          >
            JSON
          </button>
          <button 
            className={styles.btn} 
            onClick={handleNewAnalysis} 
            title="Starta ny analys"
          >
            Ny analys
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsTopbar;