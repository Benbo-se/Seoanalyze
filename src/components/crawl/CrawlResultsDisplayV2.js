'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { normalizeCrawl } from '../../utils/normalizeCrawl';
import ResultsTopbar from '../results/ResultsTopbar';
import ScoreRing from '../lighthouse/ScoreRing';
import ProgressBars from '../results/ProgressBars';
import TableOfContents from '../results/TableOfContents';
import QuickWinsPanel from '../results/QuickWinsPanel';
import PriorityMatrix from '../lighthouse/PriorityMatrix';
import styles from './crawlResults.module.css';
import {
  Link, Globe, AlertTriangle, CheckCircle, XCircle,
  FileText, Image, Search, Clock, Server, Activity,
  AlertCircle, TrendingUp, FileCode, MapPin, ExternalLink,
  Zap, Database, Shield, BarChart3
} from 'lucide-react';

// Helper functions
const fmtNum = (n) => {
  if (n == null) return '—';
  try {
    return new Intl.NumberFormat('sv-SE').format(n);
  } catch { return String(n); }
};

const fmtMs = (ms) => {
  if (!ms) return '—';
  if (ms < 1000) return `${fmtNum(ms)} ms`;
  return `${(ms/1000).toFixed(1).replace('.', ',')} s`;
};

const fmtBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Score utilities
const getScoreColor = (score) => {
  if (score >= 90) return '#16a34a';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const getGradeColor = (grade) => {
  const gradeColors = {
    'A': '#16a34a', 'B': '#65a30d', 'C': '#ca8a04',
    'D': '#ea580c', 'E': '#dc2626', 'F': '#dc2626'
  };
  return gradeColors[grade] || '#6b7280';
};

// Main Component
export default function CrawlResultsDisplayV2({ result, isSharedView = false }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueStatuses, setIssueStatuses] = useState({});

  const vm = useMemo(() => normalizeCrawl(result), [result]);

  // Filter state for clickable metrics
  const [activeFilter, setActiveFilter] = useState(null);
  const [filteredData, setFilteredData] = useState(null);

  // Extract additional data
  const quickActions = result?.summary?.quickActions || result?.quickActions || [];
  const ruleEngine = result?.ruleEngine || {};
  const errorStats = result?.summary?.errorStats || result?.errorStats;

  // Calculate scores and metrics
  const { linkmap, pages, statusBuckets, rum, summary, issues, sitemap, robotsTxt } = vm;
  const score = linkmap.score || 0;
  const grade = linkmap.grade || 'N/A';
  const analysisId = result?.analysisId || result?.id || vm.analysisId;

  // Calculate issue counts
  const criticalCount = issues.missingTitle.length + issues.brokenLinks.length + issues.brokenImages.length;
  const mediumCount = issues.missingMeta.length + issues.missingH1.length + issues.thinContent.length;
  const lowCount = issues.imagesWithoutAlt.length;
  const totalIssues = criticalCount + mediumCount + lowCount;

  // Scroll to hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  // Active section tracking for navigation
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.result-section[id]'));
    const links = Array.from(document.querySelectorAll('.section-nav .nav-link'));
    const map = new Map(sections.map(s => [s.id, links.find(l => l.getAttribute('href') === `#${s.id}`)]));

    const obs = new IntersectionObserver(entries => {
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
  }, []);

  const handleStatusChange = (issueId, newStatus) => {
    setIssueStatuses(prev => ({
      ...prev,
      [issueId]: newStatus
    }));
  };

  // Click handlers for filtering
  const handleMetricClick = (filterType, data) => {
    if (activeFilter === filterType) {
      // Toggle off if same filter clicked
      setActiveFilter(null);
      setFilteredData(null);
    } else {
      setActiveFilter(filterType);
      setFilteredData(data);

      // Scroll to relevant section
      setTimeout(() => {
        const targetSection = getTargetSection(filterType);
        if (targetSection) {
          const element = document.getElementById(targetSection);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    }
  };

  const getTargetSection = (filterType) => {
    const sectionMap = {
      'missing-title': 'content',
      'missing-meta': 'content',
      'missing-h1': 'content',
      'thin-content': 'content',
      'broken-images': 'content',
      'images-no-alt': 'content',
      'broken-links': 'links',
      'redirect-chains': 'links',
      'orphan-pages': 'links',
      'status-3xx': 'overview',
      'status-4xx': 'overview',
      'status-5xx': 'overview'
    };
    return sectionMap[filterType] || 'overview';
  };

  const getFilterTitle = (filterType) => {
    const titleMap = {
      'missing-title': 'Sidor utan titel',
      'missing-meta': 'Sidor utan meta-beskrivning',
      'missing-h1': 'Sidor utan H1',
      'thin-content': 'Sidor med tunt innehåll',
      'broken-images': 'Trasiga bilder',
      'images-no-alt': 'Bilder utan alt-text',
      'broken-links': 'Trasiga länkar',
      'redirect-chains': 'Redirect-kedjor',
      'orphan-pages': 'Orphan-sidor',
      'status-3xx': '3xx-redirects',
      'status-4xx': '4xx-fel',
      'status-5xx': '5xx-fel'
    };
    return titleMap[filterType] || 'Okänt filter';
  };

  // Action handlers
  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/v1/analyses/${analysisId}/pdf`);
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
  };

  const handleDownloadJson = () => {
    const jsonData = {
      analysisId: analysisId,
      timestamp: new Date().toISOString(),
      type: 'crawl',
      url: vm.url,
      score: score,
      grade: grade,
      crawlData: {
        pages: pages.length,
        duration: summary.durationMs,
        statusBuckets: statusBuckets,
        issues: issues,
        sitemap: sitemap,
        linkmap: linkmap
      },
      fullData: result
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
      const response = await fetch(`/api/v1/analyses/${analysisId}/share`, {
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
  };

  return (
    <div className="results-page">
      {/* Results Topbar */}
      <ResultsTopbar
        result={{
          ...result,
          score: score,
          targetUrl: vm.url,
          url: vm.url
        }}
        analysisType="crawl"
        targetUrl={vm.url}
        analysisId={analysisId}
        onDownloadPdf={handleDownloadPdf}
        onDownloadJson={handleDownloadJson}
        onShare={handleShare}
        onNewAnalysis={() => window.location.href = '/'}
        isSharedView={isSharedView}
      />

      <div className="results-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Crawl-analys Resultat</h1>
          <p className="page-subtitle">Djupanalys av webbplatsens struktur och tekniska hälsa</p>
        </div>

      {/* Crawl Information */}
      {summary?.startTime && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          fontSize: '14px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            <span>Kördes: {new Date(summary.startTime).toLocaleString('sv-SE')}</span>
          </div>
          {summary.maxDepth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} />
              <span>Max djup: {summary.maxDepth}</span>
            </div>
          )}
          {summary.concurrency && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} />
              <span>Samtidighet: {summary.concurrency}</span>
            </div>
          )}
          {summary.durationMs && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} />
              <span>Varaktighet: {fmtMs(summary.durationMs)}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>{pages.length} sidor analyserade</span>
          </div>
        </div>
      )}

      {/* Crawl Scores */}
      <div className="quick-stats">
        <div className="quick-stat-item">
          <ScoreRing
            label="Crawl Score"
            score={score}
            color={getScoreColor(score)}
            size={80}
          />
          <div style={{ fontSize: '12px', color: getScoreColor(score), marginTop: '8px' }}>
            {score >= 85 ? 'Utmärkt' : score >= 70 ? 'Bra' : score >= 50 ? 'OK' : 'Behöver åtgärd'}
          </div>
        </div>
        <div className="quick-stat-item">
          <div style={{
            backgroundColor: getGradeColor(grade),
            color: 'white',
            width: '80px',
            height: '80px',
            fontSize: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            margin: '0 auto'
          }}>
            {grade}
          </div>
          <div style={{ fontSize: '12px', color: getGradeColor(grade), marginTop: '8px' }}>
            Betyg
          </div>
        </div>
      </div>

      {/* Enhanced Dashboard Metrics */}
      <div className="score-container">
        <div className="score-metrics">
            <div className="metric-item" style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '1px solid #cbd5e1'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Globe className="metric-icon" size={22} style={{ color: 'white' }} />
              </div>
              <div className="metric-content">
                <span className="metric-value" style={{ fontSize: '28px' }}>{fmtNum(pages.length)}</span>
                <span className="metric-label">Sidor crawlade</span>
              </div>
            </div>

            <div className="metric-item" style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle className="metric-icon" size={22} style={{ color: 'white' }} />
              </div>
              <div className="metric-content">
                <span className="metric-value success" style={{ fontSize: '28px' }}>
                  {statusBuckets['2xx'] > 0 ? statusBuckets['2xx'] : 'N/A'}
                </span>
                <span className="metric-label">Friska sidor</span>
              </div>
            </div>

            <div className="metric-item" style={{
              background: totalIssues > 0 ?
                'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)' :
                'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: totalIssues > 0 ? '1px solid #fca5a5' : '1px solid #cbd5e1'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: totalIssues > 0 ?
                  'linear-gradient(135deg, #ef4444, #dc2626)' :
                  'linear-gradient(135deg, #64748b, #475569)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle className="metric-icon" size={22} style={{ color: 'white' }} />
              </div>
              <div className="metric-content">
                <span className="metric-value" style={{
                  fontSize: '28px',
                  color: totalIssues > 0 ? '#ef4444' : '#64748b'
                }}>{totalIssues}</span>
                <span className="metric-label">Problem funna</span>
              </div>
            </div>

            <div className="metric-item" style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '1px solid #cbd5e1'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock className="metric-icon" size={22} style={{ color: 'white' }} />
              </div>
              <div className="metric-content">
                <span className="metric-value" style={{ fontSize: '28px' }}>{fmtMs(summary.durationMs)}</span>
                <span className="metric-label">Crawl-tid</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Wins Section */}
        {quickActions.length > 0 && (
          <div style={{
            marginTop: '30px',
            padding: '24px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde047 20%, #facc15 100%)',
            borderRadius: '16px',
            border: '2px solid #eab308',
            boxShadow: '0 4px 16px rgba(234, 179, 8, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#eab308',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={20} style={{ color: 'white' }} />
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: '#92400e'
              }}>
                Quick Wins - Snabba förbättringar
              </h3>
            </div>
            <QuickWinsPanel quickWins={quickActions.slice(0, 3)} />
          </div>
        )}

      {/* Premium Health Categories */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '600',
          color: '#1e293b',
          margin: '0 0 24px 0'
        }}>
          Webbplatshälsa kategorier
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {/* Critical Issues Category */}
          <div style={{
            background: criticalCount === 0 ?
              'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
              'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
            border: criticalCount === 0 ? '2px solid #16a34a' : '2px solid #ef4444',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {criticalCount === 0 ? (
                  <CheckCircle size={24} style={{ color: '#16a34a' }} />
                ) : (
                  <XCircle size={24} style={{ color: '#ef4444' }} />
                )}
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: criticalCount === 0 ? '#16a34a' : '#ef4444'
                }}>
                  Kritiska problem
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: criticalCount === 0 ? '#16a34a' : '#ef4444'
              }}>
                {criticalCount}
              </div>
            </div>

            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.1)',
              marginBottom: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: criticalCount === 0 ? '100%' : '0%',
                height: '100%',
                background: criticalCount === 0 ? '#16a34a' : '#ef4444',
                borderRadius: '4px',
                transition: 'width 1s ease'
              }} />
            </div>

            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.4'
            }}>
              {criticalCount === 0 ?
                'Inga kritiska problem funna - utmärkt!' :
                'Kräver omedelbar uppmärksamhet för SEO och användarupplevelse'
              }
            </p>
          </div>

          {/* Medium Issues Category */}
          <div style={{
            background: mediumCount === 0 ?
              'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
              'linear-gradient(135deg, #fefbf2 0%, #fed7aa 100%)',
            border: mediumCount === 0 ? '2px solid #16a34a' : '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {mediumCount === 0 ? (
                  <CheckCircle size={24} style={{ color: '#16a34a' }} />
                ) : (
                  <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                )}
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: mediumCount === 0 ? '#16a34a' : '#f59e0b'
                }}>
                  Viktiga problem
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: mediumCount === 0 ? '#16a34a' : '#f59e0b'
              }}>
                {mediumCount}
              </div>
            </div>

            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.1)',
              marginBottom: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: mediumCount === 0 ? '100%' : `${Math.max(0, 100 - mediumCount * 10)}%`,
                height: '100%',
                background: mediumCount === 0 ? '#16a34a' : '#f59e0b',
                borderRadius: '4px',
                transition: 'width 1s ease'
              }} />
            </div>

            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.4'
            }}>
              {mediumCount === 0 ?
                'Inga viktiga problem - mycket bra!' :
                'Bör åtgärdas inom närmaste tiden för optimal prestanda'
              }
            </p>
          </div>

          {/* Low Issues Category */}
          <div style={{
            background: lowCount === 0 ?
              'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' :
              'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: lowCount === 0 ? '2px solid #16a34a' : '2px solid #64748b',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {lowCount === 0 ? (
                  <CheckCircle size={24} style={{ color: '#16a34a' }} />
                ) : (
                  <AlertCircle size={24} style={{ color: '#64748b' }} />
                )}
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '600',
                  color: lowCount === 0 ? '#16a34a' : '#64748b'
                }}>
                  Mindre problem
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: lowCount === 0 ? '#16a34a' : '#64748b'
              }}>
                {lowCount}
              </div>
            </div>

            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(0, 0, 0, 0.1)',
              marginBottom: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: lowCount === 0 ? '100%' : `${Math.max(0, 100 - lowCount * 5)}%`,
                height: '100%',
                background: lowCount === 0 ? '#16a34a' : '#64748b',
                borderRadius: '4px',
                transition: 'width 1s ease'
              }} />
            </div>

            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.4'
            }}>
              {lowCount === 0 ?
                'Perfekt - inga mindre problem!' :
                'Kan förbättras när tid finns för polering'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filtered Results Section */}
      {activeFilter && filteredData && (
        <section className="result-section" style={{ border: '2px solid #ff4da6', background: 'rgba(255, 77, 166, 0.05)' }}>
          <h2 className="section-title" style={{ color: '#ff4da6' }}>
            <Search size={20} />
            Filtrerade resultat: {getFilterTitle(activeFilter)} ({filteredData.length} st)
            <button
              onClick={() => handleMetricClick(activeFilter, null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: '1px solid #ff4da6',
                borderRadius: '6px',
                padding: '4px 12px',
                color: '#ff4da6',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Rensa filter
            </button>
          </h2>
          <div style={{ maxHeight: '400px', overflow: 'auto', padding: '10px', background: 'white', borderRadius: '8px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} style={{
                padding: '8px 12px',
                margin: '4px 0',
                background: '#f8fafc',
                borderRadius: '6px',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{item.url || item}</span>
                {item.wordCount && <span style={{ color: '#64748b' }}>{item.wordCount} ord</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Navigation */}
      <nav className="section-nav">
        <div className="nav-inner">
          <a href="#overview" className="nav-link active">Översikt</a>
          <a href="#technical" className="nav-link">Teknisk hälsa</a>
          <a href="#links" className="nav-link">Länkar</a>
          <a href="#content" className="nav-link">Innehåll</a>
          {rum && <a href="#performance" className="nav-link">Prestanda</a>}
          <a href="#issues" className="nav-link">Problem</a>
        </div>
      </nav>

      {/* Table of Contents */}
      <TableOfContents result={{
        overview: true,
        metadata: true,
        technical: true,
        links: linkmap.internalLinks.length + linkmap.externalLinks.length > 0,
        content: pages.length > 0,
        performance: !!rum,
        issues: totalIssues > 0
      }} />

      {/* Overview Section */}
      <section id="overview" className="result-section">
        <h2 className="section-title">
          Översikt
        </h2>

        <div className="overview-grid">
          {/* Crawl Summary Card */}
          <div className="info-card">
            <div className="card-header">
              <h3>Crawl-sammanfattning</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">Totalt antal sidor</span>
                  <span className="stat-value">{fmtNum(pages.length)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">2xx (OK)</span>
                  <span className="stat-value success">
                    {statusBuckets['2xx'] > 0 ? statusBuckets['2xx'] : 'Inga funna'}
                  </span>
                </div>
                {(statusBuckets['3xx'] > 0) && (
                  <div className="stat-row">
                    <span className="stat-label">3xx (Redirects)</span>
                    <span className="stat-value warning">{statusBuckets['3xx']}</span>
                  </div>
                )}
                {(statusBuckets['4xx'] > 0) && (
                  <div className="stat-row">
                    <span className="stat-label">4xx (Klient-fel)</span>
                    <span className="stat-value error">{statusBuckets['4xx']}</span>
                  </div>
                )}
                {(statusBuckets['5xx'] > 0) && (
                  <div className="stat-row">
                    <span className="stat-label">5xx (Server-fel)</span>
                    <span className="stat-value error">{statusBuckets['5xx']}</span>
                  </div>
                )}
                {(!statusBuckets['3xx'] && !statusBuckets['4xx'] && !statusBuckets['5xx'] && statusBuckets['2xx'] > 0) && (
                  <div className="stat-row">
                    <span className="stat-label">Status</span>
                    <span className="stat-value success">Alla sidor friska ✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Link Distribution Card */}
          <div className="info-card">
            <div className="card-header">
              <h3>Länkdistribution</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">Interna länkar</span>
                  <span className="stat-value">{fmtNum(linkmap.internalLinks.length)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Externa länkar</span>
                  <span className="stat-value">{fmtNum(linkmap.externalLinks.length)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Brutna länkar</span>
                  <span className="stat-value error">{linkmap.brokenLinks.length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Redirect-kedjor</span>
                  <span className="stat-value warning">{linkmap.redirectChains.length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Orphan-sidor</span>
                  <span className="stat-value warning">{linkmap.orphanPages.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Health Card */}
          <div className="info-card">
            <div className="card-header">
              <h3>SEO-hälsa</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">Sidor utan titel</span>
                  <span
                    className={`stat-value ${issues.missingTitle.length > 0 ? 'error' : 'success'} ${issues.missingTitle.length > 0 ? 'clickable' : ''} ${activeFilter === 'missing-title' ? 'active' : ''}`}
                    onClick={issues.missingTitle.length > 0 ? () => handleMetricClick('missing-title', issues.missingTitle) : undefined}
                    title={issues.missingTitle.length > 0 ? 'Klicka för att visa sidor utan titel' : ''}
                  >
                    {issues.missingTitle.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Sidor utan meta desc.</span>
                  <span
                    className={`stat-value ${issues.missingMeta.length > 0 ? 'warning' : 'success'} ${issues.missingMeta.length > 0 ? 'clickable' : ''} ${activeFilter === 'missing-meta' ? 'active' : ''}`}
                    onClick={issues.missingMeta.length > 0 ? () => handleMetricClick('missing-meta', issues.missingMeta) : undefined}
                    title={issues.missingMeta.length > 0 ? 'Klicka för att visa sidor utan meta-beskrivning' : ''}
                  >
                    {issues.missingMeta.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Sidor utan H1</span>
                  <span
                    className={`stat-value ${issues.missingH1.length > 0 ? 'error' : 'success'} ${issues.missingH1.length > 0 ? 'clickable' : ''} ${activeFilter === 'missing-h1' ? 'active' : ''}`}
                    onClick={issues.missingH1.length > 0 ? () => handleMetricClick('missing-h1', issues.missingH1) : undefined}
                    title={issues.missingH1.length > 0 ? 'Klicka för att visa sidor utan H1' : ''}
                  >
                    {issues.missingH1.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Tunt innehåll (&lt;300 ord)</span>
                  <span
                    className={`stat-value ${issues.thinContent.length > 0 ? 'warning' : 'success'} ${issues.thinContent.length > 0 ? 'clickable' : ''} ${activeFilter === 'thin-content' ? 'active' : ''}`}
                    onClick={issues.thinContent.length > 0 ? () => handleMetricClick('thin-content', issues.thinContent) : undefined}
                    title={issues.thinContent.length > 0 ? 'Klicka för att visa sidor med tunt innehåll' : ''}
                  >
                    {issues.thinContent.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Bilder utan alt-text</span>
                  <span
                    className={`stat-value ${issues.imagesWithoutAlt.length > 0 ? 'warning' : 'success'} ${issues.imagesWithoutAlt.length > 0 ? 'clickable' : ''} ${activeFilter === 'images-no-alt' ? 'active' : ''}`}
                    onClick={issues.imagesWithoutAlt.length > 0 ? () => handleMetricClick('images-no-alt', issues.imagesWithoutAlt) : undefined}
                    title={issues.imagesWithoutAlt.length > 0 ? 'Klicka för att visa bilder utan alt-text' : ''}
                  >
                    {issues.imagesWithoutAlt.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crawl Metadata Section */}
      <section id="metadata" className="result-section">
        <h2 className="section-title">
          Crawl-metadata & sitemap
        </h2>

        <div className="overview-grid">
          {/* Crawl Information */}
          <div className="info-card">
            <div className="card-header">
              <h3>Crawl-information</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">Starttid</span>
                  <span className="stat-value">
                    {summary.startTime ? new Date(summary.startTime).toLocaleString('sv-SE') : 'N/A'}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Varaktighet</span>
                  <span className="stat-value">{fmtMs(summary.durationMs)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Crawl-djup</span>
                  <span className="stat-value">{summary.maxDepth || 'Obegränsat'}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Samtidiga anslutningar</span>
                  <span className="stat-value">{summary.concurrency || 5}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">User Agent</span>
                  <span className="stat-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                    {summary.userAgent || 'Standard SEO Analyzer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sitemap Coverage */}
          <div className="info-card">
            <div className="card-header">
              <h3>Sitemap-täckning</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                {sitemap.present ? (
                  <>
                    <div className="stat-row">
                      <span className="stat-label">Sitemap.xml</span>
                      <span className="stat-value success">✓ Hittad</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">URLs i sitemap</span>
                      <span className="stat-value">{sitemap.urlCount || 'N/A'}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Crawlade från sitemap</span>
                      <span className="stat-value">
                        {sitemap.crawledCount || 'N/A'}
                        {sitemap.urlCount && sitemap.crawledCount &&
                          ` (${Math.round((sitemap.crawledCount / sitemap.urlCount) * 100)}%)`
                        }
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Saknas i sitemap</span>
                      <span className="stat-value warning">
                        {sitemap.missingCount || 'N/A'}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Sitemap-indexfil</span>
                      <span className="stat-value">{sitemap.isIndex ? 'Ja' : 'Nej'}</span>
                    </div>
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#64748b',
                    fontStyle: 'italic'
                  }}>
                    Ingen sitemap.xml hittad. Detta kan påverka hur sökmotorer indexerar webbplatsen.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discovery Methods */}
          <div className="info-card">
            <div className="card-header">
              <h3>Upptäckningsmetoder</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">Via länkar</span>
                  <span className="stat-value">{linkmap.discoveredByLinks || 0}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Via sitemap</span>
                  <span className="stat-value">{sitemap.crawledCount || 0}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Via direkta URLs</span>
                  <span className="stat-value">{summary.seedUrls || 1}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Totalt unika sidor</span>
                  <span className="stat-value success">{pages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Section */}
      <section id="technical" className="result-section">
        <h2 className="section-title">
          Teknisk hälsa
        </h2>

        <div className="tech-grid">
          {/* Infrastructure Status */}
          <div className="info-card">
            <div className="card-header">
              <h3>Infrastruktur</h3>
            </div>
            <div className="card-content">
              <div className="infra-items">
                <div className="infra-item">
                  {sitemap.present ? (
                    <CheckCircle className="icon success" size={18} />
                  ) : (
                    <XCircle className="icon error" size={18} />
                  )}
                  <span className="label">Sitemap.xml</span>
                  <span className={`status ${sitemap.present ? 'found' : 'missing'}`}>
                    {sitemap.present ? 'Hittad' : 'Saknas'}
                  </span>
                </div>
                <div className="infra-item">
                  {robotsTxt.present ? (
                    <CheckCircle className="icon success" size={18} />
                  ) : (
                    <XCircle className="icon error" size={18} />
                  )}
                  <span className="label">Robots.txt</span>
                  <span className={`status ${robotsTxt.present ? 'found' : 'missing'}`}>
                    {robotsTxt.present ? 'Hittad' : 'Saknas'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Page Stats */}
          <div className="info-card">
            <div className="card-header">
              <h3>Sidstatistik</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">Genomsnittlig storlek</span>
                  <span className="stat-value">
                    {pages.length > 0 ? fmtBytes(
                      pages.reduce((sum, p) => sum + (p.pageSize || 0), 0) / pages.length
                    ) : '—'}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Största sida</span>
                  <span className="stat-value">
                    {pages.length > 0 ? fmtBytes(Math.max(...pages.map(p => p.pageSize || 0))) : '—'}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Sidor &gt; 1MB</span>
                  <span className="stat-value">
                    {pages.filter(p => p.pageSize > 1024 * 1024).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Links Section */}
      <section id="links" className="result-section">
        <h2 className="section-title">
          Länkar & navigation
        </h2>

        {/* Link Map Visualization - Simple and Clean */}
        {linkmap.topLinkedPages && linkmap.topLinkedPages.length > 0 && (
          <div className="info-card" style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
            <div className="card-header">
              <h3>
                <MapPin size={16} />
                Link Map - Mest länkade sidor
              </h3>
            </div>
            <div className="card-content">
              {/* Visual bar chart of top linked pages */}
              <div style={{ padding: '20px' }}>
                {linkmap.topLinkedPages.slice(0, 10).map((page, index) => {
                  const maxLinks = Math.max(...linkmap.topLinkedPages.map(p => p.inboundLinks || 0));
                  const percentage = (page.inboundLinks / maxLinks) * 100;
                  const pagePath = page.url?.replace(/^https?:\/\/[^\/]+/, '') || page.url || '/';

                  return (
                    <div key={index} style={{
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        flex: '0 0 200px',
                        fontSize: '13px',
                        color: '#475569',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'right'
                      }}>
                        {pagePath}
                      </div>
                      <div style={{
                        flex: '1',
                        position: 'relative',
                        height: '32px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${percentage}%`,
                          background: percentage > 70 ?
                            'linear-gradient(90deg, #ff4da6, #c21d6e)' :
                            percentage > 40 ?
                            'linear-gradient(90deg, #f59e0b, #d97706)' :
                            'linear-gradient(90deg, #3b82f6, #2563eb)',
                          borderRadius: '6px',
                          transition: 'width 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '12px'
                        }}>
                          <span style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '14px',
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            {page.inboundLinks}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Link statistics summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                    {linkmap.internalLinks.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Totalt interna länkar
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                    {linkmap.externalLinks.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Externa länkar
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: linkmap.brokenLinks.length > 0 ? '#ef4444' : '#16a34a' }}>
                    {linkmap.brokenLinks.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Trasiga länkar
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: linkmap.orphanPages.length > 0 ? '#f59e0b' : '#16a34a' }}>
                    {linkmap.orphanPages.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Orphan-sidor
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="links-grid">
          {/* Top Linked Pages */}
          {linkmap.topLinkedPages && linkmap.topLinkedPages.length > 0 && (
            <div className="info-card">
              <div className="card-header">
                <h3>Mest länkade sidor</h3>
              </div>
              <div className="card-content">
                <div className="linked-pages">
                  {linkmap.topLinkedPages.slice(0, 8).map((page, index) => (
                    <div key={index} className="linked-page">
                      <span className="page-url">
                        {page.url?.replace(/^https?:\/\/[^\/]+/, '') || page.url}
                      </span>
                      <span className="link-count">{page.inboundLinks} länkar</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Orphan Pages */}
          {linkmap.orphanPages.length > 0 && (
            <div className="info-card warning-card">
              <div className="card-header">
                <h3>
                  <AlertTriangle size={16} />
                  Orphan-sidor ({linkmap.orphanPages.length})
                </h3>
              </div>
              <div className="card-content">
                <p className="card-description">
                  Sidor utan inkommande interna länkar är svåra att hitta för både användare och sökmotorer.
                </p>
                <div className="orphan-list">
                  {linkmap.orphanPages.slice(0, 5).map((url, index) => (
                    <div key={index} className="orphan-item">
                      {typeof url === 'string' ? url : url.url}
                    </div>
                  ))}
                  {linkmap.orphanPages.length > 5 && (
                    <div className="more-items">...och {linkmap.orphanPages.length - 5} till</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Link Recommendations */}
          {linkmap.recommendations && linkmap.recommendations.length > 0 && (
            <div className="info-card">
              <div className="card-header">
                <h3>Länkrekommendationer</h3>
              </div>
              <div className="card-content">
                {linkmap.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="recommendation">
                    <div className="rec-issue">{rec.issue}</div>
                    <div className="rec-fix">{rec.fix}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section id="content" className="result-section">
        <h2 className="section-title">
          Innehållsanalys
        </h2>

        <div className="content-grid">
          <div className="info-card">
            <div className="card-header">
              <h3>Innehållsproblem</h3>
            </div>
            <div className="card-content">
              {issues.thinContent.length > 0 && (
                <div className="issue-group">
                  <h4>Tunt innehåll ({issues.thinContent.length} sidor)</h4>
                  <div className="issue-list">
                    {issues.thinContent.slice(0, 3).map((page, index) => (
                      <div key={index} className="issue-item">
                        <span className="page-url">{page.url}</span>
                        <span className="word-count">{page.wordCount} ord</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {issues.missingTitle.length > 0 && (
                <div className="issue-group">
                  <h4>Saknar titel ({issues.missingTitle.length} sidor)</h4>
                  <div className="issue-list">
                    {issues.missingTitle.slice(0, 3).map((page, index) => (
                      <div key={index} className="issue-item">
                        <span className="page-url">{page.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="info-card">
            <div className="card-header">
              <h3>Bildanalys</h3>
            </div>
            <div className="card-content">
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">Brutna bilder</span>
                  <span className={`stat-value ${issues.brokenImages.length > 0 ? 'error' : 'success'}`}>
                    {issues.brokenImages.length}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Utan alt-text</span>
                  <span className={`stat-value ${issues.imagesWithoutAlt.length > 0 ? 'warning' : 'success'}`}>
                    {issues.imagesWithoutAlt.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Performance Section */}
      <section id="performance" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '22px',
          fontWeight: '600',
          color: '#1e293b',
          margin: '0 0 24px 0'
        }}>
          <Activity size={24} />
          Prestanda (RUM)
        </h2>

        {rum ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '2px solid #16a34a',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <Zap size={20} style={{ color: '#16a34a' }} />
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#16a34a'
                }}>
                  LCP (P75)
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                {fmtMs(rum.p75?.lcp_p75)}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                padding: '4px 8px',
                borderRadius: '4px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'inline-block'
              }}>
                {getRumStatus(rum.p75?.lcp_p75, 'lcp')}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '2px solid #16a34a',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <BarChart3 size={20} style={{ color: '#16a34a' }} />
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#16a34a'
                }}>
                  CLS (P75)
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                {rum.p75?.cls_p75?.toFixed(3) || '—'}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                padding: '4px 8px',
                borderRadius: '4px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'inline-block'
              }}>
                {getRumStatus(rum.p75?.cls_p75, 'cls')}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '2px solid #16a34a',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <Activity size={20} style={{ color: '#16a34a' }} />
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#16a34a'
                }}>
                  INP (P75)
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                {fmtMs(rum.p75?.inp_p75)}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                padding: '4px 8px',
                borderRadius: '4px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'inline-block'
              }}>
                {getRumStatus(rum.p75?.inp_p75, 'inp')}
              </div>
            </div>

            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '16px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {fmtNum(rum.samples)} mätningar från {rum.days} dagar
            </div>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #fefbf2 0%, #fed7aa 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '30px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '600px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BarChart3 size={20} style={{ color: 'white' }} />
                </div>
                <h3 style={{
                  color: '#92400e',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  Real User Monitoring (RUM)
                </h3>
              </div>

              <p style={{
                color: '#92400e',
                margin: 0,
                lineHeight: '1.6',
                fontSize: '15px'
              }}>
                RUM-data finns inte tillgänglig för denna webbplats. RUM mäter verkliga användares upplevelse av Core Web Vitals-mätvärden som Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS) och Interaction to Next Paint (INP).
              </p>

              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #f59e0b'
              }}>
                <h4 style={{
                  color: '#1e293b',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Zap size={16} style={{ color: '#f59e0b' }} />
                  Så får du RUM-data:
                </h4>
                <ul style={{
                  color: '#64748b',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0,
                  paddingLeft: '20px'
                }}>
                  <li>Integrera med Google Search Console för CrUX-data</li>
                  <li>Använd Google Analytics 4 Enhanced Measurements</li>
                  <li>Installera verktyg som PageSpeed Insights API</li>
                  <li>Implementera performance.measureUserAgentSpecificMemory()</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Premium Issues Section */}
      <section id="issues" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '22px',
          fontWeight: '600',
          color: '#1e293b',
          margin: '0 0 24px 0'
        }}>
          <AlertCircle size={24} />
          Problem & åtgärder
        </h2>

        {/* Use Priority Matrix if we have normalized issues */}
        {ruleEngine.actionableList && ruleEngine.actionableList.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <PriorityMatrix issues={ruleEngine.actionableList} />
          </div>
        )}

        {totalIssues === 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '2px solid #16a34a',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={28} style={{ color: 'white' }} />
              </div>
            </div>
            <h3 style={{
              color: '#16a34a',
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              Inga problem funna!
            </h3>
            <p style={{
              color: '#15803d',
              margin: 0,
              fontSize: '16px'
            }}>
              Din webbplats ser bra ut - inga kritiska eller viktiga problem upptäcktes under crawlingen.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {/* Critical Issues */}
            {criticalCount > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                border: '2px solid #ef4444',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <XCircle size={20} style={{ color: 'white' }} />
                  </div>
                  <h3 style={{
                    color: '#dc2626',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Kritiska problem ({criticalCount})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {issues.brokenLinks.length > 0 && (
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <XCircle size={16} style={{ color: '#ef4444' }} />
                        <span style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          Brutna länkar ({issues.brokenLinks.length})
                        </span>
                      </div>
                      <p style={{
                        color: '#475569',
                        fontSize: '13px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4'
                      }}>
                        Brutna länkar skadar användarupplevelse och SEO.
                      </p>
                      <div style={{
                        background: '#fee2e2',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#991b1b',
                        fontWeight: '500'
                      }}>
                        Kontrollera och uppdatera alla brutna länkar
                      </div>
                    </div>
                  )}

                  {issues.missingTitle.length > 0 && (
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <FileText size={16} style={{ color: '#ef4444' }} />
                        <span style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          Saknar titel ({issues.missingTitle.length})
                        </span>
                      </div>
                      <p style={{
                        color: '#475569',
                        fontSize: '13px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4'
                      }}>
                        Title-taggar är kritiska för SEO och användarupplevelse.
                      </p>
                      <div style={{
                        background: '#fee2e2',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#991b1b',
                        fontWeight: '500'
                      }}>
                        Lägg till unika, beskrivande titlar
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medium Issues */}
            {mediumCount > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #fefbf2 0%, #fed7aa 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AlertTriangle size={20} style={{ color: 'white' }} />
                  </div>
                  <h3 style={{
                    color: '#d97706',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Viktiga problem ({mediumCount})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {issues.missingMeta.length > 0 && (
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <FileCode size={16} style={{ color: '#f59e0b' }} />
                        <span style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          Saknar meta description ({issues.missingMeta.length})
                        </span>
                      </div>
                      <p style={{
                        color: '#475569',
                        fontSize: '13px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4'
                      }}>
                        Meta descriptions förbättrar klickfrekvens i sökresultat.
                      </p>
                      <div style={{
                        background: '#fef3c7',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#92400e',
                        fontWeight: '500'
                      }}>
                        Skriv unika beskrivningar (150-160 tecken)
                      </div>
                    </div>
                  )}

                  {issues.missingH1.length > 0 && (
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <FileText size={16} style={{ color: '#f59e0b' }} />
                        <span style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          Saknar H1 ({issues.missingH1.length})
                        </span>
                      </div>
                      <p style={{
                        color: '#475569',
                        fontSize: '13px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4'
                      }}>
                        H1-taggar hjälper sökmotorer förstå sidans huvudämne.
                      </p>
                      <div style={{
                        background: '#fef3c7',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#92400e',
                        fontWeight: '500'
                      }}>
                        Lägg till en tydlig H1-tagg per sida
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Low Issues */}
            {lowCount > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '2px solid #64748b',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AlertCircle size={20} style={{ color: 'white' }} />
                  </div>
                  <h3 style={{
                    color: '#475569',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Mindre problem ({lowCount})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {issues.imagesWithoutAlt.length > 0 && (
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <Image size={16} style={{ color: '#64748b' }} />
                        <span style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          Bilder utan alt-text ({issues.imagesWithoutAlt.length})
                        </span>
                      </div>
                      <p style={{
                        color: '#475569',
                        fontSize: '13px',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4'
                      }}>
                        Alt-text förbättrar tillgänglighet och SEO.
                      </p>
                      <div style={{
                        background: '#f1f5f9',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#334155',
                        fontWeight: '500'
                      }}>
                        Lägg till beskrivande alt-text för alla bilder
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

// Helper function for RUM status
function getRumStatus(value, metric) {
  if (!value) return 'unknown';

  switch(metric) {
    case 'lcp':
      if (value <= 2500) return 'good';
      if (value <= 4000) return 'needs-improvement';
      return 'poor';
    case 'cls':
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'needs-improvement';
      return 'poor';
    case 'inp':
      if (value <= 200) return 'good';
      if (value <= 500) return 'needs-improvement';
      return 'poor';
    default:
      return 'unknown';
  }
}