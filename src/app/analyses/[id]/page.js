// ISR Configuration
export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true; // Allow dynamic analysis IDs

// Dynamic metadata for analysis pages
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const analysisId = resolvedParams.id;
  
  return {
    title: `Analys #${analysisId} | SEO Analyze`,
    description: `Se resultatet av din SEO-, Lighthouse- eller Crawl-analys. Detaljerade rapporter och rekommendationer för förbättring.`,
    robots: "noindex, nofollow", // Analysis pages should not be indexed
    openGraph: {
      title: `Analys #${analysisId} | SEO Analyze`,
      description: "Se resultatet av din webbplatsanalys med detaljerade rapporter och rekommendationer.",
      type: "website",
    },
  };
}

// Analysis display page component
export default async function AnalysisPage({ params }) {
  const resolvedParams = await params;
  const analysisId = resolvedParams.id;

  // Redirect to existing analys route for now
  // This allows the Score Rings to be tested on the existing route
  if (typeof window !== 'undefined') {
    window.location.href = `/analys/${analysisId}`;
    return null;
  }

  // Server-side redirect
  return (
    <script 
      dangerouslySetInnerHTML={{
        __html: `window.location.href = '/analys/${analysisId}';`
      }}
    />
  );
}