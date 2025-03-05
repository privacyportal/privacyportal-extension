import { createRemoteJWKSet, jwtVerify } from 'jose';
import browser from 'webextension-polyfill';
import { API_URL, AUTHORIZATION_URL, TOKEN_URL, JWKS_URL, OAUTH_CLIENT_ID } from './constants';
import { crypto, digestMessage } from './crypto';
import { CustomError, DEFAULT_ERROR_ACTION } from './error';
import { base64ToBase64Url, bufferToBase64, bufferToBase64Url, isString } from './util';

const AUTH_ERROR_MESSAGE = ['Authentication failed.', DEFAULT_ERROR_ACTION].join(' ');
const UA_BRANDS = {
  'Microsoft Edge': 'edge',
  'Google Chrome': 'chrome'
}

async function digestAccessToken(access_token) {
  const buffer = await digestMessage(access_token, { algorithm: 'SHA-256' });
  const bufferPrefix = buffer.slice(0, Math.floor(buffer.byteLength / 2));
  return base64ToBase64Url(bufferToBase64(bufferPrefix));
}

async function validateTokens({ id_token, access_token }) {
  // validate type
  if (!id_token || !access_token || !isString(id_token) || !isString(access_token)) {
    throw new CustomError({ message: AUTH_ERROR_MESSAGE, notification_id: 'authentication' });
  }

  // validate id_token
  const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  const { payload } = await jwtVerify(id_token, JWKS, { issuer: API_URL, audience: OAUTH_CLIENT_ID });
  if (!payload.at_hash) throw new CustomError({ message: AUTH_ERROR_MESSAGE, notification_id: 'authentication' });

  // validate access_token
  const at_hash = await digestAccessToken(access_token);
  if (at_hash !== payload.at_hash) throw new CustomError({ message: AUTH_ERROR_MESSAGE, notification_id: 'authentication' });

  return { id_token, access_token };
}

async function exchangeCodeForToken(code, pkceCodeVerifier) {
  try {
    if (!code) throw new Error('code missing.');

    const params = new URLSearchParams();
    params.set('client_id', OAUTH_CLIENT_ID);
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', browser.identity.getRedirectURL());
    params.set('code_verifier', pkceCodeVerifier);

    const reponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })
    return reponse.json();
  } catch (err) {
    throw new CustomError({ message: AUTH_ERROR_MESSAGE, notification_id: 'authentication' });
  }
}

function generatePKCECodeVerifier(length = 32) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return bufferToBase64Url(array);
}

async function createPKCECodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64Url(digest);
}

function createAuthorizationURL(pkceCodeChallenge) {
  const authParams = new URLSearchParams();
  authParams.set('client_id', OAUTH_CLIENT_ID);
  authParams.set('scope', 'openid w:api_keys');
  authParams.set('response_type', 'code');
  authParams.set('nonce', crypto.randomUUID().substring(4, 18));
  authParams.set('redirect_uri', browser.identity.getRedirectURL());
  authParams.set('code_challenge', pkceCodeChallenge);
  authParams.set('code_challenge_method', 'S256');

  const authUrl = new URL(AUTHORIZATION_URL);
  authUrl.search = authParams.toString();

  return authUrl.toString();
}

export async function oauthAuthenticate() {
  // prepare PKCE code_verifier and code_challenge
  const codeVerifier = generatePKCECodeVerifier();
  const codeChallenge = await createPKCECodeChallenge(codeVerifier)

  // start oauth authentication
  const response = await browser.identity.launchWebAuthFlow({
    url: createAuthorizationURL(codeChallenge),
    interactive: true
  });

  // parse response
  const searchParams = new URL(response).searchParams;
  const code = searchParams.get('code');

  // exchange code for tokens
  const { id_token, access_token } = await exchangeCodeForToken(code, codeVerifier);

  // throws error if invalid
  await validateTokens({ id_token, access_token }).catch((e) => {
    console.error(e);
    throw e;
  });

  return { access_token };
}

async function createApiKey({ label, access_token }) {
  const res = await fetch(`${API_URL}/api-keys/new`, {
    method: 'POST',
    body: JSON.stringify({ label }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`
    }
  }).catch((err) => ({ ok: false, json: () => ({ message: err.message }) }));

  if (!res.ok)
    throw new CustomError({
      message: ['Failed to create API key.', (await res.json())?.message || DEFAULT_ERROR_ACTION].join(' '),
      notification_id: 'authentication'
    });
  return await res.json();
}

export async function authenticate() {
  // authenticate with oauth
  const { access_token } = await oauthAuthenticate();

  // create an api key valid for 90 days
  const browserLabel = await getBrowserLabel();
  const api_key = await createApiKey({ label: `${browserLabel} extension`, access_token });

  const api_key_str = JSON.stringify(api_key);

  // store the api key for future retrieval
  await browser.storage.local.set({ api_key: api_key_str });
  return api_key_str;
}

async function getBrowserName() {
  if (browser.runtime?.getBrowserInfo) {
    const { name } = await browser.runtime.getBrowserInfo();
    return name;
  }

  // handle Chromium based browsers
  if (browser.runtime.getURL('').startsWith('chrome-extension://')) {
    // this property is experimental
    const detectedBrand = (navigator?.userAgentData?.brands || []).find(({ brand }) => (brand in UA_BRANDS));
    if (detectedBrand) {
      return UA_BRANDS[detectedBrand.brand];
    }

    // fallback to chromium
    return 'chromium';
  }

  return 'browser';
}

async function getBrowserLabel() {
  let label = 'browser';
  try {
    const { os } = await browser.runtime.getPlatformInfo();
    const name = await getBrowserName();
    label = `${os} ${name}`.toLowerCase();
  } catch (err) {
    console.error(err);
  }
  return label;
}
