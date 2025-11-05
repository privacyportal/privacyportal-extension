import { get } from 'svelte/store';
import { e2eeMasterKey, e2eePwdMkey, e2eeServiceKeys, loadingE2EEMasterKey, session } from '../../stores/account';
import { STORAGE_E2EE_MKEY, STORAGE_E2EE_SERVICE_KEYS } from '../constants';
import { crypto } from '../crypto';
import { CustomError } from '../error';
import { addE2EEServiceKey, getE2EEKeys, getE2EEServiceKeys } from '../requests';
import { sessionRead, sessionWrite, storageRead, storageWrite } from '../storage';
import { base64UrlToBuffer, bufferToBase64Url, safeParseJSON } from '../util';

const ENCODER = new TextEncoder();

export async function loadServiceKeys(service) {
  const $session = get(session);
  if ($session?.e2ee && get(e2eeServiceKeys)?.service?.name !== service) {
    // try to load from session storage
    const storedServiceKeys = await sessionRead(STORAGE_E2EE_SERVICE_KEYS);
    if (storedServiceKeys?.service?.name === service) {
      e2eeServiceKeys.set(storedServiceKeys);
    } else {
      const serviceKeys = await getE2EEServiceKeys({ service });

      if (!serviceKeys?.service) {
        // service key not yet configured
        // @ts-ignore
        const { publicKey } = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveKey']);
        const newServiceKeys = await addE2EEServiceKey({
          service,
          data: {
            pubkey: await crypto.subtle.exportKey('jwk', publicKey)
          }
        });

        // override service
        Object.assign(serviceKeys, newServiceKeys);
      }

      const keysToStore = {
        acc: serviceKeys.acc,
        service: {
          name: service,
          ...serviceKeys.service
        },
        srch: serviceKeys.srch
      };

      e2eeServiceKeys.set(keysToStore);
      await sessionWrite(STORAGE_E2EE_SERVICE_KEYS, keysToStore);
    }
  }
}

export async function loadMasterKey() {
  const $session = get(session);
  if ($session?.e2ee && !get(e2eePwdMkey)) {
    let loaded = false;
    try {
      loadingE2EEMasterKey.set(true);
      const mkey = safeParseJSON(await storageRead(STORAGE_E2EE_MKEY));
      if (mkey) {
        e2eeMasterKey.set(await unwrapMasterKeyWithPassword(mkey, $session?.secret));
        loaded = true;
      }
    } catch (err) {
      console.error(err);
      e2eeMasterKey.set(undefined);
    } finally {
      loadingE2EEMasterKey.set(false);
      if (!loaded) {
        const e2eeKeys = await getE2EEKeys({ type: 'pwd' });
        e2eePwdMkey.set(e2eeKeys?.[0]);
      }
    }
  }
}

// wrap and store master key in its encrypted form (using the api_key as encryption password)
export async function storeMasterKey($e2eeMasterKey) {
  const $session = get(session);
  if ($session?.e2ee && $e2eeMasterKey) {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const wrappingKey = await deriveWrappingKeyFromPassword($session?.secret, salt);
    if (wrappingKey) {
      const wrappedMasterKey = bufferToBase64Url(await crypto.subtle.wrapKey('raw', $e2eeMasterKey, wrappingKey, 'AES-KW'));
      await storageWrite(STORAGE_E2EE_MKEY, {
        ct: wrappedMasterKey,
        salt: bufferToBase64Url(salt)
      });
    }
  }
}

export async function unwrapMasterKeyWithPassword(mkey, password) {
  const wrappingKey = await deriveWrappingKeyFromPassword(password, mkey.salt).catch((err) => {
    console.error(err);
    throw err;
  });
  return await crypto.subtle.unwrapKey('raw', base64UrlToBuffer(mkey.ct), wrappingKey, 'AES-KW', { name: 'AES-KW', length: 256 }, true, ['wrapKey', 'unwrapKey']).catch((err) => {
    console.error(err);
    throw new CustomError({ message: 'Password Incorrect', notification_id: 'e2ee_wrong_pwd' });
  });
}

async function deriveWrappingKeyFromPassword(password, salt) {
  salt = typeof salt === 'string' ? base64UrlToBuffer(salt) : salt;
  const passwordBuffer = ENCODER.encode(password || '');
  const baseKey = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-384' }, baseKey, { name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);
}

export async function deriveWrappingKey($e2eeServiceKeys, $e2eeMasterKey) {
  const [pk, sk] = await Promise.all([
    crypto.subtle.importKey('raw', base64UrlToBuffer($e2eeServiceKeys.service.pk), { name: 'X25519' }, true, []),
    crypto.subtle.unwrapKey('pkcs8', base64UrlToBuffer($e2eeServiceKeys.acc.sk), $e2eeMasterKey, 'AES-KW', { name: 'X25519' }, false, ['deriveKey'])
  ]);
  return await crypto.subtle.deriveKey({ name: 'X25519', public: pk }, sk, { name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);
}
