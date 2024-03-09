import { writable } from 'svelte/store';
import browser from 'webextension-polyfill';
import { storageClear, storageRead } from '../modules/storage';
import { safeParseJSON } from '../modules/util';

export const session = writable(undefined);

// listen to api_key changes
browser.storage.local.onChanged.addListener((changes) => {
  const changedItems = Object.keys(changes);

  for (const item of changedItems) {
    if (item === 'api_key') {
      session.set(safeParseJSON(changes[item].newValue));
    }
  }
});

export function endSession() {
  storageClear();
  session.set(null);
}

export async function loadSession() {
  const api_key = await storageRead('api_key');
  session.set(safeParseJSON(api_key));
}
