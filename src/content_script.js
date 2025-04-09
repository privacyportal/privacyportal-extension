import browser from 'webextension-polyfill';
import hmeLogo from './lib/modules/assets/hmeLogo';
import { attachShadowDomToFirstCompatibleAncestor, bindShadowElementPosition, bindVisibilityToInputFocus, fmtPixelDimension } from './lib/modules/domUtils';
import { storageRead } from './lib/modules/storage';
import { ANDROID_UA_STR, FIREFOX_UA_STR, uaIncludesAll } from './lib/modules/uaUtils';

let detectedInput;

const DATALIST_SUGGESTION = '*****@pportal.io';
const HME_LABEL = 'Hide my Email';

const EMAIL_INPUT_SCOPES = [
  `input[type=email]`,
  `input[type=text][id*="email" i]`,
  `input[type=text][name*="email" i]`,
  `input[type=text][name*="username" i]`,
  `input[type=text][name*="login" i]`,
  `input[type=text][placeholder*="email" i]`,
  `input[type=text][placeholder*="e-mail" i]`
];
const EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.join(', ');
const INJECTABLE_EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.map((scope) => `${scope}:not([data-pp])`).join(', ');
const INJECTED_EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.map((scope) => `${scope}[data-pp]`).join(', ');

const isFirefoxAndroid = uaIncludesAll(navigator, [FIREFOX_UA_STR, ANDROID_UA_STR]);
const isFirefox = uaIncludesAll(navigator, [FIREFOX_UA_STR]);

// detect mouse events
const delegate = (selector, opts) => (cb) => (e) => {
  const target = opts?.shadow ? e?.composedPath()?.[0] : e.target;
  return target?.matches(selector) && cb(target);
};

const inputDelegate = delegate(INJECTABLE_EMAIL_INPUT_SCOPE);
const shadowInputDelegate = delegate(INJECTABLE_EMAIL_INPUT_SCOPE, { shadow: true });

async function isLoggedIn() {
  return !!(await storageRead('api_key'));
}

function isElementDisplayed(element) {
  return element.offsetWidth !== 0 || element.offsetHeight !== 0;
}

/**
 * @param {HTMLInputElement} inputElement
 */
async function handleHME(inputElement) {
  inputElement.value = '';
  detectedInput = inputElement;
  await browser.runtime.sendMessage(undefined, { type: 'privacy-address-request' });
}

async function injectDataList(inputElement) {
  // only inject datalist if the user is logged in
  const shouldInject = await isLoggedIn();

  if (shouldInject) {
    const datalistId = `pp-${window.crypto.randomUUID().substring(0, 8)}`;

    if (isFirefoxAndroid) {
      const { ancestor, shadowRoot } = await attachShadowDomToFirstCompatibleAncestor(inputElement);

      const option = document.createElement('li');
      option.innerText = HME_LABEL;
      option.style.padding = '3px';
      option.style.cursor = 'pointer';

      const list = document.createElement('ul');
      list.id = datalistId;
      list.style.display = 'block';
      list.style.position = 'absolute';
      list.style.maxHeight = '300px';
      list.style.overflowY = 'auto';
      list.style.listStyle = 'none';
      list.style.backgroundColor = 'Canvas';
      list.style.color = 'CanvasText';
      list.style.colorScheme = 'light dark';
      list.style.boxShadow = '0 2px 2px #999';
      list.style.fontSize = 'small';
      list.style.zIndex = '1000';
      list.style.padding = list.style.margin = '0px';

      list.appendChild(option);

      const style = document.createElement('style');
      style.textContent = `li:hover{background-color:ButtonFace;color:ButtonText;}`;

      // Add list to shadow DOM
      shadowRoot.append(style, list);

      bindShadowElementPosition(inputElement, ancestor, () => {
        // update button position
        const inputRect = inputElement.getBoundingClientRect();
        const parentRect = ancestor.getBoundingClientRect();
        list.style.width = fmtPixelDimension(inputRect.width);
        list.style.top = fmtPixelDimension(inputRect.bottom - parentRect.top, {
          toFixed: 2
        });
        list.style.left = fmtPixelDimension(inputRect.left - parentRect.left, {
          toFixed: 2
        });
      });

      // add input element attribute to only apply once
      inputElement.setAttribute('data-pp', '');

      option.onmousedown = (e) => {
        // keep the focus on the input field
        e.preventDefault();
      };

      // handle selection
      option.onclick = async () => {
        list.style.opacity = '0';
        await handleHME(inputElement).catch(console.error);
      };

      // handle show and hide
      bindVisibilityToInputFocus(inputElement, list);
    } else {
      // create datalist option
      const option = document.createElement('option');
      option.setAttribute('id', 'new-privacy-addr');
      option.setAttribute('value', DATALIST_SUGGESTION);
      option.textContent = HME_LABEL;

      let datalist;

      // check if datalist exists
      if (inputElement.hasAttribute('list')) {
        const detectedDataListId = inputElement.getAttribute('list');
        if (detectedDataListId) {
          datalist = document.getElementById(detectedDataListId);
        }
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

      // add logo btn to inputs on firefox
      if (isFirefox) {
        const { ancestor, shadowRoot } = await attachShadowDomToFirstCompatibleAncestor(inputElement);

        // Create button element
        const btn = document.createElement('button');
        btn.title = HME_LABEL;

        Object.assign(btn.style, {
          position: 'absolute',
          border: 'none',
          borderRadius: '15px',
          cursor: 'pointer',
          padding: '0',
          margin: '0',
          zIndex: '1000',
          pointerEvents: 'auto',
          right: '8px',
          opacity: '0',
          transition: 'opacity 0.1s ease'
        });

        btn.appendChild(hmeLogo());

        // Add elements to shadow DOM
        shadowRoot.append(btn);

        bindShadowElementPosition(inputElement, ancestor, () => {
          // update button position
          const rect = inputElement.getBoundingClientRect();
          const parentRect = ancestor.getBoundingClientRect();
          const paddingRight = parseFloat(window.getComputedStyle(inputElement).getPropertyValue('padding-right')) || 0;
          btn.style.height = btn.style.width = fmtPixelDimension(rect.height * 0.7, { toFixed: 2 });
          btn.style.top = fmtPixelDimension(rect.top - parentRect.top + rect.height * 0.15, { toFixed: 2 });
          btn.style.right = fmtPixelDimension(parentRect.right - rect.right + Math.max(paddingRight, rect.height * 0.15), { toFixed: 2 });
        });

        // handle show and hide
        bindVisibilityToInputFocus(inputElement, btn);

        btn.onmousedown = (e) => {
          // keep the focus on the input field
          e.preventDefault();
        };

        btn.onclick = async () => {
          try {
            btn.disabled = true;
            await handleHME(inputElement);
          } catch (err) {
            console.error(err);
          } finally {
            btn.disabled = false;
          }
        };
      }
    }

    // listen to datalist selection (needs update in the future when datalist supports event listeners)
    inputElement.addEventListener('input', async () => {
      if (inputElement.value === '@' || inputElement.value === DATALIST_SUGGESTION) {
        await handleHME(inputElement).catch(console.error);
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
    if (isElementDisplayed(inputElement)) {
      injectDataList(inputElement).catch((e) => {
        console.error(e);
      });
    }
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

function injectDataListOnShadowDom() {
  document.addEventListener(
    'click',
    shadowInputDelegate((inputElement) => {
      injectDataList(inputElement);
    }),
    true
  );
}

window.addEventListener('load', () => {
  detectAndInjectDataList();
  injectDataListOnShadowDom();
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
  if (activeElement?.matches(EMAIL_INPUT_SCOPE)) {
    // @ts-ignore
    activeElement.blur();
    // @ts-ignore
    activeElement.focus();
  }
}

function hasActiveInput() {
  const { activeElement } = document;
  if (activeElement?.matches(EMAIL_INPUT_SCOPE)) {
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
