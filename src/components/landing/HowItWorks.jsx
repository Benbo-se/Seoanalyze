'use client';

import { Globe, Clock, FileText } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Globe,
      number: '1',
      title: 'Skriv din URL',
      description: 'Ingen registrering krävs. Bara din webbplatsadress.'
    },
    {
      icon: Clock,
      number: '2',
      title: 'Vänta 30-60 sekunder',
      description: 'Vi kör AI-analys, GDPR-kontroll och säkerhetstest.'
    },
    {
      icon: FileText,
      number: '3',
      title: 'Få din rapport',
      description: 'Prioriterad åtgärdslista med konkreta lösningar.'
    }
  ];

  return (
    <section className="how-it-works">
      <div className="section-container">
        <h2 className="section-title">Hur det fungerar</h2>

        <div className="steps-grid">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div key={step.number} className="step-card">
                <div className="step-number">{step.number}</div>
                <div className="step-icon">
                  <IconComponent size={32} />
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
