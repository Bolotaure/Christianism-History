// Password protection for the whole site (Cloudflare Pages Functions).
// The people allowed in are listed in the secret variable SITE_USERS, set in Cloudflare
// (project > Settings > Variables and secrets, type "Secret"), as "name:password" pairs
// separated by commas, e.g.  lea:motdepasse1,tom:motdepasse2
// Without that variable, nobody can enter. Passwords are never stored in the repository.
export async function onRequest({ request, env, next }) {
  const users = (env.SITE_USERS || '').split(',').map(s => s.trim()).filter(s => s.includes(':'));
  const auth = request.headers.get('Authorization') || '';
  if(users.length && auth.startsWith('Basic ')){
    let pair = '';
    try{ pair = new TextDecoder().decode(Uint8Array.from(atob(auth.slice(6).trim()), c => c.charCodeAt(0))); }catch(e){}
    if(users.some(u => sameText(u, pair))) return next();
  }
  return new Response('Accès réservé / Private', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Frises", charset="UTF-8"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  });
}

// comparison that takes the same time whatever the typed password
function sameText(a, b){
  let r = a.length ^ b.length;
  for(let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ (b.charCodeAt(i % (b.length || 1)) || 0);
  return r === 0;
}
