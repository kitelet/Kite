/**
 * @file Built-in `kite-on` event directive.
 * @module directives/on
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Attaches declarative event listeners to DOM elements with support for
 * key filters, debounce, throttle, self, once, prevent, and stop modifiers.
 *
 * Examples:
 * - `<button kite-on-click="count++">`
 * - `<form kite-on-submit="save()">`
 * - `<input kite-on-keydown.enter="addItem()">`
 * - `<input kite-on-input.debounce="search()">`
 * - `<a href="#" kite-on-click.prevent="openModal()">`
 */

import { evaluateExpression } from '../utils/expr.js';
import { createScope } from '../core/scope.js';
import { warn } from '../utils/log.js';

const KEY_MODIFIERS = {
  enter: 'Enter',
  escape: 'Escape',
  space: ' ',
  tab: 'Tab',
  delete: 'Delete',
  backspace: 'Backspace',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight'
};

/**
 * Handles `kite-on` directive.
 *
 * @param {Element} el - Target DOM element.
 * @param {string} expr - Expression to evaluate on event.
 * @param {Object} scope - Current reactive scope.
 * @param {string|null} eventName - Name of the event (e.g. 'click', 'submit').
 * @param {Array<string>} modifiers - Dot modifiers (e.g. ['prevent', 'enter']).
 * @returns {Function} Cleanup unbinder.
 */
export function onDirective(el, expr, scope, eventName, modifiers = []) {
  if (!eventName) {
    warn(`kite-on requires an event name (e.g. kite-on-click="...").`, el);
    return () => {};
  }

  const isFormSubmit = eventName === 'submit';
  const hasPrevent = modifiers.includes('prevent') || (isFormSubmit && !modifiers.includes('no-prevent'));
  const hasStop = modifiers.includes('stop');
  const hasOnce = modifiers.includes('once');
  const hasSelf = modifiers.includes('self');

  // Debounce & throttle settings
  const hasDebounce = modifiers.includes('debounce') || el.hasAttribute('kite-debounce');
  const debounceDelay = parseInt(el.getAttribute('kite-debounce') || '250', 10);

  const hasThrottle = modifiers.includes('throttle') || el.hasAttribute('kite-throttle');
  const throttleLimit = parseInt(el.getAttribute('kite-throttle') || '250', 10);

  // Check if any key modifiers were requested (e.g. .enter, .escape)
  const requiredKey = modifiers.find(m => m in KEY_MODIFIERS);

  let debounceTimer = null;
  let throttleLastRun = 0;

  const dispatchAction = (event) => {
    const eventScope = createScope({ $event: event }, scope);
    evaluateExpression(expr, eventScope);
  };

  const listener = (event) => {
    // Check .self modifier
    if (hasSelf && event.target !== el) {
      return;
    }

    // Check key modifier filter
    if (requiredKey && event instanceof KeyboardEvent) {
      if (event.key !== KEY_MODIFIERS[requiredKey]) {
        return;
      }
    }

    if (hasPrevent) {
      event.preventDefault();
    }
    if (hasStop) {
      event.stopPropagation();
    }

    // Handle debounce
    if (hasDebounce) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        dispatchAction(event);
      }, debounceDelay);
      return;
    }

    // Handle throttle
    if (hasThrottle) {
      const now = Date.now();
      if (now - throttleLastRun >= throttleLimit) {
        throttleLastRun = now;
        dispatchAction(event);
      }
      return;
    }

    dispatchAction(event);
  };

  el.addEventListener(eventName, listener, { once: hasOnce });

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    el.removeEventListener(eventName, listener);
  };
}
