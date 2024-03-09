import browser from 'webextension-polyfill';
import { displayError } from './lib/modules/error';
import { authenticate } from './lib/modules/oauth';
import { findOrCreatePrivacyAddress } from './lib/modules/requests';

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

/**
 * @param {browser.Tabs.Tab} tab
 */
async function handleNewPrivacyAddressRequest(tab) {
  // create new Privacy Address for url
  const { protocol, hostname } = new URL(tab.url);
  const { value } = await findOrCreatePrivacyAddress({ label: `${protocol}//${hostname}` });
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
