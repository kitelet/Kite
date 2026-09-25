/**
 * @file Adapter middleware pipeline manager for Kite.
 * @module core/middleware
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Manages an onion-style async middleware pipeline wrapping network adapter requests.
 *
 * @example
 * const off = Kite.middleware('auth', async (opts, ctx, next) => {
 *   opts.headers['Authorization'] = 'Bearer my-token';
 *   return next(opts, ctx);
 * });
 * off(); // unregister
 */

import { warn, error } from '../utils/log.js';

/**
 * Ordered list of registered middleware entries.
 * @type {Array<{ name: string, fn: Function }>}
 */
const middlewareStack = [];

/**
 * Registers a network adapter middleware.
 *
 * @param {string}   name - Middleware identifier.
 * @param {Function} fn   - Async handler `(opts, ctx, next) => Promise<Response>`.
 * @returns {Function} Unregister function.
 */
export function registerMiddleware(name, fn) {
  if (!name || typeof name !== 'string') {
    error('Middleware name must be a non-empty string.');
    return () => {};
  }
  if (typeof fn !== 'function') {
    error(`Middleware handler for '${name}' must be a function.`);
    return () => {};
  }

  const entry = { name, fn };
  middlewareStack.push(entry);

  return () => {
    const idx = middlewareStack.indexOf(entry);
    if (idx !== -1) {
      middlewareStack.splice(idx, 1);
    }
  };
}

/**
 * Executes the middleware stack around a terminal adapter request function.
 *
 * @param {Object}   opts            - Request options { method, path, query, body, headers, signal }.
 * @param {Object}   ctx             - Context { config, client, ... }.
 * @param {Function} terminalHandler - (opts, ctx) => Promise<Response>.
 * @returns {Promise<Response>}
 */
export async function runMiddleware(opts, ctx, terminalHandler) {
  let index = -1;

  async function dispatch(i, currentOpts) {
    if (i <= index) {
      throw new Error('next() called multiple times in middleware pipeline');
    }
    index = i;

    if (i < middlewareStack.length) {
      const entry = middlewareStack[i];
      return entry.fn(currentOpts, ctx, (nextOpts = currentOpts) => dispatch(i + 1, nextOpts));
    }

    return terminalHandler(currentOpts, ctx);
  }

  return dispatch(0, opts);
}

/**
 * Retrieves a list of registered middleware names.
 *
 * @returns {Array<{ name: string, fn: Function }>}
 */
export function getAllMiddlewares() {
  return [...middlewareStack];
}
