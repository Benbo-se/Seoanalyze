'use client';

import Link from 'next/link';
import { useState } from 'react';
import Header from '@/components/common/Header';
import { ChevronDown } from 'lucide-react';
import Script from 'next/script';

const faqs = [
  {
    category: "Allmänt",
    questions: [
      {
        q: "Vad är SEO Analyze?",
        a: "SEO Analyze är ett gratis verktyg för att analysera din webbplats sökmotoroptimering (SEO). Vi kontrollerar tekniska faktorer, innehåll, prestanda och tillgänglighet för att hjälpa dig förbättra din ranking i sökmotorer som Google."
      },
      {
        q: "Kostar det något att använda SEO Analyze?",
        a: "Nej, våra grundläggande SEO-analyser är helt gratis. Du behöver inte registrera dig eller skapa något konto för att använda tjänsten."
      },
      {
        q: "Hur ofta bör jag analysera min webbplats?",
        a: "Vi rekommenderar att du kör en analys minst en gång i månaden, eller efter varje större uppdatering av din webbplats. Detta hjälper dig att upptäcka och åtgärda problem innan de påverkar din ranking."
      },
      {
        q: "Sparar ni mina analysresultat?",
        a: "Analysresultat sparas tillfälligt för att du ska kunna dela dem via unika länkar. Vi säljer aldrig din data till tredje part. Läs mer i vår integritetspolicy."
      }
    ]
  },
  {
    category: "SEO-analys",
    questions: [
      {
        q: "Vad kontrollerar SEO-analysen?",
        a: "Vår SEO-analys kontrollerar över 50 faktorer inklusive: meta-taggar (title, description), rubrikstruktur (H1-H6), bildoptimering (alt-texter, storlek), interna och externa länkar, mobilanpassning, laddningstider, schema.org-markup och mycket mer."
      },
      {
        q: "Vad betyder de olika poängen?",
        a: "Poängen 0-100 visar hur väl din webbplats uppfyller SEO-standarder. 90-100 är utmärkt, 70-89 är bra, 50-69 behöver förbättras, och under 50 indikerar allvarliga problem som bör åtgärdas omgående."
      },
      {
        q: "Varför skiljer sig resultaten från andra verktyg?",
        a: "Olika SEO-verktyg använder olika algoritmer och viktningar. Vårt verktyg fokuserar på de faktorer som Google själva har bekräftat är viktiga, samt beprövade best practices för svenska webbplatser."
      },
      {
        q: "Vad är LIX och varför mäter ni det?",
        a: "LIX (Läsbarhetsindex) är ett svenskt mått på textens läsbarhet. Ett LIX under 40 är lättläst, 40-50 är medelsvårt, och över 50 är svårläst. Google föredrar innehåll som är lätt att förstå för din målgrupp."
      }
    ]
  },
  {
    category: "Lighthouse-analys",
    questions: [
      {
        q: "Vad är Lighthouse?",
        a: "Lighthouse är Googles officiella verktyg för att mäta webbsidors kvalitet. Vi använder det för att ge dig samma insikter som Google har när de utvärderar din webbplats."
      },
      {
        q: "Vad är Core Web Vitals?",
        a: "Core Web Vitals är Googles tre viktigaste prestandamått: LCP (Largest Contentful Paint) mäter laddningstid, FID/INP mäter interaktivitet, och CLS (Cumulative Layout Shift) mäter visuell stabilitet. Dessa påverkar direkt din Google-ranking."
      },
      {
        q: "Varför är min prestanda-poäng låg?",
        a: "Vanliga orsaker är: stora bilder som inte är optimerade, för mycket JavaScript, långsam server, saknad caching, eller tredjepartsscript som Google Analytics och sociala medier-knappar. Vår rapport visar exakt vad som behöver åtgärdas."
      },
      {
        q: "Hur förbättrar jag min laddningstid?",
        a: "De viktigaste åtgärderna är: komprimera och konvertera bilder till WebP-format, aktivera webbläsarcaching, minifiera CSS och JavaScript, använd lazy loading för bilder, och överväg ett CDN för statiska resurser."
      }
    ]
  },
  {
    category: "Crawling",
    questions: [
      {
        q: "Vad är crawling?",
        a: "Crawling innebär att vi systematiskt besöker alla sidor på din webbplats, precis som Googles sökrobotar gör. Detta ger oss en komplett bild av din webbplats struktur och eventuella problem."
      },
      {
        q: "Hur många sidor kan ni crawla?",
        a: "Vi crawlar upp till 100 sidor per analys för att ge en representativ bild av din webbplats. För större webbplatser fokuserar vi på de viktigaste sidorna baserat på intern länkstruktur."
      },
      {
        q: "Varför hittar ni inte alla mina sidor?",
        a: "Om sidor saknas kan det bero på: de är inte länkade från andra sidor, de är blockerade i robots.txt, de kräver inloggning, eller de genereras dynamiskt med JavaScript utan server-side rendering."
      },
      {
        q: "Påverkar er crawling min webbplats prestanda?",
        a: "Nej, vi crawlar med respekt för din server och begränsar antalet förfrågningar. Vi följer också robots.txt-regler och crawl-delay om sådana finns."
      }
    ]
  },
  {
    category: "AI-analys",
    questions: [
      {
        q: "Vad är AI-analysen?",
        a: "Vår AI-analys använder avancerad artificiell intelligens för att ge dig personliga rekommendationer baserat på din specifika webbplats och bransch. AI:n prioriterar åtgärder efter förväntad effekt och svårighetsgrad."
      },
      {
        q: "Hur fungerar konkurrentjämförelsen?",
        a: "Vi identifierar automatiskt dina tre närmaste SEO-konkurrenter baserat på din webbplats innehåll och målgrupp. Sedan jämför vi nyckeltal som antal sidor, ordantal, laddningstider och teknisk SEO för att visa var du kan förbättra dig."
      },
      {
        q: "Kan jag lita på AI-rekommendationerna?",
        a: "Vår AI är tränad på tusentals webbplatser och följer Googles officiella riktlinjer. Rekommendationerna är baserade på faktiska data från din webbplats, inte generiska tips. Vi förklarar alltid varför en åtgärd rekommenderas."
      }
    ]
  },
  {
    category: "Tekniska frågor",
    questions: [
      {
        q: "Fungerar analysen för alla webbplatser?",
        a: "Vi kan analysera de flesta publika webbplatser. Undantag är: sidor bakom inloggning, webbplatser som blockerar våra servrar, och sidor med mycket aggressiv bot-skydd. Kontakta oss om du har problem."
      },
      {
        q: "Stödjer ni JavaScript-tunga webbplatser (SPA)?",
        a: "Ja, vi använder en riktig webbläsare (Chromium) för att rendera JavaScript-innehåll. Detta ger samma resultat som Google ser när de indexerar din webbplats."
      },
      {
        q: "Varför tar analysen så lång tid?",
        a: "En fullständig analys tar 30-90 sekunder beroende på webbplatsens storlek. Vi kör många tester parallellt: SEO-kontroller, Lighthouse-analys, crawling och AI-analys. Resultatet är värt väntan!"
      },
      {
        q: "Kan jag exportera mina resultat?",
        a: "Ja, du kan ladda ner en PDF-rapport med alla resultat. Du kan också dela dina resultat via en unik länk som är giltig i 30 dagar."
      }
    ]
  },
  {
    category: "Förbättringar och support",
    questions: [
      {
        q: "Hur tolkar jag resultaten?",
        a: "Varje problem i rapporten har en prioritetsnivå (kritisk, viktig, låg) och en förklaring av varför det är viktigt. Vi ger också konkreta förslag på hur du åtgärdar problemet, ofta med kodexempel."
      },
      {
        q: "Kan ni hjälpa mig åtgärda problemen?",
        a: "Vi erbjuder konsulttjänster via Benbo IT-konsulting för dig som vill ha hjälp med implementering. Kontakta oss på reda@benbo.se för en offert."
      },
      {
        q: "Jag hittade en bugg, hur rapporterar jag den?",
        a: "Vi uppskattar all feedback! Skicka en beskrivning av problemet till reda@benbo.se så tittar vi på det så snart som möjligt."
      },
      {
        q: "Kan jag föreslå nya funktioner?",
        a: "Absolut! Vi utvecklar ständigt nya funktioner baserat på användarfeedback. Skicka dina idéer till reda@benbo.se."
      }
    ]
  }
];

