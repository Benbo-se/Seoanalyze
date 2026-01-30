'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faSearch,
  faBolt,
  faChartBar,
  faBullseye,
  faCode,
  faChartLine,
  faChartPie,
  faTrophy,
  faExclamationCircle,
  faLightbulb
} from '@/lib/icons';
import '@/styles/ai-analysis.css';

const AiAnalysisLanding = () => {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');

  // Läs URL från query param (från HeroSection)
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setUrl(urlParam);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [competitors, setCompetitors] = useState(['', '', '']);

  const normalizeUrl = (inputUrl) => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return '';
    if (trimmed.match(/^https?:\/\//i)) {
      return trimmed;
    }
    if (trimmed.match(/^(www\.)?[a-z0-9.-]+\.[a-z]{2,}$/i)) {
      return `https://${trimmed}`;
    }
    return `https://${trimmed}`;
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!url || url.trim === '') return;

    setLoading(true);
    setError(null);

    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl || normalizedUrl === 'https://') {
      setError('Ange en giltig webbplatsadress');
      setLoading(false);
      return;
    }

    try {
      // Filter out empty competitors and normalize URLs
      const validCompetitors = competitors
        .filter(comp => comp && comp.trim() !== '')
        .map(comp => normalizeUrl(comp))
        .filter(comp => comp && comp !== 'https://');

      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: normalizedUrl,
          competitors: validCompetitors
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();

      if (data.jobId) {
        window.location.href = `/ai-analys/${data.jobId}`;
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <section className="ai-landing">
      <div className="ai-landing-container">
        {/* Hero Section */}
        <div className="ai-hero">
          <div className="ai-hero-badge"><FontAwesomeIcon icon={faRobot} /> Beta - Gratis</div>
          <h1 className="ai-hero-title">
            AI-Driven SEO-Analys med Konkurrentjämförelse
          </h1>
          <p className="ai-hero-description">
            Få en professionell SEO-rapport som visar exakt vad du ska fixa,
            i vilken ordning, och hur det påverkar din ranking.
          </p>
        </div>

        {/* CTA Section - Moved up */}
        <div className="ai-cta-section">
          <form onSubmit={handleAnalyze} className="ai-analysis-form">
            <div className="ai-form-group">
              <label className="ai-form-label">URL att analysera *</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="www.dinwebbplats.se"
                className="ai-url-input"
                required
              />
            </div>

            <div className="ai-form-group ai-competitors-group">
              <label className="ai-form-label">
                Konkurrenter (valfritt, max 3)
                <span className="ai-form-sublabel">Jämför din sajt med konkurrenternas SEO</span>
              </label>

              {competitors.map((competitor, index) => (
                <div key={index} className="ai-competitor-input-wrapper">
                  <input
                    type="text"
                    value={competitor}
                    onChange={(e) => {
                      const newCompetitors = [...competitors];
                      newCompetitors[index] = e.target.value;
                      setCompetitors(newCompetitors);
                    }}
                    placeholder={`Konkurrent ${index + 1} (t.ex. competitor.se)`}
                    className="ai-competitor-input"
                  />
                  {competitor && (
                    <button
                      type="button"
                      onClick={() => {
                        const newCompetitors = [...competitors];
                        newCompetitors[index] = '';
                        setCompetitors(newCompetitors);
                      }}
                      className="ai-competitor-remove"
                      aria-label="Ta bort konkurrent"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !url}
              className="ai-analyze-button"
            >
              {loading ? 'Analyserar...' : 'Starta AI-Analys'}
            </button>

            {error && (
              <div className="ai-error-message">
                {error}
              </div>
            )}

            <p className="ai-form-note">
              Ingen registrering krävs • Gratis under beta • Tar 5-25 minuter beroende på sidans storlek
            </p>
          </form>
        </div>

        {/* Benefits Grid */}
        <div className="ai-benefits-grid">
          <div className="ai-benefit-card">
            <div className="ai-benefit-icon"><FontAwesomeIcon icon={faSearch} /></div>
            <h3>Komplett Webbplatscrawl</h3>
            <p>Vi analyserar hela din webbplats - alla sidor, alla problem</p>
          </div>

          <div className="ai-benefit-card">
            <div className="ai-benefit-icon"><FontAwesomeIcon icon={faBolt} /></div>
            <h3>Performance-Analys</h3>
            <p>Google Lighthouse + Core Web Vitals för optimal hastighet</p>
          </div>

          <div className="ai-benefit-card">
            <div className="ai-benefit-icon"><FontAwesomeIcon icon={faChartBar} /></div>
            <h3>Konkurrentjämförelse</h3>
            <p>Automatisk analys av dina 3 största SEO-konkurrenter</p>
          </div>

          <div className="ai-benefit-card">
            <div className="ai-benefit-icon"><FontAwesomeIcon icon={faBullseye} /></div>
            <h3>Prioriterad Handlingsplan</h3>
            <p>AI prioriterar vad du ska fixa först baserat på impact</p>
          </div>

          <div className="ai-benefit-card">
            <div className="ai-benefit-icon"><FontAwesomeIcon icon={faCode} /></div>
            <h3>Konkreta Kod-exempel</h3>
            <p>Färdiga lösningar du kan copy-paste direkt</p>
          </div>

          <div className="ai-benefit-card">
            <div className="ai-benefit-icon"><FontAwesomeIcon icon={faChartLine} /></div>
            <h3>Effektuppskattningar</h3>
            <p>Förutse hur mycket din ranking & trafik kan förbättras</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="ai-comparison-section">
          <h2 className="ai-section-title">Varför välja vår AI-analys?</h2>

          <div className="ai-comparison-table">
            <div className="ai-comparison-header">
              <div></div>
              <div>Vår AI-Analys</div>
              <div>Ahrefs</div>
              <div>SEMrush</div>
              <div>SEO-Byråer</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">Pris</div>
              <div className="ai-comparison-value highlight">Gratis</div>
              <div className="ai-comparison-value">$129/mån</div>
              <div className="ai-comparison-value">$129/mån</div>
              <div className="ai-comparison-value">15-50k kr</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">SEO Crawl</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">Performance</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">LIX (svenska)</div>
              <div className="ai-comparison-value highlight">✅</div>
              <div className="ai-comparison-value">❌</div>
              <div className="ai-comparison-value">❌</div>
              <div className="ai-comparison-value">Manuell</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">Konkurrent-crawl</div>
              <div className="ai-comparison-value highlight">✅ Auto</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
              <div className="ai-comparison-value">✅</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">AI-Analys</div>
              <div className="ai-comparison-value highlight">✅</div>
              <div className="ai-comparison-value">Begränsad</div>
              <div className="ai-comparison-value">❌</div>
              <div className="ai-comparison-value">✅</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">Kod-exempel</div>
              <div className="ai-comparison-value highlight">✅</div>
              <div className="ai-comparison-value">❌</div>
              <div className="ai-comparison-value">❌</div>
              <div className="ai-comparison-value">✅</div>
            </div>

            <div className="ai-comparison-row">
              <div className="ai-comparison-label">Tid till resultat</div>
              <div className="ai-comparison-value highlight">60-90s</div>
              <div className="ai-comparison-value">Minuter</div>
              <div className="ai-comparison-value">Minuter</div>
              <div className="ai-comparison-value">Dagar</div>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="ai-what-you-get">
          <h2 className="ai-section-title">Vad får du i rapporten?</h2>

          <div className="ai-report-preview">
            <div className="ai-report-section">
              <h3><FontAwesomeIcon icon={faChartPie} /> Executive Summary</h3>
              <p>Övergripande SEO-hälsa (0-100) med sammanfattning av kritiska problem och potential</p>
            </div>

            <div className="ai-report-section">
              <h3><FontAwesomeIcon icon={faTrophy} /> Konkurrentjämförelse</h3>
              <p>Sida-vid-sida jämförelse av antal sidor, content-längd, laddningstid, meta descriptions och mer</p>
            </div>

            <div className="ai-report-section">
              <h3><FontAwesomeIcon icon={faExclamationCircle} /> Kritiska Problem</h3>
              <p>Top 3 problem du MÅSTE fixa nu, med konkreta lösningar och kod-exempel</p>
            </div>

            <div className="ai-report-section">
              <h3><FontAwesomeIcon icon={faLightbulb} /> Förbättringsmöjligheter</h3>
              <p>5-8 viktiga optimeringar som ger stor effekt på medellång sikt</p>
            </div>

            <div className="ai-report-section">
              <h3><FontAwesomeIcon icon={faCode} /> Kod-exempel</h3>
              <p>Före/efter-kod för dina största problem - copy-paste och fixa direkt</p>
            </div>

            <div className="ai-report-section">
              <h3><FontAwesomeIcon icon={faChartLine} /> Förväntad Effekt</h3>
              <p>Uppskattningar på förbättrad laddningstid, ranking, trafik och bounce rate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AiAnalysisLanding;
