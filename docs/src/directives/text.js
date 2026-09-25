/**
 * @file Built-in `kite-text` directive.
 * @module directives/text
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Sets the text content of an element reactively.
 *
 * @example
 * <span kite-text="count"></span>
 * <h1 kite-text="'Welcome, ' + user.name"></h1>
 */

import { evaluateExpression } from '../utils/expr.js';
import { createReaction } from '../core/reactor.js';

/**
 * Handles `kite-text` directive execution.
 *
 * @param {Element} el - Target DOM element.
 * @param {string} expr - Expression to evaluate.
 * @param {Object} scope - Current reactive scope.
 * @returns {Function} Cleanup unbinder.
 */
export function textDirective(el, expr, scope) {
  return createReaction(() => {
    const value = evaluateExpression(expr, scope);
    el.textContent = value == null ? '' : String(value);
  });
}
