import browser from 'webextension-polyfill';
import { storageRead } from './lib/modules/storage';

let detectedInput;

const EMAIL_INPUT_SCOPES = [
  'input[type=email]',
  'input[type=text][id*=email]',
  'input[type=text][name*=email]',
  'input[type=text][name*=username]',
  'input[type=text][name*=login]',
  'input[type=text][placeholder*=email]'
];
const EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.join(', ');
const INJECTABLE_EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.map((scope) => `${scope}:not([data-pp])`).join(', ');
const INJECTED_EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.map((scope) => `${scope}[data-pp]`).join(', ');

const isFirefoxAndroid = ((ua) => ua.indexOf('firefox') > -1 && ua.indexOf('android') > -1)(navigator.userAgent.toLowerCase());

// detect mouse events
const delegate = (selector) => (cb) => (e) => e.target.matches && e.target.matches(selector) && cb(e.target);

const inputDelegate = delegate(INJECTABLE_EMAIL_INPUT_SCOPE);

async function isLoggedIn() {
  return !!(await storageRead('api_key'));
}

async function injectDataList(inputElement) {
  // only inject datalist if the user is logged in
  const shouldInject = await isLoggedIn();

  if (shouldInject) {
    const datalistId = `pp-${window.crypto.randomUUID().substring(0, 8)}`;

    if (isFirefoxAndroid) {
      const option = document.createElement('li');
      option.innerText = 'Hide my Email';
      option.style.padding = '3px';
      option.style.cursor = 'pointer';

      const list = document.createElement('ul');
      list.id = datalistId;
      list.style.display = 'block';
      list.style.position = 'absolute';
      list.style.maxHeight = '300px';
      list.style.overflowY = 'auto';
      list.style.listStyle = 'none';
      list.style.background = 'white';
      list.style.boxShadow = '0 2px 2px #999';
      list.style.fontSize = 'small';
      list.style.zIndex = '1000';
      list.style.padding = '0px';
      list.style.margin = '0px';

      list.appendChild(option);

      const positionList = function () {
        const { left, width, bottom } = inputElement.getBoundingClientRect();
        list.style.top = bottom + 'px';
        list.style.left = left + 'px';
        list.style.width = width + 'px';
      };

      document.body.appendChild(list);

      // add input element attribute to only apply once
      inputElement.setAttribute('data-pp', '');

      // position the list
      positionList();
      window.addEventListener('resize', positionList);

      // handle show and hide
      inputElement.addEventListener('focusin', () => {
        list.style.visibility = 'visible';
      });
      inputElement.addEventListener('focusout', () => {
        // delay to ensure click event is triggered
        setTimeout(() => {
          list.style.visibility = 'hidden';
        }, 0);
      });

      // handle focusout using click event to ensure lists have precedence
      document.addEventListener(
        'click',
        (e) => {
          if (list.style.visibility === 'visible') {
            const rect = inputElement.getBoundingClientRect();
            if (e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right) {
              list.style.visibility = 'hidden';
            }
          }
        },
        true
      );

      // handle selection
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputElement.value = '';
        detectedInput = inputElement;
        list.style.visibility = 'hidden';
        browser.runtime.sendMessage(undefined, { type: 'privacy-address-request' });
      });
    } else {
      // create datalist option
      const option = document.createElement('option');
      option.setAttribute('id', 'new-privacy-addr');
      option.setAttribute('value', '******@pportal.io');
      option.textContent = 'Hide my Email';

      let datalist;

      // check if datalist exists
      if (inputElement.hasAttribute('list')) {
        const detectedDataListId = inputElement.getAttribute('list');
        datalist = document.getElementById(detectedDataListId);
      }

      if (!datalist) {
        // create datalist element
        datalist = document.createElement('datalist');
        datalist.setAttribute('id', datalistId);

        // add the datalist input element to the input
        inputElement.setAttribute('list', datalistId);
        inputElement.insertAdjacentElement('afterend', datalist);
      }

      // add option to datalist
      datalist.appendChild(option);

      // add input element attribute to only apply once
      inputElement.setAttribute('data-pp', '');
    }

    // listen to datalist selection (needs update in the future when datalist supports event listeners)
    inputElement.addEventListener('input', () => {
      if (inputElement.value === '@' || inputElement.value === '******@pportal.io') {
        inputElement.value = '';
        detectedInput = inputElement;
        browser.runtime.sendMessage(undefined, { type: 'privacy-address-request' });
      }
    });
  }
}

function removeInjectedDataLists() {
  for (const inputElement of document.querySelectorAll(INJECTED_EMAIL_INPUT_SCOPE)) {
    const dataListId = inputElement.getAttribute('list');
    inputElement.removeAttribute('list');
    document.getElementById(dataListId).remove();
  }
}

function detectAndInjectDataList() {
  for (const inputElement of document.querySelectorAll(INJECTABLE_EMAIL_INPUT_SCOPE)) {
    injectDataList(inputElement).catch((e) => {
      console.error(e);
    });
  }
}

function injectDataListOnFocus(containerElement) {
  if (containerElement?.addEventListener) {
    containerElement.addEventListener(
      'focusin',
      inputDelegate((inputElement) => {
        injectDataList(inputElement);
      }),
      true
    );
  }
}

window.addEventListener('load', () => {
  detectAndInjectDataList();
  // inject datalist when focused on input elements inside iframes
  [...document.querySelectorAll('iframe')].map((iframe) => {
    try {
      const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
      // ensure iframe is accessible
      if (iframeDocument?.addEventListener) {
        injectDataListOnFocus(iframeDocument);
      }
    } catch {
      // do nothing
    }
  });
});

// inject datalist when focused on input elements in document
injectDataListOnFocus(document);

browser.storage.local.onChanged.addListener((changes) => {
  const changedItems = Object.keys(changes);

  for (const item of changedItems) {
    if (item === 'api_key') {
      if (changes[item].newValue) {
        // user logged in
        detectAndInjectDataList();
        refocusOnInput();
      } else {
        // user logged out
        removeInjectedDataLists();
      }
    }
  }
});

function refocusOnInput() {
  const { activeElement } = document;
  if (activeElement.matches && activeElement.matches(EMAIL_INPUT_SCOPE)) {
    // @ts-ignore
    activeElement.blur();
    // @ts-ignore
    activeElement.focus();
  }
}

function hasActiveInput() {
  const { activeElement } = document;
  if (activeElement.matches && activeElement.matches(EMAIL_INPUT_SCOPE)) {
    detectedInput = activeElement;
    return true;
  }
  return false;
}

function handleNewPrivacyAddress(address) {
  if (detectedInput && address) {
    detectedInput.value = address;
    detectedInput.dispatchEvent(new Event('paste', { bubbles: true }));
    detectedInput.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

browser.runtime.onMessage.addListener(async (message) => {
  switch (message.type) {
    case 'detect-active-input':
      return hasActiveInput(); // used to filter keyboard shortcut events
    case 'new-privacy-address':
      return handleNewPrivacyAddress(message.value);
  }
});
