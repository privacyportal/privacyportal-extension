import { get } from 'svelte/store';
import { e2eeMasterKey, e2eeServiceKeys } from '../../stores/account';
import { crypto } from '../crypto';
import { encryptString, hashString } from './cryptoWorkerUtils';
import { deriveWrappingKey } from './e2eeUtils';

export default class CryptoTasks {
  constructor(params) {
    this.worker = new Worker(new URL('./CryptoWorker.js', import.meta.url), { type: 'module' });
    this.pendingRequests = new Map();
    this.serviceName = params.serviceKeys.service.name;

    this.worker.onmessage = (event) => {
      const { id, result, error } = event.data;
      const promise = this.pendingRequests.get(id);
      if (promise) {
        error ? promise.reject(error) : promise.resolve(result);
        this.pendingRequests.delete(id);
      }
    };

    this.worker.postMessage({ action: 'init', params });
  }

  async performTask(action, params) {
    const id = crypto.randomUUID();
    const promise = new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
    });
    this.worker.postMessage({ id, action, params });
    return promise;
  }

  async encryptStr(input) {
    return this.performTask('encrypt', { input });
  }

  async hashStr(input) {
    return this.performTask('srch_hash', { input });
  }

  cleanup() {
    this.worker.terminate();
  }

  // used for direct calls outside the worker
  static async encryptStr(input) {
    const serviceKeys = get(e2eeServiceKeys);
    return await encryptString({
      input,
      wrappingKey: await deriveWrappingKey(serviceKeys, get(e2eeMasterKey)),
      serviceKeys
    });
  }

  // used for direct calls outside the worker
  static async hashStr(input) {
    const serviceKeys = get(e2eeServiceKeys);
    const masterKey = get(e2eeMasterKey);
    return await hashString({ input, serviceKeys, masterKey });
  }
}
