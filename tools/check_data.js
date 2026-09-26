// Checks every theme: same card ids/order in the 3 languages, and each [term] has a glossary entry (and no unused entry).
// Usage: node tools/check_data.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'data');
const dirs = ['', ...fs.readdirSync(root).filter(d => fs.statSync(path.join(root, d)).isDirectory())];
const look = (G, k) => { k = k.toLowerCase(); for (const c of [k, k.replace(/s$/, ''), k.replace(/es$/, ''), k.replace(/x$/, '')]) if (G[c] !== undefined) return c; return null; };
let bad = 0;
for (const d of dirs) {
  const ids = {};
  for (const [lang, sfx] of [['en', ''], ['fr', '.fr'], ['ja', '.ja']]) {
    const ev = JSON.parse(fs.readFileSync(path.join(root, d, `events${sfx}.json`)));
    const G = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(root, d, `glossary${sfx}.json`)))).map(([k, v]) => [k.toLowerCase(), v]));
    ids[lang] = ev.map(e => e.id).join();
    const used = new Set(), missing = new Set();
    for (const e of ev) for (const m of e.text.matchAll(/\[([^\]]+)\]/g)) {
      if (m[1].includes('::')) continue; // inline definition: [word::explanation]
      const k = m[1].split('|').pop(); const c = look(G, k);
      c ? used.add(c) : missing.add(`${e.id}: ${k}`);
    }
    const unused = Object.keys(G).filter(k => !used.has(k));
    if (missing.size || unused.length) { bad++; console.log(`${d || 'christianity'} [${lang}] missing:`, [...missing], 'unused:', unused); }
  }
  if (ids.en !== ids.fr || ids.en !== ids.ja) { bad++; console.log(`${d || 'christianity'}: card ids/order differ between languages`); }
  console.log(`${(d || 'christianity').padEnd(12)} ${ids.en.split(',').length} cards`);
}
process.exit(bad ? 1 : 0);
