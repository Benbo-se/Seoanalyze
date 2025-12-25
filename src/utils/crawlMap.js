export const safe = {
  number: (v) => typeof v === 'number' && isFinite(v) ? v : 0,
  count:  (v) => Array.isArray(v) ? v.length : (typeof v === 'number' ? v : 0),
};

export const asArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);

export function tallyStatus(pages=[]) {
  const buckets = { '2xx':0, '3xx':0, '4xx':0, '5xx':0, other:0 };
  for (const p of pages) {
    const s = Number(p?.status) || 0;
    if (s>=200 && s<300) buckets['2xx']++;
    else if (s>=300 && s<400) buckets['3xx']++;
    else if (s>=400 && s<500) buckets['4xx']++;
    else if (s>=500) buckets['5xx']++;
    else buckets.other++;
  }
  return buckets;
}