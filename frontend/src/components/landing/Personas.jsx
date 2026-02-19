'use client';

import { Briefcase, Code, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Personas() {
  const personas = [
    {
      icon: Briefcase,
      title: 'Småföretagare',
      quote: 'Jag vill veta om min hemsida funkar på Google utan att anlita en konsult',
      recommendation: 'AI-Rapport',
      href: '/#hero'
    },
    {
      icon: Code,
      title: 'Webbutvecklare',
      quote: 'Jag behöver snabbkolla kundprojekt innan leverans',
      recommendation: 'SEO + GDPR',
      href: '/#hero'
    },
    {
      icon: TrendingUp,
      title: 'Marknadsförare',
      quote: 'Jag behöver förstå vår SEO utan tekniskt snack',
      recommendation: 'AI-Rapport',
      href: '/#hero'
    },
    {
      icon: ShieldCheck,
      title: 'IT-ansvarig',
      quote: 'Jag måste verifiera att vi följer GDPR och säkerhetskrav',
      recommendation: 'GDPR + Säkerhet',
      href: '/#hero'
    }
  ];

  return (
    <section className="personas-section">
      <div className="section-container">
        <h2 className="section-title">Passar det mig?</h2>

        <div className="personas-grid">
          {personas.map((persona, index) => {
            const IconComponent = persona.icon;
            return (
              <div key={index} className="persona-card">
                <div className="persona-header">
                  <IconComponent size={24} className="persona-icon" />
                  <h3 className="persona-title">{persona.title}</h3>
                </div>
                <blockquote className="persona-quote">
                  "{persona.quote}"
                </blockquote>
                <a href={persona.href} className="persona-cta">
                  <ArrowRight size={16} />
                  <span>{persona.recommendation}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
