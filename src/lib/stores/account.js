import { get, writable } from 'svelte/store';
import browser from 'webextension-polyfill';
import { storageClear, storageRead } from '../modules/storage';
import { safeParseJSON } from '../modules/util';

export const session = writable(undefined);
export const cryptoTasks = writable(undefined);
export const loadingE2EEMasterKey = writable(false);
export const e2eeMasterKey = writable(undefined);
export const e2eePwdMkey = writable(undefined);
export const e2eeServiceKeys = writable(undefined);

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
  clearE2EEData();
}

export async function loadSession() {
  const api_key = await storageRead('api_key');
  session.set(safeParseJSON(api_key));
}

export function cleanupCryptoTasks() {
  const $cryptoTasks = get(cryptoTasks);
  if ($cryptoTasks) {
    $cryptoTasks.cleanup();
    cryptoTasks.set(undefined);
  }
}

export function clearE2EEData() {
  cleanupCryptoTasks();
  e2eePwdMkey.set(undefined);
  e2eeMasterKey.set(undefined);
  e2eeServiceKeys.set(undefined);
}
