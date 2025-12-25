'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useJobConnector } from '../../../hooks/useJobConnector';
import CrawlResultsDisplayV2 from '../../../components/crawl/CrawlResultsDisplayV2';
import LighthouseResultsDisplay from '../../../components/results/LighthouseResultsDisplay';
import ResultsDisplay from '../../../components/results/ResultsDisplay';
import SkeletonLoader from '../../../components/common/SkeletonLoader';
import LoadingRing from '../../../components/common/LoadingRing';
import ConsultationBanner from '../../../components/common/ConsultationBanner';
import styles from './page.module.css';

export default function AnalysisPageClient({ params, initialAnalysis = null, initialResults = null }) {
  const urlParams = useParams();
  const jobId = params?.jobId || urlParams?.jobId || '';
  
  // State for tracking job results and analysis
  const [results, setResults] = useState(initialResults || null);
  const [analysis, setAnalysis] = useState(initialAnalysis || null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isDirectAnalysis, setIsDirectAnalysis] = useState(() => {
    // If we already have initialAnalysis from SSR and jobId is ULID, this is direct access
    const isUlid = jobId && jobId.startsWith('01');
    return isUlid && initialAnalysis?.status === 'completed';
  });
  
  // Determine analysis type - will be resolved by job-meta
  const [detectedType, setDetectedType] = useState(() => {
    // Only use initialAnalysis.type if it's valid and not 'unknown'
    if (initialAnalysis?.type && initialAnalysis.type !== 'unknown' && initialAnalysis.type !== 'pending') {
      return initialAnalysis.type;
    }
    
    // Start with 'unknown' - will be resolved by job-meta API call
    console.log(`🔍 Starting with unknown type, will resolve via job-meta`);
    return 'unknown';
  });
  
  console.log('🔍 AnalysisPageClient using type:', detectedType, 'for jobId:', jobId);
  
  // Check if jobId is actually an analysisId or needs mapping
  useEffect(() => {
    if (jobId && !initialAnalysis && !initialResults) {
      if (!jobId.startsWith('01')) {
        // Use job-meta to get proper type and check completion status
        fetch(`/api/job-meta/${jobId}`, { cache: 'no-store' })
          .then(response => response.json())
          .then(data => {
            if (data.found) {
              console.log('🎯 Job meta found:', data);
              setDetectedType(data.type);
              
              if (data.status === 'completed' && data.analysisId) {
                console.log('🧭 Job completed, redirecting to:', data.analysisId);
                window.location.replace(`/analys/${data.analysisId}`);
                return;
              } else {
                // Job not completed, use SSE with correct type
                setIsDirectAnalysis(false);
              }
            } else {
              console.log('❌ Job not found in meta, trying direct fetch');
              // Try direct fetch as fallback
              fetch(`/api/v1/analyses/${jobId}`)
                .then(response => response.json())
                .then(data => {
                  if (data.status === 'completed') {
                    console.log('🎯 Direct completed analysis found:', data.id);
                    setIsDirectAnalysis(true);
                    setAnalysis(data);
                    setDetectedType(data.type || 'crawl');
                    if (data.results) {
                      setResults({...data.results, summary: data.summary});
                    }
                  } else {
                    setIsDirectAnalysis(false);
                  }
                })
                .catch(() => setIsDirectAnalysis(false));
            }
          })
          .catch(error => {
            console.error('❌ Failed to fetch job meta:', error);
            setIsDirectAnalysis(false);
          });
      } else {
        // This is likely a ULID, fetch directly
        fetch(`/api/v1/analyses/${jobId}`)
          .then(response => response.json())
          .then(data => {
            if (data.status === 'completed') {
              console.log('🎯 ULID analysis found:', data.id);
              setIsDirectAnalysis(true);
              setAnalysis(data);
              setDetectedType(data.type || 'crawl');
              if (data.results) {
                setResults({...data.results, summary: data.summary});
              }
            }
          })
          .catch(() => setIsDirectAnalysis(false));
      }
    }
  }, [jobId, initialAnalysis, initialResults]);
  
  // Only use JobConnector if this is not a direct analysis
  const jobConnectorResult = useJobConnector(
    isDirectAnalysis ? null : jobId, 
    detectedType
  );
  
  // Use jobConnector results only if not a direct analysis
  const { status, isOffline, isRecovering, nextRetryInMs, retryNow, done, connectionMode } = 
    isDirectAnalysis ? 
      { status: null, isOffline: false, isRecovering: false, nextRetryInMs: null, retryNow: () => {}, done: true, connectionMode: 'direct' } :
      jobConnectorResult;

  // Override state for direct analysis
  const state = isDirectAnalysis ? 'completed' : (status?.state ?? 'initializing');
  const progress = status?.progress ?? 0;
  const position = status?.position;
  const error = status?.error;
  const resultId = isDirectAnalysis ? jobId : (status?.resultId || status?.analysisId);
  
  // Fetch type from API when we have resultId but no type
  useEffect(() => {
    if (resultId && !status?.type && state === 'completed') {
      fetch(`/api/v1/analyses/${resultId}`)
        .then(response => response.json())
        .then(data => {
          if (data.type) {
            setDetectedType(data.type);
          }
        })
        .catch(error => console.error('Failed to fetch type:', error));
    }
  }, [resultId, status?.type, state]);
  
  const analysisType = status?.type || detectedType;
  const typeDisplayName = {
    seo: 'SEO-analys',
    lighthouse: 'Lighthouse-analys', 
    crawl: 'Crawl-analys'
  }[analysisType] || 'Analys';

  const formatRetryTime = () => {
    if (!nextRetryInMs) return '1';
    return Math.ceil(nextRetryInMs / 1000);
  };

  // Fetch results when analysis is completed
  useEffect(() => {
    if (state === 'completed' && resultId && !results && !loadingResults) {
      setLoadingResults(true);
      fetch(`/api/v1/analyses/${resultId}`)
        .then(response => response.json())
        .then(data => {
          // The API returns full data in 'results' field, not 'result'
          if (data.results) {
            // Include summary from top level for crawl analyses
            setResults({...data.results, summary: data.summary});
            setAnalysis(data); // Save full analysis including artifactUrl
          }
        })
        .catch(error => {
          console.error('Failed to fetch results:', error);
        })
        .finally(() => {
          setLoadingResults(false);
        });
    }
  }, [state, resultId, results, loadingResults]);

  return (
    <div className={styles.analysisPage}>
      <div className="warm-overlay"></div>
      <div className="container">
        <div className={styles.analysisContent}>
          
          {/* Header */}
          <div className={styles.analysisHeader}>
            <Link href="/" className={styles.backLink}>
              ← Tillbaka till start
            </Link>
            <h1 className={styles.analysisTitle}>
              {typeDisplayName}
            </h1>
            {status?.url && (
              <p className={styles.analysisUrl}>
                Analyserar: <span className={styles.urlText}>{status.url}</span>
              </p>
            )}
            {/* Connection mode indicator (for debugging) */}
            {connectionMode && (
              <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                Anslutning: {connectionMode === 'sse' ? '📡 SSE' : '🔄 Polling'}
              </div>
            )}
          </div>

          {/* Status Card - Hide when results are already loaded */}
          {!results && (
          <div className={styles.statusCard}>
            
            {/* Offline Notice */}
            {isOffline && (
              <div className="offline-notice">
                <div className="offline-indicator"></div>
                <span className="offline-text">
                  Du är offline. Fortsätter automatiskt när anslutningen är tillbaka.
                </span>
              </div>
            )}

            {/* Initializing State */}
            {state === 'initializing' && (
              <div className="state-section">
                <LoadingRing text="Ansluter till analys..." />
                <h3 className="state-title">
                  Ansluter till analys...
                </h3>
                <p className="state-message">
                  Förbereder din {typeDisplayName.toLowerCase()}
                </p>
                {isRecovering && (
                  <div className="recovery-notice">
                    <span className="recovery-text">
                      Återansluter om {formatRetryTime()}s
                      <button 
                        className="retry-button"
                        onClick={retryNow}
                      >
                        försök nu
                      </button>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Waiting in Queue */}
            {state === 'waiting' && (
              <div className="state-section">
                <div className="state-icon">
                  <span>🕒</span>
                </div>
                <h3 className="state-title">
                  Väntar i kön
                </h3>
                {position && (
                  <p className="queue-position">
                    Din plats: #{position}
                  </p>
                )}
                <p className="state-message">
                  Vi startar din {typeDisplayName.toLowerCase()} så snart som möjligt
                </p>
                {isRecovering && (
                  <div className="recovery-notice">
                    <span className="recovery-text">
                      Återansluter om {formatRetryTime()}s
                      <button 
                        className="retry-button"
                        onClick={retryNow}
                      >
                        försök nu
                      </button>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Active - In Progress */}
            {state === 'active' && (
              <div className="state-section">
                <LoadingRing
                  text={
                    analysisType === 'crawl' ? 'Crawlar din webbplats...' :
                    analysisType === 'lighthouse' ? 'Kör Lighthouse-analys...' :
                    analysisType === 'seo' ? 'Analyserar SEO...' :
                    'Bearbetar analys...'
                  }
                />
                <h3 className="state-title">
                  {analysisType === 'crawl' && `Crawlar din webbplats...`}
                  {analysisType === 'lighthouse' && `Kör Lighthouse-analys...`}
                  {analysisType === 'seo' && `Analyserar SEO...`}
                  {!['crawl', 'lighthouse', 'seo'].includes(analysisType) && `Bearbetar analys...`}
                </h3>
                
                {/* Progress Display */}
                <div className="progress-display">
                  <div className="progress-text">
                    {progress}% slutfört
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="state-message">
                  {analysisType === 'crawl' && progress > 0 && `${progress} av 100 sidor analyserade`}
                  {analysisType === 'lighthouse' && 'Mäter prestanda, tillgänglighet och SEO'}
                  {analysisType === 'seo' && 'Granskar sidans SEO-optimering'}
                </p>
              </div>
            )}

            {/* Completed */}
            {state === 'completed' && !results && (
              <div className="state-section success-state">
                <div className="state-icon">
                  <span>🎉</span>
                </div>
                <h3 className="state-title success-title">
                  Analysen är klar!
                </h3>
                
                {loadingResults ? (
                  <div>
                    <SkeletonLoader type="analysis" />
                    <p className="state-message">
                      Hämtar resultaten...
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="state-message">
                      Din {typeDisplayName.toLowerCase()} är nu redo att visas
                    </p>
                    {/* Emergency navigation button */}
                    {resultId && (
                      <button 
                        className="action-button"
                        onClick={() => window.location.replace(`/analys/${resultId}`)}
                        style={{ marginTop: '10px' }}
                      >
                        Visa resultat nu
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Failed */}
            {state === 'failed' && (
              <div className="state-section error-state">
                <div className="state-icon">
                  <span>❌</span>
                </div>
                <h3 className="state-title error-title">
                  Analysen misslyckades
                </h3>
                {error && (
                  <p className="error-message">
                    {error}
                  </p>
                )}
                <div>
                  <button 
                    className="action-button"
                    onClick={() => window.location.reload()}
                  >
                    Försök igen
                  </button>
                  <div>
                    <Link 
                      href="/"
                      className="secondary-button"
                    >
                      Starta ny analys
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Recovery Notice */}
            {!done && isRecovering && !isOffline && (
              <div className="recovery-notice">
                <span className="recovery-text">
                  Tillfälligt anslutningsfel — försöker igen om {formatRetryTime()}s
                  <button 
                    className="retry-button"
                    onClick={retryNow}
                  >
                    försök nu
                  </button>
                </span>
              </div>
            )}
          </div>
          )}

          {/* Help Section */}
          <div className="help-section">
            <h3 className="help-title">
              Vad händer nu?
            </h3>
            <div>
              {state === 'waiting' && (
                <ul className="help-list">
                  <li>• Din analys väntar i kön tillsammans med andra användares analyser</li>
                  <li>• Vi bearbetar analyser i den ordning de kommer in</li>
                  <li>• Du kan lämna denna sida och komma tillbaka - analysen fortsätter</li>
                </ul>
              )}
              {state === 'active' && (
                <ul className="help-list">
                  <li>• Analysen pågår just nu och kommer att slutföras automatiskt</li>
                  <li>• Stäng inte denna flik - du kan följa progressen i realtid</li>
                  <li>• När analysen är klar kommer du automatiskt att kunna se resultaten</li>
                </ul>
              )}
              {state === 'completed' && (
                <ul className="help-list">
                  <li>• Din analys är nu helt klar med detaljerade resultat</li>
                  <li>• Du kan dela resultaten med andra via den unika länken</li>
                  <li>• Resultaten sparas i 90 dagar och kan nås när som helst</li>
                </ul>
              )}
            </div>
          </div>

          {/* Results Display */}
          {results && (
            <div className="results-section">
              {analysisType === 'crawl' && (
                <CrawlResultsDisplayV2
                  result={{...results, analysisId: analysis?.id || resultId, targetUrl: analysis?.targetUrl}}
                />
              )}
              {analysisType === 'lighthouse' && (
                <LighthouseResultsDisplay
                  lighthouseData={{...results, analysisId: analysis?.id || resultId, targetUrl: analysis?.targetUrl}}
                  onNewAnalysis={() => window.location.href = '/'}
                />
              )}
              {analysisType === 'seo' && (
                <ResultsDisplay
                  result={{ ...results, analysisId: analysis?.id || resultId }}
                  type="seo"
                  artifactBase={resultId ? `/api/artifacts/by-id/${resultId}` : null}
                  onNewAnalysis={() => window.location.href = '/'}
                />
              )}
            </div>
          )}

        </div>
      </div>

      {/* Show consultation banner only when results are displayed */}
      {results && <ConsultationBanner />}
    </div>
  );
}