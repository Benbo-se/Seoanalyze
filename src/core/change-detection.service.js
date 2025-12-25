// Change Detection Service - Business logic for detecting and alerting on SEO changes
const { 
  createSnapshot, 
  getLatestSnapshot, 
  createChangeAlert 
} = require('./change-detection.repo');

const { sendChangeNotification } = require('./change-notification.service');

// Critical change types with severity mapping
const CHANGE_RULES = {
  canonical: { 
    severity: 'critical',
    description: 'Canonical URL changed - can impact SEO rankings'
  },
  robots: { 
    severity: 'critical',
    description: 'robots.txt changed - may affect crawler access'
  },
  csp: { 
    severity: 'warning',
    description: 'Content Security Policy changed'
  },
  title: { 
    severity: 'warning',
    description: 'Page title changed'
  },
  metaDesc: { 
    severity: 'info',
    description: 'Meta description changed'
  },
  h1: { 
    severity: 'info',
    description: 'H1 tag changed'
  }
};

// Extract critical SEO elements from analysis data
function extractSEOElements(analysisData) {
  const elements = {
    url: analysisData.targetUrl || analysisData.url,
    canonical: null,
    robots: null,
    csp: null,
    title: null,
    metaDesc: null,
    h1: null
  };

  // Extract from crawl data if available
  if (analysisData.crawl && analysisData.crawl.pages) {
    const mainPage = analysisData.crawl.pages.find(p => p.url === elements.url) || analysisData.crawl.pages[0];
    if (mainPage) {
      elements.canonical = mainPage.canonical;
      elements.title = mainPage.title;
      elements.metaDesc = mainPage.metaDescription;
      elements.h1 = mainPage.h1;
      
      // Extract CSP from headers
      if (mainPage.headers && mainPage.headers['content-security-policy']) {
        elements.csp = mainPage.headers['content-security-policy'];
      }
    }
  }

  // Extract robots.txt if available
  if (analysisData.robots) {
    elements.robots = analysisData.robots.content ? 
      analysisData.robots.content.substring(0, 2048) : null; // First 2KB
  }

  return elements;
}

// Compare two snapshots and detect changes
function detectChanges(oldSnapshot, newSnapshot) {
  const changes = [];
  const fieldsToCheck = ['canonical', 'robots', 'csp', 'title', 'metaDesc', 'h1'];

  for (const field of fieldsToCheck) {
    const oldValue = oldSnapshot ? oldSnapshot[field] : null;
    const newValue = newSnapshot[field];

    // Skip if both are null/undefined
    if (!oldValue && !newValue) continue;

    // Change detected
    if (oldValue !== newValue) {
      const rule = CHANGE_RULES[field];
      changes.push({
        changeType: field,
        severity: rule.severity,
        description: rule.description,
        oldValue,
        newValue
      });
    }
  }

  return changes;
}

// Main function to check for changes and create alerts
async function checkForChanges(analysisData) {
  try {
    // Extract current SEO elements
    const currentElements = extractSEOElements(analysisData);
    
    if (!currentElements.url) {
      throw new Error('No URL provided in analysis data');
    }

    // Get latest snapshot for comparison
    const latestSnapshot = await getLatestSnapshot(currentElements.url);

    // Create new snapshot
    const newSnapshot = await createSnapshot(currentElements);
    console.log(`📸 Created snapshot ${newSnapshot.id} for ${currentElements.url}`);

    // Detect changes if we have a previous snapshot
    if (latestSnapshot) {
      const changes = detectChanges(latestSnapshot, currentElements);
      
      // Create alerts for each change
      for (const change of changes) {
        const alert = await createChangeAlert({
          url: currentElements.url,
          changeType: change.changeType,
          severity: change.severity,
          oldValue: change.oldValue,
          newValue: change.newValue,
          snapshotId: newSnapshot.id
        });

        console.log(`🚨 ${change.severity.toUpperCase()} change detected: ${change.description}`);
        console.log(`   Old: "${change.oldValue || 'null'}"`);
        console.log(`   New: "${change.newValue || 'null'}"`);

        // Send notification for critical and warning changes
        if (change.severity === 'critical' || change.severity === 'warning') {
          try {
            await sendChangeNotification(alert);
          } catch (notificationError) {
            console.error('Failed to send change notification:', notificationError.message);
          }
        }
      }

      return {
        snapshotId: newSnapshot.id,
        changesDetected: changes.length,
        changes
      };
    } else {
      console.log(`📊 First snapshot created for ${currentElements.url} - no changes to detect`);
      return {
        snapshotId: newSnapshot.id,
        changesDetected: 0,
        changes: [],
        isFirstSnapshot: true
      };
    }
  } catch (error) {
    console.error('Change detection error:', error);
    throw error;
  }
}

module.exports = { 
  checkForChanges, 
  extractSEOElements, 
  detectChanges,
  CHANGE_RULES
};