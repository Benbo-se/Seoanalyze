// Change Detection Repository - Handle change snapshots and alerts
const { prisma } = require('./prisma');

async function createSnapshot(data) {
  return prisma.changeSnapshot.create({ 
    data: {
      id: require('crypto').randomUUID(),
      url: data.url,
      canonical: data.canonical ?? null,
      robots: data.robots ?? null,
      csp: data.csp ?? null,
      title: data.title ?? null,
      metaDesc: data.metaDesc ?? null,
      h1: data.h1 ?? null
    }
  });
}

async function getLatestSnapshot(url) {
  return prisma.changeSnapshot.findFirst({
    where: { url },
    orderBy: { createdAt: 'desc' }
  });
}

async function createChangeAlert(data) {
  return prisma.changeDetection.create({
    data: {
      id: require('crypto').randomUUID(),
      url: data.url,
      changeType: data.changeType,
      severity: data.severity,
      oldValue: data.oldValue ?? null,
      newValue: data.newValue ?? null,
      snapshotId: data.snapshotId
    }
  });
}

async function getUnresolvedAlerts(url = null) {
  return prisma.changeDetection.findMany({
    where: {
      isResolved: false,
      ...(url && { url })
    },
    include: {
      ChangeSnapshot: true
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

async function resolveAlert(id) {
  return prisma.changeDetection.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedAt: new Date()
    }
  });
}

// Get change history for a URL
async function getChangeHistory(url, days = 30) {
  return prisma.changeDetection.findMany({
    where: {
      url,
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      ChangeSnapshot: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

module.exports = { 
  createSnapshot, 
  getLatestSnapshot, 
  createChangeAlert, 
  getUnresolvedAlerts,
  resolveAlert,
  getChangeHistory
};