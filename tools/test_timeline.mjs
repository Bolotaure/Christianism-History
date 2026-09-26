// Opens every theme in the 3 languages on phone-sized screens, opens a few cards and a glossary word,
// and checks for JS errors and overlapping pins. Local data/images are used (no network needed).
// Usage: node tools/test_timeline.mjs
import { chromium, devices } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const themes = ['christianity', 'japan', 'france', 'usa', 'revolution', 'space', 'republique'];
let fail = 0;
for (const [w, h] of [[390, 844], [375, 560]]) for (const th of themes) for (const l of ['fr', 'en', 'ja']) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: w, height: h } });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  // the page is served from a local stand-in address; its data and pictures are the files of the repository
  await pg.route('http://frise.test/**', r => r.fulfill({ path: R + decodeURIComponent(new URL(r.request().url()).pathname) }));
  await pg.goto(`http://frise.test/index.html#${l}-${th}`); await pg.waitForTimeout(900);
  const res = await pg.evaluate(() => {
    const pins = [...document.querySelectorAll('.pin button')].map(e => e.getBoundingClientRect()); let ov = 0;
    for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) { const a = pins[i], c = pins[j]; if (a.left < c.right - 2 && c.left < a.right - 2 && a.top < c.bottom - 2 && c.top < a.bottom - 2) ov++; }
    return { pins: pins.length, overlaps: ov };
  });
  const ids = await pg.evaluate(() => [...document.querySelectorAll('.pin')].map(p => p.id));
  for (const id of [ids[0], ids[Math.floor(ids.length / 2)], ids[ids.length - 1]]) {
    await pg.evaluate(id => document.querySelector('#' + id + ' button').click(), id); await pg.waitForTimeout(900);
    const t = await pg.$('.body .term'); if (t) { await t.evaluate(el => el.click()); await pg.waitForTimeout(700); await pg.evaluate(() => document.querySelector('#miniCard').click()); await pg.waitForTimeout(700); }
    await pg.evaluate(() => document.querySelector('.body p').click()); await pg.waitForTimeout(900);
  }
  const ok = !errs.length && !res.overlaps && res.pins > 0; if (!ok) fail++;
  console.log(`${w}x${h} ${th.padEnd(12)} ${l} ${ok ? 'ok' : 'FAIL'} pins=${res.pins} overlaps=${res.overlaps} ${errs.join(' | ')}`);
  await ctx.close();
}
await b.close(); process.exit(fail ? 1 : 0);
