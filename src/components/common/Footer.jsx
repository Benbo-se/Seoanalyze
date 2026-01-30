'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('openCookieSettings'));
    }
  };

  const footerLinks = {
    verktyg: [
      { label: "AI-Rapport", href: "/#hero" },
      { label: "GDPR-analys", href: "/#hero" },
      { label: "Säkerhetsanalys", href: "/#hero" },
      { label: "SEO-analys", href: "/#hero" },
      { label: "Crawl", href: "/#hero" },
      { label: "Lighthouse", href: "/#hero" }
    ],
    företag: [
      { label: "Om oss", href: "/om-oss" },
      { label: "Kontakt", href: "/kontakt" },
      { label: "Blogg", href: "/blogg" },
      { label: "FAQ", href: "/faq" }
    ],
    juridiskt: [
      { label: "Integritetspolicy", href: "/integritetspolicy" },
      { label: "Cookies", href: "/integritetspolicy#cookies" }
    ]
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/SEOanalyzerLogo.png"
                alt="SEOanalyze.se"
                width={150}
                height={38}
                className="h-8 w-auto rounded-lg"
              />
            </div>
            <p className="text-sm text-background/60 mb-4">
              Svenska SEO-verktyg för svenska företag. GDPR-kompatibelt med data lagrad i Sverige.
            </p>
            <a
              href="https://benbo.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-background/40 hover:text-background/60 transition-colors"
            >
              benbo.se
            </a>
          </div>

          {/* Verktyg */}
          <div>
            <h4 className="font-semibold text-background mb-4">Verktyg</h4>
            <ul className="space-y-2">
              {footerLinks.verktyg.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Företag */}
          <div>
            <h4 className="font-semibold text-background mb-4">Företag</h4>
            <ul className="space-y-2">
              {footerLinks.företag.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Juridiskt */}
          <div>
            <h4 className="font-semibold text-background mb-4">Juridiskt</h4>
            <ul className="space-y-2">
              {footerLinks.juridiskt.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {showCookieSettings && (
                <li>
                  <button
                    onClick={openCookieSettings}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    Cookie-inställningar
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/40">
            © {new Date().getFullYear()} SEOanalyze.se. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-background/40 flex items-center gap-1">
              <span>Byggt i Sverige</span>
            </span>
            <span className="text-xs text-background/40 flex items-center gap-1">
              <span>GDPR</span>
            </span>
            <span className="text-xs text-background/40 flex items-center gap-1">
              <span>100% Gratis</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
