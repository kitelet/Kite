/**
 * @file Reactive state watcher directive for Kite.
 * @module directives/watch
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Watches a reactive scope property and executes an expression or method whenever it changes.
 *
 * @example
 * <div kite-scope="{ count: 0 }" kite-watch:count="onCountChanged()">
 */

import { registerDirective } from '../core/registry.js';
import { evaluateExpression } from '../utils/expr.js';

registerDirective('watch', (el, expr, scope, arg) => {
  if (!scope || !scope.$subscribe) return () => {};

  const propName = arg;
  if (!propName) return () => {};

  return scope.$subscribe(propName, () => {
    if (el) scope.$el = el;
    evaluateExpression(expr, scope);
  });
}, { priority: 900 });
