'use client';

import Link from 'next/link';

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="not-found-page">
      <div className="warm-overlay"></div>
      <div className="container">
        <div className="not-found-content">
          <div className="not-found-icon">🔍</div>
          <h1 className="not-found-title">404 - Sida hittades inte</h1>
          <p className="not-found-description">
            Tyvärr kunde vi inte hitta sidan du letade efter. 
            Kanske har länken flyttats eller så har du råkat skriva fel adress?
          </p>
          
          <div className="not-found-actions">
            <Link href="/" className="action-button">
              🏠 Tillbaka till startsidan
            </Link>
            <button 
              onClick={handleGoBack} 
              className="secondary-button"
            >
              ← Gå tillbaka
            </button>
          </div>
          
          <div className="not-found-suggestions">
            <h3>Vad kan du göra istället?</h3>
            <ul>
              <li><Link href="/">Starta en ny SEO-analys</Link></li>
              <li><Link href="/">Testa våra analysverktyg</Link></li>
              <li>Kontrollera att länken är korrekt stavad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}