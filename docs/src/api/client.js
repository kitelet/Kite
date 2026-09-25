/**
 * @file Unified API Client and Adapter Manager for Kite.
 * @module api/client
 * @author Kite Contributors
 * @license MIT
 *
 * @description
 * Coordinates network requests, custom adapters, adapter middleware,
 * lifecycle fetch hooks, and automatic reactive state flags (`loading`, `error`, `empty`) on Kite models.
 */

import { restAdapter } from './adapters/rest.js';
import { jsonAdapter } from './adapters/json.js';
import { localAdapter } from './adapters/local.js';
import { graphqlAdapter } from './adapters/graphql.js';
import { runMiddleware } from '../core/middleware.js';
import { triggerHook } from '../core/hooks.js';
import { warn } from '../utils/log.js';

/**
 * Global adapter registry.
 * @type {Map<string, Object>}
 */
const adapterRegistry = new Map([
  ['rest', restAdapter],
  ['json', jsonAdapter],
  ['local', localAdapter],
  ['graphql', graphqlAdapter]
]);

/**
 * Snapshot of original adapters for Kite.original().
 * @type {Map<string, Object>}
 */
const originalAdapters = new Map([
  ['rest', restAdapter],
  ['json', jsonAdapter],
  ['local', localAdapter],
  ['graphql', graphqlAdapter]
]);

/**
 * Registers a custom network protocol adapter.
 *
 * @param {string} name - Adapter identifier.
 * @param {Object|Function} adapter - Adapter implementation with a `request(config)` method or direct handler `(opts, ctx) => Promise<any>`.
 * @returns {Function} Unregister function.
 */
export function registerAdapter(name, adapter) {
  if (!name) return () => {};

  const key = String(name).toLowerCase();
  let normalized = adapter;

  if (typeof adapter === 'function') {
    normalized = {
      name: key,
      request: (opts, ctx) => adapter(opts, ctx)
    };
  } else if (!adapter || typeof adapter.request !== 'function') {
    warn(`Failed to register adapter "${name}". Expected an object with request() or a function.`);
    return () => {};
  }

  if (!originalAdapters.has(key)) {
    originalAdapters.set(key, normalized);
  }

  adapterRegistry.set(key, normalized);

  return () => unregisterAdapter(key);
}

/**
 * Unregisters a network adapter.
 *
 * @param {string} name - Adapter identifier.
 * @returns {boolean}
 */
export function unregisterAdapter(name) {
  if (!name) return false;
  return adapterRegistry.delete(String(name).toLowerCase());
}

/**
 * Retrieves a registered adapter by name.
 *
 * @param {string} name - Adapter identifier.
 * @returns {Object}
 */
export function getAdapter(name = 'rest') {
  return adapterRegistry.get(String(name).toLowerCase());
}

/**
 * Retrieves the original built-in adapter definition before any overrides.
 *
 * @param {string} name
 * @returns {Object|undefined}
 */
export function getOriginalAdapter(name) {
  return originalAdapters.get(String(name).toLowerCase());
}

/**
 * Retrieves all registered adapters.
 * @returns {Map<string, Object>}
 */
export function getAllAdapters() {
  return adapterRegistry;
}

/**
 * Unified API Client for executing REST/custom protocol requests.
 */
export class ApiClient {
  /**
   * @param {Object} [config={}]
   * @param {string} [config.base=''] - Base URL prefix.
   * @param {string} [config.adapter='rest'] - Adapter protocol to use.
   * @param {Object} [config.headers={}] - Default HTTP headers.
   */
  constructor(config = {}) {
    this.base = config.base || '';
    this.adapterName = config.adapter || 'rest';
    this.headers = Object.assign({}, config.headers);
  }

  /**
   * Sets or updates a default request header.
   *
   * @param {string} name - Header name.
   * @param {string} value - Header value.
   */
  setHeader(name, value) {
    this.headers[name] = value;
  }

  /**
   * Dispatches a request through registered middleware and the configured adapter.
   *
   * @param {Object} opts - Request parameters.
   * @returns {Promise<any>}
   */
  async request(opts = {}) {
    const adapter = getAdapter(this.adapterName) || restAdapter;
    const mergedHeaders = Object.assign({}, this.headers, opts.headers);
    const finalOpts = Object.assign({}, opts, {
      base: opts.base !== undefined ? opts.base : this.base,
      headers: mergedHeaders
    });

    triggerHook('before:fetch', finalOpts);

    const ctx = {
      config: { base: this.base },
      headers: this.headers,
      client: this
    };

    const terminalHandler = async (o, c) => {
      if (typeof adapter.request === 'function') {
        return adapter.request(o, c);
      } else if (typeof adapter === 'function') {
        return adapter(o, c);
      }
      return null;
    };

    try {
      const response = await runMiddleware(finalOpts, ctx, terminalHandler);
      triggerHook('after:fetch', response, finalOpts);
      return response;
    } catch (err) {
      triggerHook('on:error', err);
      throw err;
    }
  }

  get(path = '', query, opts = {}) {
    return this.request(Object.assign({}, opts, { path, method: 'GET', query }));
  }

  post(path = '', body, opts = {}) {
    return this.request(Object.assign({}, opts, { path, method: 'POST', body }));
  }

  put(path = '', body, opts = {}) {
    return this.request(Object.assign({}, opts, { path, method: 'PUT', body }));
  }

  patch(path = '', body, opts = {}) {
    return this.request(Object.assign({}, opts, { path, method: 'PATCH', body }));
  }

  delete(path = '', opts = {}) {
    return this.request(Object.assign({}, opts, { path, method: 'DELETE' }));
  }

  /**
   * Creates an API wrapper bound to a model's reactive loading/error/empty flags.
   *
   * @param {Object} modelScope - Target model scope.
   * @returns {Object} Bound API methods.
   */
  createBoundApi(modelScope) {
    const wrap = (method) => async (path = '', payload = undefined, opts = {}) => {
      modelScope.loading = true;
      modelScope.error = null;
      try {
        let res;
        if (method === 'get' || method === 'delete') {
          res = await this[method](path, payload, opts);
        } else {
          res = await this[method](path, payload, opts);
        }
        if (Array.isArray(res)) {
          modelScope.empty = res.length === 0;
        } else if (res && typeof res === 'object') {
          modelScope.empty = Object.keys(res).length === 0;
        } else {
          modelScope.empty = false;
        }
        return res;
      } catch (err) {
        modelScope.error = err.message || 'API request failed';
        throw err;
      } finally {
        modelScope.loading = false;
      }
    };

    return {
      get: wrap('get'),
      post: wrap('post'),
      put: wrap('put'),
      patch: wrap('patch'),
      delete: wrap('delete'),
      raw: this
    };
  }
}
