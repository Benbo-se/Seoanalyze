// Import global styles in correct order
import "../styles/index.css";
import "../styles/globals.css";
import "../styles/chatbot.css";
import Footer from '@/components/common/Footer.jsx';
import CookieBanner from '@/components/common/CookieBanner.jsx';
import ChatBot from '@/components/chatbot/ChatBot.jsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.js';

export const metadata = {
  metadataBase: new URL("https://seoanalyze.se"),
  title: "SEO Analyze | Gratis SEO-analys för din webbplats",
  description: "Gratis SEO-analys för din webbplats. Lighthouse prestanda, crawling och teknisk SEO-optimering. Få detaljerade rapporter på svenska.",
  alternates: {
    canonical: "https://seoanalyze.se/"
  },
  keywords: "SEO analys, webbplats analys, teknisk SEO, Lighthouse, prestanda, gratis SEO verktyg, webbsida optimering",
  authors: [{ name: "SEO Analyze Team" }],
  creator: "SEO Analyze",
  publisher: "SEO Analyze",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "/",
    siteName: "SEO Analyze",
    title: "Gratis SEO-analys för din webbplats | SEO Analyze",
    description: "Analysera din webbplats med vårt kostnadsfria SEO-verktyg. Få detaljerade rapporter om teknisk SEO, prestanda och användarupplevelse.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SEO Analyze - Gratis webbplatsanalys",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gratis SEO-analys för din webbplats",
    description: "Analysera din webbplats med vårt kostnadsfria SEO-verktyg. Få detaljerade rapporter om teknisk SEO och prestanda.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "your-google-verification-code",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SEO Analyze",
    startupImage: [
      "/icons/apple-touch-startup-image-750x1334.png",
      {
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
        url: "/icons/apple-touch-startup-image-750x1334.png",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/safari-pinned-tab.svg",
        color: "#3B82F6",
      },
    ],
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#3B82F6" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://seoanalyze.se/#organization",
        "name": "SEO Analyze",
        "url": "https://seoanalyze.se",
        "logo": {
          "@type": "ImageObject",
          "url": "https://seoanalyze.se/images/SEOanalyzerLogo.png",
          "width": 200,
          "height": 50
        },
        "description": "Gratis SEO-analys och webbplatsoptimering för svenska företag",
        "sameAs": [],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Support",
          "email": "reda@benbo.se"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://seoanalyze.se/#website",
        "url": "https://seoanalyze.se",
        "name": "SEO Analyze",
        "description": "Analysera din webbplats med vårt kostnadsfria SEO-verktyg. Få detaljerade rapporter om teknisk SEO, prestanda och användarupplevelse.",
        "publisher": {
          "@id": "https://seoanalyze.se/#organization"
        },
        "inLanguage": "sv-SE",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://seoanalyze.se/?url={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://seoanalyze.se/#software",
        "name": "SEO Analyze",
        "operatingSystem": "Web Browser",
        "applicationCategory": "BusinessApplication",
        "url": "https://seoanalyze.se",
        "creator": {
          "@id": "https://seoanalyze.se/#organization"
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "SEK",
          "availability": "https://schema.org/InStock"
        },
        "description": "Gratis SEO-analysverktyg med Lighthouse, crawling och teknisk SEO-analys",
        "featureList": [
          "SEO-analys",
          "Lighthouse prestanda-analys", 
          "Webbplatscrawling",
          "LIX-läsbarhet för svenska texter",
          "PDF-rapporter",
          "PWA offline-funktionalitet"
        ],
        "softwareVersion": "2.0",
        "releaseNotes": "Next.js 15 App Router migration with PWA features"
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://seoanalyze.se/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Hem",
            "item": "https://seoanalyze.se"
          }
        ]
      }
    ]
  };

  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://sentry.io" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData, null, 2)
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Defer service worker registration for better FID
              if ('serviceWorker' in navigator) {
                function registerSW() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                }
                
                // Register after page load with slight delay
                if (document.readyState === 'complete') {
                  setTimeout(registerSW, 100);
                } else {
                  window.addEventListener('load', function() {
                    setTimeout(registerSW, 100);
                  });
                }
              }
            `,
          }}
        />
        <script src="/rum-sdk.js" async></script>
      </head>
      <body>
        <ErrorBoundary>
          {children}
          <Footer />
          <CookieBanner />
          <ChatBot />
        </ErrorBoundary>
      </body>
    </html>
  );
}