'use client';

import React, { useState, useEffect } from 'react';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [settings, setSettings] = useState({
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setShowBanner(true);
      } else if (consent === 'custom') {
        const customSettings = JSON.parse(localStorage.getItem('customCookieSettings') || '{}');
        setSettings({
          analytics: customSettings.analytics || false,
          marketing: customSettings.marketing || false
        });
        // Load scripts based on saved consent
        loadConsentBasedScripts(customSettings);
      } else if (consent === 'all') {
        setSettings({ analytics: true, marketing: true });
        // Load scripts for all consent
        loadConsentBasedScripts('all');
      }

      // Listen for event from footer
      const handleOpenSettings = () => {
        setShowModal(true);
      };

      window.addEventListener('openCookieSettings', handleOpenSettings);

      return () => {
        window.removeEventListener('openCookieSettings', handleOpenSettings);
      };
    }
  }, []);

  const acceptAllCookies = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', 'all');
      setShowBanner(false);
      loadConsentBasedScripts('all');
    }
  };

  const rejectCookies = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookieConsent', 'necessary');
      setShowBanner(false);
    }
  };

  const saveCustomSettings = () => {
    if (typeof window !== 'undefined') {
      const customSettings = {
        necessary: true,
        analytics: settings.analytics,
        marketing: settings.marketing
      };
      
      localStorage.setItem('cookieConsent', 'custom');
      localStorage.setItem('customCookieSettings', JSON.stringify(customSettings));
      
      setShowModal(false);
      setShowBanner(false);
      loadConsentBasedScripts(customSettings);
    }
  };

  const loadConsentBasedScripts = (consent) => {
    if (typeof window !== 'undefined') {
      if (consent === 'all' || (typeof consent === 'object' && consent.analytics)) {
        // Load Google Analytics
        if (window.gtag) {
          window.gtag('consent', 'update', {
            'analytics_storage': 'granted'
          });
        }

        // Load Argus Metrics (check if not already loaded)
        if (!document.querySelector('script[data-tracking-code="21hqebzv"]')) {
          const argusScript = document.createElement('script');
          argusScript.src = 'https://argusmetrics.io/static/tracker.min.js';
          argusScript.setAttribute('data-tracking-code', '21hqebzv');
          argusScript.defer = true;
          document.head.appendChild(argusScript);
        }
      }

      if (consent === 'all' || (typeof consent === 'object' && consent.marketing)) {
        // Load marketing pixels
        if (window.fbq) {
          window.fbq('consent', 'grant');
        }
      }
    }
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div className="cookie-banner">
          <div className="cookie-banner-content">
            <div className="cookie-banner-inner">
              <div className="cookie-banner-text">
                <div className="cookie-icon">🍪</div>
                <div>
                  <h3>Vi använder cookies</h3>
                  <p>
                    Vi använder cookies för att förbättra din upplevelse, visa relevant innehåll och analysera trafiken.
                    <a href="/integritetspolicy" target="_blank" rel="noopener noreferrer">
                      Läs mer i vår integritetspolicy
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="cookie-banner-buttons">
                <button 
                  onClick={() => setShowModal(true)}
                  className="cookie-btn cookie-btn-secondary"
                >
                  Anpassa
                </button>
                <button 
                  onClick={rejectCookies}
                  className="cookie-btn cookie-btn-reject"
                >
                  Avvisa icke-nödvändiga
                </button>
                <button 
                  onClick={acceptAllCookies}
                  className="cookie-btn cookie-btn-primary"
                >
                  Acceptera alla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {showModal && (
        <div className="cookie-modal">
          <div className="cookie-modal-backdrop" onClick={() => setShowModal(false)}></div>
          <div className="cookie-modal-content">
            <div className="cookie-modal-header">
              <h3>Cookieinställningar</h3>
              <button onClick={() => setShowModal(false)} className="cookie-modal-close">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="cookie-settings">
              {/* Necessary Cookies */}
              <div className="cookie-setting cookie-setting-disabled">
                <div className="cookie-setting-info">
                  <h4>Nödvändiga cookies</h4>
                  <p>Krävs för att webbplatsen ska fungera. Kan inte avaktiveras.</p>
                </div>
                <div className="cookie-toggle cookie-toggle-disabled">
                  <div className="cookie-toggle-slider"></div>
                </div>
              </div>
              
              {/* Analytics Cookies */}
              <div className="cookie-setting">
                <div className="cookie-setting-info">
                  <h4>Analys & prestanda</h4>
                  <p>Hjälper oss förstå hur besökare använder webbplatsen. Vi använder Argus Metrics för att analysera trafik och användarbeteende.</p>
                </div>
                <label className="cookie-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.analytics}
                    onChange={(e) => setSettings({...settings, analytics: e.target.checked})}
                  />
                  <div className="cookie-toggle-slider"></div>
                </label>
              </div>
              
              {/* Marketing Cookies */}
              <div className="cookie-setting">
                <div className="cookie-setting-info">
                  <h4>Marknadsföring</h4>
                  <p>Används för att visa relevant reklam och mäta kampanjeffektivitet.</p>
                </div>
                <label className="cookie-toggle">
                  <input 
                    type="checkbox" 
                    checked={settings.marketing}
                    onChange={(e) => setSettings({...settings, marketing: e.target.checked})}
                  />
                  <div className="cookie-toggle-slider"></div>
                </label>
              </div>
            </div>
            
            <div className="cookie-modal-footer">
              <button 
                onClick={saveCustomSettings}
                className="cookie-btn cookie-btn-primary"
              >
                Spara inställningar
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="cookie-btn cookie-btn-secondary"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;