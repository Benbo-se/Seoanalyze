import React, { useState } from 'react';
import { Building, Copy, Check, Eye, Code, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './enhancedSeoTabSchema.module.css';

const EnhancedSeoTabSchema = ({ result }) => {
  const [copiedTemplate, setCopiedTemplate] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState('organization');

  if (!result?.schema && !result?.structuredData) {
    return (
      <div className={styles.container}>
        <div className={styles.missingSchema}>
          <AlertTriangle className={styles.missingIcon} size={48} />
          <h3>Schema.org markup saknas</h3>
          <p>Din webbplats har ingen strukturerad data. Lägg till Schema.org markup för bättre SEO.</p>
        </div>
        <div className={styles.templates}>
          <h4>Rekommenderade mallar</h4>
          {renderTemplates()}
        </div>
      </div>
    );
  }

  const schemaData = result.schema || result.structuredData || [];
  const hasSchema = Array.isArray(schemaData) ? schemaData.length > 0 : Boolean(schemaData);

  const copyTemplate = async (template, templateName) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
      setCopiedTemplate(templateName);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const templates = {
    organization: {
      name: 'Organization',
      description: 'Grundläggande företagsinformation',
      template: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Ditt Företagsnamn",
        "url": result?.url || "https://example.com",
        "logo": "https://example.com/logo.png",
        "description": "Beskrivning av ditt företag",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Gatuadress",
          "addressLocality": "Stad",
          "postalCode": "12345",
          "addressCountry": "SE"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+46-123-456-789",
          "contactType": "customer service"
        },
        "sameAs": [
          "https://facebook.com/dittforetag",
          "https://linkedin.com/company/dittforetag"
        ]
      }
    },
    website: {
      name: 'Website',
      description: 'Webbplatsinformation och sökfunktion',
      template: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Webbplatsens Namn",
        "url": result?.url || "https://example.com",
        "description": "Beskrivning av webbplatsen",
        "publisher": {
          "@type": "Organization",
          "name": "Ditt Företagsnamn"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://example.com/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    },
    breadcrumb: {
      name: 'BreadcrumbList',
      description: 'Navigationsstruktur för bättre UX',
      template: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Hem",
            "item": "https://example.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Kategori",
            "item": "https://example.com/kategori"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Nuvarande sida"
          }
        ]
      }
    }
  };

  function renderTemplates() {
    return (
      <div className={styles.templateSection}>
        <div className={styles.templateTabs}>
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              className={`${styles.templateTab} ${activeTemplate === key ? styles.templateTabActive : ''}`}
              onClick={() => setActiveTemplate(key)}
            >
              {template.name}
            </button>
          ))}
        </div>

        <div className={styles.templateContent}>
          {Object.entries(templates).map(([key, template]) => (
            activeTemplate === key && (
              <div key={key} className={styles.templateCard}>
                <div className={styles.templateHeader}>
                  <div>
                    <h5 className={styles.templateName}>{template.name}</h5>
                    <p className={styles.templateDesc}>{template.description}</p>
                  </div>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyTemplate(template.template, key)}
                    title="Kopiera JSON-LD"
                  >
                    {copiedTemplate === key ? (
                      <Check className={styles.copyIcon} size={16} />
                    ) : (
                      <Copy className={styles.copyIcon} size={16} />
                    )}
                  </button>
                </div>

                <div className={styles.templateCode}>
                  <pre className={styles.codeBlock}>
                    <code>{JSON.stringify(template.template, null, 2)}</code>
                  </pre>
                </div>

                <div className={styles.templateInstructions}>
                  <h6>Implementering:</h6>
                  <ol>
                    <li>Kopiera JSON-LD koden ovan</li>
                    <li>Anpassa värdena för ditt företag/webbplats</li>
                    <li>Lägg till i &lt;head&gt; sektionen på din webbplats</li>
                    <li>Testa med Google&apos;s Rich Results Test</li>
                  </ol>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {hasSchema ? (
        <>
          <div className={styles.existingSchema}>
            <div className={styles.schemaHeader}>
              <CheckCircle className={styles.successIcon} size={24} />
              <div>
                <h3>Schema.org upptäckt</h3>
                <p>Strukturerad data hittades på din webbplats</p>
              </div>
            </div>

            {Array.isArray(schemaData) && schemaData.map((schema, index) => (
              <div key={index} className={styles.schemaItem}>
                <div className={styles.schemaType}>
                  <Code className={styles.schemaIcon} size={16} />
                  <span>{String(schema['@type'] || schema.type || 'Okänd typ')}</span>
                </div>
                {schema.name && (
                  <div className={styles.schemaName}>Namn: {String(schema.name)}</div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.additionalTemplates}>
            <h4>Ytterligare mallar att implementera</h4>
            {renderTemplates()}
          </div>
        </>
      ) : (
        <>
          <div className={styles.missingSchema}>
            <AlertTriangle className={styles.missingIcon} size={48} />
            <h3>Schema.org markup saknas</h3>
            <p>Din webbplats har ingen strukturerad data. Lägg till Schema.org markup för bättre SEO.</p>
          </div>
          {renderTemplates()}
        </>
      )}
    </div>
  );
};

export default EnhancedSeoTabSchema;