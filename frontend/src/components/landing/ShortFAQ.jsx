'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function ShortFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Är det verkligen gratis?',
      answer: 'Ja, 100%. Ingen registrering, inga dolda kostnader. Kör hur många analyser du vill.'
    },
    {
      question: 'Hur lång tid tar en analys?',
      answer: '30-60 sekunder beroende på vilken analys du väljer. AI-rapporten tar längst tid eftersom den kör flera analyser.'
    },
    {
      question: 'Vad är LIX?',
      answer: 'LIX (Läsbarhetsindex) mäter hur lätt en text är att läsa. Vi är enda SEO-verktyget som analyserar svenska texter med LIX.'
    },
    {
      question: 'Sparas min data?',
      answer: 'Analysresultat sparas i 90 dagar så att du kan dela rapporten. Vi säljer aldrig din data.'
    },
    {
      question: 'Kan jag exportera rapporten?',
      answer: 'Ja, du kan ladda ner som PDF eller dela via en unik länk som fungerar i 90 dagar.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="short-faq">
      <div className="section-container">
        <h2 className="section-title">Vanliga frågor</h2>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp size={20} className="faq-icon" />
                ) : (
                  <ChevronDown size={20} className="faq-icon" />
                )}
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-more">
          <Link href="/faq" className="faq-more-link">
            Se alla vanliga frågor
          </Link>
        </div>
      </div>
    </section>
  );
}
