import { base64UrlToBuffer, bufferToBase64Url, bufferToHex, normalizeText } from '../util';

const ENCODER = new TextEncoder();
const HMAC_ALG = {
  name: 'HMAC',
  hash: { name: 'SHA-256' },
  length: 256
};

export async function encryptString({ input, wrappingKey, serviceKeys }) {
  const dataEncryptionKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherText = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dataEncryptionKey, ENCODER.encode(input));
  const datakey = await crypto.subtle.wrapKey('raw', dataEncryptionKey, wrappingKey, 'AES-KW');
  return [serviceKeys.acc.id, serviceKeys.service.id, bufferToBase64Url(cipherText), bufferToBase64Url(iv), bufferToBase64Url(datakey)].join('.');
}

export async function hashString({ input, serviceKeys, masterKey }) {
  const data = ENCODER.encode(`${serviceKeys.service.id}:${normalizeText(input)}`);
  const hmacKey = await crypto.subtle.unwrapKey('raw', base64UrlToBuffer(serviceKeys.srch.sk), masterKey, 'AES-KW', HMAC_ALG, false, ['sign']);
  const hash = await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, data);
  return bufferToHex(hash).substring(0, 12);
}
