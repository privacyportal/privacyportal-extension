import sendRequest from './sendRequest.js';

export async function deteleApiKey({ api_key }) {
  return await sendRequest({
    method: 'DELETE',
    path: `/api-keys/${api_key?.key}`,
    api_key
  });
}

export async function getApiKey({ api_key, notification }) {
  return await sendRequest({
    method: 'GET',
    path: `/api-keys/${api_key?.key}`,
    api_key,
    ...(notification && { notification })
  });
}

export async function getE2EEServiceKeys({ service }) {
  return await sendRequest({
    method: 'GET',
    path: `/e2ee/keys/${service}`
  });
}

export async function getE2EEKeys({ type }) {
  const query = type ? `?type=${type}` : '';
  return await sendRequest({
    method: 'GET',
    path: `/e2ee/keys${query}`
  });
}

export async function addE2EEServiceKey({ service, data }) {
  return await sendRequest({
    method: 'POST',
    path: `/e2ee/keys/${service}/new`,
    data
  });
}

export async function findOrCreatePrivacyAddress({ label = undefined, ct = undefined, srch = undefined }) {
  return await sendRequest({
    method: 'POST',
    path: '/email-relay/addresses/new',
    data: {
      ...(ct ? { ct, ...(srch && { srch }) } : { label }),
      unique: true
    },
    notification: {
      id: 'new_privacy_address',
      description: 'Failed to create privacy address. Please try again later.'
    }
  });
}
