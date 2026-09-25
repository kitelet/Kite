/**
 * @file Reactive style binding directive for Kite.
 * @module directives/style
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Binds CSS styles dynamically to an element via property argument or object expression.
 * Blocks CSS `expression()` and `javascript:` URLs for security.
 *
 * @example
 * <div kite-style:color="theme.primary"></div>
 * <div kite-style="{ color: theme.color, fontSize: size + 'px' }"></div>
 */

import { registerDirective } from '../core/registry.js';
import { createReaction } from '../core/reactor.js';
import { evaluateExpression, parseObjectLiteral } from '../utils/expr.js';

function sanitizeStyleValue(val) {
  if (typeof val !== 'string') return val;
  if (/expression\s*\(|javascript\s*:|-moz-binding|behavior\s*:/i.test(val)) {
    return '';
  }
  return val;
}

registerDirective('style', (el, expr, scope, arg) => {
  if (arg) {
    // Single property: kite-style:color="expr"
    return createReaction(() => {
      const val = evaluateExpression(expr, scope);
      const safeVal = val !== null && val !== undefined ? sanitizeStyleValue(String(val)) : '';
      el.style[arg] = safeVal;
    });
  }

  // Object literal or style string: kite-style="{ color: 'red', fontSize: '14px' }"
  return createReaction(() => {
    if (expr.trim().startsWith('{')) {
      let obj;
      try {
        obj = parseObjectLiteral(expr);
      } catch {
        obj = evaluateExpression(expr, scope);
      }

      if (obj && typeof obj === 'object') {
        for (const [prop, valExpr] of Object.entries(obj)) {
          const val = typeof valExpr === 'string' ? evaluateExpression(valExpr, scope) : valExpr;
          const safeVal = val !== null && val !== undefined ? sanitizeStyleValue(String(val)) : '';
          el.style[prop] = safeVal;
        }
      }
    } else {
      const styleString = evaluateExpression(expr, scope);
      if (typeof styleString === 'string') {
        el.style.cssText = sanitizeStyleValue(styleString);
      }
    }
  });
}, { priority: 700 });
