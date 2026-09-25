/**
 * @file Built-in `kite-if`, `kite-elif`, and `kite-else` conditional directives.
 * @module directives/if
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Conditionally adds or removes elements from the DOM based on expression truthiness.
 * Supports multi-branch cascades (`kite-if` -> `kite-elif` -> `kite-else`).
 * Uses comment placeholders to remember original locations in the document tree.
 *
 * @example
 * <p kite-if="score >= 90">Grade: A</p>
 * <p kite-elif="score >= 80">Grade: B</p>
 * <p kite-else>Grade: C</p>
 */

import { evaluateExpression } from '../utils/expr.js';
import { createReaction } from '../core/reactor.js';
import { createAnchor } from '../utils/dom.js';

/**
 * Handles `kite-if` and multi-branch `kite-elif`/`kite-else` directives.
 *
 * @param {Element} el - Primary if element.
 * @param {string} expr - Conditional expression.
 * @param {Object} scope - Current reactive scope.
 * @param {string|null} arg - Unused.
 * @param {Array<string>} modifiers - Unused.
 * @param {Function} scanElement - Scanner callback to bind child elements.
 * @returns {Function} Cleanup function.
 */
export function ifDirective(el, expr, scope, arg, modifiers, scanElement) {
  const parent = el.parentNode;
  if (!parent) return () => {};

  // Build the list of branch records
  const branches = [
    { el, expr, isElse: false, anchor: createAnchor(`if: ${expr}`), isMounted: true, unbinder: null }
  ];

  // Scan contiguous siblings for kite-elif or kite-else
  let next = el.nextElementSibling;
  while (next && next.nodeType === 1) {
    if (next.hasAttribute('kite-elif')) {
      const elifExpr = next.getAttribute('kite-elif');
      branches.push({
        el: next,
        expr: elifExpr,
        isElse: false,
        anchor: createAnchor(`elif: ${elifExpr}`),
        isMounted: true,
        unbinder: null
      });
      next = next.nextElementSibling;
    } else if (next.hasAttribute('kite-else')) {
      branches.push({
        el: next,
        expr: 'true',
        isElse: true,
        anchor: createAnchor('else'),
        isMounted: true,
        unbinder: null
      });
      break; // kite-else terminates the cascade
    } else {
      break;
    }
  }

  // Insert anchor placeholders before each element
  for (const branch of branches) {
    if (branch.el.parentNode) {
      branch.el.parentNode.insertBefore(branch.anchor, branch.el);
    }
  }

  const cleanupReaction = createReaction(() => {
    // 1. Determine which branch should be active
    let activeIndex = -1;
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      if (b.isElse || Boolean(evaluateExpression(b.expr, scope))) {
        activeIndex = i;
        break;
      }
    }

    // 2. Mount active branch and unmount all others
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      if (i === activeIndex) {
        if (!b.isMounted) {
          b.anchor.parentNode.insertBefore(b.el, b.anchor.nextSibling);
          b.isMounted = true;
          if (typeof scanElement === 'function') {
            b.unbinder = scanElement(b.el, scope);
          }
        }
      } else {
        if (b.isMounted) {
          if (typeof b.unbinder === 'function') {
            b.unbinder();
            b.unbinder = null;
          }
          if (b.el.parentNode) {
            b.el.parentNode.removeChild(b.el);
          }
          b.isMounted = false;
        }
      }
    }
  });

  return () => {
    cleanupReaction();
    for (const b of branches) {
      if (typeof b.unbinder === 'function') b.unbinder();
      if (b.anchor.parentNode) b.anchor.parentNode.removeChild(b.anchor);
      if (!b.isMounted && b.el.parentNode) b.el.parentNode.removeChild(b.el);
    }
  };
}
