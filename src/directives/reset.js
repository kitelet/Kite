/**
 * @file Scope and form reset directive for Kite.
 * @module directives/reset
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Restores the enclosing scope or form elements to their original initial state.
 *
 * @example
 * <button kite-reset>Reset</button>
 */

import { registerDirective } from '../core/registry.js';

registerDirective('reset', (el, expr, scope) => {
  if (!scope) return () => {};

  // Capture snapshot of current initial keys
  const snapshot = {};
  for (const k of Object.keys(scope)) {
    if (!k.startsWith('$') && typeof scope[k] !== 'function') {
      try {
        snapshot[k] = JSON.parse(JSON.stringify(scope[k]));
      } catch {
        snapshot[k] = scope[k];
      }
    }
  }

  const handler = (e) => {
    e.preventDefault();
    for (const [k, v] of Object.entries(snapshot)) {
      try {
        scope[k] = JSON.parse(JSON.stringify(v));
      } catch {
        scope[k] = v;
      }
    }

    const form = el.closest ? el.closest('form') : (el.tagName === 'FORM' ? el : null);
    if (form && typeof form.reset === 'function') {
      form.reset();
    }
  };

  el.addEventListener('click', handler);
  return () => el.removeEventListener('click', handler);
}, { priority: 500 });
