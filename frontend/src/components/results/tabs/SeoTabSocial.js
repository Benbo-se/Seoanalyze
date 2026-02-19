import React from 'react';
import { svStatus } from '../../../utils/svStatus';

const SeoTabSocial = ({ result }) => {
  if (!result?.social) {
    return (
      <div className="info-card">
        <div className="card-header">
          <div className="card-icon social"></div>
          <div className="card-title">Sociala medier & Open Graph</div>
        </div>
        <p style={{ color: '#666', fontSize: '14px', padding: '20px' }}>
          Saknas: Social media-data kunde inte analyseras
        </p>
      </div>
    );
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon social"></div>
        <div className="card-title">Sociala medier & Open Graph</div>
      </div>
      <div className="stats-row">
        <span className="stat-label">Poäng</span>
        <span className={`stat-value ${(result.social.score || 0) >= 70 ? 'score-good' : (result.social.score || 0) >= 50 ? 'score-warning' : 'score-poor'}`}>
          Betyg: {result.social.grade || 'N/A'} ({result.social.score || 0}/100)
        </span>
      </div>
      
      <div className="stats-row">
        <span className="stat-label">Open Graph</span>
        <span className="stat-value"></span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Titel</span>
        <span className="stat-value">{svStatus(result.social.openGraph?.title)}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Beskrivning</span>
        <span className="stat-value">{svStatus(result.social.openGraph?.description)}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Bild</span>
        <span className={`stat-value ${result.social.openGraph?.image ? 'score-good' : 'score-poor'}`}>
          {result.social.openGraph?.image ? 'Finns' : 'Saknas'}
        </span>
      </div>
      
      <div className="stats-row">
        <span className="stat-label">Twitter-kort</span>
        <span className="stat-value"></span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Korttyp</span>
        <span className="stat-value">{svStatus(result.social.twitterCards?.card)}</span>
      </div>
      <div className="stats-row">
        <span className="stat-label">Titel</span>
        <span className="stat-value">{svStatus(result.social.twitterCards?.title)}</span>
      </div>
      
      <div className="stats-row">
        <span className="stat-label">Förhandsvisning</span>
        <span className="stat-value">
          {result.social.openGraph?.title ? 'Konfigurerad' : 'Saknas'}
        </span>
      </div>
    </div>
  );
};

export default SeoTabSocial;