import React, { useState, useEffect } from 'react';
import FixThisPanel from '../common/FixThisPanel';
import MergedIssuesPanel from '../common/MergedIssuesPanel';
import OverviewDashboard from '../overview/OverviewDashboard';
import ResultsTopbar from './ResultsTopbar';
import SeoKpiRow from './SeoKpiRow';
import QuickWinsPanel from './QuickWinsPanel';
import TableOfContents from './TableOfContents';
import tocStyles from './tableOfContents.module.css';
import ProgressBars from './ProgressBars';
import SeoTabReadability from './tabs/SeoTabReadability';
import EnhancedSeoTabMeta from './tabs/EnhancedSeoTabMeta';
import EnhancedSeoTabContent from './tabs/EnhancedSeoTabContent';
import SeoTabTechnical from './tabs/SeoTabTechnical';
import EnhancedSeoTabSchema from './tabs/EnhancedSeoTabSchema';
import EnhancedSeoTabDNS from './tabs/EnhancedSeoTabDNS';
import SeoTabSecurity from './tabs/SeoTabSecurity';
import EnhancedSeoTabSocial from './tabs/EnhancedSeoTabSocial';
import SeoTabRecommendations from './tabs/SeoTabRecommendations';
import TextNormalizer from '../../utils/textNormalizer';

