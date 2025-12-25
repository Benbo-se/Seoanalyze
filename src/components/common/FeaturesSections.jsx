'use client';

import React from 'react';
import YouTubeThumb from './YouTubeThumb';

const FeaturesSections = () => {

  return (
    <>
      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">SEO-verktyg med LIX-analys för svenska texter</h2>
          <p className="features-subtitle">
            Få en tydlig bild av din webbplats prestanda på bara några sekunder – helt gratis och utan registrering. Vårt verktyg kombinerar tre kraftfulla analyser i ett. Det hjälper dig att upptäcka problem som annars är svåra att hitta.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>SEO-analys</h3>
              <p>Identifiera tekniska fel, saknade meta-taggar och förbättringsmöjligheter som påverkar din synlighet i Google.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Prestanda-analys</h3>
              <p>Mät laddningstider, mobilvänlighet och Core Web Vitals med samma teknologi som Google Lighthouse använder.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Webbplatscrawling</h3>
              <p>Skanna upp till 100 sidor för att hitta brutna länkar, dubbletter och strukturproblem som kan skada din ranking.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Swedish Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div style={{maxWidth: '900px', margin: '0 auto', textAlign: 'left'}}>
            <h3 style={{fontSize: '1.8rem', marginBottom: '20px', color: 'var(--text-dark)'}}>Utvecklat för svenska webbplatser</h3>
            <p style={{fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-medium)', marginBottom: '20px'}}>
              Det som gör vårt verktyg unikt är att det är anpassat för svenska sajter och sökbeteenden:
            </p>
            <ul style={{listStyle: 'none', padding: 0, marginBottom: '40px'}}>
              <li style={{padding: '12px 0', borderBottom: '1px solid rgba(255,107,107,0.1)', color: 'var(--text-dark)'}}>
                <strong>LIX-läsbarhet</strong> – världens enda SEO-verktyg som analyserar svenska texters läsbarhet med en professionell poängsättning.
              </li>
              <li style={{padding: '12px 0', borderBottom: '1px solid rgba(255,107,107,0.1)', color: 'var(--text-dark)'}}>
                <strong>Svenska tecken</strong> – korrekt hantering av å, ä och ö i alla analyser.
              </li>
              <li style={{padding: '12px 0', borderBottom: '1px solid rgba(255,107,107,0.1)', color: 'var(--text-dark)'}}>
                <strong>Lokala insikter</strong> – optimerat för Google.se och hur svenska användare söker.
              </li>
            </ul>
          </div>
        </div>
      </section>
      
      {/* What We Find Section */}
      <section style={{padding: '80px 0', background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)'}}>
        <div className="features-container">
          <h2 style={{textAlign: 'center', fontSize: '2.2rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '20px'}}>
            Vad hittar vi i analysen?
          </h2>
          <p style={{textAlign: 'center', fontSize: '1.15rem', color: 'var(--text-medium)', maxWidth: '750px', margin: '0 auto 40px'}}>
            Vårt verktyg går igenom hela webbplatsen. Det letar efter både tekniska fel och förbättringsmöjligheter. Här är några exempel på vad du får reda på:
          </p>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto'}}>
            <div className="analysis-card" style={{background: 'rgba(255,255,255,0.95)', border: '2px solid rgba(255,107,107,0.15)', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', cursor: 'pointer'}}>
              <h3 style={{fontSize: '1.4rem', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-color)'}}>SEO & Innehåll</h3>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Titlar, meta-beskrivningar, H1-H6</li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• <strong style={{color: 'var(--text-dark)'}}>LIX-läsbarhet för svenska texter</strong></li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Alt-texter på bilder</li>
                <li style={{padding: '8px 0', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Nyckelordstäthet & ordantal</li>
              </ul>
            </div>
            
            <div className="analysis-card" style={{background: 'rgba(255,255,255,0.95)', border: '2px solid rgba(255,107,107,0.15)', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', cursor: 'pointer'}}>
              <h3 style={{fontSize: '1.4rem', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-color)'}}>Teknisk SEO</h3>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Brutna länkar (404, 500)</li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Omdirigeringar & dubbletter</li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Robots.txt & sitemap.xml</li>
                <li style={{padding: '8px 0', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• HTTPS & säkerhetsheaders</li>
              </ul>
            </div>
            
            <div className="analysis-card" style={{background: 'rgba(255,255,255,0.95)', border: '2px solid rgba(255,107,107,0.15)', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', cursor: 'pointer'}}>
              <h3 style={{fontSize: '1.4rem', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-color)'}}>Prestanda & Core Web Vitals</h3>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Largest Contentful Paint (LCP)</li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Cumulative Layout Shift (CLS)</li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Total Blocking Time (TBT)</li>
                <li style={{padding: '8px 0', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Mobilvänlighet & viewport</li>
              </ul>
            </div>
            
            <div className="analysis-card" style={{background: 'rgba(255,255,255,0.95)', border: '2px solid rgba(255,107,107,0.15)', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', cursor: 'pointer'}}>
              <h3 style={{fontSize: '1.4rem', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-color)'}}>Social & Strukturerad data</h3>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Open Graph-taggar</li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Twitter Cards</li>
                <li style={{padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Schema.org markup</li>
                <li style={{padding: '8px 0', color: 'var(--text-medium)', fontSize: '0.95rem'}}>• Canonical URL</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Additional Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div style={{maxWidth: '900px', margin: '0 auto', textAlign: 'left'}}>
            <h3 style={{fontSize: '1.8rem', marginBottom: '20px', color: 'var(--text-dark)'}}>Inte bara problem – utan lösningar</h3>
            <p style={{fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-medium)', marginBottom: '40px'}}>
              När ett problem upptäcks får du tydliga rekommendationer och färdiga kodexempel att kopiera direkt in på din webbplats. Steg-för-steg-instruktioner på svenska gör det enkelt även för den som inte är teknisk expert.
            </p>
            
            <h3 style={{fontSize: '1.8rem', marginBottom: '20px', color: 'var(--text-dark)'}}>Professionella rapporter för ditt team</h3>
            <ul style={{listStyle: 'none', padding: 0, marginBottom: '40px'}}>
              <li style={{padding: '12px 0', borderBottom: '1px solid rgba(255,107,107,0.1)', color: 'var(--text-dark)'}}>
                • Interaktiva visualiseringar istället för tråkiga textlistor.
              </li>
              <li style={{padding: '12px 0', borderBottom: '1px solid rgba(255,107,107,0.1)', color: 'var(--text-dark)'}}>
                • Export till PDF – perfekt för att dela med kollegor eller kunder.
              </li>
              <li style={{padding: '12px 0', borderBottom: '1px solid rgba(255,107,107,0.1)', color: 'var(--text-dark)'}}>
                • Delbara länkar som fungerar i 90 dagar.
              </li>
              <li style={{padding: '12px 0', borderBottom: '1px solid rgba(255,107,107,0.1)', color: 'var(--text-dark)'}}>
                • Historisk spårning så att du kan följa förbättringar över tid.
              </li>
            </ul>
            
            <h3 style={{fontSize: '1.8rem', marginBottom: '20px', color: 'var(--text-dark)'}}>Varför välja vårt verktyg?</h3>
            
            <div style={{background: 'rgba(255,107,107,0.08)', border: '2px solid rgba(255,107,107,0.2)', padding: '30px', borderRadius: '16px', margin: '20px 0 40px', boxShadow: '0 4px 20px rgba(255,107,107,0.1)'}}>
              <p style={{fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-medium)', marginBottom: '16px'}}>
                Internationella SEO-verktyg som SEMrush och Ahrefs kostar tusentals kronor varje månad och saknar ofta stöd för svenska språket.
              </p>
              <p style={{fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-medium)', marginBottom: '24px'}}>
                Vår tjänst är gratis, byggd för svenska företag och levererar insikter som är direkt användbara.
              </p>
              <p style={{fontSize: '1.3rem', fontWeight: '600', textAlign: 'center', color: 'var(--primary-color)', margin: 0}}>
                Starta din analys nu – inga konton, ingen betalning, bara resultat på 30 sekunder.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section style={{padding: '80px 0', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 20px'}}>
          <h2 style={{textAlign: 'center', fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '20px'}}>
            Se hur det fungerar
          </h2>
          <p style={{textAlign: 'center', fontSize: '1.25rem', color: 'var(--text-medium)', marginBottom: '50px', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto'}}>
            Se alla tre analysverktygen i aktion och lär dig tolka resultaten
          </p>
          
          {/* Video Container with Smart Thumbnail */}
          <div style={{maxWidth: '900px', margin: '0 auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', borderRadius: '20px', overflow: 'hidden'}}>
            <YouTubeThumb id="hda9pweGWmo" />
          </div>
          
          {/* Feature highlights under video */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '50px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto'}}>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px'}}>0:00</div>
              <div style={{color: 'var(--text-medium)'}}>SEO-analys med LIX-poäng</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px'}}>0:35</div>
              <div style={{color: 'var(--text-medium)'}}>Lighthouse Core Web Vitals</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '8px'}}>1:14</div>
              <div style={{color: 'var(--text-medium)'}}>Crawling av 100 sidor</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSections;