/**
 * @file Slot resolution and content projection for Kite components.
 * @module components/slot
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Replaces `<slot>` elements in a component template with matching projected content
 * from the caller `<kite-use>`. Supports named slots, default slots, and fallback content.
 */

/**
 * Resolves and injects slots in a cloned component template.
 *
 * @param {DocumentFragment|Element} clonedTemplate - Cloned component template DOM.
 * @param {Element} hostEl - The `<kite-use>` element containing projected slot content.
 */
export function resolveSlots(clonedTemplate, hostEl) {
  if (!clonedTemplate || typeof clonedTemplate.querySelectorAll !== 'function') return;
  // Collect all slot elements in the cloned template
  const slots = clonedTemplate.querySelectorAll('slot');
  if (slots.length === 0) return;

  // Map of slot name -> Array of provided DOM nodes from hostEl
  const providedSlots = new Map();
  providedSlots.set('default', []);

  // Classify child nodes in hostEl
  const hostChildren = Array.from(hostEl.childNodes);
  for (const child of hostChildren) {
    // If element has a slot attribute: <div slot="actions">
    if (child.nodeType === 1 && child.hasAttribute('slot')) {
      const slotName = child.getAttribute('slot');
      if (!providedSlots.has(slotName)) {
        providedSlots.set(slotName, []);
      }
      providedSlots.get(slotName).push(child.cloneNode(true));
    } else {
      // Non-empty text or unslotted elements go to default slot
      if (child.nodeType === 3 && !child.textContent.trim()) {
        continue; // skip whitespace-only text nodes
      }
      providedSlots.get('default').push(child.cloneNode(true));
    }
  }

  // Replace each <slot> with corresponding provided nodes or retain fallback
  for (let i = 0; i < slots.length; i++) {
    const slotEl = slots[i];
    const slotName = slotEl.getAttribute('name') || 'default';

    const matchingNodes = providedSlots.get(slotName);

    if (matchingNodes && matchingNodes.length > 0) {
      const parent = slotEl.parentNode;
      for (const node of matchingNodes) {
        parent.insertBefore(node, slotEl);
      }
      parent.removeChild(slotEl);
    } else {
      // No matching content provided: unwrap and keep the slot's fallback children
      const parent = slotEl.parentNode;
      while (slotEl.firstChild) {
        parent.insertBefore(slotEl.firstChild, slotEl);
      }
      parent.removeChild(slotEl);
    }
  }
}
