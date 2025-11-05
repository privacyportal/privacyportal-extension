import { encryptString, hashString } from './cryptoWorkerUtils';

let masterKey, wrappingKey, serviceKeys;

async function handleInit(params) {
  masterKey = params.masterKey;
  wrappingKey = params.wrappingKey;
  serviceKeys = params.serviceKeys;
}

async function handleEncrypt({ input }) {
  return encryptString({ input, wrappingKey, serviceKeys });
}

async function handleSearchHash({ input }) {
  return hashString({ input, serviceKeys, masterKey });
}

self.addEventListener(
  'message',
  async function (event) {
    try {
      let result, error;
      try {
        switch (event.data?.action) {
          case 'init': {
            result = await handleInit(event.data?.params);
            break;
          }
          case 'encrypt': {
            result = await handleEncrypt(event.data?.params);
            break;
          }
          case 'srch_hash': {
            result = await handleSearchHash(event.data?.params);
            break;
          }
          default:
            throw new Error('Unsupported action.');
        }
      } catch (err) {
        error = err;
      }
      self.postMessage({ id: event.data.id, ...(result && { result }), ...(error && { error }) });
    } catch (error) {
      // // Uncomment to debug
      // debugger;

      // break out of the promise and bubble up error
      setTimeout(function () {
        throw 'error';
      });
    }
  },
  false
);
