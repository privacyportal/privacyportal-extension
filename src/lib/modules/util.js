export function bufferToBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

export function base64ToBase64Url(input) {
  return input.replace(/\//g, '_').replace(/\+/g, '-').replace(/=+$/, '');
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
