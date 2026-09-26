// Private access to the whole site (Cloudflare Pages Functions).
//
// The people allowed in are listed in the secret variable SITE_USERS, set in Cloudflare
// (project > Settings > Variables and secrets, type "Secret"), as "name:password" pairs
// separated by commas, e.g.  lea:motdepasse1,tom:motdepasse2   (no comma in a password).
// Without that variable, nobody can enter. Passwords are never stored in the repository.
//
// A visitor who is not signed in gets a sign-in page (FR / EN / JA). Signing in leaves a
// signed session cookie on the device for one year, renewed by visits. The signature is
// made with the person's own "name:password" entry, so removing someone from SITE_USERS or
// changing their password ends their session on their next visit, and adding people does
// not sign anyone out.

const COOKIE = 'fiches_session';
const YEAR = 365 * 24 * 3600;             // session length, in seconds
const RENEW_AFTER = 30 * 24 * 3600;       // renew the cookie at most once a month
const enc = new TextEncoder();

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const users = parseUsers(env.SITE_USERS);

  if(url.pathname === '/__auth' && request.method === 'POST') return signIn(request, url, users);
  if(url.pathname === '/__logout') return new Response(null, { status: 303, headers: {
    Location: '/', 'Set-Cookie': cookie('', 0), 'Cache-Control': 'no-store' } });

  const session = await readSession(request, users);
  if(session){
    const res = await next();
    if(session.exp - now() > YEAR - RENEW_AFTER) return res;
    const out = new Response(res.body, res);   // copy: the original headers may be read-only
    out.headers.append('Set-Cookie', cookie(await makeToken(session.user, users.get(session.user).entry), YEAR));
    return out;
  }

  // not signed in: the sign-in page for pages, a plain refusal for data and pictures
  const page = request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
  return page
    ? new Response(LOGIN_PAGE, { status: 401, headers: { ...PRIVATE, 'Content-Type': 'text/html; charset=utf-8' } })
    : new Response('Private', { status: 401, headers: PRIVATE });
}

const PRIVATE = {
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'"
};

// "name:password,name2:password2" -> Map(lowercase name -> {pass, entry})
function parseUsers(list){
  const users = new Map();
  for(const raw of (list || '').split(',')){
    const entry = raw.trim(), i = entry.indexOf(':');
    if(i > 0 && i < entry.length - 1) users.set(entry.slice(0, i).trim().toLowerCase(), { pass: entry.slice(i + 1), entry });
  }
  return users;
}

async function signIn(request, url, users){
  // only the site's own sign-in page may post here
  const origin = request.headers.get('Origin');
  if(origin && origin !== url.origin) return json({ ok: false }, 403);
  let name = '', pass = '';
  try{ const b = await request.json(); name = String(b.user || '').trim().toLowerCase(); pass = String(b.pass || ''); }catch(e){}
  const u = users.get(name);
  if(!u || !sameText(u.pass, pass)){
    await new Promise(r => setTimeout(r, 1200));   // slows down guessing
    return json({ ok: false }, 401);
  }
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(await makeToken(name, u.entry), YEAR) });
}

async function readSession(request, users){
  const m = /(?:^|;\s*)fiches_session=([^;]+)/.exec(request.headers.get('Cookie') || '');
  if(!m) return null;
  const [n, exp, sig] = m[1].split('.');
  let name = '';
  try{ name = decodeURIComponent(n || ''); }catch(e){ return null; }
  const u = users.get(name), e = Number(exp);
  if(!u || !(e > now())) return null;
  const expected = await sign(u.entry, name + '|' + e);
  return sameText(expected, sig || '') ? { user: name, exp: e } : null;
}

async function makeToken(name, entry){
  const exp = now() + YEAR;
  return encodeURIComponent(name) + '.' + exp + '.' + await sign(entry, name + '|' + exp);
}

