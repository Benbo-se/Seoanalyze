import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, Image, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import styles from './enhancedSeoTabSocial.module.css';

const EnhancedSeoTabSocial = ({ result }) => {
  const [previewPlatform, setPreviewPlatform] = useState('facebook');

  if (!result?.social && !result?.openGraph && !result?.twitter) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <AlertTriangle className={styles.errorIcon} size={20} />
          <p>Sociala medier-data kunde inte analyseras</p>
        </div>
      </div>
    );
  }

  const social = result.social || {};
  const og = result.openGraph || social.openGraph || {};
  const twitter = result.twitter || social.twitter || {};

  const socialPlatforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      data: og,
      requiredFields: ['title', 'description', 'image'],
      previewData: {
        title: String(og.title || result.title || ''),
        description: String(og.description || result.metaDescription || ''),
        image: String(og.image || result.images?.[0]?.src || ''),
        url: String(result.url || '')
      }
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      data: twitter,
      requiredFields: ['card', 'title', 'description'],
      previewData: {
        title: String(twitter.title || og.title || result.title || ''),
        description: String(twitter.description || og.description || result.metaDescription || ''),
        image: String(twitter.image || og.image || result.images?.[0]?.src || ''),
        card: String(twitter.card || 'summary_large_image')
      }
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      data: og, // LinkedIn uses OpenGraph
      requiredFields: ['title', 'description', 'image'],
      previewData: {
        title: String(og.title || result.title || ''),
        description: String(og.description || result.metaDescription || ''),
        image: String(og.image || result.images?.[0]?.src || ''),
        url: String(result.url || '')
      }
    }
  ];

  const getFieldStatus = (platform, field) => {
    const value = platform.data && platform.data[field] ? String(platform.data[field]) : '';
    if (!value || value === '') return 'missing';

    // Check length recommendations
    if (field === 'title' && value.length > 60) return 'warning';
    if (field === 'description' && (value.length < 120 || value.length > 200)) return 'warning';

    return 'good';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircle className={styles.iconGood} size={14} />;
      case 'warning': return <AlertTriangle className={styles.iconWarning} size={14} />;
      case 'missing': return <AlertTriangle className={styles.iconPoor} size={14} />;
      default: return null;
    }
  };

  const renderPreview = () => {
    const platform = socialPlatforms.find(p => p.id === previewPlatform);
    const preview = platform.previewData;

    if (previewPlatform === 'facebook') {
      return (
        <div className={styles.facebookPreview}>
          <div className={styles.previewHeader}>
            <Facebook size={16} />
            <span>Facebook förhandsvisning</span>
          </div>
          <div className={styles.facebookCard}>
            <div className={styles.facebookImage}>
              {preview.image ? (
                <img src={preview.image} alt="Social media preview" onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }} />
              ) : null}
              <div className={styles.imagePlaceholder} style={{display: preview.image ? 'none' : 'flex'}}>
                <Image size={48} />
                <span>Ingen bild</span>
              </div>
            </div>
            <div className={styles.facebookContent}>
              <div className={styles.facebookUrl}>{preview.url}</div>
              <div className={styles.facebookTitle}>{preview.title || 'Titel saknas'}</div>
              <div className={styles.facebookDesc}>{preview.description || 'Beskrivning saknas'}</div>
            </div>
          </div>
        </div>
      );
    }

    if (previewPlatform === 'twitter') {
      return (
        <div className={styles.twitterPreview}>
          <div className={styles.previewHeader}>
            <Twitter size={16} />
            <span>Twitter förhandsvisning ({preview.card})</span>
          </div>
          <div className={styles.twitterCard}>
            <div className={styles.twitterImage}>
              {preview.image ? (
                <img src={preview.image} alt="Social media preview" onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }} />
              ) : null}
              <div className={styles.imagePlaceholder} style={{display: preview.image ? 'none' : 'flex'}}>
                <Image size={48} />
                <span>Ingen bild</span>
              </div>
            </div>
            <div className={styles.twitterContent}>
              <div className={styles.twitterTitle}>{preview.title || 'Titel saknas'}</div>
              <div className={styles.twitterDesc}>{preview.description || 'Beskrivning saknas'}</div>
              <div className={styles.twitterUrl}>{String(result.url || '')}</div>
            </div>
          </div>
        </div>
      );
    }

    // LinkedIn preview (similar to Facebook)
    return (
      <div className={styles.linkedinPreview}>
        <div className={styles.previewHeader}>
          <Linkedin size={16} />
          <span>LinkedIn förhandsvisning</span>
        </div>
        <div className={styles.linkedinCard}>
          <div className={styles.linkedinImage}>
            {preview.image ? (
              <img src={preview.image} alt="Preview" onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }} />
            ) : null}
            <div className={styles.imagePlaceholder} style={{display: preview.image ? 'none' : 'flex'}}>
              <Image size={48} />
              <span>Ingen bild</span>
            </div>
          </div>
          <div className={styles.linkedinContent}>
            <div className={styles.linkedinTitle}>{preview.title || 'Titel saknas'}</div>
            <div className={styles.linkedinDesc}>{preview.description || 'Beskrivning saknas'}</div>
            <div className={styles.linkedinUrl}>{preview.url}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Platforms Analysis */}
      <div className={styles.platformsGrid}>
        {socialPlatforms.map((platform) => {
          const IconComponent = platform.icon;
          const presentFields = platform.requiredFields.filter(field =>
            platform.data && platform.data[field] && String(platform.data[field]) !== ''
          ).length;
          const totalFields = platform.requiredFields.length;
          const completionRate = (presentFields / totalFields) * 100;

          return (
            <div key={platform.id} className={styles.platformCard}>
              <div className={styles.platformHeader}>
                <div className={styles.platformIcon}>
                  <IconComponent size={20} />
                </div>
                <div>
                  <h4 className={styles.platformName}>{platform.name}</h4>
                  <div className={styles.completionRate}>
                    {presentFields}/{totalFields} fält konfigurerade ({Math.round(completionRate)}%)
                  </div>
                </div>
              </div>

              <div className={styles.fieldsList}>
                {platform.requiredFields.map((field) => {
                  const status = getFieldStatus(platform, field);
                  const value = platform.data && platform.data[field] ? String(platform.data[field]) : '';

                  return (
                    <div key={field} className={styles.fieldItem}>
                      <div className={styles.fieldName}>
                        {getStatusIcon(status)}
                        <span>{field === 'card' ? 'Card Type' : field.charAt(0).toUpperCase() + field.slice(1)}</span>
                      </div>
                      <div className={styles.fieldValue}>
                        {value ? (
                          <>
                            <span>{value.length > 50 ? `${value.substring(0, 50)}...` : value}</span>
                            {field !== 'card' && (
                              <small className={styles.fieldLength}>
                                ({value.length} tecken)
                              </small>
                            )}
                          </>
                        ) : (
                          <span className={styles.fieldMissing}>Saknas</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Section */}
      <div className={styles.previewSection}>
        <div className={styles.previewControls}>
          <h3 className={styles.previewTitle}>
            <Eye size={20} />
            Förhandsvisning
          </h3>
          <div className={styles.previewTabs}>
            {socialPlatforms.map((platform) => {
              const IconComponent = platform.icon;
              return (
                <button
                  key={platform.id}
                  className={`${styles.previewTab} ${previewPlatform === platform.id ? styles.previewTabActive : ''}`}
                  onClick={() => setPreviewPlatform(platform.id)}
                >
                  <IconComponent size={16} />
                  {platform.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.previewContainer}>
          {renderPreview()}
        </div>
      </div>

      {/* Recommendations */}
      <div className={styles.recommendationsCard}>
        <div className={styles.recommendationsHeader}>
          <Share2 className={styles.recommendationsIcon} size={20} />
          <h4>Optimeringsrekommendationer</h4>
        </div>
        <ul className={styles.recommendationsList}>
          <li>Använd bilder med minst 1200x630 pixlar för bästa kvalitet</li>
          <li>Håll titlar under 60 tecken för alla plattformar</li>
          <li>Skriv beskrivningar mellan 120-200 tecken</li>
          <li>Testa dina delningar med respektive plattforms debugger</li>
          <li>Använd konsekventa bilder och meddelanden över alla plattformar</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedSeoTabSocial;