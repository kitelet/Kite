/**
 * @file Lifecycle hook manager for Kite.
 * @module core/hooks
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Coordinates application-wide lifecycle callbacks:
 * - before:scan / after:scan
 * - before:mount / after:mount
 * - before:update / after:update
 * - before:unmount / after:unmount
 * - before:fetch / after:fetch
 * - on:error
 * - on:route
 *
 * @example
 * const off = Kite.hook('before:fetch', (opts) => {
 *   opts.headers['X-Request-Id'] = crypto.randomUUID();
 * });
 * off(); // unregister
 */

import { warn, error } from '../utils/log.js';

/**
 * Registry mapping hook event names to a Set of callback functions.
 * @type {Map<string, Set<Function>>}
 */
const hooksRegistry = new Map();

/**
 * Registers a lifecycle hook callback.
 *
 * @param {string}   name - Hook identifier (e.g. 'before:fetch', 'on:error').
 * @param {Function} fn   - Callback function.
 * @returns {Function} Unregister function.
 */
export function registerHook(name, fn) {
  if (!name || typeof name !== 'string') {
    error('Hook name must be a non-empty string.');
    return () => {};
  }
  if (typeof fn !== 'function') {
    error(`Hook handler for '${name}' must be a function.`);
    return () => {};
  }

  const key = name.toLowerCase();
  if (!hooksRegistry.has(key)) {
    hooksRegistry.set(key, new Set());
  }
  const set = hooksRegistry.get(key);
  set.add(fn);

  return () => {
    set.delete(fn);
    if (set.size === 0) {
      hooksRegistry.delete(key);
    }
  };
}

/**
 * Synchronously triggers all registered callbacks for a hook.
 *
 * @param {string} name - Hook identifier.
 * @param {...*}   args - Arguments passed to callbacks.
 */
export function triggerHook(name, ...args) {
  const key = name.toLowerCase();
  const set = hooksRegistry.get(key);
  if (!set || set.size === 0) return;

  for (const fn of Array.from(set)) {
    try {
      fn(...args);
    } catch (err) {
      warn(`Error executing hook '${name}':`, err);
    }
  }
}

/**
 * Asynchronously triggers all registered callbacks for a hook, awaiting Promise returns.
 *
 * @param {string} name - Hook identifier.
 * @param {...*}   args - Arguments passed to callbacks.
 * @returns {Promise<void>}
 */
export async function triggerAsyncHook(name, ...args) {
  const key = name.toLowerCase();
  const set = hooksRegistry.get(key);
  if (!set || set.size === 0) return;

  for (const fn of Array.from(set)) {
    try {
      await fn(...args);
    } catch (err) {
      warn(`Error executing async hook '${name}':`, err);
    }
  }
}

/**
 * Retrieves all registered hooks as a Map.
 *
 * @returns {Map<string, Array<Function>>}
 */
export function getAllHooks() {
  const result = new Map();
  for (const [k, set] of hooksRegistry.entries()) {
    result.set(k, Array.from(set));
  }
  return result;
}
