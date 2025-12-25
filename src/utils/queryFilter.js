// src/utils/queryFilter.js
// Bygger en predikat-funktion (row => boolean) från en söksträng.
// Stöd: fri text (AND), "nyckel:värde", jämförelser (>, >=, <, <=, =, !=),
// negation (!foo eller nyckel:!värde), citat "fras med mellanslag",
// wildcard * (matchar vilken sträng som helst), OR inuti ett värde via "|".
//
// Exempel:
//  - status:404
//  - status:>=400
//  - type:broken|redirect
//  - target:*pdf
//  - "my phrase"  !login
//  - size:>20000  hops:>=2

function parseKeyValue(query) {
  const rules = [];
  const freeTextTerms = [];
  
  // Robust regex för åäö, bindestreck, punkt i nycklar
  const pattern = /([\p{L}\p{N}_\-.]+):(>=?|<=?|!=|=)?("(?:[^"\\\\]|\\\\.)+"|[^\s]+)/gu;
  let match;
  let processed = '';
  
  while ((match = pattern.exec(query)) !== null) {
    const key = match[1].toLowerCase();
    const operator = match[2] || '=';
    const raw = match[3].trim();
    const value = raw.startsWith('"') && raw.endsWith('"') 
      ? raw.slice(1, -1) // Ta bort citattecken
      : raw;
    
    rules.push({ key, operator, value: value.toLowerCase() });
    processed += ' '.repeat(match[0].length);
  }
  
  // Extrahera resterande fri text
  const remaining = query.replace(pattern, ' ').trim();
  if (remaining) {
    // Tokenize remaining text, respektera citat
    const tokens = [];
    let buf = '', inQuotes = false;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      if (c === '"') { inQuotes = !inQuotes; continue; }
      if (!inQuotes && /\s/.test(c)) { 
        if (buf.trim()) { tokens.push(buf.trim()); buf = ''; } 
        continue; 
      }
      buf += c;
    }
    if (buf.trim()) tokens.push(buf.trim());
    freeTextTerms.push(...tokens.filter(Boolean));
  }
  
  return { rules, freeTextTerms };
}

const ops = [
  { re: /^>=/, fn: (a,b) => a >= b },
  { re: /^<=/, fn: (a,b) => a <= b },
  { re: /^>/,  fn: (a,b) => a >  b },
  { re: /^</,  fn: (a,b) => a <  b },
  { re: /^!=/, fn: (a,b) => a != b },
  { re: /^=/,  fn: (a,b) => a == b },
];

function getByPath(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, k) => (acc==null ? acc : acc[k]), obj);
}

function coerce(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const n = Number(val);
  if (!Number.isNaN(n) && String(val).trim() !== '') return n;
  return String(val);
}

function makeValueMatcher(raw) {
  // OR-stöd inuti värdet: a|b|c
  const parts = String(raw).split('|').map(s => s.trim()).filter(Boolean);
  const matchers = parts.map(p => {
    const neg = p.startsWith('!');
    const body = neg ? p.slice(1) : p;
    
    // wildcard -> regex (förbättrad)
    if (body.includes('*')) {
      const rx = new RegExp('^' + body.split('*').map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i');
      return v => {
        const val = coerce(v);
        const ok = typeof val === 'string' ? rx.test(val) : rx.test(String(val));
        return neg ? !ok : ok;
      };
    }
    
    // exakt (case-insensitiv) strängjämförelse
    return v => {
      const val = coerce(v);
      const ok = String(val).toLowerCase() === String(body).toLowerCase();
      return neg ? !ok : ok;
    };
  });

  return v => matchers.some(fn => fn(v));
}

function matchRule(rule, row, valueAccess) {
  const { key, operator, value } = rule;
  const rowValue = valueAccess(row, key);
  
  // Specialfall för status:5xx etc
  if (key === 'status' && /^\dxx$/i.test(value)) {
    const code = coerce(rowValue) || 0;
    const base = parseInt(value[0], 10) * 100;
    return code >= base && code < base + 100;
  }
  
  // Jämförelse-operatorer
  if (operator !== '=') {
    const want = coerce(value);
    const got = coerce(rowValue);
    
    if (typeof want === 'number' && typeof got === 'number') {
      switch (operator) {
        case '>=': return got >= want;
        case '<=': return got <= want;
        case '>': return got > want;
        case '<': return got < want;
        case '!=': return got != want;
      }
    }
    
    // Lexicografisk jämförelse för strängar
    const strGot = String(got);
    const strWant = String(want);
    switch (operator) {
      case '>=': return strGot >= strWant;
      case '<=': return strGot <= strWant;
      case '>': return strGot > strWant;
      case '<': return strGot < strWant;
      case '!=': return strGot !== strWant;
    }
  }
  
  // Annars likhet / wildcard / OR
  const valueMatcher = makeValueMatcher(value);
  return valueMatcher(rowValue);
}

export function buildPredicate(query, { defaultFields = [], valueAccess = (row,k)=>getByPath(row,k), fieldMappings = {} } = {}) {
  const q = (query || '').trim();
  if (!q) return () => true;

  const { rules, freeTextTerms } = parseKeyValue(q);

  return row => {
    // Alla key:value regler måste matcha
    for (const rule of rules) {
      // Använd mappning om den finns (t.ex. svenska -> engelska fält)
      const mappedKey = fieldMappings[rule.key] || rule.key;
      const mappedRule = { ...rule, key: mappedKey };
      
      if (!matchRule(mappedRule, row, valueAccess)) {
        return false;
      }
    }
    
    // Alla fri-text termer måste matcha (AND)
    for (const term of freeTextTerms) {
      const neg = term.startsWith('!');
      const needle = (neg ? term.slice(1) : term).toLowerCase();
      
      const hay = defaultFields.length
        ? defaultFields.map(k => valueAccess(row, k)).join(' ')
        : JSON.stringify(row);
      
      const ok = String(hay).toLowerCase().includes(needle);
      if (neg ? ok : !ok) {
        return false;
      }
    }
    
    return true;
  };
}