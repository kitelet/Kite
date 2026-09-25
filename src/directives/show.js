/**
 * @file Built-in `kite-show` visibility directive.
 * @module directives/show
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Toggles the visibility of an element via CSS `display: none` without removing
 * it from the DOM. Preserves original inline display styles when visible.
 *
 * @example
 * <div kite-show="isOpen">Menu items...</div>
 */

import { evaluateExpression } from '../utils/expr.js';
import { createReaction } from '../core/reactor.js';

/**
 * Handles `kite-show` directive.
 *
 * @param {HTMLElement} el - Target DOM element.
 * @param {string} expr - Boolean expression.
 * @param {Object} scope - Current reactive scope.
 * @returns {Function} Cleanup unbinder.
 */
export function showDirective(el, expr, scope) {
  // Cache original inline display style if specified
  const initialDisplay = el.style.display === 'none' ? '' : el.style.display;

  return createReaction(() => {
    const isVisible = Boolean(evaluateExpression(expr, scope));
    if (isVisible) {
      el.style.display = initialDisplay;
    } else {
      el.style.display = 'none';
    }
  });
}
