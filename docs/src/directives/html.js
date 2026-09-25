/**
 * @file HTML interpolation directive for Kite.
 * @module directives/html
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Sets the element's innerHTML to the evaluated expression result.
 * Safe by default: automatically sanitizes dangerous tags, inline event handlers,
 * and javascript: URLs unless explicitly declared as trusted via `kite-html.trusted`.
 *
 * @example
 * <div kite-html="post.body"></div>
 * <div kite-html.trusted="trustedAdminMarkup"></div>
 */

import { registerDirective } from '../core/registry.js';
import { createReaction } from '../core/reactor.js';
import { evaluateExpression } from '../utils/expr.js';
import { sanitize } from '../utils/sanitize.js';

registerDirective('html', (el, expr, scope, arg, modifiers) => {
  const isTrusted = modifiers.includes('trusted');

  return createReaction(() => {
    const rawVal = evaluateExpression(expr, scope);
    const htmlVal = rawVal === null || rawVal === undefined ? '' : String(rawVal);
    el.innerHTML = isTrusted ? htmlVal : sanitize(htmlVal);
  });
}, { priority: 900 });
