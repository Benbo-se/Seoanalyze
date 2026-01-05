import Link from 'next/link';

export const metadata = {
  title: "Kontakt | SEO Analyze",
  description: "Kontakta SEO Analyze för frågor, support eller konsultation om sökmotoroptimering. Vi hjälper dig förbättra din webbplats ranking.",
  robots: "index, follow",
};

export default function Kontakt() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Kontakta oss</h1>
      <p className="text-gray-600 mb-8">
        Vi finns här för att hjälpa dig med dina SEO-frågor. Välj det kontaktsätt som passar dig bäst.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Allmänna frågor */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Allmänna frågor
          </h2>
          <p className="text-gray-600 mb-4">
            Har du frågor om hur du använder SEO Analyze eller behöver hjälp med att tolka dina resultat?
          </p>
          <a
            href="mailto:reda@benbo.se"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            reda@benbo.se
          </a>
          <p className="text-sm text-gray-500 mt-3">
            Svarstid: Inom 24 timmar på vardagar
          </p>
        </div>

        {/* Teknisk support */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-4xl mb-4">🔧</div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Teknisk support
          </h2>
          <p className="text-gray-600 mb-4">
            Upplever du problem med tjänsten eller vill rapportera en bugg? Vi uppskattar all feedback!
          </p>
          <a
            href="mailto:reda@benbo.se?subject=Teknisk support - SEO Analyze"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Rapportera problem
          </a>
          <p className="text-sm text-gray-500 mt-3">
            Inkludera gärna URL och skärmdumpar
          </p>
        </div>

        {/* Konsulttjänster */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-4xl mb-4">💼</div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            SEO-konsultation
          </h2>
          <p className="text-gray-600 mb-4">
            Behöver du professionell hjälp med att implementera SEO-förbättringar? Vi erbjuder konsulttjänster via Benbo IT-konsulting.
          </p>
          <a
            href="mailto:reda@benbo.se?subject=Offertförfrågan SEO-konsultation"
            className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Begär offert
          </a>
          <p className="text-sm text-gray-500 mt-3">
            Vi återkommer med offert inom 48 timmar
          </p>
        </div>

        {/* Samarbete */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-4xl mb-4">🤝</div>
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Samarbete & partnerskap
          </h2>
          <p className="text-gray-600 mb-4">
            Intresserad av att samarbeta med oss? Vi är öppna för partnerskap med webbyråer och marknadsföringsbyråer.
          </p>
          <a
            href="mailto:reda@benbo.se?subject=Samarbetsförfrågan"
            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Diskutera samarbete
          </a>
        </div>
      </div>

      {/* Företagsinformation */}
      <section className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Om Benbo IT-konsulting
        </h2>
        <p className="text-gray-600 mb-4">
          SEO Analyze utvecklas och drivs av Benbo IT-konsulting, ett svenskt IT-konsultföretag
          specialiserat på webbutveckling och sökmotoroptimering.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Kontaktuppgifter</h3>
            <ul className="text-gray-600 space-y-1">
              <li><strong>E-post:</strong> reda@benbo.se</li>
              <li><strong>Webb:</strong> <a href="https://benbo.se" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">benbo.se</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Tjänster</h3>
            <ul className="text-gray-600 space-y-1">
              <li>SEO-analys och optimering</li>
              <li>Webbutveckling (React, Next.js)</li>
              <li>Teknisk SEO-audit</li>
              <li>Prestandaoptimering</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Snabbhjälp */}
      <section className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">
          Behöver du snabb hjälp?
        </h2>
        <p className="text-gray-600 mb-4">
          Kolla först om ditt svar finns i våra vanliga frågor eller fråga vår AI-chattbot.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/faq"
            className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Läs FAQ
          </Link>
          <Link
            href="/bot"
            className="inline-block bg-white text-gray-600 px-6 py-2 rounded-lg border border-gray-600 hover:bg-gray-50 transition-colors"
          >
            Fråga AI-chattboten
          </Link>
        </div>
      </section>
    </div>
  );
}
