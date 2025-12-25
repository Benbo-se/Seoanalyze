import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import styles from './enhancedSeoTabDNS.module.css';

const EnhancedSeoTabDNS = ({ result }) => {
  const [expandedRecords, setExpandedRecords] = useState(new Set());

  if (!result?.dns && !result?.security) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <AlertTriangle className={styles.errorIcon} size={20} />
          <p>DNS-säkerhetsdata kunde inte analyseras</p>
        </div>
      </div>
    );
  }

  const dns = result.dns || {};
  const security = result.security || {};

  const toggleRecord = (recordType) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordType)) {
      newExpanded.delete(recordType);
    } else {
      newExpanded.add(recordType);
    }
    setExpandedRecords(newExpanded);
  };

  const getSecurityStatus = (record) => {
    if (!record || typeof record !== 'object') return 'unknown';

    if (record.secure === true || record.valid === true || record.present === true) {
      return 'secure';
    }
    if (record.secure === false || record.valid === false || record.present === false) {
      return 'insecure';
    }
    if (record.warning || record.issues) {
      return 'warning';
    }
    return 'unknown';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'secure':
        return <CheckCircle className={styles.iconSecure} size={16} />;
      case 'insecure':
        return <XCircle className={styles.iconInsecure} size={16} />;
      case 'warning':
        return <AlertTriangle className={styles.iconWarning} size={16} />;
      default:
        return <Info className={styles.iconUnknown} size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'secure':
        return 'Säker';
      case 'insecure':
        return 'Osäker';
      case 'warning':
        return 'Varning';
      default:
        return 'Okänd';
    }
  };

  const dnsRecords = [
    {
      type: 'SPF',
      name: 'SPF Record',
      description: 'Specifierar vilka servrar som får skicka e-post för domänen',
      data: dns.spf || security.spf,
      importance: 'HIGH'
    },
    {
      type: 'DKIM',
      name: 'DKIM Record',
      description: 'Digitala signaturer för e-postautenticering',
      data: dns.dkim || security.dkim,
      importance: 'HIGH'
    },
    {
      type: 'DMARC',
      name: 'DMARC Policy',
      description: 'Policy för hantering av misslyckad e-postautenticering',
      data: dns.dmarc || security.dmarc,
      importance: 'HIGH'
    },
    {
      type: 'MX',
      name: 'MX Records',
      description: 'E-postservrar för domänen',
      data: dns.mx || security.mx,
      importance: 'MEDIUM'
    },
    {
      type: 'TXT',
      name: 'TXT Records',
      description: 'Textposter för verifiering och konfiguration',
      data: dns.txt || security.txt,
      importance: 'MEDIUM'
    },
    {
      type: 'CAA',
      name: 'CAA Records',
      description: 'Auktoriserar vilka CA:er som får utfärda SSL-certifikat',
      data: dns.caa || security.caa,
      importance: 'MEDIUM'
    }
  ];

  const securityChecks = [
    {
      name: 'HTTPS Redirect',
      status: security.httpsRedirect || security.ssl?.redirect,
      description: 'Automatisk omdirigering från HTTP till HTTPS'
    },
    {
      name: 'HSTS Header',
      status: security.hsts || security.headers?.hsts,
      description: 'HTTP Strict Transport Security för tvingad HTTPS'
    },
    {
      name: 'SSL Certificate',
      status: security.ssl || security.certificate,
      description: 'Giltigt SSL/TLS-certifikat'
    },
    {
      name: 'Security Headers',
      status: security.headers || security.securityHeaders,
      description: 'Säkerhetsheaders för skydd mot attacker'
    }
  ];

  return (
    <div className={styles.container}>
      {/* Security Overview */}
      <div className={styles.overviewSection}>
        <h3 className={styles.sectionTitle}>
          <Shield size={20} />
          Säkerhetsöversikt
        </h3>

        <div className={styles.securityGrid}>
          {securityChecks.map((check, index) => {
            const status = getSecurityStatus(check.status);
            return (
              <div key={index} className={styles.securityCard}>
                <div className={styles.securityHeader}>
                  {getStatusIcon(status)}
                  <span className={styles.securityName}>{check.name}</span>
                  <span className={`${styles.securityStatus} ${styles[status]}`}>
                    {getStatusText(status)}
                  </span>
                </div>
                <p className={styles.securityDescription}>{check.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* DNS Records */}
      <div className={styles.dnsSection}>
        <h3 className={styles.sectionTitle}>DNS-poster</h3>

        <div className={styles.recordsList}>
          {dnsRecords.map((record) => {
            const isExpanded = expandedRecords.has(record.type);
            const status = getSecurityStatus(record.data);
            const hasData = record.data && typeof record.data === 'object';

            return (
              <div key={record.type} className={styles.recordCard}>
                <div
                  className={styles.recordHeader}
                  onClick={() => hasData && toggleRecord(record.type)}
                  style={{ cursor: hasData ? 'pointer' : 'default' }}
                >
                  <div className={styles.recordInfo}>
                    {hasData && (
                      isExpanded ?
                        <ChevronDown size={16} className={styles.expandIcon} /> :
                        <ChevronRight size={16} className={styles.expandIcon} />
                    )}
                    <div className={styles.recordMeta}>
                      <span className={styles.recordType}>{record.type}</span>
                      <span className={styles.recordName}>{record.name}</span>
                      <span className={`${styles.importance} ${styles[record.importance.toLowerCase()]}`}>
                        {record.importance}
                      </span>
                    </div>
                  </div>

                  <div className={styles.recordStatus}>
                    {getStatusIcon(status)}
                    <span className={`${styles.statusText} ${styles[status]}`}>
                      {getStatusText(status)}
                    </span>
                  </div>
                </div>

                <p className={styles.recordDescription}>{record.description}</p>

                {isExpanded && hasData && (
                  <div className={styles.recordDetails}>
                    <h5>Detaljer:</h5>
                    <pre className={styles.recordData}>
                      {typeof record.data === 'string'
                        ? record.data
                        : JSON.stringify(record.data, null, 2)
                      }
                    </pre>
                  </div>
                )}

                {!hasData && (
                  <div className={styles.recordMissing}>
                    <Info size={14} />
                    <span>Ingen data tillgänglig</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className={styles.recommendationsSection}>
        <h3 className={styles.sectionTitle}>Säkerhetsrekommendationer</h3>

        <div className={styles.recommendationsList}>
          <div className={styles.recommendationItem}>
            <Shield size={16} />
            <div>
              <strong>Implementera SPF, DKIM och DMARC</strong>
              <p>Skydda din domän från e-postförfalskning och phishing-attacker.</p>
            </div>
          </div>

          <div className={styles.recommendationItem}>
            <Shield size={16} />
            <div>
              <strong>Aktivera HSTS</strong>
              <p>Tvinga webbläsare att alltid använda HTTPS för din webbplats.</p>
            </div>
          </div>

          <div className={styles.recommendationItem}>
            <Shield size={16} />
            <div>
              <strong>Konfigurera CAA-poster</strong>
              <p>Kontrollera vilka certifikatutfärdare som får utfärda SSL-certifikat för din domän.</p>
            </div>
          </div>

          <div className={styles.recommendationItem}>
            <Shield size={16} />
            <div>
              <strong>Säkerhetsheaders</strong>
              <p>Lägg till Content-Security-Policy, X-Frame-Options och andra säkerhetsheaders.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSeoTabDNS;