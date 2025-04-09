/**
 * @param { HTMLInputElement } inputElement
 * @param { HTMLElement } elementToBind
 */
export function bindVisibilityToInputFocus(inputElement, elementToBind) {
  inputElement.addEventListener('focusin', () => {
    elementToBind.style.opacity = '1';
  });

  inputElement.addEventListener('focusout', () => {
    elementToBind.style.opacity = '0';
  });

  // handle click events also
  document.addEventListener(
    'click',
    () => {
      elementToBind.style.opacity = document.activeElement === inputElement ? '1' : '0';
    },
    true
  );
}

/**
 * @param {HTMLElement} element
 * @returns {Promise<{ancestor: HTMLElement; shadowRoot: ShadowRoot;}>}
 */
export async function attachShadowDomToFirstCompatibleAncestor(element) {
  let ancestor = element.parentElement;
  let shadowRoot;
  while (ancestor) {
    try {
      shadowRoot = ancestor.shadowRoot || ancestor.attachShadow({ mode: 'open' });

      // style
      const style = document.createElement('style');
      style.textContent = `:host{position:relative;display:block;box-sizing:border-box;margin:0;padding:0;}`;

      // Preserve original input in light DOM
      const slot = document.createElement('slot');

      shadowRoot.append(style, slot);
    } catch {
      /* do nothing */
    }

    if (shadowRoot) return { ancestor, shadowRoot };
    ancestor = ancestor.parentElement;
  }
  throw new Error('Failed to attach HME DOM.');
}

/**
 * @param {HTMLInputElement} inputElement
 * @param {Element} ancestor
 * @param {FrameRequestCallback} updatePosition
 */
export function bindShadowElementPosition(inputElement, ancestor, updatePosition) {
  let animationFrame = 0;
  const debouncedUpdate = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(updatePosition);
  };

  // Handle dynamic updates
  const observer = new ResizeObserver(debouncedUpdate);
  observer.observe(inputElement);
  observer.observe(ancestor);

  // cleanup the observer at GC time
  const registry = new FinalizationRegistry((observer) => {
    observer.unobserve(inputElement);
    observer.unobserve(ancestor);
    observer.disconnect();
  });

  const weakRef = new WeakRef(inputElement);
  registry.register(weakRef, observer);
}

/**
 * @param {number} amount
 * @param {{toFixed?: number} | undefined} opts
 */
export function fmtPixelDimension(amount, opts = undefined) {
  return (opts?.toFixed ? amount.toFixed(opts.toFixed) : amount) + 'px';
}
