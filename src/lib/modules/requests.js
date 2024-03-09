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

export async function findOrCreatePrivacyAddress({ label }) {
  return await sendRequest({
    method: 'POST',
    path: '/email-relay/addresses/new',
    data: {
      label,
      unique: true
    },
    notification: {
      id: 'new_privacy_address',
      description: 'Failed to create privacy address. Please try again later.'
    }
  });
}
