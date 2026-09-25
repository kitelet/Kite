/**
 * @file Clipboard copy directive for Kite.
 * @module directives/copy
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * One-click copy to clipboard with automatic feedback state.
 *
 * @example
 * <button kite-copy="shareUrl">Copy Link</button>
 */

import { registerDirective } from '../core/registry.js';
import { evaluateExpression } from '../utils/expr.js';

registerDirective('copy', (el, expr, scope) => {
  const handler = async (e) => {
    e.preventDefault();
    const text = expr ? evaluateExpression(expr, scope) : el.textContent;
    if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(String(text));
        el.classList.add('kite-copied');
        setTimeout(() => el.classList.remove('kite-copied'), 1500);
      } catch {}
    }
  };

  el.addEventListener('click', handler);
  return () => el.removeEventListener('click', handler);
}, { priority: 500 });
