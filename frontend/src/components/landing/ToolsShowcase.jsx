'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Shield,
  Lock,
  Search,
  Globe,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const ToolsShowcase = () => {
  const tools = [
    {
      id: "ai-report",
      name: "AI-Rapport",
      icon: Bot,
      isAI: true,
      description: "Komplett analys med AI-genererad prioriterad handlingsplan baserad på SEO, GDPR och säkerhet.",
      features: [
        "Automatisk prioritering av åtgärder",
        "Konkreta förbättringsförslag",
        "Svensk LIX-analys av innehåll",
        "Kombinerad SEO + Säkerhet + GDPR",
        "Handlingsplan i PDF-format"
      ],
      preview: { score: 85, suggestions: 12, priority: "Hög", categories: 4 }
    },
    {
      id: "gdpr",
      name: "GDPR Cookie-analys",
      icon: Shield,
      isAI: true,
      description: "Analyserar cookies, tracking-scripts och consent-banners enligt GDPR och ePrivacy-direktivet.",
      features: [
        "TCF v2 & CMP-detektion",
        "Cookie-kategorisering",
        "Consent-banner validering",
        "Tracking-script analys",
        "EDPB-compliance check"
      ],
      preview: { score: 90, cookies: 8, trackers: 3, bannerStatus: "OK" }
    },
    {
      id: "security",
      name: "Säkerhetsanalys",
      icon: Lock,
      isAI: true,
      description: "Kontrollerar SSL-certifikat, security headers, exponerade filer och sårbara bibliotek.",
      features: [
        "SSL/TLS-certifikat validering",
        "Security headers (CSP, HSTS, etc.)",
        "Exponerade filer & kataloger",
        "JavaScript-bibliotek scanning",
        "OWASP Top 10 kontroll"
      ],
      preview: { score: 78, ssl: "A+", headers: 6, vulnerabilities: 2 }
    },
    {
      id: "seo",
      name: "SEO-analys",
      icon: Search,
      isAI: false,
      description: "Grundläggande SEO-analys av en enskild sida med 100+ kontrollpunkter.",
      features: [
        "Meta-taggar & Open Graph",
        "Rubrikstruktur (H1-H6)",
        "Bildoptimering & alt-texter",
        "Intern & extern länkstruktur",
        "Schema.org markup"
      ],
      preview: { score: 72, issues: 8, warnings: 15, passed: 77 }
    },
    {
      id: "crawl",
      name: "Crawl",
      icon: Globe,
      isAI: false,
      description: "Skanna hela din webbplats och hitta brutna länkar, duplicerat innehåll och strukturella problem.",
      features: [
        "Upp till 100 sidor per crawl",
        "Brutna länkar & redirects",
        "Duplicerade titlar/meta",
        "Sitemap-validering",
        "Robots.txt-analys"
      ],
      preview: { pages: 47, brokenLinks: 3, duplicates: 5, redirects: 12 }
    },
    {
      id: "lighthouse",
      name: "Lighthouse",
      icon: Zap,
      isAI: false,
      description: "Google Lighthouse-analys för prestanda, tillgänglighet och Core Web Vitals.",
      features: [
        "Performance-poäng",
        "Core Web Vitals (LCP, FID, CLS)",
        "Tillgänglighetsanalys",
        "Best Practices",
        "PWA-kontroll"
      ],
      preview: { performance: 89, accessibility: 95, bestPractices: 92, seo: 100 }
    }
  ];

  const scrollToHero = () => {
    const hero = document.getElementById('hero');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="tools" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Badge variant="ai" className="mb-4">
            <Sparkles className="w-3 h-3" />
            Verktyg
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Kraftfulla verktyg för varje behov
          </h2>
          <p className="text-lg text-muted-foreground">
            Välj mellan manuella verktyg och AI-drivna analyser för optimal SEO.
          </p>
        </div>

        {/* Tools tabs */}
        <Tabs defaultValue="ai-report" className="max-w-5xl mx-auto">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1 mb-8 bg-card border border-border rounded-xl">
            {tools.map((tool) => (
              <TabsTrigger
                key={tool.id}
                value={tool.id}
                className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all text-xs md:text-sm"
              >
                <tool.icon className="w-4 h-4" />
                <span className="hidden sm:inline truncate">{tool.name.split(' ')[0]}</span>
                {tool.isAI && (
                  <Badge variant="ai" className="text-[8px] md:text-[10px] px-1 py-0 hidden lg:flex">
                    <Sparkles className="w-2 h-2 md:w-2.5 md:h-2.5" />
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {tools.map((tool) => (
            <TabsContent key={tool.id} value={tool.id} className="mt-0">
              <div className={`grid lg:grid-cols-2 gap-8 p-8 rounded-2xl border ${
                tool.isAI
                  ? "bg-ai-muted/20 border-ai/20"
                  : "bg-card border-border"
              }`}>
                {/* Left: Info */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${
                      tool.isAI
                        ? "gradient-ai text-white"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl text-foreground">
                        {tool.name}
                      </h3>
                      {tool.isAI && (
                        <Badge variant="ai" className="mt-1">
                          <Sparkles className="w-3 h-3" />
                          AI-driven
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    {tool.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {tool.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
                          tool.isAI ? "text-ai" : "text-success"
                        }`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={tool.isAI ? "ai" : "hero"}
                    className="w-fit"
                    onClick={scrollToHero}
                  >
                    Prova {tool.name.toLowerCase()}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Right: Preview */}
                <div className="bg-background rounded-xl border border-border p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/50" />
                      <div className="w-3 h-3 rounded-full bg-warning/50" />
                      <div className="w-3 h-3 rounded-full bg-success/50" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">seoanalyze.se</span>
                  </div>

                  {/* Preview content based on tool type */}
                  {tool.id === "ai-report" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-ai-muted/50 rounded-lg border border-ai/20">
                        <Sparkles className="w-5 h-5 text-ai" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">AI-analys klar</div>
                          <div className="text-xs text-muted-foreground">{tool.preview.suggestions} åtgärder identifierade</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-2xl font-bold text-ai">{tool.preview.score}</div>
                          <div className="text-xs text-muted-foreground">Total poäng</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-2xl font-bold text-foreground">{tool.preview.categories}</div>
                          <div className="text-xs text-muted-foreground">Kategorier</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {tool.id === "gdpr" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">GDPR-poäng</span>
                        <span className="text-2xl font-display font-bold text-success">{tool.preview.score}/100</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: `${tool.preview.score}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold text-foreground">{tool.preview.cookies}</div>
                          <div className="text-xs text-muted-foreground">Cookies</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold text-warning">{tool.preview.trackers}</div>
                          <div className="text-xs text-muted-foreground">Trackers</div>
                        </div>
                        <div className="text-center p-3 bg-success/10 rounded-lg">
                          <div className="text-lg font-bold text-success">{tool.preview.bannerStatus}</div>
                          <div className="text-xs text-muted-foreground">Banner</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {tool.id === "security" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                        <span className="text-sm font-medium text-foreground">SSL-betyg</span>
                        <span className="text-2xl font-display font-bold text-success">{tool.preview.ssl}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg text-center">
                          <div className="text-lg font-bold text-foreground">{tool.preview.headers}/8</div>
                          <div className="text-xs text-muted-foreground">Headers OK</div>
                        </div>
                        <div className="p-3 bg-destructive/10 rounded-lg text-center">
                          <div className="text-lg font-bold text-destructive">{tool.preview.vulnerabilities}</div>
                          <div className="text-xs text-muted-foreground">Sårbarheter</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {tool.id === "seo" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">SEO-poäng</span>
                        <span className="text-2xl font-display font-bold text-primary">{tool.preview.score}/100</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${tool.preview.score}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-destructive/10 rounded-lg">
                          <div className="text-lg font-bold text-destructive">{tool.preview.issues}</div>
                          <div className="text-xs text-muted-foreground">Fel</div>
                        </div>
                        <div className="text-center p-3 bg-warning/10 rounded-lg">
                          <div className="text-lg font-bold text-warning">{tool.preview.warnings}</div>
                          <div className="text-xs text-muted-foreground">Varningar</div>
                        </div>
                        <div className="text-center p-3 bg-success/10 rounded-lg">
                          <div className="text-lg font-bold text-success">{tool.preview.passed}</div>
                          <div className="text-xs text-muted-foreground">Godkända</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {tool.id === "crawl" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">Sidor skannade</span>
                        <span className="text-2xl font-display font-bold text-primary">{tool.preview.pages}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-destructive/10 rounded-lg">
                          <div className="text-lg font-bold text-destructive">{tool.preview.brokenLinks}</div>
                          <div className="text-xs text-muted-foreground">Brutna</div>
                        </div>
                        <div className="text-center p-3 bg-warning/10 rounded-lg">
                          <div className="text-lg font-bold text-warning">{tool.preview.duplicates}</div>
                          <div className="text-xs text-muted-foreground">Duplikat</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-bold text-foreground">{tool.preview.redirects}</div>
                          <div className="text-xs text-muted-foreground">Redirects</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {tool.id === "lighthouse" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-success/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-success">{tool.preview.performance}</div>
                          <div className="text-xs text-muted-foreground">Prestanda</div>
                        </div>
                        <div className="p-3 bg-success/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-success">{tool.preview.accessibility}</div>
                          <div className="text-xs text-muted-foreground">Tillgänglighet</div>
                        </div>
                        <div className="p-3 bg-success/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-success">{tool.preview.bestPractices}</div>
                          <div className="text-xs text-muted-foreground">Best Practices</div>
                        </div>
                        <div className="p-3 bg-success/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-success">{tool.preview.seo}</div>
                          <div className="text-xs text-muted-foreground">SEO</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default ToolsShowcase;
