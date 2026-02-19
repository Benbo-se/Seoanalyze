// RUM Repository - Handle Real User Metrics data access
const { prisma } = require('./prisma');

async function storeRumEvent(e) {
  return prisma.rumEvent.create({
    data: {
      url: e.url,
      lcp: e.lcp ?? null,
      cls: e.cls ?? null,
      inp: e.inp ?? null,
      ua: e.ua ?? null,
      vp_w: e.vp_w ?? null,
      vp_h: e.vp_h ?? null,
      ts: e.ts ?? new Date()
    }
  });
}

async function getRumStats(url, days = 7) {
  const rows = await prisma.$queryRawUnsafe(`
    select
      percentile_cont(0.75) within group (order by lcp) as lcp_p75,
      percentile_cont(0.75) within group (order by cls) as cls_p75,
      percentile_cont(0.75) within group (order by inp) as inp_p75,
      count(*)::int as samples
    from rum_events
    where url = $1 and ts >= now() - interval '${days} days'
  `, url);
  
  const r = rows?.[0] || { lcp_p75: null, cls_p75: null, inp_p75: null, samples: 0 };
  return {
    metrics: { lcp_p75: r.lcp_p75, cls_p75: r.cls_p75, inp_p75: r.inp_p75 },
    sampleSize: Number(r.samples),
    period: { days }
  };
}

module.exports = { storeRumEvent, getRumStats };