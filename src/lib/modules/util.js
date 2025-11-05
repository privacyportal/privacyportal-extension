export function bufferToBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

export function base64ToBase64Url(input) {
  return input.replace(/\//g, '_').replace(/\+/g, '-').replace(/=+$/, '');
}

export function base64UrlToBase64(input) {
  return input.replace(/-/g, '+').replace(/_/g, '/');
}

export function bufferToBase64Url(buffer) {
  return base64ToBase64Url(bufferToBase64(buffer));
}

export function base64ToBuffer(input) {
  return new Uint8Array(
    atob(input)
      .split('')
      .map((c) => c.charCodeAt(0))
  ).buffer;
}

export function base64UrlToBuffer(input) {
  return base64ToBuffer(base64UrlToBase64(input));
}

export function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeParseJSON(value) {
  let result = null;
  if (!value) return result;
  try {
    result = JSON.parse(value);
  } catch {
    // do nothing
  }
  return result;
}

export function isString(input) {
  return typeof input === 'string' || input instanceof String;
}

export function writeValueToClipboard(value) {
  setTimeout(async () => await navigator.clipboard.writeText(value));
}

export function normalizeText(text) {
  return text.toLowerCase().normalize('NFKC');
}
