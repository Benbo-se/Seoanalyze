export const metadata = {
  title: "Integritetspolicy | SEO Analyze",
  description: "Läs vår integritetspolicy för SEO Analyze. Vi värnar om din personliga integritet och dataskydd.",
  robots: "index, follow",
};

export default function Integritetspolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Integritetspolicy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">
          Denna integritetspolicy beskriver hur SEO Analyze samlar in, använder och skyddar din personliga information.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Information vi samlar in</h2>
          <p className="text-gray-600 mb-4">
            När du använder SEO Analyze kan vi samla in följande information:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>URL-adresser som du analyserar</li>
            <li>Teknisk information om din webbläsare och enhet</li>
            <li>IP-adress och geografisk plats</li>
            <li>Användningsstatistik och analysresultat</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Hur vi använder din information</h2>
          <p className="text-gray-600 mb-4">
            Vi använder den insamlade informationen för att:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Tillhandahålla SEO-analystjänster</li>
            <li>Förbättra våra tjänster och användarupplevelse</li>
            <li>Generera anonymiserad statistik</li>
            <li>Förhindra missbruk av tjänsten</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dataskydd</h2>
          <p className="text-gray-600 mb-4">
            Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda din personliga information mot obehörig åtkomst, förlust eller missbruk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cookies och analys</h2>
          <p className="text-gray-600 mb-4">
            Vi använder cookies för att förbättra din användarupplevelse och analysera trafiken på vår webbplats.
          </p>
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Typer av cookies:</h3>
          <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
            <li><strong>Nödvändiga cookies:</strong> Krävs för att webbplatsen ska fungera korrekt. Kan inte avaktiveras.</li>
            <li><strong>Analys-cookies:</strong> Vi använder Argus Metrics för att samla in anonymiserad statistik om hur besökare använder vår webbplats. Detta hjälper oss att förbättra tjänsten.</li>
            <li><strong>Marknadsföring:</strong> Används för att visa relevant reklam (om aktiverat).</li>
          </ul>
          <p className="text-gray-600 mb-4">
            Du kan hantera dina cookie-inställningar genom cookie-bannern som visas vid ditt första besök, eller genom att klicka på &ldquo;Cookie-inställningar&rdquo; i sidfoten.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Dina rättigheter</h2>
          <p className="text-gray-600 mb-4">
            Enligt GDPR har du rätt att:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Begära tillgång till dina personuppgifter</li>
            <li>Begära rättelse av felaktiga uppgifter</li>
            <li>Begära radering av dina personuppgifter</li>
            <li>Invända mot behandling av dina personuppgifter</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Kontakt</h2>
          <p className="text-gray-600">
            För frågor om denna integritetspolicy, kontakta oss på{' '}
            <a href="mailto:reda@benbo.se" className="text-blue-600 hover:text-blue-800">
              reda@benbo.se
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Ändringar</h2>
          <p className="text-gray-600">
            Vi kan uppdatera denna integritetspolicy från tid till annan. Senaste uppdatering: September 2025.
          </p>
        </section>
      </div>
    </div>
  );
}