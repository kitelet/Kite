/**
 * @file Custom event emission directive for Kite components.
 * @module directives/emit
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Emits a custom bubbling DOM event from a component to parent scopes.
 *
 * @example
 * <button kite-emit="saved">Save</button>
 * <button kite-emit:item-selected="{ id: item.id }">Select</button>
 */

import { registerDirective } from '../core/registry.js';
import { evaluateExpression } from '../utils/expr.js';

registerDirective('emit', (el, expr, scope, arg) => {
  const eventName = arg || expr;
  if (!eventName) return () => {};

  const handler = (e) => {
    let detail = null;
    if (arg && expr) {
      detail = evaluateExpression(expr, scope);
    }

    const customEvent = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    });
    el.dispatchEvent(customEvent);
  };

  el.addEventListener('click', handler);
  return () => el.removeEventListener('click', handler);
}, { priority: 500 });
