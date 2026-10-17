import settings from '../src/data/cms.json' with { type: 'json' };

const cookieName = '__Host-cms-oauth';
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
const cookie = (value, age) => `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };

function configuration(request, env) {
  if (!env.CMS_SITE_URL || !env.CMS_GITHUB_CLIENT_ID || !env.CMS_GITHUB_CLIENT_SECRET) return null;
  const site = new URL(env.CMS_SITE_URL);
  if (site.protocol !== 'https:' || site.origin !== new URL(request.url).origin) return null;
  return { origin: site.origin, callback: `${site.origin}/api/callback` };
}

function popup(origin, message) {
  const nonce = random();
  const script = `const origin=${json(origin)};const message=${json(message)};
    if(window.opener){
      window.addEventListener('message',function receive(event){
        if(event.origin!==origin||event.source!==window.opener||event.data!=='authorizing:github')return;
        window.opener.postMessage(message,origin);window.removeEventListener('message',receive);window.close();
      });
      window.opener.postMessage('authorizing:github',origin);
    }`;
  return new Response(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>GitHub 登入</title><p>登入流程已結束，可以返回文章管理後台。</p><script nonce="${nonce}">${script}</script></html>`, {
    headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie('', 0),
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'` },
  });
}

export async function authorize(request, env) {
  let config;
  try { config = configuration(request, env); } catch { /* Invalid deployment configuration. */ }
  if (!config) return new Response('CMS 登入尚未設定完成，請依 CMS_CLOUDFLARE_GUIDE.md 設定正式網址與 GitHub OAuth 金鑰。', { status: 503, headers });
  const state = random();
  const verifier = random();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const destination = new URL('https://github.com/login/oauth/authorize');
  destination.search = new URLSearchParams({
    client_id: env.CMS_GITHUB_CLIENT_ID, redirect_uri: config.callback, state,
    scope: env.CMS_GITHUB_SCOPE === 'repo' ? 'repo' : 'public_repo',
    code_challenge: challenge, code_challenge_method: 'S256',
  }).toString();
  return new Response(null, { status: 302, headers: { ...headers, Location: destination.href, 'Set-Cookie': cookie(`${state}.${verifier}`, 600) } });
}

export async function callback(request, env, fetcher = fetch) {
  let config;
  try { config = configuration(request, env); } catch { /* Invalid deployment configuration. */ }
  if (!config) return new Response('CMS 登入設定不完整或網址不符。', { status: 503, headers });
  const fail = message => popup(config.origin, `authorization:github:error:${JSON.stringify({ message })}`);
  const url = new URL(request.url);
  const value = (request.headers.get('Cookie') || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || '';
  const [state, verifier] = value.split('.');
  if (!/^[a-f0-9]{64}$/.test(state || '') || !/^[a-f0-9]{64}$/.test(verifier || '') || state !== url.searchParams.get('state')) {
    return fail('登入驗證已失效，請返回後台重新登入。');
  }
  if (url.searchParams.has('error') || !url.searchParams.get('code')) return fail('GitHub 登入未完成，請重試。');
  try {
    const response = await fetcher('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: env.CMS_GITHUB_CLIENT_ID, client_secret: env.CMS_GITHUB_CLIENT_SECRET,
        code: url.searchParams.get('code'), redirect_uri: config.callback, code_verifier: verifier }),
    });
    const token = await response.json();
    if (!response.ok || typeof token.access_token !== 'string' || token.error) return fail('GitHub 授權失敗，請重新登入。');
    const apiHeaders = { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'personal-journal-cms' };
    const user = await fetcher('https://api.github.com/user', { headers: apiHeaders });
    if (!user.ok) return fail('無法確認 GitHub 帳號，請重新登入。');
    const repository = await fetcher(`https://api.github.com/repos/${settings.repo}`, { headers: apiHeaders });
    const repo = await repository.json();
    if (!repository.ok || repo.permissions?.push !== true) return fail('此 GitHub 帳號沒有網站儲存庫的寫入權限。');
    return popup(config.origin, `authorization:github:success:${JSON.stringify({ token: token.access_token, provider: 'github' })}`);
  } catch {
    return fail('登入服務暫時無法連線，請稍後重試。');
  }
}