// HMAC-SHA-256 of the message, keyed with the person's "name:password" entry
async function sign(entry, message){
  const key = await crypto.subtle.importKey('raw', enc.encode('fiches-session-v1|' + entry), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
  return btoa(String.fromCharCode(...mac)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function cookie(value, maxAge){
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
function json(body, status, headers){
  return new Response(JSON.stringify(body), { status, headers: { ...PRIVATE, 'Content-Type': 'application/json', ...(headers || {}) } });
}
function now(){ return Math.floor(Date.now() / 1000); }

// comparison that takes the same time whatever the typed text
function sameText(a, b){
  let r = a.length ^ b.length;
  for(let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ (b.charCodeAt(i % (b.length || 1)) || 0);
  return r === 0;
}

// Sign-in page, in the colours of the timelines. The language follows the link (#fr-…),
// then the language chosen earlier on the site, then the device language.
const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="robots" content="noindex, nofollow"/>
<meta name="referrer" content="no-referrer"/>
<meta name="theme-color" content="#14110f"/>
<title>Frises</title>
<style>
:root{--bg:#14110f;--ink:#f6eee2;--muted:#b9ab97;--gold:#e8b85c;--gold2:#f5d58f;--err:#f08a6e}
html,body{margin:0;min-height:100%;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
body{display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px 16px;box-sizing:border-box}
main{width:min(100%,380px)}
.kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);font-weight:700;text-align:center}
h1{margin:12px 0 26px;font-family:Georgia,"Times New Roman",serif;font-size:30px;line-height:1.15;text-align:center}
:lang(ja) h1{font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",Georgia,serif}
form{background:linear-gradient(180deg,rgba(232,184,92,.12),rgba(232,184,92,.04));border:1px solid rgba(255,255,255,.14);border-top:6px solid var(--gold);border-radius:18px;padding:22px 20px 20px}
label{display:block;font-size:14px;color:var(--muted);margin:0 0 6px}
input{display:block;width:100%;box-sizing:border-box;margin:0 0 16px;padding:13px 14px;font-size:18px;color:var(--ink);background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);border-radius:12px;outline:none}
input:focus{border-color:var(--gold2)}
button{width:100%;margin-top:4px;padding:14px;font-size:18px;font-weight:800;color:#241c12;background:var(--gold);border:0;border-radius:12px;cursor:pointer}
button:disabled{opacity:.6;cursor:default}
#msg{min-height:22px;margin:12px 0 0;font-size:15px;color:var(--err);text-align:center}
</style>
</head>
<body>
<main>
  <div class="kicker" id="kicker"></div>
  <h1 id="title"></h1>
  <form id="form" autocomplete="on">
    <label for="user" id="luser"></label>
    <input id="user" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required/>
    <label for="pass" id="lpass"></label>
    <input id="pass" name="password" type="password" autocomplete="current-password" required/>
    <button type="submit" id="go"></button>
    <p id="msg" role="alert"></p>
  </form>
</main>
<script>
const T = {
  fr:{kicker:"Une frise pour jeunes explorateurs", title:"Bienvenue !", user:"Identifiant", pass:"Mot de passe", go:"Entrer", bad:"Identifiant ou mot de passe incorrect.", net:"Pas de connexion. Réessaie."},
  en:{kicker:"A timeline for young explorers", title:"Welcome!", user:"Username", pass:"Password", go:"Enter", bad:"Wrong username or password.", net:"No connection. Try again."},
  ja:{kicker:"わかい探検家のためのタイムライン", title:"ようこそ！", user:"ユーザー名", pass:"パスワード", go:"入る", bad:"ユーザー名かパスワードがちがいます。", net:"つながりません。もう一度ためしてね。"}
};
function pickLang(){
  const h = location.hash.slice(1).toLowerCase().split(/[-._~]/).find(x => T[x]);
  if(h) return h;
  try{ const s = localStorage.getItem('xtl-lang'); if(T[s]) return s; }catch(e){}
  const n = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return T[n] ? n : 'en';
}
const LANG = pickLang(), L = T[LANG];
document.documentElement.lang = LANG;
for(const [id, k] of [['kicker','kicker'],['title','title'],['luser','user'],['lpass','pass'],['go','go']]) document.getElementById(id).textContent = L[k];
const form = document.getElementById('form'), msg = document.getElementById('msg'), go = document.getElementById('go');
form.addEventListener('submit', async ev => {
  ev.preventDefault(); msg.textContent = ''; go.disabled = true;
  try{
    const r = await fetch('/__auth', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin',
      body: JSON.stringify({ user: form.user.value, pass: form.pass.value }) });
    if(r.ok){ location.reload(); return; }   // same address, so the link's #theme is kept
    msg.textContent = L.bad; form.pass.value = ''; form.pass.focus();
  }catch(e){ msg.textContent = L.net; }
  go.disabled = false;
});
</script>
</body>
</html>`;
