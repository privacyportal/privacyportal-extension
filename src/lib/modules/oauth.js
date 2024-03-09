import { createRemoteJWKSet, jwtVerify } from 'jose';
import browser from 'webextension-polyfill';
import { API_URL, AUTHORIZATION_URL, JWKS_URL, OAUTH_CLIENT_ID } from './constants';
import { crypto, digestMessage } from './crypto';
import { CustomError, DEFAULT_ERROR_ACTION } from './error';
import { base64ToBase64Url, bufferToBase64, isString } from './util';

const AUTH_ERROR_MESSAGE = ['Authentication failed.', DEFAULT_ERROR_ACTION].join(' ');

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

function createAuthorizationURL() {
  const authParams = new URLSearchParams();
  authParams.set('client_id', OAUTH_CLIENT_ID);
  authParams.set('scope', 'openid w:api_keys');
  authParams.set('response_type', 'id_token token');
  authParams.set('nonce', crypto.randomUUID().substring(4, 18));
  authParams.set('redirect_uri', browser.identity.getRedirectURL());

  const authUrl = new URL(AUTHORIZATION_URL);
  authUrl.search = authParams.toString();

  return authUrl.toString();
}

export async function oauthAuthenticate() {
  // start oauth authentication
  const response = await browser.identity.launchWebAuthFlow({
    url: createAuthorizationURL(),
    interactive: true
  });

  // parse resonse
  const searchParams = new URL(response).searchParams;
  const id_token = searchParams.get('id_token');
  const access_token = searchParams.get('access_token');

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
  const api_key = await createApiKey({ label: 'firefox extension', access_token });

  const api_key_str = JSON.stringify(api_key);

  // store the api key for future retrieval
  await browser.storage.local.set({ api_key: api_key_str });
  return api_key_str;
}
