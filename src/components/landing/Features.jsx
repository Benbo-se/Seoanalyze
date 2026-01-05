'use client';

import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Shield,
  Lock,
  Sparkles,
  Globe,
  Zap,
  BookOpen
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Search,
      title: "Teknisk SEO-analys",
      description: "Komplett genomgång med 100+ kontrollpunkter för meta-taggar, rubriker och struktur.",
      isAI: false,
    },
    {
      icon: Sparkles,
      title: "AI-driven rapport",
      description: "Få en prioriterad handlingsplan med konkreta förbättringsförslag.",
      isAI: true,
    },
    {
      icon: Shield,
      title: "GDPR Cookie-analys",
      description: "TCF-detektion, tracking-scripts och consent-banner validering.",
      isAI: true,
    },
    {
      icon: Lock,
      title: "Säkerhetsanalys",
      description: "SSL-certifikat, security headers och sårbarhetsskanning.",
      isAI: true,
    },
    {
      icon: BookOpen,
      title: "Svensk LIX-analys",
      description: "Unik läsbarhetsanalys anpassad för svenska texter och SEO.",
      isAI: false,
    },
    {
      icon: Globe,
      title: "Crawl hela sajten",
      description: "Skanna upp till 100 sidor för att hitta brutna länkar och duplicerat innehåll.",
      isAI: false,
    },
    {
      icon: Zap,
      title: "Lighthouse-prestanda",
      description: "Core Web Vitals och Googles prestandapoäng för mobil och desktop.",
      isAI: false,
    },
    {
      icon: FileText,
      title: "PDF-rapporter",
      description: "Ladda ner professionella rapporter att dela med kunder eller kollegor.",
      isAI: false,
    },
  ];

  return (
    <section id="funktioner" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Funktioner
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Allt du behöver för bättre SEO
          </h2>
          <p className="text-lg text-muted-foreground">
            Kraftfulla verktyg som hjälper dig förstå och förbättra din webbplats synlighet.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                feature.isAI ? "bg-ai-muted/30 border-ai/20" : ""
              }`}
            >
              {/* AI Badge */}
              {feature.isAI && (
                <Badge variant="ai" className="absolute top-4 right-4 text-[10px]">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </Badge>
              )}

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                feature.isAI
                  ? "gradient-ai text-white"
                  : "bg-primary/10 text-primary"
              }`}>
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
