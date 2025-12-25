'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faArrowRight } from '@/lib/icons';

// Dynamic imports för bättre kod-delning
const loadPushNotifications = () => import('@/utils/pushNotifications');

const HeroSection = () => {
  const [activeTab, setActiveTab] = useState('seo');
  const [url, setUrl] = useState('');
  const [crawlPages, setCrawlPages] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false
  });

  // Lazy load notification status after component mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const { getPushNotificationStatus } = await loadPushNotifications();
        const status = await getPushNotificationStatus();
        setNotificationStatus(status);
      } catch (error) {
        console.log('Push notifications not available');
      }
    };
    
    // Defer this check to reduce initial JavaScript execution
    const timeoutId = setTimeout(checkNotificationStatus, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  // Function to automatically add https:// if protocol is missing
  const normalizeUrl = (inputUrl) => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return '';

    // If it already has a protocol, keep it as is
    if (trimmed.match(/^https?:\/\//i)) {
      return trimmed;
    }

    // If it starts with www. or looks like a domain, add https://
    if (trimmed.match(/^(www\.)?[a-z0-9.-]+\.[a-z]{2,}$/i)) {
      return `https://${trimmed}`;
    }

    // For other cases, also default to https://
    return `https://${trimmed}`;
  };

  const handleAnalyze = async () => {
    if (!url || url.trim() === '') return;

    setLoading(true);
    setError(null);

    // Normalize URL with auto-https
    const normalizedUrl = normalizeUrl(url);

    // Basic validation of normalized URL
    if (!normalizedUrl || normalizedUrl === 'https://') {
      setError('Ange en giltig webbplatsadress');
      setLoading(false);
      return;
    }

    try {
      const analysisData = {
        url: normalizedUrl,
        type: activeTab,
        maxPages: activeTab === 'crawl' ? crawlPages : undefined,
      };

      // Lazy load push notification logic only when needed
      if (!navigator.onLine) {
        try {
          const { queueAnalysisForBackgroundSync } = await loadPushNotifications();
          if ('serviceWorker' in navigator) {
            const analysisId = await queueAnalysisForBackgroundSync(analysisData);
            if (analysisId) {
              setError('Du är offline. Analysen kommer att köras när du kommer online igen.');
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('Offline sync not available');
        }
      }

      // Try to handle push notifications asynchronously (non-blocking)
      if (notificationStatus.supported && !notificationStatus.subscribed) {
        loadPushNotifications().then(async ({ subscribeToPushNotifications, getPushNotificationStatus }) => {
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.ready;
              await subscribeToPushNotifications(registration);
              const newStatus = await getPushNotificationStatus();
              setNotificationStatus(newStatus);
            } catch (error) {
              console.log('Push notification subscription failed');
            }
          }
        }).catch(() => {
          console.log('Push notifications not available');
        });
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Redirect to analysis page
      if (data.jobId) {
        window.location.href = `/analys/${data.jobId}`;
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  const getHeroContent = () => {
    switch (activeTab) {
      case 'seo':
        return {
          title: 'Analysverktyget som hjälper dig förstå och förbättra din webbplats',
          description: 'Vårt verktyg analyserar din webbplats i minsta detalj. Med ett enkelt klick får du en komplett översikt av sidans SEO, prestanda och mobilvänlighet. Allt körs lokalt - snabbt, säkert och oberoende.',
          buttonText: 'Analysera nu',
          tabs: [
            { id: 'seo', label: 'SEO', sublabel: 'Grundläggande SEO', description: 'Snabb analys av en sida', active: true },
            { id: 'crawl', label: 'CRAWL', sublabel: 'Hela webbplatsen', description: 'Crawla upp till 100 sidor', active: false },
            { id: 'lighthouse', label: 'PERF', sublabel: 'Prestanda & Core Web Vitals', description: 'Google Lighthouse-analys', active: false }
          ]
        };
      case 'crawl':
        return {
          title: 'Analysverktyget som hjälper dig förstå och förbättra din webbplats',
          description: 'Vårt verktyg analyserar din webbplats i minsta detalj. Med ett enkelt klick får du en komplett översikt av sidans SEO, prestanda och mobilvänlighet. Allt körs lokalt - snabbt, säkert och oberoende.',
          buttonText: 'Analysera nu',
          tabs: [
            { id: 'seo', label: 'SEO', sublabel: 'Grundläggande SEO', description: 'Snabb analys av en sida', active: false },
            { id: 'crawl', label: 'CRAWL', sublabel: 'Hela webbplatsen', description: 'Crawla upp till 100 sidor', active: true },
            { id: 'lighthouse', label: 'PERF', sublabel: 'Prestanda & Core Web Vitals', description: 'Google Lighthouse-analys', active: false }
          ]
        };
      case 'lighthouse':
        return {
          title: 'Analysverktyget som hjälper dig förstå och förbättra din webbplats',
          description: 'Vårt verktyg analyserar din webbplats i minsta detalj. Med ett enkelt klick får du en komplett översikt av sidans SEO, prestanda och mobilvänlighet. Allt körs lokalt - snabbt, säkert och oberoende.',
          buttonText: 'Analysera nu',
          tabs: [
            { id: 'seo', label: 'SEO', sublabel: 'Grundläggande SEO', description: 'Snabb analys av en sida', active: false },
            { id: 'crawl', label: 'CRAWL', sublabel: 'Hela webbplatsen', description: 'Crawla upp till 100 sidor', active: false },
            { id: 'lighthouse', label: 'PERF', sublabel: 'Prestanda & Core Web Vitals', description: 'Google Lighthouse-analys', active: true }
          ]
        };
      default:
        return getHeroContent().seo;
    }
  };

  const content = getHeroContent();

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-subtitle">Fixa din SEO – utan krångel</div>
        <h1>Analysera din webbplats på djupet – helt gratis</h1>
        <p className="hero-description">
          SEO-verktyg som hittar brutna länkar, prestandaproblem och tekniska fel på hela sajten. Inkluderar LIX-analys för svenska texter och färdig kod för att fixa problemen.
        </p>

        <div className="hero-tool-card">
          {/* AI Analysis CTA - Premium Option */}
          <a href="/ai-analys" className="ai-analysis-cta-compact">
            <FontAwesomeIcon icon={faRobot} />
            <div className="ai-cta-text-compact">
              <span className="ai-cta-title-compact">AI-Analys - Professionell Rapport</span>
              <span className="ai-cta-subtitle-compact">Konkurrentjämförelse • Handlingsplan • Beta</span>
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="ai-cta-arrow" />
          </a>

          <div className="ai-analysis-separator-compact">
            <span>eller välj snabbanalys</span>
          </div>

          <div className="analysis-type-selector">
            {content.tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (setActiveTab) {
                    setActiveTab(tab.id);
                  }
                }}
                className={`type-btn ${tab.active ? 'active' : ''}`}
              >
                <span className="type-icon">{tab.label}</span>
                <span className="type-title">{tab.description}</span>
              </button>
            ))}
          </div>

          <p style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '12px', textAlign: 'center' }}>
            Skriv bara din webbplatsadress (https:// läggs till automatiskt)
          </p>

          <form className="url-form" onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}>
            <div className="input-group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="www.dinwebbplats.se"
                className="url-input"
                pattern="^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$"
                title="Ange en giltig webbplatsadress, t.ex. exempel.se eller www.exempel.se"
                required
              />
              
              {activeTab === 'crawl' && (
                <div className="crawl-pages-container">
                  <label className="crawl-pages-label">Antal sidor att crawla:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={crawlPages || 10}
                    onChange={(e) => setCrawlPages(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="crawl-pages-input"
                  />
                  <span className="crawl-pages-suffix">sidor</span>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !url}
                className="analyze-btn"
              >
                {loading ? 'Analyserar...' : content.buttonText}
              </button>
            </div>
          </form>

          <p style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '12px', textAlign: 'center' }}>
            Ingen registrering krävs • Gratis under beta • Fungerar direkt i webbläsaren
          </p>

          {error && (
            <div className="error-message">
              Analysis failed. Please try again.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;