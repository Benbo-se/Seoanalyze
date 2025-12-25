// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true; // Allow dynamic job IDs

// Dynamic metadata for analysis pages
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const jobId = resolvedParams.jobId;
  
  // Shorten long ULID to just show "Analys" for cleaner display
  const displayTitle = jobId.length > 10 ? "Analys" : `Analys #${jobId}`;

  return {
    title: `${displayTitle} | SEO Analyze`,
    description: `Se resultatet av din SEO-, Lighthouse- eller Crawl-analys. Detaljerade rapporter och rekommendationer för förbättring.`,
    robots: "noindex, nofollow", // Analysis pages should not be indexed
    openGraph: {
      title: `${displayTitle} | SEO Analyze`,
      description: "Se resultatet av din webbplatsanalys med detaljerade rapporter och rekommendationer.",
      type: "website",
    },
  };
}

// Import client component and redirect
import AnalysisPageClient from './AnalysisPageClient';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AnalysisPage({ params }) {
  const { jobId } = params || {};
  
  // Server-side redirect for completed jobs using job-meta
  const isUlid = jobId && jobId.startsWith('01');
  if (!isUlid && jobId) {
    // Build base URL from incoming request
    const h = headers();
    const proto = h.get('x-forwarded-proto') || 'http';
    const host = h.get('host') || 'localhost:5001';
    const base = `${proto}://${host}`;
    
    try {
      const res = await fetch(`${base}/api/job-meta/${jobId}`, { cache: 'no-store' });
      if (res.ok) {
        const meta = await res.json();
        if (meta?.found && meta?.status === 'completed' && meta?.analysisId) {
          redirect(`/analys/${meta.analysisId}`);
        }
      }
    } catch (error) {
      console.error('Server-side job-meta fetch failed:', error);
      // Continue to client-side handling if server-side fails
    }
  }

  // Build base URL for API calls
  const h = headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('host') || 'localhost:5001';
  const base = `${proto}://${host}`;

  let initialAnalysis = null;
  let initialResults = null;
  try {
    const res = await fetch(`${base}/api/v1/analyses/${jobId}`, { cache: 'no-store' });
    if (res.ok) {
      initialAnalysis = await res.json();
      // För SEO-analyser: merge top-level fält med results för kompatibilitet
      if (initialAnalysis?.results && initialAnalysis.type === 'seo') {
        initialResults = {
          ...initialAnalysis.results,
          seoScore: initialAnalysis.results.seoScore || initialAnalysis.seoScore,
          metaDescription: initialAnalysis.results.metaDescription || initialAnalysis.metaDescription,
          score: initialAnalysis.results.score || initialAnalysis.score,
          url: initialAnalysis.results.url || initialAnalysis.targetUrl,
          title: initialAnalysis.results.title || initialAnalysis.title
        };
      } else {
        initialResults = initialAnalysis?.results || null;
      }
    }
  } catch (_) { /* no-op: SSR ska inte krascha om API:et faller */ }

  return (
    <>
      {/* SSR-verifiering för hero: syns endast om screenshots finns redan på servern */}
      {initialResults?.screenshots?.desktop ? (
        <noscript data-testid="seo-hero-ssr" />
      ) : (
        <noscript data-testid="seo-hero-no-screenshots" />
      )}

      <AnalysisPageClient
        params={params}
        initialAnalysis={initialAnalysis}
        initialResults={initialResults}
      />
    </>
  );
}