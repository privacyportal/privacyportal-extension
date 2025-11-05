import browser from 'webextension-polyfill';

export async function storageWrite(key, value) {
  return await browser.storage.local.set({ [key]: JSON.stringify(value) });
}

export async function storageRead(key) {
  const result = await browser.storage.local.get([key]);
  return result?.[key];
}

export async function storageClear() {
  await browser.storage.local.clear();
  await browser.storage.session.clear();
}

export async function sessionWrite(key, value) {
  return await browser.storage.session.set({ [key]: JSON.stringify(value) });
}

export async function sessionRead(key) {
  const value = (await browser.storage.session.get([key]))?.[key];
  if (value) return JSON.parse(value);
  return null;
}