// Generate FAQPage schema for rich snippets
const generateFaqSchema = () => {
  const allQuestions = faqs.flatMap(category =>
    category.questions.map(q => ({
      "@type": "Question",
      "name": q.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.a
      }
    }))
  );

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allQuestions
  };
};

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-800 pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <p className="p-4 text-gray-600 leading-relaxed bg-white">
          {answer}
        </p>
      </div>
    </div>
  );
}

function CategoryAccordion({ category, questions, openItems, toggleItem, categoryIndex }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
        {category}
      </h2>
      <div>
        {questions.map((faq, faqIndex) => {
          const itemKey = `${categoryIndex}-${faqIndex}`;
          return (
            <AccordionItem
              key={itemKey}
              question={faq.q}
              answer={faq.a}
              isOpen={openItems.has(itemKey)}
              onToggle={() => toggleItem(itemKey)}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (key) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allKeys = faqs.flatMap((cat, catIdx) =>
      cat.questions.map((_, qIdx) => `${catIdx}-${qIdx}`)
    );
    setOpenItems(new Set(allKeys));
  };

  const collapseAll = () => {
    setOpenItems(new Set());
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFaqSchema()) }}
      />
      <Header />
      <div className="container mx-auto px-4 pb-8 max-w-4xl pt-24">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Vanliga frågor (FAQ)</h1>
            <p className="text-gray-600">
              Här hittar du svar på de vanligaste frågorna om SEO Analyze och sökmotoroptimering.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Expandera alla
            </button>
            <button
              onClick={collapseAll}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Stäng alla
            </button>
          </div>
        </div>

        {faqs.map((category, categoryIndex) => (
          <CategoryAccordion
            key={categoryIndex}
            category={category.category}
            questions={category.questions}
            openItems={openItems}
            toggleItem={toggleItem}
            categoryIndex={categoryIndex}
          />
        ))}

        <section className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Hittade du inte svaret du sökte?
          </h2>
          <p className="text-gray-600 mb-4">
            Kontakta oss så hjälper vi dig! Du kan också prova vår AI-chattbot för snabba svar.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/kontakt"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kontakta oss
            </Link>
            <Link
              href="/bot"
              className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fråga AI-chattboten
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
