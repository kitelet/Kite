/**
 * @file Global Store registry and <kite-store> manager for Kite.
 * @module core/store
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Implements app-wide global reactive stores declared via `<kite-store>`.
 * Values in stores are accessible to any component or directive across the entire page.
 *
 * @example
 * <kite-store name="app">
 *   { user: 'Guest', theme: 'light' }
 * </kite-store>
 */

import { createScope } from './scope.js';
import { parseObjectLiteral } from '../utils/expr.js';
import { warn } from '../utils/log.js';

/**
 * Registry of named global stores.
 * @type {Map<string, Proxy>}
 */
const storeRegistry = new Map();

/**
 * Shared aggregated global store scope.
 * @type {Proxy}
 */
export const globalStore = createScope({});

/**
 * Registers a named reactive global store.
 *
 * @param {string} name - Store identifier.
 * @param {Object} data - Initial store state.
 * @returns {Proxy} Reactive store scope proxy.
 */
export function registerStore(name, data = {}) {
  if (!name) {
    warn('Cannot register store without a name.');
    return null;
  }
  const normalized = name.toLowerCase();
  const scope = createScope(data);
  storeRegistry.set(normalized, scope);

  // Expose on global store under its name, e.g. $store.app
  globalStore[normalized] = scope;
  // Also merge root properties if default 'app' or 'global' store
  if (normalized === 'app' || normalized === 'global') {
    Object.assign(globalStore, scope);
  }

  return scope;
}

/**
 * Retrieves a registered global store by name.
 *
 * @param {string} name - Store identifier.
 * @returns {Proxy|undefined}
 */
export function getStore(name) {
  if (!name) return undefined;
  return storeRegistry.get(name.toLowerCase());
}

/**
 * Returns all active stores as a plain map for debugging.
 * @returns {Object}
 */
export function getAllStores() {
  const result = {};
  for (const [key, store] of storeRegistry.entries()) {
    result[key] = store;
  }
  return result;
}

/**
 * Scans and initializes a `<kite-store>` DOM element.
 *
 * @param {Element} el - The `<kite-store>` element.
 */
export function processStoreDefinition(el) {
  const name = el.getAttribute('name') || 'app';
  const raw = el.textContent || '';
  let initial = {};

  if (raw.trim()) {
    try {
      initial = parseObjectLiteral(raw.trim());
    } catch (err) {
      warn(`Failed to parse <kite-store name="${name}">:`, err);
    }
  }

  registerStore(name, initial);
  el.style.display = 'none';
}
