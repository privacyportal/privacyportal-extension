import { API_URL } from './constants.js';
import { CustomError, displayError } from './error.js';
import signApiRequest from './signApiRequest.js';
import { storageClear, storageRead } from './storage.js';
import { safeParseJSON } from './util.js';

const API_AUTHORIZATION_HEADER = 'authorization';
const API_AUTH_HEADER_TYPE = 'PP';
const API_TIMESTAMP_HEADER = 'X-PP-TS';

const DEFAULT_ERROR_MESSAGE = 'Unexpected Error. Please try again later.';

export async function getApiKey() {
  return safeParseJSON(await storageRead('api_key'));
}

export default async function sendRequest({ api_key = undefined, ...params }) {
  const { method, path, data, notification } = {
    method: 'GET',
    ...params
  };

  const reqBody = JSON.stringify(data);

  const headers = {
    'Content-Type': 'application/json'
  };

  // read api key from storage if not defined
  api_key ||= await getApiKey();

  if (api_key?.key && api_key?.secret) {
    const timestamp = Date.now();

    // create request signature
    const signature = await signApiRequest({
      method,
      url: path,
      body: reqBody,
      timestamp,
      secret: api_key.secret
    });

    // create auth header
    headers[API_AUTHORIZATION_HEADER] = `${API_AUTH_HEADER_TYPE} ${api_key.key}:${signature}`;
    headers[API_TIMESTAMP_HEADER] = timestamp;
  }

  // make request
  const res = await fetch(`${API_URL}${path}`, {
    method,
    body: reqBody,
    headers
  }).catch(() => ({ ok: false, status: 500, json: () => ({ message: notification?.message || DEFAULT_ERROR_MESSAGE }) }));

  if (!res.ok) {
    // handle error

    let error;
    try {
      const { message } = await res.json();
      error = new CustomError({
        ...(notification?.id && { notification_id: notification.id }),
        message
      });
    } catch {
      error = new CustomError({
        ...(notification?.id && { notification_id: notification.id }),
        message: notification?.message || DEFAULT_ERROR_MESSAGE
      });
    }

    // handle unauthorized error (e.g. user manually deleted the API key)
    if (res.status === 401) {
      // sign out
      await storageClear();
    }

    displayError(error);
    throw error;
  }

  let result;
  try {
    result = await res.json();
  } catch {
    const error = new CustomError({
      ...(notification?.id && { notification_id: notification.id }),
      message: notification?.message || DEFAULT_ERROR_MESSAGE
    });

    displayError(error);
    throw error;
  }

  return result;
}
