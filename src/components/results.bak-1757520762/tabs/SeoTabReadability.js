import React from 'react';

const SeoTabReadability = ({ result }) => {
  if (!result || !result.readability) {
    return null;
  }

  return (
    <div className="info-card">
      <div className="card-header">
        <div className="card-icon content"></div>
        <div className="card-title">LIX Läsbarhet för Svenska
          <span className="tooltip-trigger" title="Läsbarhetsindex (LIX) för svenska texter - lägre värde = lättare att läsa">ⓘ</span>
        </div>
      </div>
      
      {/* Score Översikt */}
      <div className="metric-grid" style={{marginBottom: '20px'}}>
        <div className="metric-item">
          <div className={`metric-score ${result.readability.lix <= 40 ? 'score-good' : result.readability.lix <= 50 ? 'score-warning' : 'score-poor'}`}>
            {result.readability.lix}
          </div>
          <div className="metric-label">LIX-värde</div>
        </div>
        <div className="metric-item">
          <div className={`metric-score ${result.readability.score >= 70 ? 'score-good' : result.readability.score >= 50 ? 'score-warning' : 'score-poor'}`}>
            {result.readability.score}/100
          </div>
          <div className="metric-label">Läsbarhet</div>
        </div>
        <div className="metric-item">
          <div className={`metric-score ${result.readability.seoScore >= 70 ? 'score-good' : result.readability.seoScore >= 50 ? 'score-warning' : 'score-poor'}`}>
            {result.readability.seoScore}/100
          </div>
          <div className="metric-label">SEO-poäng</div>
        </div>
        <div className="metric-item">
          <div className={`metric-score ${result.readability.grade === 'Medel' || result.readability.grade === 'Lätt' ? 'score-good' : 'score-warning'}`}>
            {result.readability.grade}
          </div>
          <div className="metric-label">Nivå</div>
        </div>
      </div>

      {/* LIX Badge System */}
      <div style={{marginBottom: '20px'}}>
        <h4 style={{marginBottom: '15px'}}>Läsbarhetsbadge
          <span className="tooltip-trigger" title="Badge baserat på LIX-värde - visar textens tillgänglighet">ⓘ</span>
        </h4>
        <div className="lix-badge-container" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <div className={`lix-badge ${
            !result.readability.lix || result.readability.lix === 0 ? 'badge-info' :
            result.readability.lix <= 30 ? 'badge-excellent' : 
            result.readability.lix <= 40 ? 'badge-good' : 
            result.readability.lix <= 50 ? 'badge-medium' : 
            result.readability.lix <= 60 ? 'badge-hard' : 'badge-very-hard'
          }`}>
            <div className="badge-icon">
              {!result.readability.lix || result.readability.lix === 0 ? 'ℹ️' :
               result.readability.lix <= 30 ? '🏆' : 
               result.readability.lix <= 40 ? '🌟' : 
               result.readability.lix <= 50 ? '✅' : 
               result.readability.lix <= 60 ? '⚠️' : '❌'}
            </div>
            <div className="badge-text">
              <div className="badge-title">{result.readability.level}</div>
              <div className="badge-subtitle">LIX: {result.readability.lix}</div>
            </div>
          </div>
          <div className="badge-description">
            <strong>{result.readability.grade}:</strong> {result.readability.description}
          </div>
        </div>
      </div>

      {/* Detaljerad Analys */}
      {result.readability.metrics && (
        <>
          <h4 style={{marginTop: '25px', marginBottom: '15px'}}>Detaljerad Analys</h4>
          <div className="stats-grid">
            <div className="stats-row">
              <span className="stat-label">Totalt antal ord</span>
              <span className="stat-value">{result.readability.metrics.totalWords}</span>
            </div>
            <div className="stats-row">
              <span className="stat-label">Antal meningar</span>
              <span className="stat-value">{result.readability.metrics.totalSentences}</span>
            </div>
            <div className="stats-row">
              <span className="stat-label">Ord per mening (snitt)</span>
              <span className={`stat-value ${result.readability.metrics.avgSentenceLength <= 15 ? 'score-good' : result.readability.metrics.avgSentenceLength <= 20 ? 'score-warning' : 'score-poor'}`}>
                {result.readability.metrics.avgSentenceLength}
              </span>
            </div>
            <div className="stats-row">
              <span className="stat-label">Långa ord ({'>'}6 bokstäver)</span>
              <span className={`stat-value ${result.readability.metrics.longWords <= 30 ? 'score-good' : result.readability.metrics.longWords <= 40 ? 'score-warning' : 'score-poor'}`}>
                {result.readability.metrics.longWords}% 
              </span>
            </div>
            <div className="stats-row">
              <span className="stat-label">Långa meningar ({'>'}25 ord)</span>
              <span className={`stat-value ${result.readability.metrics.longSentences === 0 ? 'score-good' : result.readability.metrics.longSentences <= 2 ? 'score-warning' : 'score-poor'}`}>
                {result.readability.metrics.longSentences} st
              </span>
            </div>
            <div className="stats-row">
              <span className="stat-label">Ord per stycke (snitt)</span>
              <span className={`stat-value ${result.readability.metrics.avgWordsPerParagraph <= 100 ? 'score-good' : result.readability.metrics.avgWordsPerParagraph <= 150 ? 'score-warning' : 'score-poor'}`}>
                {result.readability.metrics.avgWordsPerParagraph}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Rekommendationer */}
      {result.readability.recommendations && result.readability.recommendations.length > 0 && (
        <>
          <h4 style={{marginTop: '25px', marginBottom: '15px'}}>Handlingsplan för Bättre Läsbarhet</h4>
          <div className="recommendations-list">
            {result.readability.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-item ${rec.type}`} style={{
                padding: '12px 15px',
                marginBottom: '10px',
                borderRadius: '8px',
                borderLeft: `4px solid ${
                  rec.type === 'critical' ? '#e53e3e' : 
                  rec.type === 'warning' ? '#d69e2e' : 
                  rec.type === 'success' ? '#38a169' : '#3182ce'
                }`,
                backgroundColor: `${
                  rec.type === 'critical' ? '#fed7d7' : 
                  rec.type === 'warning' ? '#fef5e7' : 
                  rec.type === 'success' ? '#f0fff4' : '#ebf8ff'
                }`
              }}>
                <div className="rec-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                  <span className="rec-icon">
                    {rec.type === 'critical' ? '🔴' : rec.type === 'warning' ? '🟡' : rec.type === 'success' ? '🟢' : '🔵'}
                  </span>
                  <span className="rec-impact" style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: rec.type === 'critical' ? '#c53030' : rec.type === 'warning' ? '#b7791f' : rec.type === 'success' ? '#2f855a' : '#2b6cb0'
                  }}>
                    {rec.impact === 'high' ? 'Hög effekt' : rec.impact === 'medium' ? 'Medel effekt' : 'Låg effekt'}
                  </span>
                </div>
                <p style={{margin: 0, fontSize: '14px', lineHeight: '1.4'}}>
                  {rec.text}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* LIX Poängskala */}
      <div style={{marginTop: '25px'}}>
        <h4 style={{marginBottom: '15px'}}>LIX Poängskala</h4>
        <div className="lix-scale" style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div className="scale-item" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div className="scale-badge badge-excellent">{'< 30'}</div>
            <span>Mycket lätt (Barnbok)</span>
          </div>
          <div className="scale-item" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div className="scale-badge badge-good">30-40</div>
            <span>Lätt (Skönlitteratur)</span>
          </div>
          <div className="scale-item" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div className="scale-badge badge-medium">40-50</div>
            <span>Medel (Normaltext)</span>
          </div>
          <div className="scale-item" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div className="scale-badge badge-hard">50-60</div>
            <span>Svår (Facktext)</span>
          </div>
          <div className="scale-item" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div className="scale-badge badge-very-hard">{' > 60'}</div>
            <span>Mycket svår (Vetenskaplig text)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoTabReadability;