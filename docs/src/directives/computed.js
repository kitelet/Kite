/**
 * @file Computed properties directive for Kite.
 * @module directives/computed
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Automatically calculates and maintains derived state values on the scope.
 *
 * @example
 * <div kite-scope="{ count: 2 }" kite-computed:double="count * 2">
 *   <span kite-text="double"></span>
 * </div>
 */

import { registerDirective } from '../core/registry.js';
import { createReaction } from '../core/reactor.js';
import { evaluateExpression, parseObjectLiteral } from '../utils/expr.js';

registerDirective('computed', (el, expr, scope, arg) => {
  if (!scope) return () => {};

  if (arg) {
    // kite-computed:double="count * 2"
    const propName = arg;
    return createReaction(() => {
      scope[propName] = evaluateExpression(expr, scope);
    });
  }

  // kite-computed="{ double: 'count * 2', isPositive: 'count > 0' }"
  let definitions = {};
  try {
    definitions = parseObjectLiteral(expr);
  } catch {
    return () => {};
  }

  const cleanups = [];
  for (const [propName, formula] of Object.entries(definitions)) {
    const unbind = createReaction(() => {
      scope[propName] = evaluateExpression(formula, scope);
    });
    cleanups.push(unbind);
  }

  return () => {
    for (const c of cleanups) c();
  };
}, { priority: 950 });
