export const FIREFOX_UA_STR = 'firefox';
export const ANDROID_UA_STR = 'android';

/**
 * @param {Navigator} navigator
 * @param {string[]} items
 * @returns {boolean}
 */
export function uaIncludesAll(navigator, items) {
  const ua = navigator.userAgent.toLowerCase();
  for (const item of items) {
    if (ua.indexOf(item) === -1) return false;
  }
  return true;
}
