/**
 * @file Built-in `kite-class` dynamic class directive.
 * @module directives/class
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Toggles CSS class names on an element reactively.
 *
 * Supported syntaxes:
 * - Specific class targeting: `<div kite-class:active="isActive">`
 * - Object syntax: `<div kite-class="{ active: isActive, danger: hasError }">`
 */

import { evaluateExpression } from '../utils/expr.js';
import { createReaction } from '../core/reactor.js';
import { warn } from '../utils/log.js';

/**
 * Handles `kite-class` directive.
 *
 * @param {Element} el - Target DOM element.
 * @param {string} expr - Class expression.
 * @param {Object} scope - Current reactive scope.
 * @param {string|null} className - Target class name if using `kite-class:<name>`.
 * @returns {Function} Cleanup unbinder.
 */
export function classDirective(el, expr, scope, className) {
  if (className) {
    // Single class toggle: <div kite-class:active="isActive">
    return createReaction(() => {
      const isPresent = Boolean(evaluateExpression(expr, scope));
      el.classList.toggle(className, isPresent);
    });
  }

  // Object-based multi-class toggle: <div kite-class="{ active: isActive, error: isError }">
  return createReaction(() => {
    const classObj = evaluateExpression(expr, scope);
    if (classObj && typeof classObj === 'object') {
      for (const [cls, condition] of Object.entries(classObj)) {
        el.classList.toggle(cls, Boolean(condition));
      }
    } else {
      warn(`kite-class without a class argument expects an object expression, got:`, classObj);
    }
  });
}
