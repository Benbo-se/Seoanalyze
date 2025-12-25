export const metadata = {
  title: 'SEOAnalyzeBot - Web Crawler Information',
  description: 'Information about SEOAnalyzeBot, the web crawler for SEO Analyze',
  robots: 'index, follow'
};

import './bot.css';

export default function BotPage() {
  return (
    <div className="bot-info-page">
      <div className="container">
        <h1>SEOAnalyzeBot - Web Crawler Information</h1>

        <section className="info-section">
          <h2>Om SEOAnalyzeBot</h2>
          <p>
            SEOAnalyzeBot är den officiella webcrawlern för SEO Analyze
            (seoanalyze.se), en svensk tjänst för SEO-analys och webbplatsoptimering.
          </p>
        </section>

        <section className="info-section">
          <h2>User-Agent</h2>
          <code className="user-agent">
            Mozilla/5.0 (compatible; SEOAnalyzeBot/1.0; +https://seoanalyze.se/bot)
          </code>
        </section>

        <section className="info-section">
          <h2>Vad gör vår bot?</h2>
          <ul>
            <li>Analyserar sidstruktur och SEO-faktorer</li>
            <li>Kontrollerar brutna länkar och bilder</li>
            <li>Mäter sidprestanda och laddningstider</li>
            <li>Identifierar förbättringsområden för sökmotoroptimering</li>
            <li>Respekterar robots.txt och crawl-delay direktiv</li>
            <li>Följer noindex och nofollow meta-taggar</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>Robots.txt Compliance</h2>
          <p>SEOAnalyzeBot respekterar fullt ut robots.txt direktiv:</p>
          <ul>
            <li><strong>User-agent:</strong> SEOAnalyzeBot</li>
            <li><strong>Crawl-delay:</strong> Respekterar alltid (minimum 0.5s mellan requests)</li>
            <li><strong>Disallow:</strong> Följer alla disallow-regler</li>
            <li><strong>Sitemap:</strong> Prioriterar URLs från sitemap</li>
          </ul>

          <h3>Exempel robots.txt</h3>
          <pre className="code-example">
{`User-agent: SEOAnalyzeBot
Crawl-delay: 1
Allow: /

User-agent: *
Disallow: /admin/
Disallow: /private/
Sitemap: https://example.com/sitemap.xml`}
          </pre>
        </section>

        <section className="info-section">
          <h2>Blockera vår bot</h2>
          <p>
            Om du vill blockera SEOAnalyzeBot från din webbplats,
            lägg till följande i din robots.txt:
          </p>
          <pre className="code-example">
{`User-agent: SEOAnalyzeBot
Disallow: /`}
          </pre>
        </section>

        <section className="info-section">
          <h2>Rapportera problem</h2>
          <p>
            Om vår bot orsakar problem eller beter sig felaktigt,
            vänligen kontakta oss omedelbart:
          </p>
          <ul>
            <li>E-post: bot@seoanalyze.se</li>
            <li>Support: support@seoanalyze.se</li>
            <li>Akuta ärenden: +46 (kommer snart)</li>
          </ul>
        </section>

        <section className="info-section">
          <h2>Teknisk information</h2>
          <table className="tech-info">
            <tbody>
              <tr>
                <td>Bot namn:</td>
                <td>SEOAnalyzeBot</td>
              </tr>
              <tr>
                <td>Version:</td>
                <td>1.0</td>
              </tr>
              <tr>
                <td>Request headers:</td>
                <td>Accept, Accept-Language, Accept-Encoding, DNT</td>
              </tr>
              <tr>
                <td>Max sidstorlek:</td>
                <td>10 MB</td>
              </tr>
              <tr>
                <td>Timeout:</td>
                <td>5 sekunder</td>
              </tr>
              <tr>
                <td>Default crawl-delay:</td>
                <td>0.5 sekunder</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="info-section">
          <h2>IP-adresser</h2>
          <p>
            SEOAnalyzeBot crawlar från följande IP-adresser
            (listan kan ändras, kontrollera denna sida för uppdateringar):
          </p>
          <ul className="ip-list">
            <li>Kommer snart - under implementation</li>
          </ul>
        </section>

      </div>
    </div>
  );
}