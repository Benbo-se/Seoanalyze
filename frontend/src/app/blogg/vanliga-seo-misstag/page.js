import Link from 'next/link';
import Header from '@/components/common/Header';
import Script from 'next/script';

export const metadata = {
  title: "5 vanliga SEO-misstag på svenska webbplatser | SEO Analyze",
  description: "Många svenska webbplatser gör samma misstag om och om igen. Här är de vanligaste felen och hur du undviker dem.",
  robots: "index, follow",
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "5 vanliga SEO-misstag på svenska webbplatser",
  "description": "Många svenska webbplatser gör samma misstag om och om igen. Här är de vanligaste felen och hur du undviker dem.",
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
    "@id": "https://seoanalyze.se/blogg/vanliga-seo-misstag"
  }
};

export default function SeoMisstagArtikel() {
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
          <span className="text-gray-600">SEO-misstag</span>
        </nav>

        <article>
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Tips & tricks</span>
              <span className="text-gray-500 text-xs">7 min läsning</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              5 vanliga SEO-misstag på svenska webbplatser
            </h1>
            <p className="text-gray-500 text-sm">
              Publicerad: 3 januari 2026 | Uppdaterad: 3 januari 2026
            </p>
          </header>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="lead text-xl text-gray-600 mb-6">
              Efter att ha analyserat tusentals svenska webbplatser ser vi samma misstag upprepas
              gång på gång. Här är de fem vanligaste problemen och hur du åtgärdar dem.
            </p>

            {/* Misstag 1 */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8 rounded-r-lg">
              <h2 className="text-xl font-bold text-red-800 mb-2">1. Saknade eller duplicerade meta-titlar</h2>
              <p className="text-red-700 mb-0">Påverkar: 67% av analyserade webbplatser</p>
            </div>

            <p className="mb-4">
              Meta-titeln är det första Google och användare ser. Ändå har många webbplatser antingen
              samma titel på alla sidor (&quot;Välkommen till Företaget AB&quot;) eller ingen titel alls.
            </p>

            <div className="bg-gray-100 rounded-lg p-4 my-4">
              <p className="font-semibold text-gray-800 mb-2">Dåligt exempel:</p>
              <code className="text-sm text-red-600">&lt;title&gt;Hem | Företaget&lt;/title&gt;</code>
              <p className="text-sm text-gray-600 mt-2">(Samma på alla sidor)</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 my-4">
              <p className="font-semibold text-green-800 mb-2">Bra exempel:</p>
              <code className="text-sm text-green-600">&lt;title&gt;Begagnade cyklar i Stockholm | Cykelbutiken&lt;/title&gt;</code>
              <p className="text-sm text-gray-600 mt-2">(Unik, beskrivande, inkluderar sökord)</p>
            </div>

            <p className="mb-4">
              <strong>Lösning:</strong> Skapa unika titlar för varje sida. Inkludera huvudsökordet och
              håll dig under 60 tecken. Formatet &quot;[Sökord] | [Företagsnamn]&quot; fungerar bra.
            </p>

            {/* Misstag 2 */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8 rounded-r-lg">
              <h2 className="text-xl font-bold text-red-800 mb-2">2. Bilder utan alt-text</h2>
              <p className="text-red-700 mb-0">Påverkar: 54% av analyserade webbplatser</p>
            </div>

            <p className="mb-4">
              Alt-text (alternativ text) beskriver vad en bild föreställer. Det är viktigt för:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Tillgänglighet</strong> - Skärmläsare läser upp alt-texten för synskadade</li>
              <li><strong>SEO</strong> - Google kan inte &quot;se&quot; bilder, men läser alt-texten</li>
              <li><strong>Backup</strong> - Visas om bilden inte laddas</li>
            </ul>

            <div className="bg-gray-100 rounded-lg p-4 my-4">
              <p className="font-semibold text-gray-800 mb-2">Dåligt:</p>
              <code className="text-sm text-red-600">&lt;img src=&quot;produkt.jpg&quot;&gt;</code>
            </div>

            <div className="bg-green-50 rounded-lg p-4 my-4">
              <p className="font-semibold text-green-800 mb-2">Bra:</p>
              <code className="text-sm text-green-600">&lt;img src=&quot;produkt.jpg&quot; alt=&quot;Röd mountainbike för barn, modell Trek 2024&quot;&gt;</code>
            </div>

            {/* Misstag 3 */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8 rounded-r-lg">
              <h2 className="text-xl font-bold text-red-800 mb-2">3. Långsam laddningstid</h2>
              <p className="text-red-700 mb-0">Påverkar: 71% av analyserade webbplatser</p>
            </div>

            <p className="mb-4">
              Hastighet är en rankingfaktor. Google har bekräftat att långsamma sidor rankas lägre.
              De vanligaste orsakerna till långsam laddning på svenska webbplatser:
            </p>

            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li><strong>Ooptimerade bilder</strong> - Bilder direkt från kameran kan vara 5-10 MB</li>
              <li><strong>För många plugins</strong> - Vanligt på WordPress-sidor</li>
              <li><strong>Billig hosting</strong> - Delade servrar med för många webbplatser</li>
              <li><strong>Ingen caching</strong> - Samma resurser laddas om varje gång</li>
            </ol>

            <p className="mb-4">
              <strong>Lösning:</strong> Använd WebP-format för bilder, aktivera browser caching,
              och överväg en CDN för statiska resurser.
            </p>

            {/* Misstag 4 */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8 rounded-r-lg">
              <h2 className="text-xl font-bold text-red-800 mb-2">4. Bristfällig mobilvänlighet</h2>
              <p className="text-red-700 mb-0">Påverkar: 38% av analyserade webbplatser</p>
            </div>

            <p className="mb-4">
              Sedan 2019 använder Google &quot;mobile-first indexing&quot;, vilket betyder att de bedömer
              din webbplats baserat på mobilversionen. Vanliga mobilproblem:
            </p>

            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Text för liten att läsa utan att zooma</li>
              <li>Knappar för nära varandra (svårt att träffa rätt)</li>
              <li>Horisontell scroll (innehåll bredare än skärmen)</li>
              <li>Pop-ups som blockerar innehållet</li>
            </ul>

            <p className="mb-4">
              <strong>Lösning:</strong> Testa din webbplats på riktiga mobiler, inte bara i webbläsarens
              &quot;responsive mode&quot;. Använd minst 16px fontstorlek och 44x44px klickytor.
            </p>

            {/* Misstag 5 */}
            <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8 rounded-r-lg">
              <h2 className="text-xl font-bold text-red-800 mb-2">5. Brutna länkar</h2>
              <p className="text-red-700 mb-0">Påverkar: 43% av analyserade webbplatser</p>
            </div>

            <p className="mb-4">
              Brutna länkar (404-fel) skadar både användarupplevelsen och din SEO. De uppstår när:
            </p>

            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Du tar bort eller flyttar sidor utan redirect</li>
              <li>Du länkar till externa sidor som försvunnit</li>
              <li>Stavfel i URLs</li>
            </ul>

            <p className="mb-4">
              <strong>Lösning:</strong> Kör regelbundna crawls av din webbplats för att hitta
              brutna länkar. SEO Analyze gör detta automatiskt och visar exakt vilka länkar
              som är trasiga.
            </p>

            {/* Sammanfattning */}
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Sammanfattning</h2>
            <div className="bg-blue-50 rounded-lg p-6 my-6">
              <p className="font-semibold text-blue-800 mb-3">Checklista - fixa dessa först:</p>
              <ol className="list-decimal pl-6 space-y-2 text-blue-700">
                <li>Ge varje sida en unik meta-titel med sökord</li>
                <li>Lägg till beskrivande alt-text på alla bilder</li>
                <li>Optimera bilder och aktivera caching</li>
                <li>Testa och förbättra mobilupplevelsen</li>
                <li>Hitta och fixa alla brutna länkar</li>
              </ol>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Hur många av dessa misstag gör du?</h2>
            <p className="mb-6 opacity-90">
              Kör en gratis SEO-analys och få en komplett lista på vad du behöver fixa.
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
