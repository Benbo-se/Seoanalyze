import React, { useState, useEffect } from 'react';
import { Menu, BarChart3, Zap, Tag, FileText, Settings, Lightbulb, Building, Globe, Shield, Share2, BookOpen, Eye, ChevronRight, AlertTriangle, Award } from 'lucide-react';
import styles from './tableOfContents.module.css';

const TableOfContents = ({ result, type = 'seo' }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);

  // Use the explicit type prop instead of guessing from result structure
  const isLighthouse = type === 'lighthouse';
  const isCrawl = type === 'crawl';

  const sections = isCrawl ? [
    { id: 'overview', title: 'Översikt', icon: BarChart3, required: true },
    { id: 'metadata', title: 'Crawl-metadata', icon: Tag, required: false, condition: result?.metadata },
    { id: 'technical', title: 'Teknisk hälsa', icon: Settings, required: false, condition: result?.technical },
    { id: 'links', title: 'Länkar & navigation', icon: Globe, required: false, condition: result?.links },
    { id: 'content', title: 'Innehållsanalys', icon: FileText, required: false, condition: result?.content },
    { id: 'performance', title: 'Prestanda (RUM)', icon: Zap, required: false, condition: result?.performance },
    { id: 'issues', title: 'Problem & åtgärder', icon: Lightbulb, required: false, condition: result?.issues }
  ] : isLighthouse ? [
    { id: 'overview', title: 'Översikt', icon: BarChart3, required: true },
    { id: 'metrics', title: 'Core Web Vitals', icon: Zap, required: true },
    { id: 'opportunities', title: 'Förbättringar', icon: Settings, required: false, condition: result?.opportunities },
    { id: 'diagnostics', title: 'Diagnostik', icon: AlertTriangle, required: false, condition: result?.diagnostics },
    { id: 'scores', title: 'Detaljerade Poäng', icon: Award, required: true }
  ] : [
    { id: 'overview', title: 'Översikt', icon: BarChart3, required: true },
    { id: 'quick-wins', title: 'Quick Wins', icon: Zap, required: true },
    { id: 'meta', title: 'Meta-taggar', icon: Tag, required: true },
    { id: 'content', title: 'Innehåll', icon: FileText, required: true },
    { id: 'technical', title: 'Tekniskt', icon: Settings, required: true },
    { id: 'recommendations', title: 'Rekommendationer', icon: Lightbulb, required: true },
    { id: 'schema', title: 'Schema.org', icon: Building, required: false, condition: !!result?.schema },
    { id: 'dns', title: 'DNS & e-postsäkerhet', icon: Globe, required: false, condition: !!result?.dns },
    { id: 'security', title: 'Säkerhet', icon: Shield, required: false, condition: !!result?.security },
    { id: 'social', title: 'Sociala medier', icon: Share2, required: false, condition: !!result?.social },
    { id: 'readability', title: 'LIX Läsbarhet', icon: BookOpen, required: false, condition: !!result?.readability }
  ];

  const visibleSections = sections.filter(section => {
    if (section.required) return true;
    if (section.condition === undefined) return true; // No condition means always show
    return section.condition; // Evaluate the condition
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-10% 0px -85% 0px',
        threshold: 0
      }
    );

    visibleSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  const handleSectionClick = (sectionId, event) => {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
      setIsExpanded(false); // Close mobile menu
    }
  };

  const progress = ((visibleSections.findIndex(s => s.id === activeSection) + 1) / visibleSections.length) * 100;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Visa innehållsförteckning"
      >
        <Menu className={styles.toggleIcon} size={16} />
        <span className={styles.toggleText}>Innehåll</span>
        <span className={styles.progressIndicator} style={{ '--progress': `${progress}%` }}></span>
      </button>

      {/* Backdrop for mobile */}
      {isExpanded && (
        <div
          className={styles.backdrop}
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Table of Contents */}
      <nav className={`${styles.toc} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.tocHeader}>
          <h3 className={styles.tocTitle}>Innehållsförteckning</h3>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
          <span className={styles.progressText}>
            {visibleSections.findIndex(s => s.id === activeSection) + 1} av {visibleSections.length}
          </span>
        </div>

        <ul className={styles.tocList}>
          {visibleSections.map((section, index) => (
            <li key={section.id} className={styles.tocItem}>
              <a
                href={`#${section.id}`}
                className={`${styles.tocLink} ${activeSection === section.id ? styles.active : ''}`}
                onClick={(e) => handleSectionClick(section.id, e)}
              >
                <span className={styles.sectionNumber}>{index + 1}</span>
                <span className={styles.sectionTitle}>{section.title}</span>
                <span className={styles.sectionStatus}>
                  {activeSection === section.id && <Eye size={12} />}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Backdrop for mobile */}
      {isExpanded && (
        <div
          className={styles.backdrop}
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default TableOfContents;