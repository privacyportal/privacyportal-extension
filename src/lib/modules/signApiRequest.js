import { crypto } from './crypto';
import { base64ToBase64Url, bufferToBase64 } from './util';

const ALGORITHM = {
  name: 'HMAC',
  hash: 'SHA-256'
};

const encoder = new TextEncoder();

export default async function signApiRequest(params) {
  const { method, url, body, timestamp, secret } = params;

  const items_to_sign = [timestamp, method, url];
  if (body && Object.keys(body).length > 0) items_to_sign.push(body);

  const keyData = encoder.encode(secret);
  const dataToSign = encoder.encode(items_to_sign.join('\n'));

  const key = await crypto.subtle.importKey('raw', keyData, ALGORITHM, false, ['sign']);

  const signature = await crypto.subtle.sign(ALGORITHM.name, key, dataToSign);

  return base64ToBase64Url(bufferToBase64(signature));
}
