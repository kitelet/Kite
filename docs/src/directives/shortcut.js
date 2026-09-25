/**
 * @file Global keyboard shortcut directive for Kite.
 * @module directives/shortcut
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Binds a global keyboard shortcut (e.g. `ctrl+s`, `escape`) to an action or method.
 *
 * @example
 * <button kite-shortcut="ctrl+s" kite-on-click="save()">Save</button>
 */

import { registerDirective } from '../core/registry.js';
import { evaluateExpression } from '../utils/expr.js';

registerDirective('shortcut', (el, expr, scope, arg) => {
  if (typeof window === 'undefined') return () => {};

  const shortcut = (arg || expr || '').toLowerCase().trim();
  if (!shortcut) return () => {};

  const parts = shortcut.split('+').map(s => s.trim());
  const needsCtrl = parts.includes('ctrl') || parts.includes('control');
  const needsAlt = parts.includes('alt');
  const needsShift = parts.includes('shift');
  const needsMeta = parts.includes('cmd') || parts.includes('meta');
  const mainKey = parts.filter(p => !['ctrl', 'control', 'alt', 'shift', 'cmd', 'meta'].includes(p))[0];

  const handler = (e) => {
    if (needsCtrl && !e.ctrlKey) return;
    if (needsAlt && !e.altKey) return;
    if (needsShift && !e.shiftKey) return;
    if (needsMeta && !e.metaKey) return;

    if (mainKey && e.key.toLowerCase() !== mainKey.toLowerCase()) {
      return;
    }

    e.preventDefault();
    if (typeof el.click === 'function') {
      el.click();
    } else {
      evaluateExpression(expr, scope);
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, { priority: 500 });
