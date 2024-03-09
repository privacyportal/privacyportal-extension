import browser from 'webextension-polyfill';

export async function storageWrite(key, value) {
  return await browser.storage.local.set({ [key]: JSON.stringify(value) });
}

export async function storageRead(key) {
  const result = await browser.storage.local.get([key]);
  return result?.[key];
}

export async function storageClear() {
  return await browser.storage.local.clear();
}
