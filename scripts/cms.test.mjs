import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import fs from 'node:fs';
import { authorize, callback } from '../cms/oauth.js';

const origin = 'https://journal.example';
const env = { CMS_SITE_URL: origin, CMS_GITHUB_CLIENT_ID: 'test-client', CMS_GITHUB_CLIENT_SECRET: 'test-secret' };
async function flow() {
  const response = await authorize(new Request(`${origin}/api/auth?scope=repo`), env);
  const url = new URL(response.headers.get('Location'));
  const cookie = response.headers.get('Set-Cookie').split(';')[0];
  return { response, url, cookie, request: new Request(`${origin}/api/callback?code=sample&state=${url.searchParams.get('state')}`, { headers: { Cookie: cookie } }) };
}

test('login requires configured secrets and exact production origin', async () => {
  assert.equal((await authorize(new Request(`${origin}/api/auth`), {})).status, 503);
  assert.equal((await authorize(new Request('https://preview.example/api/auth'), env)).status, 503);
});

test('authorization uses state, secure cookie, PKCE and public repo scope', async () => {
  const { response, url } = await flow();
  assert.equal(response.status, 302);
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.searchParams.get('redirect_uri'), `${origin}/api/callback`);
  assert.equal(url.searchParams.get('scope'), 'public_repo');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge').length, 43);
  assert.match(response.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('invalid state cannot exchange a token', async () => {
  let called = false;
  const response = await callback(new Request(`${origin}/api/callback?code=sample&state=bad`), env, () => { called = true; });
  assert.equal(called, false);
  assert.ok((await response.text()).includes('authorization:github:error:'));
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
});

test('a read-only GitHub account does not receive a token', async () => {
  const { request } = await flow();
  let count = 0;
  const response = await callback(request, env, async () => {
    count++;
    return Response.json(count === 1 ? { access_token: 'fake-private-token' } : count === 2 ? { login: 'reader' } : { permissions: { push: false } });
  });
  const html = await response.text();
  assert.ok(html.includes('authorization:github:error:'));
  assert.ok(!html.includes('fake-private-token'));
});

test('success exchanges PKCE verifier, validates account/repo and restricts popup messages', async () => {
  const { request, cookie } = await flow();
  const calls = [];
  const token = 'fake-token</script>';
  const response = await callback(request, env, async (url, options) => {
    calls.push({ url, options });
    return Response.json(calls.length === 1 ? { access_token: token } : calls.length === 2 ? { login: 'writer' } : { permissions: { push: true } });
  });
  assert.equal(JSON.parse(calls[0].options.body).code_verifier, cookie.split('.')[1]);
  assert.equal(calls[2].url, 'https://api.github.com/repos/asianLai0630/my-blog');
  const html = await response.text();
  assert.ok(!html.includes(token));
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  const messages = [];
  let handler;
  const opener = { postMessage: (message, target) => messages.push({ message, target }) };
  runInNewContext(html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1], { window: {
    opener, addEventListener: (_, receive) => { handler = receive; }, removeEventListener() {}, close() {},
  } });
  assert.equal(messages.length, 1);
  handler({ source: opener, origin: 'https://attacker.example', data: 'authorizing:github' });
  handler({ source: {}, origin, data: 'authorizing:github' });
  assert.equal(messages.length, 1);
  handler({ source: opener, origin, data: 'authorizing:github' });
  assert.equal(messages.length, 2);
  assert.equal(messages[1].target, origin);
  assert.ok(messages[1].message.includes('authorization:github:success:'));
});

test('network failures return a generic error without secrets', async () => {
  const { request } = await flow();
  const response = await callback(request, env, async () => { throw new Error(env.CMS_GITHUB_CLIENT_SECRET); });
  const html = await response.text();
  assert.ok(html.includes('authorization:github:error:'));
  assert.ok(!html.includes(env.CMS_GITHUB_CLIENT_SECRET));
});

test('built CMS paths and fields match the repository and Astro collection', () => {
  const { config } = JSON.parse(fs.readFileSync(new URL('../dist/admin/config.json', import.meta.url), 'utf8'));
  assert.equal(config.backend.repo, 'asianLai0630/my-blog');
  assert.equal(config.backend.branch, 'main');
  assert.equal(config.collections[0].folder, 'src/content/articles');
  assert.equal(config.media_folder, 'public/images/uploads');
  const fields = config.collections[0].fields;
  assert.equal(fields.find(field => field.name === 'draft').default, true);
  assert.equal(fields.find(field => field.name === 'date').format, 'YYYY-MM-DD');
  assert.deepEqual(fields.find(field => field.name === 'body').modes, ['raw']);
  const routes = JSON.parse(fs.readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'));
  assert.deepEqual(routes.include, ['/api/auth', '/api/callback']);
});
