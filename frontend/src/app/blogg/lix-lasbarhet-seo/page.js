import Link from 'next/link';
import Header from '@/components/common/Header';
import Script from 'next/script';

export const metadata = {
  title: "Vad är LIX och varför är det viktigt för SEO? | SEO Analyze",
  description: "LIX (Läsbarhetsindex) är ett svenskt mått på hur lättläst en text är. Lär dig hur läsbarhet påverkar din SEO och hur du optimerar dina texter.",
  robots: "index, follow",
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Vad är LIX och varför är det viktigt för SEO?",
  "description": "LIX (Läsbarhetsindex) är ett svenskt mått på hur lättläst en text är. Lär dig hur läsbarhet påverkar din SEO och hur du optimerar dina texter.",
  "image": "https://seoanalyze.se/og-image.png",
  "datePublished": "2026-01-03",
  "dateModified": "2026-01-03",
  "author": {
    "@type": "Organization",
    "name": "SEO Analyze",
    "url": "https://seoanalyze.se"
  },
  "publisher": {
    "@type": "Organization",
    "name": "SEO Analyze",
    "logo": {
      "@type": "ImageObject",
      "url": "https://seoanalyze.se/images/SEOanalyzerLogo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://seoanalyze.se/blogg/lix-lasbarhet-seo"
  }
};

export default function LixArtikel() {
  return (
    <>
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl pt-24">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/blogg" className="text-blue-600 hover:underline">Blogg</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">LIX och läsbarhet</span>
        </nav>

        <article>
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">SEO-grunderna</span>
              <span className="text-gray-500 text-xs">5 min läsning</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Vad är LIX och varför är det viktigt för SEO?
            </h1>
            <p className="text-gray-500 text-sm">
              Publicerad: 3 januari 2026 | Uppdaterad: 3 januari 2026
            </p>
          </header>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="lead text-xl text-gray-600 mb-6">
              LIX (Läsbarhetsindex) är ett svenskt mått på hur lättläst en text är. I denna guide
              förklarar vi vad LIX betyder, hur det beräknas och varför det är viktigt för din SEO.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Vad är LIX?</h2>
            <p className="mb-4">
              LIX utvecklades av den svenske pedagogen Carl-Hugo Björnsson på 1960-talet. Det är ett
              objektivt mått som beräknar hur svår en text är att läsa baserat på två faktorer:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Meningslängd</strong> - Längre meningar är svårare att följa</li>
              <li><strong>Ordlängd</strong> - Längre ord (över 6 bokstäver) är ofta mer komplexa</li>
            </ul>

            <div className="bg-gray-100 rounded-lg p-6 my-6">
              <h3 className="font-semibold text-gray-800 mb-2">LIX-formeln</h3>
              <code className="text-sm">LIX = (antal ord / antal meningar) + (långa ord × 100 / antal ord)</code>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">LIX-skalan</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">LIX-värde</th>
                    <th className="border p-3 text-left">Svårighetsgrad</th>
                    <th className="border p-3 text-left">Exempel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3">Under 25</td>
                    <td className="border p-3">Mycket lättläst</td>
                    <td className="border p-3">Barnböcker</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-3">25-30</td>
                    <td className="border p-3">Lättläst</td>
                    <td className="border p-3">Skönlitteratur, tidningar</td>
                  </tr>
                  <tr>
                    <td className="border p-3">30-40</td>
                    <td className="border p-3">Medelsvår</td>
                    <td className="border p-3">Normal sakprosa</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-3">40-50</td>
                    <td className="border p-3">Svår</td>
                    <td className="border p-3">Officiella texter</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Över 50</td>
                    <td className="border p-3">Mycket svår</td>
                    <td className="border p-3">Teknisk/akademisk text</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Varför är LIX viktigt för SEO?</h2>
            <p className="mb-4">
              Google vill ge användarna den bästa möjliga upplevelsen. Om din text är för svår att läsa
              kommer besökare att lämna sidan snabbt, vilket ökar din <strong>bounce rate</strong>.
              Detta signalerar till Google att din sida kanske inte är det bästa resultatet.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
              <p className="font-semibold text-blue-800">Rekommendation</p>
              <p className="text-blue-700">
                För webbinnehåll rekommenderar vi ett LIX-värde mellan 30-40. Det är tillgängligt
                för de flesta läsare samtidigt som det kan förmedla komplex information.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Så förbättrar du din LIX</h2>
            <ol className="list-decimal pl-6 mb-4 space-y-3">
              <li>
                <strong>Korta ner meningarna</strong> - Sikta på max 15-20 ord per mening.
                Dela upp långa meningar med punkt istället för kommatecken.
              </li>
              <li>
                <strong>Använd enklare ord</strong> - Byt ut &quot;implementera&quot; mot &quot;införa&quot;,
                &quot;applikation&quot; mot &quot;app&quot; eller &quot;program&quot;.
              </li>
              <li>
                <strong>Undvik facktermer</strong> - Om du måste använda dem, förklara vad de betyder.
              </li>
              <li>
                <strong>Läs högt</strong> - Om du behöver andas mitt i en mening är den för lång.
              </li>
              <li>
                <strong>Använd verktyg</strong> - SEO Analyze mäter automatiskt LIX för din webbplats.
              </li>
            </ol>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">LIX i SEO Analyze</h2>
            <p className="mb-4">
              Vårt verktyg är unikt i att det automatiskt beräknar LIX för alla textstycken på din
              webbplats. Du får:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Genomsnittligt LIX-värde för hela sidan</li>
              <li>Specifika rekommendationer för förbättring</li>
              <li>Jämförelse med konkurrenter (i AI-analysen)</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Testa din LIX nu</h2>
            <p className="mb-6 opacity-90">
              Kör en gratis SEO-analys och se hur lättläst din webbplats är.
            </p>
            <Link
              href="/"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Analysera min webbplats
            </Link>
          </div>

          {/* Navigation */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link href="/blogg" className="text-blue-600 hover:underline flex items-center">
              <span className="mr-2">&larr;</span> Tillbaka till bloggen
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
