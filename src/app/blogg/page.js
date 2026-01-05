import Link from 'next/link';

export const metadata = {
  title: "SEO-blogg | Tips och guider | SEO Analyze",
  description: "Lär dig mer om SEO, prestanda och hur du förbättrar din webbplats synlighet i sökmotorer. Svenska guider och tips.",
  robots: "index, follow",
};

const articles = [
  {
    slug: 'lix-lasbarhet-seo',
    title: 'Vad är LIX och varför är det viktigt för SEO?',
    excerpt: 'LIX (Läsbarhetsindex) är ett svenskt mått på hur lättläst en text är. Lär dig hur läsbarhet påverkar din SEO och hur du optimerar dina texter.',
    date: '2026-01-03',
    readTime: '5 min',
    category: 'SEO-grunderna'
  },
  {
    slug: 'vanliga-seo-misstag',
    title: '5 vanliga SEO-misstag på svenska webbplatser',
    excerpt: 'Många svenska webbplatser gör samma misstag om och om igen. Här är de vanligaste felen och hur du undviker dem.',
    date: '2026-01-03',
    readTime: '7 min',
    category: 'Tips & tricks'
  },
  {
    slug: 'forbattra-core-web-vitals',
    title: 'Så förbättrar du din Core Web Vitals',
    excerpt: 'Core Web Vitals är Googles sätt att mäta användarupplevelsen. Lär dig vad LCP, FID och CLS betyder och hur du optimerar dem.',
    date: '2026-01-03',
    readTime: '8 min',
    category: 'Prestanda'
  }
];

export default function Blogg() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">SEO-bloggen</h1>
      <p className="text-gray-600 mb-8">
        Tips, guider och nyheter om SEO för svenska webbplatser.
      </p>

      <div className="space-y-6">
        {articles.map((article) => (
          <article key={article.slug} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <Link href={`/blogg/${article.slug}`}>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {article.category}
                </span>
                <span className="text-gray-500 text-xs flex items-center">
                  {article.readTime} läsning
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                {article.title}
              </h2>
              <p className="text-gray-600 mb-3">
                {article.excerpt}
              </p>
              <div className="text-sm text-gray-500">
                Publicerad: {new Date(article.date).toLocaleDateString('sv-SE')}
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* CTA */}
      <section className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Vill du testa din SEO?</h2>
        <p className="mb-6 opacity-90">
          Kör en gratis analys och se hur din webbplats presterar.
        </p>
        <Link
          href="/"
          className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Starta SEO-analys
        </Link>
      </section>
    </div>
  );
}
