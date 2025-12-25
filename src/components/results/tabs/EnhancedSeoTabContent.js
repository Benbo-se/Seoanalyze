import React, { useState } from 'react';
import { FileText, Hash, Image, Link, BarChart3, AlertCircle, CheckCircle, Info } from 'lucide-react';
import styles from './enhancedSeoTabContent.module.css';

const EnhancedSeoTabContent = ({ result }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Extract data with correct structure based on original SeoTabContent
  const wordCount = result?.wordCount || 0;
  const headings = result?.headings || {};
  const images = result?.images || {};
  const keywordDensity = result?.keywordDensity || [];

  const tabs = [
    {
      id: 'overview',
      name: 'Översikt',
      icon: BarChart3,
      content: renderOverviewTab()
    },
    {
      id: 'headings',
      name: 'Rubriker',
      icon: Hash,
      content: renderHeadingsTab()
    },
    {
      id: 'images',
      name: 'Bilder',
      icon: Image,
      content: renderImagesTab()
    },
    {
      id: 'keywords',
      name: 'Nyckelord',
      icon: BarChart3,
      content: renderKeywordsTab()
    }
  ];

  function renderOverviewTab() {
    const readabilityScore = result?.readability?.score || 0;
    const h1Count = headings?.h1?.count || 0;
    const imagesTotal = images?.total || 0;
    const imagesWithoutAlt = images?.withoutAlt || 0;

    return (
      <div className={styles.tabContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FileText size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{wordCount}</span>
              <span className={styles.statLabel}>Ord totalt</span>
            </div>
            <div className={styles.statStatus}>
              {wordCount < 300 ? (
                <AlertCircle className={styles.iconWarning} size={16} />
              ) : (
                <CheckCircle className={styles.iconSuccess} size={16} />
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Hash size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{h1Count}</span>
              <span className={styles.statLabel}>H1 rubriker</span>
            </div>
            <div className={styles.statStatus}>
              {h1Count === 1 ? (
                <CheckCircle className={styles.iconSuccess} size={16} />
              ) : (
                <AlertCircle className={styles.iconWarning} size={16} />
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Image size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{Math.max(0, imagesTotal - imagesWithoutAlt)} / {imagesTotal}</span>
              <span className={styles.statLabel}>Bilder med alt-text</span>
            </div>
            <div className={styles.statStatus}>
              {imagesWithoutAlt === 0 && imagesTotal > 0 ? (
                <CheckCircle className={styles.iconSuccess} size={16} />
              ) : imagesWithoutAlt > 0 ? (
                <AlertCircle className={styles.iconWarning} size={16} />
              ) : (
                <Info className={styles.iconInfo} size={16} />
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{readabilityScore}</span>
              <span className={styles.statLabel}>LIX-poäng</span>
            </div>
            <div className={styles.statStatus}>
              {readabilityScore > 0 && readabilityScore < 40 ? (
                <CheckCircle className={styles.iconSuccess} size={16} />
              ) : readabilityScore > 0 ? (
                <AlertCircle className={styles.iconWarning} size={16} />
              ) : (
                <Info className={styles.iconInfo} size={16} />
              )}
            </div>
          </div>
        </div>

        <div className={styles.contentAnalysis}>
          <h4 className={styles.analysisTitle}>Innehållsanalys</h4>
          <div className={styles.analysisList}>
            {wordCount < 300 && (
              <div className={styles.analysisItem}>
                <AlertCircle className={styles.iconWarning} size={16} />
                <span>Innehållet är för kort ({wordCount} ord). Sikta på minst 300 ord för bättre SEO.</span>
              </div>
            )}
            {h1Count !== 1 && (
              <div className={styles.analysisItem}>
                <AlertCircle className={styles.iconWarning} size={16} />
                <span>Använd exakt en H1-rubrik per sida (nu: {h1Count}).</span>
              </div>
            )}
            {imagesWithoutAlt > 0 && (
              <div className={styles.analysisItem}>
                <AlertCircle className={styles.iconWarning} size={16} />
                <span>{imagesWithoutAlt} bilder saknar alt-text.</span>
              </div>
            )}
            {wordCount >= 300 && h1Count === 1 && imagesWithoutAlt === 0 && (
              <div className={styles.analysisItem}>
                <CheckCircle className={styles.iconSuccess} size={16} />
                <span>Bra grundstruktur för innehållet!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderHeadingsTab() {
    return (
      <div className={styles.tabContent}>
        <div className={styles.headingsOverview}>
          <h4 className={styles.analysisTitle}>Rubrikstruktur</h4>
          <div className={styles.headingStats}>
            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(level => {
              const count = headings[level]?.count || 0;
              return (
                <div key={level} className={styles.headingStat}>
                  <span className={styles.headingTag}>{level.toUpperCase()}</span>
                  <span className={styles.headingCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.headingsAnalysis}>
          <h5 className={styles.analysisSubtitle}>Analys</h5>
          <div className={styles.analysisList}>
            {headings?.h1?.count === 0 && (
              <div className={styles.analysisItem}>
                <AlertCircle className={styles.iconWarning} size={16} />
                <span>Ingen H1-rubrik hittades. Lägg till en beskrivande H1.</span>
              </div>
            )}
            {headings?.h1?.count > 1 && (
              <div className={styles.analysisItem}>
                <AlertCircle className={styles.iconWarning} size={16} />
                <span>Flera H1-rubriker hittades ({headings.h1.count}). Använd endast en H1 per sida.</span>
              </div>
            )}
            {headings?.h1?.count === 1 && (
              <div className={styles.analysisItem}>
                <CheckCircle className={styles.iconSuccess} size={16} />
                <span>Perfekt! En H1-rubrik hittades.</span>
              </div>
            )}
            {(headings?.h2?.count || 0) === 0 && (
              <div className={styles.analysisItem}>
                <Info className={styles.iconInfo} size={16} />
                <span>Överväg att lägga till H2-rubriker för bättre struktur.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderImagesTab() {
    const imagesTotal = images?.total || 0;
    const imagesWithoutAlt = images?.withoutAlt || 0;
    const imagesWithAlt = Math.max(0, imagesTotal - imagesWithoutAlt);

    return (
      <div className={styles.tabContent}>
        <div className={styles.imagesOverview}>
          <h4 className={styles.analysisTitle}>Bildanalys</h4>
          <div className={styles.imageStats}>
            <div className={styles.imageStat}>
              <span className={styles.imageLabel}>Totalt</span>
              <span className={styles.imageCount}>{imagesTotal}</span>
            </div>
            <div className={styles.imageStat}>
              <span className={styles.imageLabel}>Med alt-text</span>
              <span className={`${styles.imageCount} ${styles.success}`}>{imagesWithAlt}</span>
            </div>
            <div className={styles.imageStat}>
              <span className={styles.imageLabel}>Utan alt-text</span>
              <span className={`${styles.imageCount} ${styles.warning}`}>{imagesWithoutAlt}</span>
            </div>
          </div>
        </div>

        <div className={styles.imagesAnalysis}>
          <h5 className={styles.analysisSubtitle}>Rekommendationer</h5>
          <div className={styles.analysisList}>
            {imagesTotal === 0 && (
              <div className={styles.analysisItem}>
                <Info className={styles.iconInfo} size={16} />
                <span>Inga bilder hittades på sidan.</span>
              </div>
            )}
            {imagesWithoutAlt > 0 && (
              <div className={styles.analysisItem}>
                <AlertCircle className={styles.iconWarning} size={16} />
                <span>Lägg till beskrivande alt-text för {imagesWithoutAlt} bilder.</span>
              </div>
            )}
            {imagesTotal > 0 && imagesWithoutAlt === 0 && (
              <div className={styles.analysisItem}>
                <CheckCircle className={styles.iconSuccess} size={16} />
                <span>Alla bilder har alt-text. Bra jobbat!</span>
              </div>
            )}
            {imagesTotal > 10 && (
              <div className={styles.analysisItem}>
                <Info className={styles.iconInfo} size={16} />
                <span>Många bilder ({imagesTotal}). Överväg bildoptimering för prestanda.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderKeywordsTab() {
    const hasKeywords = Array.isArray(keywordDensity) && keywordDensity.length > 0;

    return (
      <div className={styles.tabContent}>
        <div className={styles.keywordsOverview}>
          <h4 className={styles.analysisTitle}>Nyckelordstäthet</h4>

          {hasKeywords ? (
            <div className={styles.keywordsList}>
              {keywordDensity.slice(0, 15).map((keyword, index) => (
                <div key={keyword?.word || index} className={styles.keywordItem}>
                  <span className={styles.keywordWord}>{keyword?.word || 'N/A'}</span>
                  <div className={styles.keywordBar}>
                    <div
                      className={styles.keywordFill}
                      style={{ width: `${Math.min(100, (keyword?.density || 0) * 20)}%` }}
                    />
                  </div>
                  <span className={styles.keywordDensity}>
                    {keyword?.density ? parseFloat(keyword.density).toFixed(1) : '0'}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <BarChart3 size={48} className={styles.emptyIcon} />
              <p>Ingen nyckelordstäthet kunde analyseras</p>
            </div>
          )}
        </div>

        {hasKeywords && (
          <div className={styles.keywordsAnalysis}>
            <h5 className={styles.analysisSubtitle}>Tips</h5>
            <div className={styles.analysisList}>
              <div className={styles.analysisItem}>
                <Info className={styles.iconInfo} size={16} />
                <span>Sikta på 1-3% täthet för huvudnyckelord.</span>
              </div>
              <div className={styles.analysisItem}>
                <Info className={styles.iconInfo} size={16} />
                <span>Undvik keyword stuffing - fokusera på naturligt språk.</span>
              </div>
              <div className={styles.analysisItem}>
                <Info className={styles.iconInfo} size={16} />
                <span>Använd synonymer och relaterade termer för variation.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabsHeader}>
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className={styles.tabPanel}>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default EnhancedSeoTabContent;