const ResultsDisplay = ({ result, type = 'seo', artifactBase, onNewAnalysis, isSharedView = false }) => {
  const [fixableIssues, setFixableIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueStatuses, setIssueStatuses] = useState(new Map());
  const [showMergedIssues, setShowMergedIssues] = useState(false);
  const [otherAnalyses, setOtherAnalyses] = useState({ lighthouse: null, crawl: null });
  const getScoreColor = (score) => {
    if (score >= 80) return 'score-good';
    if (score >= 50) return 'score-warning';
    return 'score-poor';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Utmärkt! Din webbplats är väloptimerad';
    if (score >= 50) return 'Bra, men det finns utrymme för förbättring';
    return 'Behöver förbättras - flera viktiga områden saknas';
  };

  // Extract issues from results on component mount
  useEffect(() => {
    if (result && type === 'seo') {
      const issues = extractFixableIssues(result);
      setFixableIssues(issues);
    }
  }, [result, type]);

  // IntersectionObserver for active nav link on scroll
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.result-section[id]'));
    const links = Array.from(document.querySelectorAll('.section-nav .nav-link'));
    const map = new Map(sections.map(s => [s.id, links.find(l => l.getAttribute('href') === `#${s.id}`)]));

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const link = map.get(e.target.id);
        if (!link) return;
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, [result]);

  const extractFixableIssues = (analysisResult) => {
    const issues = [];
    const targetUrl = window.location.href; // Or get from props
    const domain = 'example.com'; // Extract from URL properly

    // 1. Missing H1
    if (!analysisResult.headings?.h1 || analysisResult.headings.h1.length === 0) {
      issues.push({
        id: `missing-h1-${Date.now()}`,
        title: "Saknar H1-rubrik",
        severity: "critical",
        foundOn: ["/"],
        howTo: [
          "Lägg till exakt en H1-tag per sida som beskriver sidans huvudsyfte.",
          "Placera H1-rubriken ovanför huvudinnehållet på sidan.",
          "Använd 20-70 tecken och inkludera viktiga sökord."
        ],
        links: [
          { label: "Google: Heading best practices", url: "https://developers.google.com/search/docs/appearance/title-link" }
        ],
        quickFixes: [
          { label: "Grundläggande H1", snippet: `<h1>${analysisResult.title || 'Sidtitel'}</h1>` }
        ],
        status: 'open'
      });
    }

    // 2. Meta Description Issues  
    const metaDesc = analysisResult.metaDescription;
    if (!metaDesc || metaDesc.length < 120 || metaDesc.length > 160) {
      issues.push({
        id: `meta-description-${Date.now()}`,
        title: !metaDesc ? "Saknar meta description" : "Meta description fel längd",
        severity: "important",
        foundOn: ["/"],
        howTo: [
          "Skriv en lockande beskrivning på 150-160 tecken.",
          "Inkludera huvudnyckelordet tidigt i beskrivningen.",
          "Förklara tydligt vad besökaren kan förvänta sig."
        ],
        links: [
          { label: "Google: Meta description guide", url: "https://developers.google.com/search/docs/appearance/snippet" }
        ],
        quickFixes: [
          { label: "Optimerad meta description", snippet: `<meta name="description" content="Din nya beskrivning här">` }
        ],
        status: 'open'
      });
    }

    // 3. Missing Alt Text
    if (analysisResult.images && analysisResult.images.length > 0) {
      const missingAlt = analysisResult.images.filter(img => !img.alt || img.alt.trim() === '');
      if (missingAlt.length > 0) {
        issues.push({
          id: `missing-alt-${Date.now()}`,
          title: `${missingAlt.length} bilder saknar alt-text`,
          severity: "important",
          foundOn: ["/"],
          howTo: [
            "Lägg till beskrivande alt-attribut för alla bilder.",
            "Beskriv vad som visas i bilden, inte bara \"bild\".",
            "Använd 125 tecken eller mindre."
          ],
          links: [
            { label: "WebAIM: Alt text guide", url: "https://webaim.org/articles/images/" }
          ],
          quickFixes: [
            { label: "Alt-text mall", snippet: `alt="Beskrivande text här"` }
          ],
          status: 'open'
        });
      }
    }

    return issues;
  };

  const handleIssueStatusUpdate = (issueId, newStatus) => {
    setIssueStatuses(prev => {
      const updated = new Map(prev);
      updated.set(issueId, newStatus);
      return updated;
    });
  };

  const getProgressStats = () => {
    if (fixableIssues.length === 0) return { total: 0, fixed: 0, inProgress: 0 };
    
    const fixed = fixableIssues.filter(issue => issueStatuses.get(issue.id) === 'fixed').length;
    const inProgress = fixableIssues.filter(issue => issueStatuses.get(issue.id) === 'in_progress').length;
    
    return { total: fixableIssues.length, fixed, inProgress };
  };

  // Use TextNormalizer instead of custom decodeHtml
  const decodeHtml = (text) => {
    return TextNormalizer.normalizeText(text);
  };

  if (!result) return null;

  const score = result.seoScore || result.score || 0;
  
  // Map API data to component format
  const titleScore = result.scoreBreakdown?.title || 0;
  const metaScore = result.scoreBreakdown?.metaDescription || 0;
  const headingScore = result.scoreBreakdown?.headings || 0;
  const contentScore = result.scoreBreakdown?.content || 0;
  const imageScore = result.scoreBreakdown?.images || 0;
  const technicalScore = result.scoreBreakdown?.technical || 0;
  const socialScore = result.scoreBreakdown?.social || 0;
  const mobileScore = result.scoreBreakdown?.mobile || 0;

  // Action handlers for topbar
  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${result.analysisId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `seo-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('PDF generation failed. Please try again.');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF download failed. Please try again.');
    }
  };

  const handleDownloadJson = () => {
    const jsonData = {
      analysisId: result.analysisId,
      timestamp: new Date().toISOString(),
      type: 'seo',
      url: result.url,
      score: result.score,
      fullData: result
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${result.analysisId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 90 })
      });
      if (response.ok) {
        const shareData = await response.json();
        if (navigator.share) {
          await navigator.share({
            title: 'SEO Analys Resultat',
            text: `SEO analys av ${result.url}`,
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

  // Handle error states with detailed user messages
  if (result?.isError) {
    return (
      <div className="error-page" style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff0f7 0%, #ffeaf5 100%)',
        padding: '40px 20px'
      }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>
              {result.errorType === 'bot_blocked' ? '🛡️' :
               result.errorType === 'timeout' ? '⏱️' :
               result.errorType === 'connection_failed' ? '🔌' :
               result.errorType === 'ssl_error' ? '🔒' :
               result.errorType === 'server_error' ? '🚨' : '❌'}
            </div>
            <h1 style={{
              fontSize: '2rem',
              color: '#1e293b',
              marginBottom: '12px',
              fontWeight: 'bold'
            }}>
              {result.title}
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#64748b',
              marginBottom: '8px'
            }}>
              {result.message}
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px'
            }}>
              Webbplats: <span style={{ fontWeight: '600', color: '#ff4da6' }}>{result.url}</span>
            </p>
          </div>

          {/* Explanation */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              color: '#1e293b',
              marginBottom: '16px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Varför händer detta?
            </h3>
            <ul style={{
              color: '#64748b',
              lineHeight: '1.6',
              paddingLeft: '20px'
            }}>
              {result.explanation?.map((item, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              color: '#1e293b',
              marginBottom: '16px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Vad kan du göra istället?
            </h3>
            <ul style={{
              color: '#64748b',
              lineHeight: '1.6',
              paddingLeft: '20px'
            }}>
              {result.suggestions?.map((item, index) => (
                <li key={index} style={{
                  marginBottom: '8px',
                  listStyleType: 'none',
                  position: 'relative',
                  paddingLeft: '20px'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: '#16a34a',
                    fontWeight: '500'
                  }}>✅</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div style={{
            textAlign: 'center',
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={onNewAnalysis}
              style={{
                backgroundColor: '#ff4da6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Prova ny analys
            </button>
            <button
              onClick={() => window.open('/', '_blank')}
              style={{
                backgroundColor: 'white',
                color: '#64748b',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              SEO-guide
            </button>
          </div>

          {/* Technical details for debugging */}
          {result.technicalError && (
            <details style={{
              marginTop: '32px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <summary style={{
                color: '#64748b',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                Tekniska detaljer
              </summary>
              <pre style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#475569',
                background: 'white',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto'
              }}>
                {result.technicalError}
              </pre>
            </details>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className={`results-page ${tocStyles.tocContainer}`}>
      {/* Sticky Topbar - endast för SEO */}
      {type === 'seo' && (
        <ResultsTopbar
          result={result}
          analysisId={result.analysisId}
          onDownloadPdf={handleDownloadPdf}
          onDownloadJson={handleDownloadJson}
          onShare={handleShare}
          onNewAnalysis={onNewAnalysis}
        />
      )}

      <div className="results-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">SEO-analys Resultat</h1>
          <p className="page-subtitle">Professionella SEO-insikter för din webbplats</p>
        </div>

        {/* Status Banner */}
        <div className="status-banner">
          <div className="status-title">Analys Slutförd</div>
          <div className="status-url">{result.url}</div>
        </div>

        {/* SEO-only: KPI-rad + Quick Wins ovanför folden */}
        {type === 'seo' && (
          <>
            <SeoKpiRow result={result} />
            <QuickWinsPanel result={result} />
          </>
        )}

        {/* Score Section */}
        <div className="score-section">
          <div className="score-circle-container">
            <div className="score-circle-bg" style={{'--score': score}}>
              <div className="score-circle-inner">
                <div className="score-text">{score}</div>
              </div>
            </div>
          </div>
          <div className="score-label">SEO-poäng</div>
        </div>

        {/* Table of Contents */}
        <TableOfContents result={result} type={type} />

        {/* Section Container */}
        <div className="sections-container">

        {/* All Sections - Rendered Unconditionally */}
        <section id="overview" className="result-section">
          <h2 className="section-title">Översikt</h2>
          <ProgressBars result={result} />
          <OverviewDashboard
            result={result}
            artifactBase={artifactBase}
          />
        </section>

        <section id="quick-wins" className="result-section">
          <h2 className="section-title">Quick Wins</h2>
          <QuickWinsPanel result={result} />
        </section>

        <section id="meta" className="result-section">
          <h2 className="section-title">Meta-taggar</h2>
          <EnhancedSeoTabMeta result={result} artifactBase={artifactBase} />
        </section>

        <section id="content" className="result-section">
          <h2 className="section-title">Innehåll</h2>
          <EnhancedSeoTabContent result={result} />
        </section>

        <section id="technical" className="result-section">
          <h2 className="section-title">Tekniskt</h2>
          <SeoTabTechnical result={result} />
        </section>

        <section id="recommendations" className="result-section">
          <h2 className="section-title">Rekommendationer</h2>
          <SeoTabRecommendations result={result} />
        </section>

        {result.schema && (
          <section id="schema" className="result-section">
            <h2 className="section-title">Schema.org</h2>
            <EnhancedSeoTabSchema result={result} />
          </section>
        )}

        {result.dns && (
          <section id="dns" className="result-section">
            <h2 className="section-title">DNS Säkerhet</h2>
            <EnhancedSeoTabDNS result={result} />
          </section>
        )}

        {result.security && (
          <section id="security" className="result-section">
            <h2 className="section-title">Säkerhet</h2>
            <SeoTabSecurity result={result} />
          </section>
        )}

        {result.social && (
          <section id="social" className="result-section">
            <h2 className="section-title">Sociala medier</h2>
            <EnhancedSeoTabSocial result={result} />
          </section>
        )}

        {result.readability && (
          <section id="readability" className="result-section">
            <h2 className="section-title">LIX Läsbarhet</h2>
            <SeoTabReadability result={result} />
          </section>
        )}
        </div>
      </div>
      
      {/* Merged Issues Panel */}
      {showMergedIssues && (
        <MergedIssuesPanel
          seoResult={result}
          lighthouseResult={otherAnalyses.lighthouse}
          crawlResult={otherAnalyses.crawl}
          targetUrl={result.url}
          onClose={() => setShowMergedIssues(false)}
        />
      )}

      {/* Fix This Panel */}
      <FixThisPanel
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleIssueStatusUpdate}
      />
    </div>
  );
};

export default ResultsDisplay;