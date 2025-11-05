import { crypto } from './crypto';

export function tinyArrayShuffle(array) {
  const shuffled = [...array];
  if (array.length > 10) throw new Error('Array must be <= 10 items.');
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    const j = randomValues[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
