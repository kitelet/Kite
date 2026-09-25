/**
 * @file Built-in `kite-for` looping directive.
 * @module directives/for
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Loops through arrays, objects, or numeric ranges, rendering an instance of the element for each entry.
 * Each iteration receives an isolated child scope inheriting from the parent scope.
 *
 * Supported syntaxes:
 * - `kite-for="item in items"`
 * - `kite-for="(item, index) in items"`
 * - `kite-for="(value, key) in object"`
 * - `kite-for="n in 1..10"`
 * - `kite-for="item in items where item.done"`
 */

import { evaluateExpression } from '../utils/expr.js';
import { createReaction } from '../core/reactor.js';
import { createScope } from '../core/scope.js';
import { createAnchor } from '../utils/dom.js';
import { warn } from '../utils/log.js';

/**
 * Parses the for loop grammar.
 *
 * @param {string} expr - Raw expression string.
 * @returns {{ itemVar: string, indexVar: string|null, collectionExpr: string, whereExpr: string|null }|null}
 */
export function parseForExpression(expr) {
  const inIndex = expr.indexOf(' in ');
  if (inIndex === -1) {
    warn(`Invalid kite-for expression: "${expr}". Expected format: "item in items" or "n in 1..10".`);
    return null;
  }

  const left = expr.slice(0, inIndex).trim();
  let right = expr.slice(inIndex + 4).trim();
  let whereExpr = null;

  const whereIndex = right.indexOf(' where ');
  if (whereIndex !== -1) {
    whereExpr = right.slice(whereIndex + 7).trim();
    right = right.slice(0, whereIndex).trim();
  }

  let itemVar = left;
  let indexVar = null;

  if (left.startsWith('(') && left.endsWith(')')) {
    const inner = left.slice(1, -1);
    const parts = inner.split(',').map(s => s.trim());
    itemVar = parts[0];
    indexVar = parts[1] || null;
  }

  return { itemVar, indexVar, collectionExpr: right, whereExpr };
}

/**
 * Handles `kite-for` directive.
 *
 * @param {Element} el - Template element.
 * @param {string} expr - Loop expression.
 * @param {Object} scope - Current reactive scope.
 * @param {string|null} arg - Unused.
 * @param {Array<string>} modifiers - Unused.
 * @param {Function} scanElement - Scanner callback to bind generated clones.
 * @returns {Function} Cleanup function.
 */
export function forDirective(el, expr, scope, arg, modifiers, scanElement) {
  const parsed = parseForExpression(expr);
  if (!parsed) return () => {};

  const { itemVar, indexVar, collectionExpr, whereExpr } = parsed;
  const parent = el.parentNode;
  if (!parent) return () => {};

  // Anchor comment replacing the element in DOM
  const anchor = createAnchor(`for: ${expr}`);
  parent.insertBefore(anchor, el);

  // Check if looping on a <template> tag or standard element
  const isTemplateTag = el.tagName && el.tagName.toLowerCase() === 'template';
  const rawNodes = isTemplateTag
    ? (el.content ? Array.from(el.content.childNodes) : Array.from(el.childNodes))
    : [el];

  const preparedTemplates = rawNodes.map(node => {
    const clone = node.cloneNode(true);
    if (clone.nodeType === 1 && clone.hasAttribute && clone.hasAttribute('kite-for')) {
      clone.removeAttribute('kite-for');
    }
    return clone;
  });

  // Remove the original template node from DOM
  parent.removeChild(el);

  // Track currently rendered items and their cleanup functions
  let renderedNodes = [];
  let unbindCallbacks = [];

  const cleanupReaction = createReaction(() => {
    // 1. Tear down previous rendered nodes and child bindings
    for (const unbind of unbindCallbacks) {
      if (typeof unbind === 'function') unbind();
    }
    unbindCallbacks = [];

    for (const node of renderedNodes) {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
    renderedNodes = [];

    // 2. Resolve collection: Range (1..10) or Expression
    let entries = [];
    const MAX_FOR_LIMIT = 2000;
    const rangeMatch = collectionExpr.match(/^(\d+)\.\.(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const count = Math.abs(end - start) + 1;
      const safeEnd = count > MAX_FOR_LIMIT ? (end >= start ? start + MAX_FOR_LIMIT - 1 : start - MAX_FOR_LIMIT + 1) : end;
      if (count > MAX_FOR_LIMIT) {
        warn(`[Kite] kite-for range ${start}..${end} exceeded safety limit of ${MAX_FOR_LIMIT}. Truncating to avoid browser lockup.`);
      }
      for (let i = start; i <= safeEnd; i++) {
        entries.push({ item: i, key: i, index: entries.length });
      }
    } else {
      const collection = evaluateExpression(collectionExpr, scope);
      if (typeof collection === 'number') {
        const count = Math.min(collection, MAX_FOR_LIMIT);
        if (collection > MAX_FOR_LIMIT) {
          warn(`[Kite] kite-for numeric count ${collection} exceeded safety limit of ${MAX_FOR_LIMIT}. Truncating.`);
        }
        for (let i = 1; i <= count; i++) {
          entries.push({ item: i, key: i, index: entries.length });
        }
      } else if (Array.isArray(collection)) {
        if (collection.length > MAX_FOR_LIMIT) {
          warn(`[Kite] kite-for collection length ${collection.length} exceeded safety limit of ${MAX_FOR_LIMIT}. Truncating.`);
        }
        const safeItems = collection.length > MAX_FOR_LIMIT ? collection.slice(0, MAX_FOR_LIMIT) : collection;
        entries = safeItems.map((item, idx) => ({ item, key: idx, index: idx }));
      } else if (collection && typeof collection === 'object') {
        let objectEntries = Object.entries(collection);
        if (objectEntries.length > MAX_FOR_LIMIT) {
          warn(`[Kite] kite-for object keys count ${objectEntries.length} exceeded safety limit of ${MAX_FOR_LIMIT}. Truncating.`);
          objectEntries = objectEntries.slice(0, MAX_FOR_LIMIT);
        }
        entries = objectEntries.map(([key, val], idx) => ({ item: val, key, index: idx }));
      }
    }

    // 3. Apply optional where filter
    if (whereExpr && entries.length > 0) {
      entries = entries.filter((entry) => {
        const testScope = createScope({
          [itemVar]: entry.item,
          [indexVar || '$index']: entry.key
        }, scope);
        return Boolean(evaluateExpression(whereExpr, testScope));
      });
    }

    // 4. Render each entry
    let insertRef = anchor;
    for (const entry of entries) {
      // Create child scope with loop variables
      const localState = {
        [itemVar]: entry.item
      };
      if (indexVar) {
        localState[indexVar] = entry.key;
      }
      localState.$index = entry.index;
      localState.$key = entry.key;

      const itemScope = createScope(localState, scope);

      for (const tNode of preparedTemplates) {
        const clone = tNode.cloneNode(true);
        // Insert clone into DOM after previous entry
        if (insertRef && insertRef.parentNode) {
          insertRef.parentNode.insertBefore(clone, insertRef.nextSibling);
        }
        renderedNodes.push(clone);
        insertRef = clone;

        // Scan clone with child scope
        if (clone.nodeType === 1 && typeof scanElement === 'function') {
          const unbind = scanElement(clone, itemScope);
          if (typeof unbind === 'function') {
            unbindCallbacks.push(unbind);
          }
        }
      }
    }
  });

  return () => {
    cleanupReaction();
    for (const unbind of unbindCallbacks) {
      if (typeof unbind === 'function') unbind();
    }
    for (const node of renderedNodes) {
      if (node.parentNode) node.parentNode.removeChild(node);
    }
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
  };
}
