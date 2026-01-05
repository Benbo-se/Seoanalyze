'use client';

import { Flag, CreditCard, Shield, Zap, Code, Bot } from 'lucide-react';

export default function UniqueAdvantages() {
  const advantages = [
    {
      icon: Flag,
      title: 'Svensk LIX-analys',
      description: 'Enda verktyget med svensk läsbarhetsanalys. Optimera texter för din målgrupp.'
    },
    {
      icon: CreditCard,
      title: '100% gratis',
      description: 'Ingen registrering, inga dolda kostnader. Kör obegränsat antal analyser.'
    },
    {
      icon: Shield,
      title: 'GDPR-expertis',
      description: 'TCF v2-detektion och iframe-analys som ingen annan har. Byggd för europeisk compliance.'
    },
    {
      icon: Zap,
      title: 'Snabbt resultat',
      description: 'Komplett rapport på 30-60 sekunder. Ingen väntan, inga köer.'
    },
    {
      icon: Code,
      title: 'Färdig kod',
      description: 'Kopiera och klistra lösningar direkt. Ingen teknisk kunskap krävs.'
    },
    {
      icon: Bot,
      title: 'AI-rapport',
      description: 'Prioriterad handlingsplan på svenska. AI förklarar problemen i klartext.'
    }
  ];

  return (
    <section className="unique-advantages">
      <div className="section-container">
        <h2 className="section-title">Därför väljer du oss</h2>

        <div className="advantages-grid">
          {advantages.map((advantage, index) => {
            const IconComponent = advantage.icon;
            return (
              <div key={index} className="advantage-card">
                <div className="advantage-icon">
                  <IconComponent size={24} />
                </div>
                <h3 className="advantage-title">{advantage.title}</h3>
                <p className="advantage-description">{advantage.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
