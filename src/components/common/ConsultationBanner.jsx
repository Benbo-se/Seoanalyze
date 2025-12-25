'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@/lib/icons';
import styles from './ConsultationBanner.module.css';

const ConsultationBanner = () => {
  const handleContact = () => {
    window.location.href = 'mailto:redaekengren@protonmail.com?subject=Hjälp med SEO-analys från seoanalyze.se';
  };

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.text}>
          <FontAwesomeIcon icon={faLightbulb} className={styles.icon} />
          <p className={styles.message}>Behöver du hjälp att tolka resultaten?</p>
        </div>
        <button
          onClick={handleContact}
          className={styles.ctaButton}
          aria-label="Kontakta för rådgivning"
        >
          Kontakta för rådgivning
        </button>
      </div>
    </div>
  );
};

export default ConsultationBanner;
