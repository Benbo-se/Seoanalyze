import Link from 'next/link';
import Header from '@/components/common/Header';
import { Flag, Bot, Banknote, BarChart3, Code } from 'lucide-react';

export const metadata = {
  title: "Om oss | SEO Analyze",
  description: "Lär känna teamet bakom SEO Analyze. Vi är passionerade om att hjälpa svenska företag synas bättre i sökmotorer.",
  robots: "index, follow",
};

export default function OmOss() {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pb-8 max-w-4xl pt-24">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Om SEO Analyze</h1>
      <p className="text-gray-600 mb-8">
        Ett kraftfullt SEO-verktyg byggt av svenska utvecklare, för svenska webbplatser.
      </p>

      {/* Vision */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Vår vision</h2>
        <div className="bg-blue-50 rounded-lg p-6">
          <p className="text-gray-700 text-lg leading-relaxed">
            Vi tror att alla företag förtjänar att synas på nätet. SEO Analyze skapades för att
            göra professionell sökmotoroptimering tillgänglig för alla – oavsett budget eller
            teknisk kunskap. Vårt mål är att demokratisera SEO och ge svenska företagare
            verktygen de behöver för att konkurrera med de stora aktörerna.
          </p>
        </div>
      </section>

      {/* Varför vi byggde detta */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Varför SEO Analyze?</h2>
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="mb-4">
            De flesta SEO-verktyg på marknaden är antingen för dyra för småföretagare (1000-2000 kr/månad)
            eller för tekniska för den genomsnittliga webbplatsägaren. Vi såg ett gap och bestämde oss
            för att fylla det.
          </p>
          <p className="mb-4">
            SEO Analyze kombinerar kraften hos professionella verktyg med enkelhet som alla kan förstå.
            Vi använder samma teknologi som Google (Lighthouse) och kompletterar med AI-driven analys
            som ger konkreta, prioriterade åtgärdsförslag.
          </p>
        </div>
      </section>

      {/* Vad som gör oss unika */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Vad som gör oss unika</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <Flag className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Svenskt fokus</h3>
            <p className="text-gray-600">
              Vi förstår den svenska marknaden. Vårt verktyg är byggt för svenska webbplatser
              med stöd för LIX-analys (svensk läsbarhet) och svenska SEO-standarder.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">AI-driven analys</h3>
            <p className="text-gray-600">
              Vår AI analyserar din webbplats mot konkurrenter och ger personliga
              rekommendationer sorterade efter förväntad effekt.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Helt gratis</h3>
            <p className="text-gray-600">
              Grundläggande SEO-analyser är och förblir gratis. Ingen registrering krävs,
              inga dolda avgifter, inga begränsningar på antal analyser.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Actionable insights</h3>
            <p className="text-gray-600">
              Vi visar inte bara problemen – vi förklarar varför de är viktiga och
              ger konkreta kodexempel på hur du åtgärdar dem.
            </p>
          </div>
        </div>
      </section>

      {/* Teknologi */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Vår teknologi</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            SEO Analyze är byggt med modern teknologi för maximal prestanda och tillförlitlighet:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Frontend</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>Next.js 15</li>
                <li>React 19</li>
                <li>Server Components</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Backend</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>Node.js</li>
                <li>PostgreSQL</li>
                <li>Redis & BullMQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Analys</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>Google Lighthouse</li>
                <li>Puppeteer (Chromium)</li>
                <li>DeepSeek AI</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">SEO Analyze i siffror</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">50+</div>
            <div className="text-sm opacity-90">SEO-faktorer</div>
          </div>
          <div className="bg-green-600 text-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">100</div>
            <div className="text-sm opacity-90">Sidor/crawl</div>
          </div>
          <div className="bg-purple-600 text-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">4</div>
            <div className="text-sm opacity-90">Analystyper</div>
          </div>
          <div className="bg-orange-600 text-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">100%</div>
            <div className="text-sm opacity-90">Gratis</div>
          </div>
        </div>
      </section>

      {/* Bakom kulisserna */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bakom kulisserna</h2>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <Code className="w-10 h-10 text-gray-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">Benbo IT-konsulting</h3>
              <p className="text-gray-500 mb-3">Utvecklare & SEO-entusiast</p>
              <p className="text-gray-600">
                SEO Analyze utvecklas av Benbo IT-konsulting, ett svenskt IT-konsultföretag
                med passion för webbutveckling och sökmotoroptimering. Med erfarenhet från
                både stora och små projekt vet vi vad som fungerar i praktiken.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Redo att förbättra din SEO?</h2>
        <p className="mb-6 opacity-90">
          Kör din första analys helt gratis – ingen registrering krävs.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Starta SEO-analys
          </Link>
          <Link
            href="/kontakt"
            className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            Kontakta oss
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}
