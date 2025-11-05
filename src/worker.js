import { get } from 'svelte/store';
import browser from 'webextension-polyfill';
import CryptoTasks from './lib/modules/e2ee/CryptoTasks';
import { loadMasterKey, loadServiceKeys } from './lib/modules/e2ee/e2eeUtils';
import { encryptAddressData } from './lib/modules/e2ee/mrelayUtils';
import { displayError } from './lib/modules/error';
import { authenticate } from './lib/modules/oauth';
import { findOrCreatePrivacyAddress } from './lib/modules/requests';
import { loadSession, session } from './lib/stores/account';

// listen to messages from extension or content-script
browser.runtime.onMessage.addListener(async (message, sender) => {
  let response;
  try {
    switch (message.type) {
      case 'authenticate': {
        response = await authenticate();
        break;
      }
      case 'privacy-address-request': {
        await handleNewPrivacyAddressRequest(sender.tab);
        break;
      }
    }
  } catch (err) {
    console.error(err);
    displayError(err);
  }
  return response;
});

async function reloadE2EEConfig() {
  await loadSession();
  await loadServiceKeys('mrelay');
  await loadMasterKey();
}

/**
 * @param {browser.Tabs.Tab} tab
 */
async function handleNewPrivacyAddressRequest(tab) {
  // create new Privacy Address for url
  const { protocol, hostname } = new URL(tab.url);
  const address = { label: `${protocol}//${hostname}` };
  await reloadE2EEConfig();
  const encryptedAddress = get(session)?.e2ee ? await encryptAddressData(address, CryptoTasks) : undefined;
  const { value } = await findOrCreatePrivacyAddress(encryptedAddress ?? address);
  browser.tabs.sendMessage(tab.id, { type: 'new-privacy-address', value });
}

// listen to keyboard shortcuts
if (browser?.commands?.onCommand) {
  browser.commands.onCommand.addListener((command) => {
    if (command === 'privacy-address') {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        return browser.tabs.sendMessage(tab.id, { type: 'detect-active-input' }).then((hasActiveInput) => {
          if (hasActiveInput) {
            handleNewPrivacyAddressRequest(tab);
          }
        });
      });
    }
  });
}
