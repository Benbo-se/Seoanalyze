import React, { useState } from 'react';
import { Search, Monitor, Smartphone, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import styles from './enhancedSeoTabMeta.module.css';

const EnhancedSeoTabMeta = ({ result }) => {
  const [viewMode, setViewMode] = useState('desktop');
  const [copied, setCopied] = useState(false);

  const title = result?.title || result?.meta?.title || '';
  const description = result?.metaDescription || result?.meta?.description || '';
  const url = result?.url || result?.targetUrl || '';
  // Create favicon URL from target domain, don't use our own as fallback
  const favicon = result?.favicon || (url ? `${new URL(url).origin}/favicon.ico` : null);

  const titleLength = title.length;
  const descLength = description.length;

  const getTitleStatus = () => {
    if (!title) return 'error';
    if (titleLength < 30 || titleLength > 60) return 'warning';
    return 'success';
  };

  const getDescStatus = () => {
    if (!description) return 'error';
    if (descLength < 120 || descLength > 160) return 'warning';
    return 'success';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className={styles.container}>
      {/* Meta Tags Analysis */}
      <div className={styles.analysisSection}>
        <h3 className={styles.sectionTitle}>Meta-taggar Analys</h3>

        {/* Title Analysis */}
        <div className={styles.metaItem}>
          <div className={styles.metaHeader}>
            <span className={styles.metaLabel}>Title Tag</span>
            <div className={styles.metaStatus}>
              {getTitleStatus() === 'success' && <CheckCircle className={styles.iconSuccess} size={16} />}
              {getTitleStatus() === 'warning' && <AlertCircle className={styles.iconWarning} size={16} />}
              {getTitleStatus() === 'error' && <AlertCircle className={styles.iconError} size={16} />}
              <span className={`${styles.lengthIndicator} ${styles[getTitleStatus()]}`}>
                {titleLength}/60 tecken
              </span>
            </div>
          </div>
          <div className={styles.metaContent}>
            <code className={styles.codeBlock}>{title || 'Ingen titel hittades'}</code>
            <button
              className={styles.copyBtn}
              onClick={() => copyToClipboard(title)}
              title="Kopiera"
            >
              <Copy size={14} />
            </button>
          </div>
          {getTitleStatus() === 'warning' && (
            <p className={styles.metaHint}>
              {titleLength < 30 ? 'För kort - lägg till mer beskrivande text' : 'För lång - kan bli avklippt i sökresultat'}
            </p>
          )}
        </div>

        {/* Description Analysis */}
        <div className={styles.metaItem}>
          <div className={styles.metaHeader}>
            <span className={styles.metaLabel}>Meta Description</span>
            <div className={styles.metaStatus}>
              {getDescStatus() === 'success' && <CheckCircle className={styles.iconSuccess} size={16} />}
              {getDescStatus() === 'warning' && <AlertCircle className={styles.iconWarning} size={16} />}
              {getDescStatus() === 'error' && <AlertCircle className={styles.iconError} size={16} />}
              <span className={`${styles.lengthIndicator} ${styles[getDescStatus()]}`}>
                {descLength}/160 tecken
              </span>
            </div>
          </div>
          <div className={styles.metaContent}>
            <code className={styles.codeBlock}>{description || 'Ingen beskrivning hittades'}</code>
            <button
              className={styles.copyBtn}
              onClick={() => copyToClipboard(description)}
              title="Kopiera"
            >
              <Copy size={14} />
            </button>
          </div>
          {getDescStatus() === 'warning' && (
            <p className={styles.metaHint}>
              {descLength < 120 ? 'För kort - lägg till mer information' : 'För lång - kan bli avklippt i sökresultat'}
            </p>
          )}
        </div>
      </div>

      {/* Google Preview */}
      <div className={styles.previewSection}>
        <div className={styles.previewHeader}>
          <h3 className={styles.sectionTitle}>
            <Search size={20} />
            Google Förhandsvisning
          </h3>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'desktop' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('desktop')}
            >
              <Monitor size={16} />
              Desktop
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'mobile' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone size={16} />
              Mobil
            </button>
          </div>
        </div>

        <div className={`${styles.googlePreview} ${styles[viewMode]}`}>
          <div className={styles.googleResult}>
            <div className={styles.googleUrl}>
              <img src={favicon} alt="" className={styles.favicon} onError={(e) => e.target.style.display = 'none'} />
              <div>
                <div className={styles.siteName}>{displayUrl.split('/')[0]}</div>
                <div className={styles.breadcrumb}>{displayUrl}</div>
              </div>
            </div>
            <h3 className={styles.googleTitle}>
              {viewMode === 'mobile'
                ? truncateText(title || 'Sidtitel saknas', 65)
                : (title || 'Sidtitel saknas')}
            </h3>
            <div className={styles.googleDesc}>
              {viewMode === 'mobile'
                ? truncateText(description || 'Meta description saknas. Google kommer automatiskt generera en beskrivning från sidans innehåll.', 120)
                : (description || 'Meta description saknas. Google kommer automatiskt generera en beskrivning från sidans innehåll.')}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className={styles.recommendations}>
        <h4 className={styles.recTitle}>Optimeringsförslag</h4>
        <ul className={styles.recList}>
          {titleLength < 30 && <li>Förläng titeln till minst 30 tecken för bättre synlighet</li>}
          {titleLength > 60 && <li>Förkorta titeln till max 60 tecken för att undvika avklippning</li>}
          {!title && <li>Lägg till en unik och beskrivande titel för sidan</li>}
          {descLength < 120 && <li>Förläng meta description till minst 120 tecken</li>}
          {descLength > 160 && <li>Förkorta meta description till max 160 tecken</li>}
          {!description && <li>Lägg till en lockande meta description som sammanfattar sidans innehåll</li>}
          {title && !title.includes(result?.primaryKeyword) && result?.primaryKeyword && (
            <li>Inkludera huvudnyckelordet &quot;{result.primaryKeyword}&quot; i titeln</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default EnhancedSeoTabMeta;