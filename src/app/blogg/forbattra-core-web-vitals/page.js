import Link from 'next/link';

export const metadata = {
  title: "Så förbättrar du din Core Web Vitals | SEO Analyze",
  description: "Core Web Vitals är Googles sätt att mäta användarupplevelsen. Lär dig vad LCP, FID och CLS betyder och hur du optimerar dem.",
  robots: "index, follow",
};

export default function CoreWebVitalsArtikel() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/blogg" className="text-blue-600 hover:underline">Blogg</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">Core Web Vitals</span>
      </nav>

      <article>
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Prestanda</span>
            <span className="text-gray-500 text-xs">8 min läsning</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Så förbättrar du din Core Web Vitals
          </h1>
          <p className="text-gray-500 text-sm">
            Publicerad: 3 januari 2026 | Uppdaterad: 3 januari 2026
          </p>
        </header>

        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="lead text-xl text-gray-600 mb-6">
            Core Web Vitals är Googles sätt att mäta hur snabb och användarvänlig din webbplats är.
            Sedan 2021 är de en officiell rankingfaktor. Här förklarar vi vad de betyder och hur
            du förbättrar dem.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Vad är Core Web Vitals?</h2>
          <p className="mb-4">
            Core Web Vitals består av tre mätvärden som tillsammans beskriver användarupplevelsen:
          </p>

          {/* LCP */}
          <div className="bg-white border-2 border-green-500 rounded-lg p-6 my-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-green-500 text-white text-lg font-bold px-3 py-1 rounded">LCP</span>
              <h3 className="text-xl font-semibold text-gray-800 m-0">Largest Contentful Paint</h3>
            </div>
            <p className="text-gray-600 mb-3">
              Mäter hur lång tid det tar innan det största synliga elementet (ofta en bild eller rubrik)
              har laddats.
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">Bra: &lt;2.5s</span>
              <span className="text-yellow-600 font-medium">OK: 2.5-4s</span>
              <span className="text-red-600 font-medium">Dåligt: &gt;4s</span>
            </div>
          </div>

          {/* INP */}
          <div className="bg-white border-2 border-blue-500 rounded-lg p-6 my-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-500 text-white text-lg font-bold px-3 py-1 rounded">INP</span>
              <h3 className="text-xl font-semibold text-gray-800 m-0">Interaction to Next Paint</h3>
            </div>
            <p className="text-gray-600 mb-3">
              Mäter hur snabbt sidan reagerar på användarinteraktion (klick, tangentbordstryck).
              Ersatte FID (First Input Delay) i mars 2024.
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">Bra: &lt;200ms</span>
              <span className="text-yellow-600 font-medium">OK: 200-500ms</span>
              <span className="text-red-600 font-medium">Dåligt: &gt;500ms</span>
            </div>
          </div>

          {/* CLS */}
          <div className="bg-white border-2 border-purple-500 rounded-lg p-6 my-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-purple-500 text-white text-lg font-bold px-3 py-1 rounded">CLS</span>
              <h3 className="text-xl font-semibold text-gray-800 m-0">Cumulative Layout Shift</h3>
            </div>
            <p className="text-gray-600 mb-3">
              Mäter visuell stabilitet - hur mycket layouten &quot;hoppar&quot; när sidan laddas.
              Har du någonsin klickat på fel knapp för att något flyttade sig? Det är dålig CLS.
            </p>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">Bra: &lt;0.1</span>
              <span className="text-yellow-600 font-medium">OK: 0.1-0.25</span>
              <span className="text-red-600 font-medium">Dåligt: &gt;0.25</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Förbättra LCP (Largest Contentful Paint)</h2>
          <p className="mb-4">LCP påverkas mest av hur snabbt ditt huvudinnehåll laddas. Vanliga orsaker till dålig LCP:</p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1. Optimera bilder</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Använd moderna format som WebP eller AVIF</li>
            <li>Komprimera bilder (verktyg: Squoosh, ImageOptim)</li>
            <li>Använd rätt storlek - ladda inte 4000px bilder för 400px visning</li>
            <li>Lägg till <code className="bg-gray-100 px-1 rounded">loading=&quot;lazy&quot;</code> på bilder under folden</li>
          </ul>

          <div className="bg-gray-100 rounded-lg p-4 my-4">
            <p className="font-semibold text-gray-800 mb-2">Kodexempel - responsiva bilder:</p>
            <pre className="text-sm overflow-x-auto"><code>{`<img
  src="bild-800.webp"
  srcset="bild-400.webp 400w, bild-800.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  alt="Beskrivning"
  width="800"
  height="600"
/>`}</code></pre>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2. Preload viktiga resurser</h3>
          <p className="mb-4">
            Berätta för webbläsaren vilka resurser som är viktigast att ladda först:
          </p>
          <div className="bg-gray-100 rounded-lg p-4 my-4">
            <pre className="text-sm overflow-x-auto"><code>{`<link rel="preload" href="hero-image.webp" as="image" />
<link rel="preload" href="main-font.woff2" as="font" crossorigin />`}</code></pre>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3. Snabbare server (TTFB)</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Använd caching (Redis, Varnish)</li>
            <li>Överväg en CDN (Cloudflare, Fastly)</li>
            <li>Uppgradera hosting om TTFB &gt; 600ms</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Förbättra INP (Interaction to Next Paint)</h2>
          <p className="mb-4">
            INP mäter hur snabbt sidan reagerar. Problem uppstår när JavaScript blockerar huvudtråden.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1. Dela upp JavaScript</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Använd code splitting - ladda bara det som behövs</li>
            <li>Defer icke-kritiska scripts med <code className="bg-gray-100 px-1 rounded">&quot;async&quot;</code> eller <code className="bg-gray-100 px-1 rounded">&quot;defer&quot;</code></li>
            <li>Flytta tung beräkning till Web Workers</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2. Undvik stora DOM-träd</h3>
          <p className="mb-4">
            Fler än 1500 DOM-element gör sidan trög. Använd virtualisering för långa listor.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3. Optimera tredjepartsskript</h3>
          <p className="mb-4">
            Analytics, chatbotar och annonser kan förstöra din INP. Ladda dem efter att sidan är interaktiv.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Förbättra CLS (Cumulative Layout Shift)</h2>
          <p className="mb-4">
            CLS-problem är ofta enkla att fixa när du vet vad som orsakar dem.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1. Ange alltid bildstorlek</h3>
          <div className="bg-gray-100 rounded-lg p-4 my-4">
            <p className="font-semibold text-gray-800 mb-2">Dåligt:</p>
            <code className="text-sm text-red-600">&lt;img src=&quot;bild.jpg&quot; /&gt;</code>
            <p className="font-semibold text-gray-800 mt-4 mb-2">Bra:</p>
            <code className="text-sm text-green-600">&lt;img src=&quot;bild.jpg&quot; width=&quot;800&quot; height=&quot;600&quot; /&gt;</code>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2. Reservera plats för annonser</h3>
          <div className="bg-gray-100 rounded-lg p-4 my-4">
            <pre className="text-sm overflow-x-auto"><code>{`.ad-container {
  min-height: 250px; /* Samma som annonsens höjd */
}`}</code></pre>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3. Undvik dynamiskt innehåll ovanför folden</h3>
          <p className="mb-4">
            Ladda inte in innehåll som skjuter ner det användaren redan tittar på.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4. Förladdade typsnitt</h3>
          <p className="mb-4">
            Font-swap kan orsaka CLS. Använd <code className="bg-gray-100 px-1 rounded">font-display: optional</code> eller preload:
          </p>
          <div className="bg-gray-100 rounded-lg p-4 my-4">
            <code className="text-sm">&lt;link rel=&quot;preload&quot; href=&quot;font.woff2&quot; as=&quot;font&quot; crossorigin /&gt;</code>
          </div>

          {/* Verktyg */}
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Verktyg för att mäta Core Web Vitals</h2>
          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800">Fältdata (riktiga användare)</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>Google Search Console</li>
                <li>Chrome UX Report (CrUX)</li>
                <li>PageSpeed Insights</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800">Labbdata (testmiljö)</h3>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>Lighthouse (Chrome DevTools)</li>
                <li>WebPageTest</li>
                <li>SEO Analyze</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
            <p className="font-semibold text-blue-800">Tips</p>
            <p className="text-blue-700">
              Fältdata (från riktiga användare) är viktigare än labbdata för ranking.
              Google använder CrUX-data för att bedöma din webbplats.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Mät din Core Web Vitals</h2>
          <p className="mb-6 opacity-90">
            Kör en Lighthouse-analys och se exakt hur din webbplats presterar.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Kör prestandaanalys
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
  );
}
