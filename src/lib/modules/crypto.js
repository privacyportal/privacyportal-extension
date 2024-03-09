export const crypto = self?.crypto || window.crypto;

export async function digestMessage(message, options = {}) {
  const { algorithm } = { algorithm: 'SHA-256', ...options };
  const msgUint8 = new TextEncoder().encode(message);
  return await crypto.subtle.digest(algorithm, msgUint8);
}
