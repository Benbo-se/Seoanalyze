'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Shield, Lock, Search, Globe, Zap, ChevronDown, ChevronUp, ArrowRight, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const loadPushNotifications = () => import('@/utils/pushNotifications');

const HeroSection = () => {
  const [selectedType, setSelectedType] = useState('ai');
  const [url, setUrl] = useState('');
  const [crawlPages, setCrawlPages] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false
  });

  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const { getPushNotificationStatus } = await loadPushNotifications();
        const status = await getPushNotificationStatus();
        setNotificationStatus(status);
      } catch (error) {
        console.log('Push notifications not available');
      }
    };
    const timeoutId = setTimeout(checkNotificationStatus, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  const normalizeUrl = (inputUrl) => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return '';
    if (trimmed.match(/^https?:\/\//i)) return trimmed;
    return `https://${trimmed}`;
  };

  const getApiType = (type) => {
    const typeMap = {
      'ai': 'seo',
      'gdpr': 'gdpr',
      'security': 'security',
      'seo': 'seo',
      'crawl': 'crawl',
      'lighthouse': 'lighthouse'
    };
    return typeMap[type] || 'seo';
  };

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!url || url.trim() === '') return;

    setLoading(true);
    setError(null);

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl || normalizedUrl === 'https://') {
      setError('Ange en giltig webbplatsadress');
      setLoading(false);
      return;
    }

    try {
      const analysisData = {
        url: normalizedUrl,
        type: getApiType(selectedType),
        maxPages: selectedType === 'crawl' ? crawlPages : undefined,
      };

      if (!navigator.onLine) {
        try {
          const { queueAnalysisForBackgroundSync } = await loadPushNotifications();
          if ('serviceWorker' in navigator) {
            const analysisId = await queueAnalysisForBackgroundSync(analysisData);
            if (analysisId) {
              setError('Du är offline. Analysen kommer att köras när du kommer online igen.');
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('Offline sync not available');
        }
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) throw new Error('Analysen misslyckades. Försök igen.');

      const data = await response.json();
      if (data.jobId) window.location.href = `/analys/${data.jobId}`;
    } catch (err) {
      setError(err.message || 'Något gick fel. Försök igen.');
      setLoading(false);
    }
  };

  const scrollToTools = () => {
    const toolsSection = document.getElementById('tools');
    if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
  };

  const analysisOptions = [
    { id: 'ai', icon: Bot, title: 'AI-Rapport', badge: 'Rekommenderad', description: 'Komplett analys med prioriterad handlingsplan', isAI: true },
    { id: 'gdpr', icon: Shield, title: 'GDPR Cookie-analys', description: 'TCF-detektion, consent-banner, tracking', isAI: true },
    { id: 'security', icon: Lock, title: 'Säkerhetsanalys', description: 'SSL, headers, sårbarheter, exponerade filer', isAI: true }
  ];

  const advancedOptions = [
    { id: 'seo', icon: Search, title: 'SEO-analys', description: 'Grundläggande SEO för en sida' },
    { id: 'crawl', icon: Globe, title: 'Crawl', description: 'Skanna upp till 100 sidor' },
    { id: 'lighthouse', icon: Zap, title: 'Lighthouse', description: 'Prestanda & Core Web Vitals' }
  ];

  return (
    <section id="hero" className="relative pt-24 pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-ai/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="ai" className="mb-6 animate-fade-up">
            <Sparkles className="w-3 h-3" />
            Nu med AI-driven analys
          </Badge>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up">
            Analysera din webbplats{" "}
            <span className="text-primary">helt gratis</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up">
            Få en komplett rapport om SEO, GDPR och säkerhet.
            Svensk LIX-analys ingår. Ingen registrering krävs.
          </p>

          {/* Analysis Card */}
          <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-xl border border-border p-6 animate-fade-up">
            {/* URL Input Form */}
            <form onSubmit={handleAnalyze} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="www.dinwebbplats.se"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-12 h-12 text-base"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="cta"
                  size="lg"
                  disabled={loading || !url}
                  className="sm:px-8"
                >
                  {loading ? 'Analyserar...' : 'Analysera nu'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </form>

            {/* Analysis Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {analysisOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedType(option.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{option.title}</span>
                          {option.isAI && (
                            <Badge variant="ai" className="text-[10px] px-1.5 py-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI
                            </Badge>
                          )}
                          {option.badge && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0">
                              {option.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>Fler verktyg: SEO, Crawl, Lighthouse</span>
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap justify-center gap-3">
                  {advancedOptions.map((option) => {
                    const IconComponent = option.icon;
                    const isSelected = selectedType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedType(option.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium">{option.title}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedType === 'crawl' && (
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <label className="text-sm text-muted-foreground">Antal sidor:</label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={crawlPages}
                      onChange={(e) => setCrawlPages(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-20 h-9 text-center"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Secondary CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-fade-up">
            <Button variant="hero-secondary" size="lg" onClick={scrollToTools}>
              Se verktyg
            </Button>
            <span className="text-sm text-muted-foreground">
              Ingen registrering krävs
            </span>
          </div>

          {/* Social proof stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-12 animate-fade-up">
            <div className="flex flex-col items-center p-4">
              <div className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                <Users className="w-5 h-5 text-primary" />
                100%
              </div>
              <span className="text-sm text-muted-foreground">Gratis</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                <TrendingUp className="w-5 h-5 text-success" />
                LIX
              </div>
              <span className="text-sm text-muted-foreground">Svensk analys</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                <Sparkles className="w-5 h-5 text-ai" />
                AI
              </div>
              <span className="text-sm text-muted-foreground">Drivna rapporter</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                <Shield className="w-5 h-5 text-primary" />
                GDPR
              </div>
              <span className="text-sm text-muted-foreground">Data i Sverige</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
