'use client';

import { Bot, Shield, Lock, CheckCircle } from 'lucide-react';

export default function FeatureCards() {
  const mainFeature = {
    icon: Bot,
    title: 'AI-Rapport',
    description: 'Komplett analys som kombinerar SEO, GDPR och säkerhet. Du får en prioriterad handlingsplan med uppskattad tid per åtgärd.',
    features: [
      'SEO-analys med LIX',
      'GDPR cookie-scan',
      'Konkreta kodförslag',
      'Säkerhetskontroll',
      'Lighthouse-poäng',
      'PDF-export'
    ],
    cta: 'Kör AI-Rapport',
    href: '/#hero'
  };

  const secondaryFeatures = [
    {
      icon: Shield,
      title: 'GDPR-analys',
      features: [
        'Cookie-detektion',
        'Consent-banner kontroll',
        'TCF v2-detektion',
        'Tracking-scripts'
      ],
      cta: 'Kör GDPR-analys',
      href: '/#hero'
    },
    {
      icon: Lock,
      title: 'Säkerhetsanalys',
      features: [
        'SSL-certifikat',
        'Security headers',
        'Exponerade filer',
        'Sårbara bibliotek'
      ],
      cta: 'Kör Säkerhetsanalys',
      href: '/#hero'
    }
  ];

  const MainIcon = mainFeature.icon;

  return (
    <section className="feature-cards-section">
      <div className="section-container">
        <h2 className="section-title">Vad vi analyserar</h2>

        {/* Main Feature - AI Rapport */}
        <div className="main-feature-card">
          <div className="main-feature-header">
            <MainIcon size={32} className="main-feature-icon" />
            <h3 className="main-feature-title">{mainFeature.title}</h3>
          </div>
          <p className="main-feature-description">{mainFeature.description}</p>
          <div className="main-feature-list">
            {mainFeature.features.map((feature, index) => (
              <div key={index} className="feature-list-item">
                <CheckCircle size={16} className="feature-check-icon" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <a href={mainFeature.href} className="main-feature-cta">
            {mainFeature.cta}
          </a>
        </div>

        {/* Secondary Features */}
        <div className="secondary-features-grid">
          {secondaryFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="secondary-feature-card">
                <div className="secondary-feature-header">
                  <IconComponent size={24} className="secondary-feature-icon" />
                  <h3 className="secondary-feature-title">{feature.title}</h3>
                </div>
                <ul className="secondary-feature-list">
                  {feature.features.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <a href={feature.href} className="secondary-feature-cta">
                  {feature.cta}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
