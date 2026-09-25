/**
 * @file Built-in `kite-bind` directive.
 * @module directives/bind
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * One-way binding from reactive state to DOM attributes.
 * Disallows binding to dangerous inline event handlers (`on*`) or script schemes (`javascript:`).
 *
 * Supports:
 * - Direct attribute targeting: `<img kite-bind:src="avatar">`
 * - Boolean attributes: `<button kite-bind:disabled="isLoading">`
 * - Object syntax: `<div kite-bind="{ title: tooltip, role: 'dialog' }">`
 */

import { evaluateExpression } from '../utils/expr.js';
import { createReaction } from '../core/reactor.js';
import { isSafeAttribute, sanitizeAttributeValue } from '../utils/sanitize.js';
import { warn } from '../utils/log.js';

const BOOLEAN_ATTRIBUTES = new Set([
  'disabled', 'checked', 'readonly', 'required', 'hidden',
  'selected', 'autofocus', 'multiple', 'novalidate'
]);

/**
 * Applies a calculated attribute value to a DOM element.
 *
 * @param {Element} el - Target element.
 * @param {string} attrName - Attribute name to update.
 * @param {any} value - Calculated expression value.
 */
function applyAttribute(el, attrName, value) {
  if (!isSafeAttribute(attrName)) {
    warn(`Refusing to bind dangerous attribute "${attrName}" for security reasons.`, el);
    return;
  }

  const safeVal = sanitizeAttributeValue(value);
  const isBool = BOOLEAN_ATTRIBUTES.has(attrName.toLowerCase());

  if (isBool) {
    if (safeVal) {
      el.setAttribute(attrName, '');
    } else {
      el.removeAttribute(attrName);
    }
  } else if (safeVal === null || safeVal === undefined || safeVal === false) {
    el.removeAttribute(attrName);
  } else {
    el.setAttribute(attrName, String(safeVal));
  }
}

/**
 * Handles `kite-bind` directive.
 *
 * @param {Element} el - DOM element.
 * @param {string} expr - Attribute expression.
 * @param {Object} scope - Scope instance.
 * @param {string|null} arg - Target attribute name if using `kite-bind:attr`.
 * @returns {Function} Cleanup function.
 */
export function bindDirective(el, expr, scope, arg) {
  if (arg) {
    // Single attribute binding: <img kite-bind:src="avatar">
    return createReaction(() => {
      const val = evaluateExpression(expr, scope);
      applyAttribute(el, arg, val);
    });
  }

  // Object syntax: <div kite-bind="{ disabled: isBusy, title: desc }">
  return createReaction(() => {
    const obj = evaluateExpression(expr, scope);
    if (obj && typeof obj === 'object') {
      for (const [attrName, val] of Object.entries(obj)) {
        applyAttribute(el, attrName, val);
      }
    }
  });
}
