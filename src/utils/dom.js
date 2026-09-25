/**
 * @file Native DOM utilities and structural helpers for Kite.
 * @module utils/dom
 * @author Kite Contributors
 * @license MIT
 */

/**
 * Creates an anchor comment node used to remember position when conditionally rendering.
 *
 * @param {string} label - Descriptive tag for the comment anchor.
 * @returns {Comment} A DOM comment node.
 * @example
 * const placeholder = createAnchor('kite-if: count > 5');
 */
export function createAnchor(label) {
  if (typeof document !== 'undefined' && typeof document.createComment === 'function') {
    return document.createComment(`kite:${label}`);
  }
  return { nodeType: 8, nodeValue: `kite:${label}` };
}

/**
 * Safely inserts a node immediately after a reference node.
 *
 * @param {Node} newNode - The node to insert.
 * @param {Node} referenceNode - The node to insert after.
 */
export function insertAfter(newNode, referenceNode) {
  if (referenceNode.parentNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }
}

/**
 * Extracts all attributes starting with 'kite-' from an element.
 *
 * @param {Element} el - DOM element to inspect.
 * @returns {Array<{ name: string, value: string }>} List of matching attribute records.
 */
export function getKiteAttributes(el) {
  if (!el || !el.attributes) return [];
  const results = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.name.startsWith('kite-')) {
      results.push({ name: attr.name, value: attr.value });
    }
  }
  return results;
}

/**
 * Recursively walks a DOM subtree, including open Shadow DOM roots.
 *
 * @param {Node} root - Root node to start traversal.
 * @param {Function} callback - Invoked for each element visited. Return false to skip children.
 */
export function walkTree(root, callback) {
  if (!root || root.nodeType !== 1) return; // Must be Element

  const shouldContinue = callback(root);
  if (shouldContinue === false) return;

  // Inspect open shadow root if present
  if (root.shadowRoot) {
    walkTree(root.shadowRoot, callback);
  }

  let child = root.firstElementChild;
  while (child) {
    const next = child.nextElementSibling;
    walkTree(child, callback);
    child = next;
  }
}

/**
 * Attaches an event listener with support for event modifiers.
 *
 * Supported modifiers:
 * - `.prevent`: Calls event.preventDefault()
 * - `.stop`: Calls event.stopPropagation()
 * - `.once`: Listener removes itself after first invocation
 *
 * @param {Element} el - Target DOM element.
 * @param {string} eventName - Standard event name (e.g. 'click', 'submit').
 * @param {Function} handler - Callback to invoke.
 * @param {Array<string>} [modifiers=[]] - Array of modifier flags.
 * @returns {Function} Cleanup function to remove listener.
 */
export function attachEvent(el, eventName, handler, modifiers = []) {
  const options = {
    once: modifiers.includes('once')
  };

  const listener = (event) => {
    if (modifiers.includes('prevent') || (eventName === 'submit' && !modifiers.includes('no-prevent'))) {
      event.preventDefault();
    }
    if (modifiers.includes('stop')) {
      event.stopPropagation();
    }
    handler(event);
  };

  el.addEventListener(eventName, listener, options);
  return () => el.removeEventListener(eventName, listener, options);
}
