/**
 * @file HTML file inclusion primitive for Kite.
 * @module core/include
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Implements `<kite-include src="...">` allowing developers to split applications
 * into modular HTML files (e.g. `todos.model.html`, `todos.view.html`) that are
 * fetched and inlined into the document without a build step or bundler.
 *
 * @example
 * <kite-include src="/app/models/todos.model.html"></kite-include>
 */

import { warn, error } from '../utils/log.js';

// Tracks in-flight and processed URLs to prevent infinite circular includes
const inFlightIncludes = new Set();

/**
 * Fetches an HTML file, inlines its content in place of the `<kite-include>` tag,
 * and recursively compiles any newly inserted Kite directives, models, or views.
 *
 * @param {Element} el - The `<kite-include>` DOM element.
 * @param {Function} scanCallback - Scanner function to compile inserted DOM nodes.
 * @returns {Promise<void>} Resolves when the include is fetched, mounted, and scanned.
 */
export async function processInclude(el, scanCallback) {
  if (!el || !el.getAttribute) return;

  const src = el.getAttribute('src');
  if (!src) {
    warn(`Found <kite-include> without a 'src' attribute.`, el);
    return;
  }

  // Resolve absolute path relative to current document location
  let resolvedUrl;
  try {
    resolvedUrl = typeof window !== 'undefined'
      ? new URL(src, window.location.href).href
      : src;
  } catch {
    resolvedUrl = src;
  }

  if (inFlightIncludes.has(resolvedUrl)) {
    warn(`Circular or duplicate <kite-include> detected for "${src}". Skipping.`, el);
    return;
  }

  inFlightIncludes.add(resolvedUrl);

  try {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Create a temporary container to hold the parsed markup
    const template = document.createElement('template');
    template.innerHTML = html;
    const fragment = template.content;

    // Capture references to root elements before appending
    const insertedElements = Array.from(fragment.children);

    const parent = el.parentNode;
    if (!parent) {
      inFlightIncludes.delete(resolvedUrl);
      return;
    }

    // Insert new elements right before the <kite-include> placeholder
    parent.insertBefore(fragment, el);

    // Remove the placeholder element
    parent.removeChild(el);

    // Recursively scan and bind the newly inserted DOM nodes
    if (typeof scanCallback === 'function') {
      for (const node of insertedElements) {
        if (node.nodeType === 1) { // ELEMENT_NODE
          scanCallback(node);
        }
      }
    }
  } catch (err) {
    warn(`Failed to load <kite-include src="${src}">: ${err.message}`);
    if (el && el.parentNode) {
      const placeholder = typeof document !== 'undefined' && typeof document.createComment === 'function'
        ? document.createComment(` kite-include failed: ${src} `)
        : { nodeType: 8, nodeValue: ` kite-include failed: ${src} ` };
      el.parentNode.replaceChild(placeholder, el);
    }
  } finally {
    inFlightIncludes.delete(resolvedUrl);
  }
}
