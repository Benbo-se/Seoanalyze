export const svStatus = (v, fallback = 'Saknas') => {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t || /^(missing|n\/a|na|none)$/i.test(t)) return fallback;
  }
  return v;
};