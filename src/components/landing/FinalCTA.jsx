'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const FinalCTA = () => {
  const scrollToHero = () => {
    const hero = document.getElementById('hero');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTools = () => {
    const tools = document.getElementById('tools');
    if (tools) tools.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="relative max-w-4xl mx-auto text-center p-12 md:p-16 rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-ai/50" />

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-ai/20 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-primary-foreground text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Starta din kostnadsfria analys idag
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Redo att förbättra din webbplats?
            </h2>

            <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Kom igång på några sekunder. Ingen registrering krävs - aldrig.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="hero-secondary"
                size="xl"
                className="bg-white text-primary hover:bg-white/90 border-0"
                onClick={scrollToHero}
              >
                Analysera gratis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="xl"
                className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                onClick={scrollToTools}
              >
                Se verktyg
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/60 mt-6">
              100% gratis - Ingen registrering - Data lagras i Sverige
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
