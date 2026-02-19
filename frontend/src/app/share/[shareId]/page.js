'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ResultsDisplay from '../../../components/results/ResultsDisplay';
import LighthouseResultsDisplay from '../../../components/results/LighthouseResultsDisplay';
import CrawlResultsDisplayV2 from '../../../components/crawl/CrawlResultsDisplayV2';
import AiAnalysisResults from '../../../components/ai-analysis/AiAnalysisResults';
import Link from 'next/link';
// Using inline styles to avoid import issues

export default function SharePage() {
  const params = useParams();
  const shareId = params?.shareId;

  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shareId) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    fetch(`/api/v1/share/${shareId}`)
      .then(response => {
        if (response.status === 404) {
          setError('Share link not found or expired');
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to load shared analysis');
        }
        return response.json();
      })
      .then(data => {
        if (data) {
          setSharedData(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch shared analysis:', err);
        setError('Failed to load shared analysis');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shareId]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff0f7 0%, #ffeaf5 100%)',
        position: 'relative'
      }}>
        <div className="warm-overlay"></div>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ paddingTop: '40px' }}>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #ff4da6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>
                Laddar delad analys...
              </h2>
              <p style={{ color: '#64748b' }}>
                Hämtar analysdata
              </p>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff0f7 0%, #ffeaf5 100%)',
        position: 'relative'
      }}>
        <div className="warm-overlay"></div>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ paddingTop: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Link href="/" style={{
                display: 'inline-block',
                color: '#ff4da6',
                textDecoration: 'none',
                marginBottom: '20px',
                fontWeight: '500'
              }}>
                ← Tillbaka till start
              </Link>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#ef4444',
                marginBottom: '16px'
              }}>
                Länken kunde inte hittas
              </h1>
              <p style={{ color: '#64748b', textAlign: 'center' }}>
                {error || 'Delningslänken är ogiltig, har upphört att gälla eller har tagits bort.'}
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              margin: '20px 0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔗💔</div>
              <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>
                Vill du göra din egen analys?
              </h3>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Analysera vilken webbplats som helst kostnadsfritt med vårt SEO-verktyg
              </p>
              <Link
                href="/"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#ff4da6',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Starta ny analys
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { analysis, results } = sharedData;
  const analysisType = analysis.type;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fff0f7 0%, #ffeaf5 100%)',
      position: 'relative'
    }}>
      <div className="warm-overlay"></div>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ paddingTop: '40px' }}>

          {/* Header - same style as our SEO results pages */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Link href="/" style={{
              display: 'inline-block',
              color: '#ff4da6',
              textDecoration: 'none',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              ← Gör din egen analys
            </Link>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#0F172A',
              marginBottom: '16px',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Delad {analysisType === 'seo' ? 'SEO' : analysisType === 'lighthouse' ? 'Lighthouse' : analysisType === 'ai-analysis' ? 'AI' : 'Crawl'}-analys
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#64748B',
              marginBottom: '8px'
            }}>
              Webbplats: <span style={{ fontWeight: '600', color: '#ff4da6' }}>{analysis.targetUrl}</span>
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              textAlign: 'center',
              margin: '8px 0 0 0'
            }}>
              Analyserad: {new Date(analysis.createdAt).toLocaleDateString('sv-SE')} •
              Visad {sharedData.views} {sharedData.views === 1 ? 'gång' : 'gånger'}
            </p>
          </div>

          {/* Screenshots Preview */}
          {results?.screenshots && (
            <div className="hero-previews" style={{
              marginBottom: '32px'
            }}>
              <div className="preview-desktop">
                <img
                  src={`/api/artifacts/by-id/${analysis.id}/${results.screenshots.desktop}`}
                  alt="Förhandsvisning (desktop)"
                  loading="eager"
                />
              </div>
              {results.screenshots.mobile && (
                <div className="preview-mobile">
                  <img
                    src={`/api/artifacts/by-id/${analysis.id}/${results.screenshots.mobile}`}
                    alt="Förhandsvisning (mobil)"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}

          {/* Score Display */}
          {(analysisType === 'seo' && (results?.seoScore || results?.score)) && (
            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              padding: '24px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ff4da6',
                marginBottom: '8px'
              }}>
                {results.seoScore || results.score}/100
              </div>
              <div style={{
                color: '#64748B',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                SEO-poäng
              </div>
            </div>
          )}

          {/* Lighthouse Score Display */}
          {analysisType === 'lighthouse' && results?.performanceScore && (
            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              padding: '24px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ff4da6',
                marginBottom: '8px'
              }}>
                {results.performanceScore}/100
              </div>
              <div style={{
                color: '#64748B',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                Prestanda-poäng
              </div>
            </div>
          )}

          {/* Crawl Score Display */}
          {analysisType === 'crawl' && results?.score && (
            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              padding: '24px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ff4da6',
                marginBottom: '8px'
              }}>
                {results.score}/100
              </div>
              <div style={{
                color: '#64748B',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                Crawl-poäng
              </div>
            </div>
          )}

          {/* AI Analysis Score Display */}
          {analysisType === 'ai-analysis' && analysis?.aiReport?.score && (
            <div style={{
              textAlign: 'center',
              marginBottom: '32px',
              padding: '24px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ff4da6',
                marginBottom: '8px'
              }}>
                {analysis.aiReport.score}/100
              </div>
              <div style={{
                color: '#64748B',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                SEO Hälsa
              </div>
            </div>
          )}

          {/* Progress indicator (completed) */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 77, 166, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #ff4da6 0%, #c21d6e 100%)',
                borderRadius: '4px'
              }}></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#16a34a', fontWeight: '500' }}>
                ✅ Delad analys redo
              </span>
            </div>
          </div>

          {/* Results Display - same components as regular analysis */}
          <div>
            {analysisType === 'seo' && (
              <ResultsDisplay
                result={{ ...results, analysisId: analysis.id }}
                type="seo"
                onNewAnalysis={() => window.location.href = '/'}
                isSharedView={true}
              />
            )}

            {analysisType === 'lighthouse' && (
              <LighthouseResultsDisplay
                lighthouseData={{ ...results, analysisId: analysis.id }}
                onNewAnalysis={() => window.location.href = '/'}
                isSharedView={true}
              />
            )}

            {analysisType === 'crawl' && (
              <CrawlResultsDisplayV2
                result={results}
                isSharedView={true}
              />
            )}

            {analysisType === 'ai-analysis' && (
              <AiAnalysisResults
                analysis={analysis}
                isSharedView={true}
              />
            )}
          </div>

          {/* Footer for shared view - matches our design */}
          <div style={{
            textAlign: 'center',
            marginTop: '60px',
            padding: '30px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>
              Gillar du vad du ser?
            </h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Analysera din egen webbplats kostnadsfritt med SEO Analyzer
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                backgroundColor: '#ff4da6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                marginRight: '12px'
              }}
            >
              Starta din analys
            </Link>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>
              Helt gratis • Ingen registrering krävs
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}