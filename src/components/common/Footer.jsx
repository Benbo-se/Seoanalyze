'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const Footer = () => {
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookieConsent');
      if (consent) {
        setShowCookieSettings(true);
      }
    }
  }, []);

  const openCookieSettings = () => {
    // Dispatch custom event to open cookie modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('openCookieSettings'));
    }
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:redaekengren@protonmail.com';
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <h3>Powered by Benbo</h3>
        <p>Professionell SEO-analys utvecklad av Benbo IT-konsulting</p>
        <div className="footer-links">
          <a href="https://benbo.se" target="_blank" rel="noopener noreferrer">
            Benbo.se
          </a>
          <span className="footer-divider">•</span>
          <Link href="/integritetspolicy">
            Integritetspolicy
          </Link>
          <span className="footer-divider">•</span>
          <a href="#" onClick={handleContactClick}>
            Kontakt
          </a>
          {showCookieSettings && (
            <>
              <span className="footer-divider">•</span>
              <button 
                onClick={openCookieSettings}
                className="cookie-settings-link"
              >
                Ändra cookieinställningar
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;