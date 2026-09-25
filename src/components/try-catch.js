/**
 * @file Error boundary component (<kite-try> / <kite-catch>) for Kite.
 * @module components/try-catch
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Catches rendering, expression, or child errors inside `<kite-try>` and displays
 * the `<kite-catch>` fallback UI without crashing the rest of the application.
 *
 * @example
 * <kite-try>
 *   <kite-use name="risky-component"></kite-use>
 *   <kite-catch>
 *     <p>Something went wrong. <a href="#/">Go back</a></p>
 *   </kite-catch>
 * </kite-try>
 */

import { warn } from '../utils/log.js';

/**
 * Mounts a `<kite-try>` error boundary element.
 *
 * @param {Element} tryEl - The `<kite-try>` DOM element.
 * @param {Object} scope - Reactive scope.
 * @param {Function} scanElement - DOM scanner callback.
 * @returns {Function} Cleanup function.
 */
export function mountErrorBoundary(tryEl, scope, scanElement) {
  const catchEl = tryEl.querySelector('kite-catch');
  if (catchEl) {
    catchEl.style.display = 'none'; // Hide fallback initially
  }

  const cleanups = [];

  const triggerError = (err) => {
    warn(`Captured error inside <kite-try>:`, err);

    // Dispatch global kite:error event on window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kite:error', {
        detail: {
          type: 'render_error',
          message: err ? err.message : 'Unknown error',
          element: tryEl
        }
      }));
    }

    // Hide try contents and show catch fallback
    let child = tryEl.firstElementChild;
    while (child) {
      if (child !== catchEl) {
        child.style.display = 'none';
      }
      child = child.nextElementSibling;
    }

    if (catchEl) {
      catchEl.style.display = '';
      if (typeof scanElement === 'function') {
        scanElement(catchEl, scope);
      }
    }
  };

  try {
    let child = tryEl.firstElementChild;
    while (child) {
      const nextSibling = child.nextElementSibling;
      if (child !== catchEl && typeof scanElement === 'function') {
        const u = scanElement(child, scope);
        if (typeof u === 'function') cleanups.push(u);
      }
      child = nextSibling;
    }
  } catch (err) {
    triggerError(err);
  }

  return () => {
    for (const u of cleanups) u();
  };
}
