import React, { useState, useEffect } from 'react';
import FixThisPanel from '../common/FixThisPanel';
import MergedIssuesPanel from '../common/MergedIssuesPanel';
import OverviewDashboard from '../overview/OverviewDashboard';
import ResultsTopbar from './ResultsTopbar';
import SeoKpiRow from './SeoKpiRow';
import QuickWinsPanel from './QuickWinsPanel';
import SeoTabReadability from './tabs/SeoTabReadability';
import SeoTabMeta from './tabs/SeoTabMeta';
import SeoTabContent from './tabs/SeoTabContent';
import SeoTabTechnical from './tabs/SeoTabTechnical';
import SeoTabSchema from './tabs/SeoTabSchema';
import SeoTabDNS from './tabs/SeoTabDNS';
import SeoTabSecurity from './tabs/SeoTabSecurity';
import SeoTabSocial from './tabs/SeoTabSocial';
import SeoTabRecommendations from './tabs/SeoTabRecommendations';
import TextNormalizer from '../../utils/textNormalizer';

const ResultsDisplay = ({ result, type = 'seo', artifactBase, onNewAnalysis, isSharedView = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
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

  return (
    <div className="results-section">
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
          <h1 className="page-title">SEO Analysis Results</h1>
          <p className="page-subtitle">Professional SEO insights for your website</p>
        </div>

        {/* Status Banner */}
        <div className="status-banner">
          <div className="status-title">Analysis Complete</div>
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
          <div className="score-label">SEO Score</div>
        </div>

        {/* Overall Section */}
        <div className="overall-section">
          <h2 className="overall-title">Overall SEO Score</h2>
          <p className="overall-subtitle">{getScoreMessage(score)}</p>
          
            <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Översikt
            </button>
            <button 
              className={`tab-btn ${activeTab === 'meta' ? 'active' : ''}`}
              onClick={() => setActiveTab('meta')}
            >
              Meta-taggar
            </button>
            <button 
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              Innehåll
            </button>
            <button 
              className={`tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
              onClick={() => setActiveTab('technical')}
            >
              Tekniskt
            </button>
            <button 
              className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
              {result.recommendations && result.recommendations.length > 0 && (
                <span className="tab-badge">{result.recommendations.length}</span>
              )}
            </button>
            {result.schema && (
              <button 
                className={`tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
                onClick={() => setActiveTab('schema')}
              >
                Schema.org
                <span className="tab-badge">{result.schema.score}</span>
              </button>
            )}
            {result.dns && (
              <button 
                className={`tab-btn ${activeTab === 'dns' ? 'active' : ''}`}
                onClick={() => setActiveTab('dns')}
              >
                DNS Säkerhet
                <span className="tab-badge">{result.dns.score}</span>
              </button>
            )}
            {result.security && (
              <button 
                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                Säkerhet
                <span className="tab-badge">{result.security.score}</span>
              </button>
            )}
            {result.social && (
              <button 
                className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
                onClick={() => setActiveTab('social')}
              >
                Social Media
                <span className="tab-badge">{result.social.score}</span>
              </button>
            )}
            {/* 90-dagars: LIX Tab med Badge */}
            {result.readability && (
              <button 
                className={`tab-btn ${activeTab === 'readability' ? 'active' : ''}`}
                onClick={() => setActiveTab('readability')}
              >
                LIX Läsbarhet
                <span className="tab-badge">{result.readability.seoScore}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <OverviewDashboard
            result={result}
            artifactBase={artifactBase}
          />
        )}

        {activeTab === 'meta' && (
          <SeoTabMeta result={result} artifactBase={artifactBase} />
        )}

        {activeTab === 'content' && (
          <SeoTabContent result={result} />
        )}

        {activeTab === 'technical' && (
          <SeoTabTechnical result={result} setActiveTab={setActiveTab} />
        )}


        {activeTab === 'recommendations' && (
          <SeoTabRecommendations result={result} />
        )}

        {/* Schema.org Tab */}
        {activeTab === 'schema' && result.schema && (
          <SeoTabSchema result={result} />
        )}

        {/* DNS Tab */}
        {activeTab === 'dns' && result.dns && (
          <SeoTabDNS result={result} />
        )}

        {/* Security Headers Tab */}
        {activeTab === 'security' && result.security && (
          <SeoTabSecurity result={result} />
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && result.social && (
          <SeoTabSocial result={result} />
        )}

        {/* 90-dagars: LIX Läsbarhet Tab */}
        {activeTab === 'readability' && result.readability && (
          <SeoTabReadability result={result} />
        )}
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