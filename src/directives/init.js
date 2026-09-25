/**
 * @file Built-in `kite-init` mount directive.
 * @module directives/init
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Runs an expression once when the element is initially mounted and bound.
 *
 * @example
 * <div kite-init="count = 10">
 * <div kite-init="loadData()">
 */

import { evaluateExpression } from '../utils/expr.js';

/**
 * Handles `kite-init` directive.
 *
 * @param {Element} el - Target DOM element.
 * @param {string} expr - Expression to run once on mount.
 * @param {Object} scope - Current reactive scope.
 * @returns {Function} No-op cleanup.
 */
export function initDirective(el, expr, scope) {
  evaluateExpression(expr, scope);
  return () => {};
}
